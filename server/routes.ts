import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertKnowledgeBaseFileSchema, creditOperationSchema, transcriptSchema, messageSchema, insertAiAnalysisSchema } from "@shared/schema";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { randomUUID, createHash } from "crypto";
import { VoiceflowKB } from "./voiceflow-kb";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import Stripe from "stripe";

const upload = multer({ storage: multer.memoryStorage() });

const VOICEFLOW_API_KEY = process.env.VOICEFLOW_API_KEY;
const VOICEFLOW_API_BASE = "https://api.voiceflow.com";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" })
  : null;

function isValidVFApiKey(key: unknown): key is string {
  return typeof key === 'string' && key.startsWith('VF.');
}

// Session type extension
declare module 'express-session' {
  interface SessionData {
    projectId?: string;
    vfApiKey?: string;
    budget?: number;
    gtmOAuthState?: string;
  }
}

// Helper function to get API key from config or session, and sync if needed
async function getApiKey(req: Request): Promise<string | undefined> {
  const projectId = req.session?.projectId;
  if (!projectId) return undefined;

  const config = await storage.getProjectConfig(projectId);
  const sessionApiKey = req.session?.vfApiKey;

  // If config has API key, use it
  if (config.vf_api_key) {
    return config.vf_api_key;
  }

  // If session has API key but config doesn't, sync it
  if (sessionApiKey && isValidVFApiKey(sessionApiKey)) {
    config.vf_api_key = sessionApiKey;
    await storage.updateProjectConfig(config);
    return sessionApiKey;
  }

  // Fallback to environment variable
  return VOICEFLOW_API_KEY;
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log("[Auth Middleware] Checking authentication for:", req.method, req.path);
  console.log("[Auth Middleware] Request headers:", {
    origin: req.headers.origin,
    cookie: req.headers.cookie ? "present" : "missing",
  });
  console.log("[Auth Middleware] Session:", {
    hasSession: !!req.session,
    projectId: req.session?.projectId,
    sessionID: req.sessionID,
    cookie: req.session?.cookie ? {
      secure: req.session.cookie.secure,
      httpOnly: req.session.cookie.httpOnly,
      sameSite: req.session.cookie.sameSite,
    } : null,
  });
  
  if (!req.session?.projectId) {
    console.error("[Auth Middleware] Authentication failed - no project ID");
    console.error("[Auth Middleware] Session state:", {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      sessionKeys: req.session ? Object.keys(req.session) : [],
    });
    return res.status(401).json({ error: "Authentication required" });
  }
  
  console.log("[Auth Middleware] Authentication successful");
  next();
}

// CSV parsing functions - handles multi-line quoted fields
function parseCSV(csvText: string): any[] {
  const rows: any[] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let headers: string[] = [];
  let isFirstRow = true;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row (handle \r\n and \n)
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip the \n
      }

      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());

        if (isFirstRow) {
          headers = currentRow;
          isFirstRow = false;
        } else if (currentRow.length > 0 && currentRow.some(f => f)) {
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = currentRow[index] || '';
          });
          rows.push(row);
        }

        currentRow = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }
  }

  // Handle last row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (!isFirstRow && currentRow.length > 0 && currentRow.some(f => f)) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = currentRow[index] || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

function loadCSVData() {
  const transcriptsPath = join(process.cwd(), 'server', 'data', 'transcripts.csv');
  const messagesPath = join(process.cwd(), 'server', 'data', 'transcripts_messages.csv');

  const transcriptsCSV = readFileSync(transcriptsPath, 'utf-8');
  const messagesCSV = readFileSync(messagesPath, 'utf-8');

  const transcripts = parseCSV(transcriptsCSV);
  const messages = parseCSV(messagesCSV);

  return { transcripts, messages };
}

// Constants for credit/budget calculations
const CREDITS_PER_UNIT = 10000;
const COST_PER_UNIT = 60.0;
const RESET_DAYS = 30;

function calculateCost(credits: number): number {
  return (credits / CREDITS_PER_UNIT) * COST_PER_UNIT;
}

function checkAndResetIfNeeded(config: any): boolean {
  const startDate = new Date(config.start_date);
  const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysElapsed >= RESET_DAYS) {
    config.credits_used = 0;
    config.start_date = new Date().toISOString();
    return true;
  }
  return false;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Diagnostic endpoint for environment variables (safe - doesn't expose secrets)
  app.get("/api/diagnostics/env", requireAuth, async (req, res) => {
    const googleVars = Object.keys(process.env).filter(k => k.toUpperCase().includes('GOOGLE'));
    res.json({
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      hasOpenaiKey: !!process.env.OPENAI_API_KEY,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
      googleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      googleClientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
      googleClientIdPreview: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 30) + "..." : "missing",
      allGoogleEnvKeys: googleVars,
      port: process.env.PORT,
    });
  });

  // Authentication APIs
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { project_id, vf_api_key, budget } = req.body;
      
      console.log("========== [Login] Login Request Started ==========");
      console.log("[Login] Timestamp:", new Date().toISOString());
      console.log("[Login] Request headers:", {
        origin: req.headers.origin,
        referer: req.headers.referer,
        "user-agent": req.headers["user-agent"]?.substring(0, 50),
        cookie: req.headers.cookie ? "present" : "missing",
      });
      console.log("[Login] Received login request for project:", project_id);
      console.log("[Login] Session ID before regenerate:", req.sessionID);
      console.log("[Login] Has existing session:", !!req.session);
      console.log("[Login] Existing session projectId:", req.session?.projectId);
      console.log("[Login] Environment check:", {
        NODE_ENV: process.env.NODE_ENV,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        sessionSecretLength: process.env.SESSION_SECRET?.length || 0,
      });
      
      if (!project_id) {
        console.error("[Login] ERROR: project_id missing from request body");
        return res.status(400).json({ error: "project_id required" });
      }

      // Regenerate session to prevent session fixation
      console.log("[Login] Regenerating session...");
      req.session.regenerate((err) => {
        if (err) {
          console.error("[Login] Session regeneration error:", err);
          console.error("[Login] Error details:", {
            message: err.message,
            stack: err.stack,
          });
          return res.status(500).json({ error: "Login failed" });
        }

        console.log("[Login] Session regenerated successfully");
        console.log("[Login] New session ID:", req.sessionID);
        console.log("[Login] New session object:", {
          hasSession: !!req.session,
          cookie: req.session?.cookie,
        });

        // Store in session (server-side)
        req.session.projectId = project_id;
        req.session.vfApiKey = isValidVFApiKey(vf_api_key) ? vf_api_key : VOICEFLOW_API_KEY;
        req.session.budget = budget || 60;

        console.log("[Login] Session data set:", {
          projectId: req.session.projectId,
          hasVfApiKey: !!req.session.vfApiKey,
          budget: req.session.budget,
        });
        console.log("[Login] Session cookie config:", {
          secure: req.session.cookie.secure,
          httpOnly: req.session.cookie.httpOnly,
          sameSite: req.session.cookie.sameSite,
          maxAge: req.session.cookie.maxAge,
          path: req.session.cookie.path,
        });

        // Save session before responding
        console.log("[Login] Saving session...");
        req.session.save(async (saveErr) => {
          if (saveErr) {
            console.error("[Login] Session save error:", saveErr);
            console.error("[Login] Save error details:", {
              message: saveErr.message,
              stack: saveErr.stack,
            });
            return res.status(500).json({ error: "Login failed" });
          }

          console.log("[Login] Session saved successfully");
          console.log("[Login] Session ID after save:", req.sessionID);
          console.log("[Login] Session cookie details:", {
            name: req.session.cookie.name,
            secure: req.session.cookie.secure,
            httpOnly: req.session.cookie.httpOnly,
            sameSite: req.session.cookie.sameSite,
            maxAge: req.session.cookie.maxAge,
            path: req.session.cookie.path,
          });
          
          // Log response headers
          const setCookieHeaders = res.getHeader("set-cookie");
          console.log("[Login] Response Set-Cookie headers:", {
            hasHeaders: !!setCookieHeaders,
            headers: setCookieHeaders ? (Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders]) : [],
            rawHeaders: res.getHeaders()["set-cookie"],
          });

          try {
            // Initialize or update project config
            const config = await storage.getProjectConfig(project_id);
            config.budget = budget || config.budget;
            if (vf_api_key) {
              if (isValidVFApiKey(vf_api_key)) {
                config.vf_api_key = vf_api_key;
              } else {
                console.error("Invalid Voiceflow API key provided during login; ignoring.");
              }
            }
            await storage.updateProjectConfig(config);

            console.log("[Login] Login successful, sending response");
            console.log("[Login] Response headers after send:", {
              "set-cookie": res.getHeader("set-cookie"),
            });
            res.json({
              success: true,
              project_id,
            });
            console.log("========== [Login] Login Request Completed ==========");
          } catch (error) {
            console.error("[Login] Config update error:", error);
            res.status(500).json({ error: "Login failed" });
          }
        });
      });
    } catch (error) {
      console.error("[Login] Login error:", error);
      console.error("[Login] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    console.log("[Logout] Logout request received");
    console.log("[Logout] Session ID:", req.sessionID);
    console.log("[Logout] Has session:", !!req.session);
    console.log("[Logout] Request headers:", {
      cookie: req.headers.cookie ? "present" : "missing",
    });
    
    req.session.destroy((err) => {
      if (err) {
        console.error("[Logout] Logout error:", err);
        console.error("[Logout] Error details:", {
          message: err.message,
          stack: err.stack,
        });
        return res.status(500).json({ error: "Logout failed" });
      }
      console.log("[Logout] Session destroyed successfully");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    console.log("========== [Session Check] Session Check Started ==========");
    console.log("[Session Check] Timestamp:", new Date().toISOString());
    console.log("[Session Check] Request headers:", {
      origin: req.headers.origin,
      referer: req.headers.referer,
      cookie: req.headers.cookie ? "present" : "missing",
      "cookie-detail": req.headers.cookie?.substring(0, 200),
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-forwarded-proto": req.headers["x-forwarded-proto"],
      host: req.headers.host,
    });
    console.log("[Session Check] Request protocol:", {
      protocol: req.protocol,
      secure: req.secure,
      originalUrl: req.originalUrl,
    });
    console.log("[Session Check] Session ID:", req.sessionID);
    console.log("[Session Check] Has session object:", !!req.session);
    console.log("[Session Check] Session details:", {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      projectId: req.session?.projectId,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      cookie: req.session?.cookie ? {
        secure: req.session.cookie.secure,
        httpOnly: req.session.cookie.httpOnly,
        sameSite: req.session.cookie.sameSite,
        maxAge: req.session.cookie.maxAge,
        path: req.session.cookie.path,
        domain: req.session.cookie.domain,
      } : null,
    });
    console.log("[Session Check] Environment check:", {
      NODE_ENV: process.env.NODE_ENV,
      hasSessionSecret: !!process.env.SESSION_SECRET,
    });
    
    if (req.session?.projectId) {
      console.log("[Session Check] Authentication successful");
      console.log("========== [Session Check] Session Check Completed ==========");
      res.json({
        authenticated: true,
        project_id: req.session.projectId,
      });
    } else {
      console.log("[Session Check] No project ID found, returning unauthenticated");
      console.log("[Session Check] Session state:", {
        sessionID: req.sessionID,
        hasSession: !!req.session,
        sessionKeys: req.session ? Object.keys(req.session) : [],
      });
      console.log("========== [Session Check] Session Check Completed ==========");
      res.json({ authenticated: false });
    }
  });

  // User authentication endpoints for settings
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);

      // Return user-like object with current session data
      const apiKey = await getApiKey(req) || "";
      res.json({
        id: 1, // Mock user ID
        username: `user-${projectId.slice(0, 8)}`,
        projectId,
        apiKey,
        createdAt: config.start_date || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: error.message || "Failed to get user" });
    }
  });

  // Get project config (including GA4 measurement ID)
  app.get("/api/project/config", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      res.json({
        ga4_measurement_id: config.ga4_measurement_id || undefined,
      });
    } catch (error: any) {
      console.error("[Project Config] Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch project config" });
    }
  });

  // Update GA4 Measurement ID
  app.post("/api/project/ga4-tracking", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const { measurement_id } = req.body;
      
      // Validate measurement ID format (G-XXXXXXXXXX)
      if (measurement_id && !measurement_id.match(/^G-[A-Z0-9]+$/i)) {
        return res.status(400).json({ error: "Invalid GA4 Measurement ID format. Should be G-XXXXXXXXXX" });
      }

      const config = await storage.getProjectConfig(projectId);
      config.ga4_measurement_id = measurement_id || undefined;
      await storage.updateProjectConfig(config);
      
      res.json({ success: true, measurement_id: measurement_id || null });
    } catch (error: any) {
      console.error("[GA4 Tracking] Error:", error);
      res.status(500).json({ error: error.message || "Failed to update GA4 tracking ID" });
    }
  });

  // ========================================
  // USAGE API - EXACT SAME AS vf-usage-api-exporter/src/server.js
  // ========================================

  const USAGE_ENDPOINT = "https://analytics-api.voiceflow.com/v2/query/usage";

  async function postJson(url: string, body: any, headers: Record<string, string>) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }
    if (!response.ok) {
      const err: any = new Error(`HTTP ${response.status}`);
      err.response = response;
      err.body = json;
      throw err;
    }
    return json;
  }

  function buildFilter({ projectId, limit, startTime, endTime, cursor }: any) {
    const filter: any = { projectID: projectId, limit };
    if (startTime) filter.startTime = startTime;
    if (endTime) filter.endTime = endTime;
    if (cursor != null) filter.cursor = cursor;
    return filter;
  }

  async function fetchUsageItems({ apiKey, projectId, metricName, limit, startTime, endTime }: any) {
    const headers = { Authorization: apiKey };
    let cursor = undefined;
    const items: any[] = [];
    const maxPages = 100;
    for (let page = 0; page < maxPages; page++) {
      const body = {
        data: {
          name: metricName,
          filter: buildFilter({ projectId, limit, startTime, endTime, cursor }),
        },
      };
      const json = await postJson(USAGE_ENDPOINT, body, headers);
      const pageItems = json?.result?.items || [];
      if (!Array.isArray(pageItems) || pageItems.length === 0) break;
      items.push(...pageItems);
      const nextCursor = json?.result?.cursor;
      if (nextCursor == null) break;
      cursor = nextCursor;
    }
    // Sort by period ascending
    items.sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
    return items;
  }

  function toInt(value: any, fallback: number) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  app.get("/api/usage", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      
      // Get project config from database
      const config = await storage.getProjectConfig(projectId);
      
      // Get API key from database config (required)
      const apiKey = config.vf_api_key;
      if (!apiKey) {
        return res.status(400).json({ error: "Voiceflow API key not configured. Please set it in your project settings." });
      }

      // Use project_id from database config (not from query params or env vars)
      const reqProjectId = config.project_id;
      const metricName = ((req.query.metric as string) || "credit_usage").trim();
      const limit = toInt(req.query.limit, 100);
      const startTime = req.query.startTime as string;
      const endTime = req.query.endTime as string;

      const items = await fetchUsageItems({ 
        apiKey, 
        projectId: reqProjectId, 
        metricName, 
        limit, 
        startTime, 
        endTime 
      });
      
      return res.json({ projectId: reqProjectId, metric: metricName, items });
    } catch (err: any) {
      return res.status(502).json({ 
        error: err?.message || "Upstream error", 
        details: err?.body 
      });
    }
  });

  // Legacy usage stats API (keeping for backward compatibility)
  app.get("/api/usage/stats", requireAuth, async (req, res) => {
    try {
      // Mock data for now - will be replaced with real Voiceflow API calls
      const usageStats = {
        totalUsage: 15234,
        creditsUsed: 7521,
        activeConversations: 42,
        filesInKB: await storage.getKnowledgeBaseFiles().then(files => files.length),
        usageHistory: [
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), totalRequests: 1200, successfulRequests: 1150, failedRequests: 50 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), totalRequests: 1450, successfulRequests: 1400, failedRequests: 50 },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), totalRequests: 1800, successfulRequests: 1750, failedRequests: 50 },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), totalRequests: 2100, successfulRequests: 2050, failedRequests: 50 },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), totalRequests: 2500, successfulRequests: 2450, failedRequests: 50 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), totalRequests: 3084, successfulRequests: 3000, failedRequests: 84 },
          { date: new Date().toISOString(), totalRequests: 3100, successfulRequests: 3021, failedRequests: 79 },
        ],
      };
      res.json(usageStats);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ error: "Failed to fetch usage stats" });
    }
  });

  // Knowledge Base APIs
  app.get("/api/knowledge-base", requireAuth, async (req, res) => {
    try {
      const files = await storage.getKnowledgeBaseFiles();
      res.json(files);
    } catch (error) {
      console.error("Error fetching knowledge base files:", error);
      res.status(500).json({ error: "Failed to fetch knowledge base files" });
    }
  });

  // Fetch knowledge base data from Voiceflow API
  app.get("/api/knowledge-base/voiceflow", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const apiKey = await getApiKey(req);
      if (!apiKey) {
        return res.status(400).json({ error: "Voiceflow API key not configured" });
      }

      console.log("[KB Fetch] Fetching knowledge base data from Voiceflow...");

      // Voiceflow Knowledge Base Document List API
      const url = `${VOICEFLOW_API_BASE}/v1/knowledge-base/docs?page=1&limit=100`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[KB Fetch] Voiceflow API error:", errorText);
        throw new Error(`Voiceflow API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`[KB Fetch] Fetched ${data?.data?.length || 0} knowledge base documents from Voiceflow`);
      console.log(`[KB Fetch] Total documents: ${data?.total || 0}`);

      res.json(data);
    } catch (error: any) {
      console.error("[KB Fetch] Error fetching knowledge base from Voiceflow:", error);
      res.status(500).json({ error: error.message || "Failed to fetch knowledge base from Voiceflow" });
    }
  });

  app.post("/api/knowledge-base/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      console.log("=== [KB Upload] START ===");
      console.log("[KB Upload] Request received");
      console.log("[KB Upload] Session data:", {
        projectId: req.session.projectId,
        hasSession: !!req.session,
      });
      console.log("[KB Upload] Body:", req.body);
      console.log("[KB Upload] File present:", !!req.file);
      
      if (!req.file) {
        console.error("[KB Upload] No file in request!");
        return res.status(400).json({ error: "No file provided" });
      }

      console.log("[KB Upload] File details:", {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        buffer_size: req.file.buffer?.length || 0,
      });

      // Get API credentials from session
      const projectId = req.session.projectId;
      console.log("[KB Upload] Project ID from session:", projectId);
      
      if (!projectId) {
        console.error("[KB Upload] No project ID in session!");
        return res.status(401).json({ error: "Not authenticated or project ID missing" });
      }

      console.log("[KB Upload] Fetching config for project:", projectId);
      // Get project config from database to get API key and project_id
      const config = await storage.getProjectConfig(projectId);
      const apiKey = config.vf_api_key;
      
      if (!apiKey) {
        console.error("[KB Upload] No API key available!");
        return res.status(400).json({ error: "Voiceflow API key not configured. Please add your API key in Settings." });
      }

      console.log("[KB Upload] Preparing to upload to Voiceflow Knowledge Base...");
      console.log("[KB Upload] API Key (first 20 chars):", apiKey.substring(0, 20) + "...");
      console.log("[KB Upload] Project ID from database:", config.project_id);

      // Upload to Voiceflow Knowledge Base API
      const FormData = (await import("form-data")).default;
      const formData = new FormData();
      
      console.log("[KB Upload] Creating FormData with file:");
      console.log("[KB Upload] - File name:", req.file.originalname);
      console.log("[KB Upload] - File size:", req.file.size);
      console.log("[KB Upload] - Buffer length:", req.file.buffer.length);
      console.log("[KB Upload] - MIME type:", req.file.mimetype);
      
      // Append file exactly like the working example - just buffer and filename
      formData.append("file", req.file.buffer, req.file.originalname);

      // Add metadata if provided
      if (req.body.metadata) {
        console.log("[KB Upload] Adding metadata:", req.body.metadata);
        formData.append("metadata", req.body.metadata);
      }

      console.log("[KB Upload] VOICEFLOW_API_BASE constant value:", VOICEFLOW_API_BASE);
      const uploadUrl = `${VOICEFLOW_API_BASE}/v1/knowledge-base/docs/upload?maxChunkSize=1000`;
      console.log("[KB Upload] Constructed Upload URL:", uploadUrl);
      
      const formHeaders = formData.getHeaders();
      console.log("[KB Upload] FormData headers:", formHeaders);
      console.log("[KB Upload] FormData boundary:", formHeaders['content-type']);
      console.log("[KB Upload] API Key (first 20 chars):", apiKey.substring(0, 20) + "...");
      console.log("[KB Upload] Making request to Voiceflow...");

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: apiKey,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      console.log("[KB Upload] Voiceflow response status:", uploadResponse.status);
      console.log("[KB Upload] Voiceflow response headers:", Object.fromEntries(uploadResponse.headers.entries()));

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("[KB Upload] Voiceflow API error response:", errorText);
        
        // Return the actual status code from Voiceflow
        return res.status(uploadResponse.status).json({
          error: `Voiceflow API error ${uploadResponse.status}`,
          details: errorText,
          voiceflowStatus: uploadResponse.status
        });
      }

      const voiceflowResult = await uploadResponse.json();
      console.log("[KB Upload] Voiceflow response data:", JSON.stringify(voiceflowResult, null, 2));

      // Store reference in local database
      const fileData = {
        name: req.file.originalname,
        size: req.file.size,
      };

      console.log("[KB Upload] Storing in local database...");
      const validated = insertKnowledgeBaseFileSchema.parse(fileData);
      const file = await storage.createKnowledgeBaseFile(validated);
      
      console.log("[KB Upload] File stored successfully with ID:", file.id);
      console.log("=== [KB Upload] SUCCESS ===");
      
      // Return combined result
      res.json({
        ...file,
        voiceflow: voiceflowResult,
      });
    } catch (error: any) {
      console.error("=== [KB Upload] ERROR ===");
      console.error("[KB Upload] Error type:", error.constructor.name);
      console.error("[KB Upload] Error message:", error.message);
      console.error("[KB Upload] Error stack:", error.stack);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });

  app.delete("/api/knowledge-base/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteKnowledgeBaseFile(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Bulk export knowledge base files
  app.post("/api/knowledge-base/bulk-export", requireAuth, async (req, res) => {
    try {
      const { fileIds, format } = req.body;

      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ error: "File IDs required" });
      }

      console.log(`Bulk exporting ${fileIds.length} knowledge base files...`);

      const files = await storage.getKnowledgeBaseFiles();
      const selectedFiles = files.filter(file => fileIds.includes(file.id));

      const AdmZip = (await import("adm-zip")).default;
      const zip = new AdmZip();

      // Add each file to the ZIP
      selectedFiles.forEach((file) => {
        if (format === "json") {
          const jsonContent = JSON.stringify(file, null, 2);
          zip.addFile(`${file.name}.json`, Buffer.from(jsonContent, "utf-8"));
        } else {
          // For binary files, we'd need to store the actual file content
          // For now, create a metadata file
          const metadata = `${file.name}\nSize: ${file.size} bytes\nUploaded: ${file.uploadedAt}`;
          zip.addFile(`${file.name}.txt`, Buffer.from(metadata, "utf-8"));
        }
      });

      const zipBuffer = zip.toBuffer();

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="knowledge-base-bulk.${format === "json" ? "zip" : "zip"}"`
      );
      res.send(zipBuffer);
    } catch (error: any) {
      console.error("Error in knowledge base bulk export:", error);
      res.status(500).json({ error: error.message || "Failed to export knowledge base files" });
    }
  });

  // Export knowledge base data from Voiceflow
  app.post("/api/knowledge-base/export", async (req, res) => {
    try {
      const { apiKey, projectId, environmentId, format } = req.body;

      if (!apiKey || !projectId) {
        return res.status(400).json({ error: "API key and project ID required" });
      }

      console.log("[KB Export] Exporting knowledge base data from Voiceflow...");

      // Voiceflow Knowledge Base Document List API
      const url = `${VOICEFLOW_API_BASE}/v1/knowledge-base/docs?page=1&limit=100`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[KB Export] Voiceflow API error:", errorText);
        throw new Error(`Voiceflow API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`[KB Export] Fetched ${data?.data?.length || 0} knowledge base documents from Voiceflow`);
      console.log(`[KB Export] Total documents: ${data?.total || 0}`);

      // Create ZIP export
      const AdmZip = (await import("adm-zip")).default;
      const zip = new AdmZip();

      if (data?.data && Array.isArray(data.data)) {
        data.data.forEach((doc: any, index: number) => {
          if (format === "json") {
            const jsonContent = JSON.stringify(doc, null, 2);
            const fileName = doc.data?.name || `document-${index + 1}`;
            zip.addFile(`${fileName}.json`, Buffer.from(jsonContent, "utf-8"));
          } else {
            const docData = doc.data || {};
            const txtContent = `Document ID: ${doc.documentID || 'Unknown'}\nName: ${docData.name || 'Unknown'}\nType: ${docData.type || 'Unknown'}\nURL: ${docData.url || 'N/A'}\nStatus: ${doc.status || 'Unknown'}\nUpdated: ${doc.updatedAt || 'Unknown'}`;
            const fileName = docData.name || `document-${index + 1}`;
            zip.addFile(`${fileName}.txt`, Buffer.from(txtContent, "utf-8"));
          }
        });
      }

      // Add a summary file
      const summary = `Voiceflow Knowledge Base Export Summary
Total Documents: ${data?.total || 0}
Documents in Export: ${data?.data?.length || 0}
Export Format: ${format.toUpperCase()}
Project ID: ${projectId}
Environment ID: ${environmentId || 'None'}
Export Date: ${new Date().toISOString()}`;
      zip.addFile('export-summary.txt', Buffer.from(summary, "utf-8"));

      const zipBuffer = zip.toBuffer();

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="voiceflow-knowledge-base-export.zip"`
      );
      res.send(zipBuffer);
    } catch (error: any) {
      console.error("[KB Export] Error in knowledge base export:", error);
      res.status(500).json({ error: error.message || "Failed to export knowledge base data" });
    }
  });

  // ========================================
  // EXPORTER API ROUTES - EXACT SAME AS vf-knowledge-base-exporter
  // ========================================

  // Setup multer for file uploads with disk storage (like the exporter)
  const uploadToDisk = multer({ dest: join(process.cwd(), 'uploads') });

  // GET /api/docs - List all documents from Voiceflow KB (exact copy from exporter)
  app.get('/api/docs', requireAuth, async (req, res) => {
    console.log('[API] GET /api/docs - Fetching documents...');
    try {
      const projectId = req.session.projectId!;
      const apiKey = await getApiKey(req);
      if (!apiKey) {
        console.error('[API] ERROR: No API key configured');
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      const kb = new VoiceflowKB(apiKey, projectId);
      const docs = await kb.listDocuments(100, 0);
      console.log('[API] Documents fetched successfully:', docs.data?.length || 0, 'docs');
      res.json({ data: docs.data || [] });
    } catch (e: any) {
      console.error('[API] ERROR fetching documents:', e);
      console.error('[API] Error stack:', e.stack);
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/upload - Upload file to Voiceflow KB (exact copy from exporter)
  app.post('/api/upload', requireAuth, uploadToDisk.single('file'), async (req, res) => {
    console.log('[UPLOAD] POST /api/upload - Starting upload...');
    console.log('[UPLOAD] File received:', req.file);
    
    if (!req.file) {
      console.error('[UPLOAD] ERROR: No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('[UPLOAD] File details:');
    console.log('  - Original name:', req.file.originalname);
    console.log('  - Temp path:', req.file.path);
    console.log('  - Size:', req.file.size, 'bytes');
    console.log('  - Mimetype:', req.file.mimetype);
    
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);

      if (!config.vf_api_key) {
        console.error('[UPLOAD] ERROR: No API key configured');
        unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      const kb = new VoiceflowKB(config.vf_api_key, projectId);
      
      console.log('[UPLOAD] Calling kb.uploadDocument...');
      const result = await kb.uploadDocument(
        req.file.path,
        null,
        null,
        null,
        null,
        req.file.originalname
      );
      console.log('[UPLOAD] Upload successful!');
      console.log('[UPLOAD] Response from Voiceflow:', JSON.stringify(result, null, 2));
      unlinkSync(req.file.path);
      res.json({ data: result.data });
    } catch (e: any) {
      console.error('[UPLOAD] ERROR during upload:', e.message);
      console.error('[UPLOAD] Error stack:', e.stack);
      if (e.response) {
        console.error('[UPLOAD] API Response status:', e.response.status);
        console.error('[UPLOAD] API Response data:', JSON.stringify(e.response.data, null, 2));
      }
      if (req.file) {
        unlinkSync(req.file.path);
      }
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /api/docs/:id - Delete document from Voiceflow KB (exact copy from exporter)
  app.delete('/api/docs/:id', requireAuth, async (req, res) => {
    console.log('[DELETE] DELETE /api/docs/' + req.params.id);
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);

      if (!config.vf_api_key) {
        console.error('[DELETE] ERROR: No API key configured');
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      const kb = new VoiceflowKB(config.vf_api_key, projectId);
      const result = await kb.deleteDocument(req.params.id);
      console.log('[DELETE] Delete successful');
      res.json({ data: result.data || { ok: true } });
    } catch (e: any) {
      console.error('[DELETE] ERROR:', e.message);
      console.error('[DELETE] Error stack:', e.stack);
      res.status(500).json({ error: e.message });
    }
  });

  // Helper function to convert object to CSV row with proper escaping
  function escapeCSVField(field: any): string {
    if (field === null || field === undefined) return '';
    const str = String(field);
    // If field contains comma, newline, or quote, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  // Helper function to write CSV file
  function writeCSVFile(filePath: string, headers: string[], rows: any[]): void {
    const csvLines: string[] = [];
    // Write headers
    csvLines.push(headers.map(escapeCSVField).join(','));
    // Write rows
    rows.forEach(row => {
      const values = headers.map(header => escapeCSVField(row[header] || ''));
      csvLines.push(values.join(','));
    });
    writeFileSync(filePath, csvLines.join('\n'), 'utf-8');
  }

  // Refresh transcripts endpoint - fetches from Voiceflow and updates CSV files
  app.post("/api/transcripts/refresh", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const apiKey = await getApiKey(req);
      
      if (!apiKey) {
        return res.status(400).json({ error: "Voiceflow API key not configured" });
      }

      console.log("[Transcript Refresh] Starting refresh for project:", projectId);

      // Step 1: Fetch transcripts from Voiceflow API
      const ANALYTICS_BASE_URL = "https://analytics-api.voiceflow.com/v1";
      const headers = {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: apiKey,
      };

      const transcripts: any[] = [];
      let skip = 0;
      const pageSize = 100;

      // Calculate date range: go back 12 months to ensure we get all historical data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12); // 12 months ago

      console.log("[Transcript Refresh] Fetching transcripts from Voiceflow...");
      console.log(`[Transcript Refresh] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      while (true) {
        const url = `${ANALYTICS_BASE_URL}/transcript/project/${projectId}`;
        const params = new URLSearchParams({ take: pageSize.toString(), skip: skip.toString(), order: "DESC" });
        
        // Include date range in request body to fetch historical transcripts
        // Voiceflow API accepts filter with startDate and endDate
        const requestBody: any = {
          filter: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }
        };
        
        const response = await fetch(`${url}?${params}`, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Voiceflow API error ${response.status}: ${errorText}`);
        }

        const payload = await response.json();
        const pageTranscripts = payload.transcripts || [];
        
        if (pageTranscripts.length === 0) break;
        
        transcripts.push(...pageTranscripts);
        console.log(`[Transcript Refresh] Fetched ${transcripts.length} transcripts so far...`);
        
        if (pageTranscripts.length < pageSize) break;
        skip += pageTranscripts.length;
      }

      console.log(`[Transcript Refresh] Fetched ${transcripts.length} total transcripts`);

      // Step 2: Fetch messages for each transcript
      const allMessages: any[] = [];
      let successCount = 0;
      let errorCount = 0;
      let emptyCount = 0;
      
      console.log("[Transcript Refresh] Fetching messages for transcripts...");
      
      for (const transcript of transcripts) {
        try {
          // Fetch detailed transcript with logs
          const detailUrl = `${ANALYTICS_BASE_URL}/transcript/${transcript.id}`;
          const detailResponse = await fetch(detailUrl, { headers });
          
          if (!detailResponse.ok) {
            console.warn(`[Transcript Refresh] Failed to fetch transcript ${transcript.id}: ${detailResponse.status} ${detailResponse.statusText}`);
            errorCount++;
            continue;
          }
          
          const detailPayload = await detailResponse.json();
          const fullTranscript = detailPayload.transcript;
          const logs = fullTranscript?.logs || [];
          
          if (!Array.isArray(logs) || logs.length === 0) {
            console.warn(`[Transcript Refresh] No logs found for transcript ${transcript.id}`);
            emptyCount++;
            continue;
          }
          
          let messageCount = 0;
          
          // Parse logs to extract messages (same logic as AI Analysis)
          for (const log of logs) {
            const logType = log?.type;
            const data = log?.data || {};
            
            if (logType === "action" && data.type === "text") {
              // User message
              const messageText = data.payload || "";
              if (messageText.trim()) {
                allMessages.push({
                  transcriptID: transcript.id,
                  sessionID: transcript.sessionID,
                  role: "user",
                  message: messageText,
                  logCreatedAt: log.createdAt || new Date().toISOString(),
                });
                messageCount++;
              }
            } else if (logType === "trace" && data.type === "text") {
              // AI message
              const payload = data.payload || {};
              if (payload.ai && payload.message) {
                allMessages.push({
                  transcriptID: transcript.id,
                  sessionID: transcript.sessionID,
                  role: "ai",
                  message: payload.message,
                  logCreatedAt: log.createdAt || new Date().toISOString(),
                });
                messageCount++;
              }
            }
          }
          
          if (messageCount > 0) {
            successCount++;
            console.log(`[Transcript Refresh] Found ${messageCount} messages for transcript ${transcript.id}`);
          } else {
            emptyCount++;
            console.warn(`[Transcript Refresh] No messages extracted from logs for transcript ${transcript.id} (${logs.length} logs found)`);
          }
        } catch (error: any) {
          console.error(`[Transcript Refresh] Error fetching messages for transcript ${transcript.id}:`, error.message);
          errorCount++;
          // Continue with other transcripts even if one fails
        }
      }
      
      console.log(`[Transcript Refresh] Message fetch summary: ${successCount} with messages, ${emptyCount} empty, ${errorCount} errors`);

      console.log(`[Transcript Refresh] Fetched ${allMessages.length} total messages`);

      // Step 3: Format transcripts for CSV
      const transcriptRows = transcripts.map((t: any) => ({
        id: t.id || '',
        sessionID: t.sessionID || '',
        projectID: t.projectID || projectId,
        environmentID: t.environmentID || '',
        createdAt: t.createdAt || '',
        updatedAt: t.updatedAt || '',
        expiresAt: t.expiresAt || '',
        endedAt: t.endedAt || '',
        recordingURL: t.recordingURL || '',
        properties_count: Array.isArray(t.properties) ? t.properties.length : 0,
        properties_json: JSON.stringify(t.properties || []),
        evaluations_count: Array.isArray(t.evaluations) ? t.evaluations.length : 0,
        evaluations_json: JSON.stringify(t.evaluations || []),
      }));

      // Step 4: Write CSV files
      const transcriptsPath = join(process.cwd(), 'server', 'data', 'transcripts.csv');
      const messagesPath = join(process.cwd(), 'server', 'data', 'transcripts_messages.csv');

      const transcriptHeaders = [
        'id', 'sessionID', 'projectID', 'environmentID', 'createdAt', 'updatedAt',
        'expiresAt', 'endedAt', 'recordingURL', 'properties_count', 'properties_json',
        'evaluations_count', 'evaluations_json'
      ];

      const messageHeaders = [
        'transcriptID', 'sessionID', 'role', 'message', 'logCreatedAt'
      ];

      console.log("[Transcript Refresh] Writing CSV files...");
      writeCSVFile(transcriptsPath, transcriptHeaders, transcriptRows);
      writeCSVFile(messagesPath, messageHeaders, allMessages);

      console.log("[Transcript Refresh] Refresh complete!");
      res.json({
        success: true,
        transcriptsCount: transcripts.length,
        messagesCount: allMessages.length,
        message: `Refreshed ${transcripts.length} transcripts and ${allMessages.length} messages`,
      });
    } catch (error: any) {
      console.error("[Transcript Refresh] Error:", error);
      res.status(500).json({ error: error.message || "Failed to refresh transcripts" });
    }
  });

  // Get transcripts from CSV data
  app.get("/api/transcripts", requireAuth, async (req, res) => {
    try {
      console.log("Loading transcripts from CSV...");

      const { transcripts } = loadCSVData();

      // Debug: Check for undefined/null entries
      const invalidEntries = transcripts.filter((t: any) => !t || !t.id);
      if (invalidEntries.length > 0) {
        console.error('[CSV Debug] Found invalid entries:', invalidEntries.length, 'invalid out of', transcripts.length);
        console.error('[CSV Debug] Sample invalid entries:', invalidEntries.slice(0, 3));
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      // Sort by createdAt descending
      const sortedTranscripts = transcripts.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Paginate
      const paginatedTranscripts = sortedTranscripts.slice(skip, skip + limit);

      console.log(`[CSV Debug] Loaded ${paginatedTranscripts.length} transcripts from CSV (page ${page})`);
      console.log(`[CSV Debug] First 3 transcript IDs:`, paginatedTranscripts.slice(0, 3).map((t: any) => ({
        id: t?.id,
        sessionID: t?.sessionID,
        hasId: !!t?.id,
      })));

      res.json({
        transcripts: paginatedTranscripts,
        page,
        limit,
        hasMore: (skip + limit) < sortedTranscripts.length,
      });
    } catch (error: any) {
      console.error("Error loading transcripts from CSV:", error);
      res.status(500).json({ error: error.message || "Failed to load transcripts" });
    }
  });

  // Get messages for a specific transcript from CSV
  app.get("/api/transcripts/:id/messages", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Loading messages for transcript ${id} from CSV...`);

      const { transcripts, messages } = loadCSVData();
      
      // Find the transcript to get its sessionID
      const transcript = transcripts.find((t: any) => t.id === id);
      const sessionID = transcript?.sessionID;

      // Filter messages for this transcript - try both transcriptID and sessionID
      let transcriptMessages = messages.filter((m: any) => m.transcriptID === id);
      
      // If no messages found by transcriptID, try sessionID as fallback
      if (transcriptMessages.length === 0 && sessionID) {
        console.log(`No messages found by transcriptID, trying sessionID: ${sessionID}`);
        transcriptMessages = messages.filter((m: any) => m.sessionID === sessionID);
      }

      console.log(`Found ${transcriptMessages.length} messages for transcript ${id}${sessionID ? ` (sessionID: ${sessionID})` : ''}`);

      res.json(transcriptMessages);
    } catch (error: any) {
      console.error("Error loading messages from CSV:", error);
      res.status(500).json({ error: error.message || "Failed to load messages" });
    }
  });

  // Bulk export transcripts from CSV
  app.post("/api/transcripts/bulk-export", requireAuth, async (req, res) => {
    try {
      const { transcriptIds, format: exportFormat } = req.body;

      if (!transcriptIds || !Array.isArray(transcriptIds) || transcriptIds.length === 0) {
        return res.status(400).json({ error: "Transcript IDs required" });
      }

      console.log(`Bulk exporting ${transcriptIds.length} transcripts from CSV...`);

      const { messages: allMessages } = loadCSVData();
      const AdmZip = (await import("adm-zip")).default;
      const zip = new AdmZip();

      // Process each transcript
      transcriptIds.forEach((id: string) => {
        const messages = allMessages.filter((m: any) => m.transcriptID === id);

        if (messages.length === 0) {
          zip.addFile(
            `${id}.error.txt`,
            Buffer.from(`No messages found for transcript ${id}`, "utf-8")
          );
          return;
        }

        if (exportFormat === "json") {
          const jsonContent = JSON.stringify(messages, null, 2);
          zip.addFile(`${id}.json`, Buffer.from(jsonContent, "utf-8"));
        } else {
          const txtContent = messages
            .map(
              (msg: any) =>
                `[${msg.logCreatedAt}] ${msg.role.toUpperCase()}: ${msg.message}`
            )
            .join("\n\n");
          zip.addFile(`${id}.txt`, Buffer.from(txtContent, "utf-8"));
        }
      });

      const zipBuffer = zip.toBuffer();

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="transcripts-bulk.zip"`
      );
      res.send(zipBuffer);
    } catch (error: any) {
      console.error("Error in bulk export:", error);
      res.status(500).json({ error: error.message || "Failed to export transcripts" });
    }
  });

  // Voiceflow Limit Counter Webhook Endpoint (public, no auth required)
  // This endpoint is called by Voiceflow to check if usage limits are reached
  // Returns plain text: "usage_limit_reached" or "usage_allowed" (like TokenFlowX)
  app.post("/check", async (req, res) => {
    try {
      const requestProjectId = req.body.project_id as string;
      
      if (!requestProjectId) {
        return res.status(400).send("error: project_id required");
      }

      // Get project config from database - this ensures we use the project_id from the database
      const config = await storage.getProjectConfig(requestProjectId);
      
      // Use the project_id from the database config instead of the request body
      const projectId = config.project_id;
      
      // Get credit account to check current balance
      const account = await storage.getDefaultCreditAccount();
      const creditLimit = parseFloat(account.creditLimit || "0");
      const creditsUsed = parseFloat(account.creditsUsed || "0");
      const remainingBalance = creditLimit - creditsUsed;
      
      // Check if limit is reached (remaining balance <= 0)
      const limitReached = remainingBalance <= 0;
      
      // Return plain text response like TokenFlowX
      if (limitReached) {
        res.send("usage_limit_reached");
      } else {
        res.send("usage_allowed");
      }
    } catch (error: any) {
      console.error("[VF Limit Counter] Error checking limit:", error);
      res.status(500).send("error: failed to check limit");
    }
  });

  // Credit/Budget Management APIs
  app.get("/api/budget/check", requireAuth, async (req, res) => {
    try {
      // Use project_id from session only (prevent IDOR)
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      const wasReset = checkAndResetIfNeeded(config);
      
      if (wasReset) {
        await storage.updateProjectConfig(config);
      }

      const currentCost = calculateCost(config.credits_used);
      const budgetInCredits = Math.floor((config.budget / COST_PER_UNIT) * CREDITS_PER_UNIT);
      const creditsRemaining = budgetInCredits - config.credits_used;
      const overBudget = currentCost > config.budget;
      
      const startDate = new Date(config.start_date);
      const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = RESET_DAYS - daysElapsed;

      const status = overBudget ? "usage_limit_reached" : `${creditsRemaining}_credits_remain`;

      const response = {
        status,
        over_budget: overBudget,
        project_id: projectId,
        budget: config.budget,
        credits_used: config.credits_used,
        current_cost: parseFloat(currentCost.toFixed(2)),
        remaining: parseFloat((config.budget - currentCost).toFixed(2)),
        credits_remaining: creditsRemaining,
        days_remaining: Math.max(0, daysRemaining),
        start_date: config.start_date,
        reset: wasReset,
        message: wasReset ? "Period reset (30 days elapsed)" : undefined,
      };

      res.json(response);
    } catch (error) {
      console.error("Error checking budget:", error);
      res.status(500).json({ error: "Failed to check budget" });
    }
  });

  app.post("/api/budget/set", requireAuth, async (req, res) => {
    try {
      const { budget, vf_api_key } = req.body;
      
      if (budget === undefined) {
        return res.status(400).json({ error: "budget required" });
      }

      // Use project_id from session only (prevent IDOR)
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      config.budget = parseFloat(budget);
      
      if (vf_api_key) {
        config.vf_api_key = vf_api_key;
      }

      await storage.updateProjectConfig(config);

      res.json({
        message: "Budget set successfully",
        project_id: projectId,
        budget: config.budget,
        has_vf_api_key: !!config.vf_api_key,
      });
    } catch (error) {
      console.error("Error setting budget:", error);
      res.status(500).json({ error: "Failed to set budget" });
    }
  });

  app.post("/api/credits/add", requireAuth, async (req, res) => {
    try {
      const { credits } = req.body;
      
      if (credits === undefined) {
        return res.status(400).json({ error: "credits required" });
      }

      // Use project_id from session only (prevent IDOR)
      const projectId = req.session.projectId!;
      const config = await storage.addCredits(projectId, credits);
      const currentCost = calculateCost(config.credits_used);

      res.json({
        message: "Credits added",
        project_id: config.project_id,
        credits_used: config.credits_used,
        current_cost: parseFloat(currentCost.toFixed(2)),
      });
    } catch (error) {
      console.error("Error adding credits:", error);
      res.status(500).json({ error: "Failed to add credits" });
    }
  });

  app.get("/api/budget/status/:projectId", requireAuth, async (req, res) => {
    try {
      // Ignore URL param, use session projectId only (prevent IDOR)
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      const currentCost = calculateCost(config.credits_used);
      const overBudget = currentCost > config.budget;

      res.json({
        project_id: projectId,
        budget: config.budget,
        credits_used: config.credits_used,
        current_cost: parseFloat(currentCost.toFixed(2)),
        remaining: parseFloat((config.budget - currentCost).toFixed(2)),
        over_budget: overBudget,
        pricing: {
          credits: CREDITS_PER_UNIT,
          cost: COST_PER_UNIT,
        },
      });
    } catch (error) {
      console.error("Error fetching budget status:", error);
      res.status(500).json({ error: "Failed to fetch budget status" });
    }
  });

  app.post("/api/budget/reset/:projectId", requireAuth, async (req, res) => {
    try {
      // Ignore URL param, use session projectId only (prevent IDOR)
      const projectId = req.session.projectId!;
      await storage.resetProject(projectId);

      res.json({
        message: `Project ${projectId} reset successfully`,
      });
    } catch (error) {
      console.error("Error resetting project:", error);
      res.status(500).json({ error: "Failed to reset project" });
    }
  });

  // ========================================
  // COST TAB API ROUTES - From VoiceflowBilling
  // ========================================

  // Get credit account information
  app.get("/api/account", requireAuth, async (_req, res) => {
    try {
      let account = await storage.getDefaultCreditAccount();
      const creditLimit = parseFloat(account.creditLimit);
      let creditsUsed = parseFloat(account.creditsUsed);
      
      // Calculate billing period dates
      const periodStart = new Date(account.createdAt);
      const periodReset = new Date(periodStart);
      periodReset.setMonth(periodReset.getMonth() + 1);
      
      // Check if reset is needed (period has expired)
      const now = Date.now();
      if (now >= periodReset.getTime()) {
        console.log("[Account] Billing period expired - resetting usage to 0 and period to 30 days");
        // Reset the account: set createdAt to now and reset usage to 0
        await storage.resetCreditAccount(account.id);
        account = await storage.getDefaultCreditAccount();
        creditsUsed = parseFloat(account.creditsUsed);
        
        // Recalculate with new period
        const newPeriodStart = new Date(account.createdAt);
        const newPeriodReset = new Date(newPeriodStart);
        newPeriodReset.setMonth(newPeriodReset.getMonth() + 1);
        
        const msUntilReset = newPeriodReset.getTime() - now;
        const daysUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60 * 24));
        const hoursUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
        
        const remaining = creditLimit - creditsUsed;
        
        return res.json({
          ...account,
          creditLimit: creditLimit.toFixed(2),
          creditsUsed: creditsUsed.toFixed(2),
          remaining: remaining.toFixed(2),
          limitExceeded: remaining < 0 ? "limit_reached" : "within_limit",
          billingPeriod: {
            startDate: newPeriodStart.toISOString(),
            resetDate: newPeriodReset.toISOString(),
            daysUntilReset,
            hoursUntilReset,
            minutesUntilReset,
            totalSecondsUntilReset: Math.floor(msUntilReset / 1000)
          },
          wasReset: true
        });
      }
      
      // Normal case - period not expired yet
      const msUntilReset = Math.max(0, periodReset.getTime() - now);
      const daysUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60 * 24));
      const hoursUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
      
      const remaining = creditLimit - creditsUsed;
      
      res.json({
        ...account,
        creditLimit: creditLimit.toFixed(2),
        creditsUsed: creditsUsed.toFixed(2),
        remaining: remaining.toFixed(2),
        limitExceeded: remaining < 0 ? "limit_reached" : "within_limit",
        billingPeriod: {
          startDate: periodStart.toISOString(),
          resetDate: periodReset.toISOString(),
          daysUntilReset,
          hoursUntilReset,
          minutesUntilReset,
          totalSecondsUntilReset: Math.floor(msUntilReset / 1000)
        }
      });
    } catch (error: any) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all transactions
  app.get("/api/transactions", requireAuth, async (_req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all usage records
  app.get("/api/usage-records", requireAuth, async (_req, res) => {
    try {
      const usageRecords = await storage.getAllUsageRecords();
      res.json(usageRecords);
    } catch (error: any) {
      console.error("Error fetching usage records:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update account plan
  // Get plans endpoint
  app.get("/api/plans", requireAuth, async (req, res) => {
    try {
      const plans = [
        { id: "free", name: "Free", tier: 0, initialBalance: 10, voiceflowCredits: 1000, price: 0 },
        { id: "starter", name: "Starter", tier: 1, initialBalance: 50, voiceflowCredits: 5000, price: 29 },
        { id: "pro", name: "Pro", tier: 2, initialBalance: 200, voiceflowCredits: 20000, price: 99 },
        { id: "enterprise", name: "Enterprise", tier: 3, initialBalance: 1000, voiceflowCredits: 100000, price: 299 },
      ];
      res.json({ plans });
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Error fetching plans: " + error.message });
    }
  });

  // Create payment intent for plan subscription
  app.post("/api/plans/payment-intent", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      const plans: Record<string, { initialBalance: number; chatbotCredits: number; price: number }> = {
        free: { initialBalance: 10, chatbotCredits: 1000, price: 0 },
        starter: { initialBalance: 50, chatbotCredits: 5000, price: 29 },
        pro: { initialBalance: 200, chatbotCredits: 20000, price: 99 },
        enterprise: { initialBalance: 1000, chatbotCredits: 100000, price: 299 },
      };

      const plan = plans[planId];
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      // Free plan doesn't require payment
      if (plan.price === 0) {
        return res.status(400).json({ error: "Free plan does not require payment" });
      }

      if (!stripe) {
        return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable." });
      }

      const projectId = req.session.projectId!;
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(plan.price * 100), // Convert to cents
        currency: "usd",
        metadata: {
          planId,
          projectId,
          type: "plan_subscription",
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: plan.price,
        planId,
      });
    } catch (error: any) {
      console.error("Error creating plan payment intent:", error);
      res.status(500).json({ error: "Error creating payment intent: " + error.message });
    }
  });

  // Complete plan payment and update account
  app.post("/api/plans/complete-payment", requireAuth, async (req, res) => {
    try {
      const { planId, paymentIntentId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      if (!paymentIntentId && !stripe) {
        // Allow direct plan update if Stripe is not configured (for testing)
        console.warn("[Plan Payment] Stripe not configured, allowing direct plan update");
      } else if (paymentIntentId && stripe) {
        // Verify payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== "succeeded") {
          return res.status(400).json({ error: `Payment not completed. Status: ${paymentIntent.status}` });
        }

        // Verify metadata matches
        if (paymentIntent.metadata.planId !== planId || paymentIntent.metadata.projectId !== req.session.projectId) {
          return res.status(400).json({ error: "Payment intent metadata mismatch" });
        }
      }

      // Define plans with prices
      const plans: Record<string, { initialBalance: number; chatbotCredits: number; price: number }> = {
        free: { initialBalance: 10, chatbotCredits: 1000, price: 0 },
        starter: { initialBalance: 50, chatbotCredits: 5000, price: 29 },
        pro: { initialBalance: 200, chatbotCredits: 20000, price: 99 },
        enterprise: { initialBalance: 1000, chatbotCredits: 100000, price: 299 },
      };

      const plan = plans[planId];
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const account = await storage.getDefaultCreditAccount();
      const currentCreditsUsed = parseFloat(account.creditsUsed || "0");
      
      // Update credit limit to plan's initial balance
      const newCreditLimit = Math.max(plan.initialBalance, currentCreditsUsed);
      const newChatbotCredits = plan.chatbotCredits;
      
      console.log(`[Plan Payment] Plan: ${planId}, Price: $${plan.price}, Initial Balance: $${plan.initialBalance}`);

      await storage.updateCreditLimit(account.id, newCreditLimit.toFixed(2));
      await storage.updateVoiceflowCredits(account.id, newChatbotCredits.toFixed(0));
      await storage.updatePlanId(account.id, planId);

      // Create transaction record
      if (plan.price > 0) {
        await storage.createTransaction({
          accountId: account.id,
          type: "purchase",
          amount: plan.price.toFixed(2),
          description: `Plan subscription: ${planId}`,
          stripePaymentIntentId: paymentIntentId || null,
          status: "completed",
        });
      }

      const updatedAccount = await storage.getDefaultCreditAccount();
      
      const updatedCreditsUsed = parseFloat(updatedAccount.creditsUsed || "0");
      const updatedCreditLimit = parseFloat(updatedAccount.creditLimit || "0");
      const remainingBalance = updatedCreditLimit - updatedCreditsUsed;
      
      res.json({
        success: true,
        planId,
        creditLimit: updatedAccount.creditLimit,
        creditsUsed: updatedAccount.creditsUsed,
        remainingBalance: remainingBalance.toFixed(2),
        chatbotCredits: updatedAccount.voiceflowCredits,
        message: `Plan updated to ${planId}. Balance: $${remainingBalance.toFixed(2)}`
      });
    } catch (error: any) {
      console.error("Error completing plan payment:", error);
      res.status(500).json({ error: "Error completing plan payment: " + error.message });
    }
  });

  // Legacy endpoint - now requires payment for paid plans
  app.post("/api/account/update-plan", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      const plans: Record<string, { initialBalance: number; chatbotCredits: number; price: number }> = {
        free: { initialBalance: 10, chatbotCredits: 1000, price: 0 },
        starter: { initialBalance: 50, chatbotCredits: 5000, price: 29 },
        pro: { initialBalance: 200, chatbotCredits: 20000, price: 99 },
        enterprise: { initialBalance: 1000, chatbotCredits: 100000, price: 299 },
      };

      const plan = plans[planId];
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      // Paid plans require payment
      if (plan.price > 0) {
        return res.status(402).json({ 
          error: "Payment required",
          message: `This plan requires payment. Please use the payment flow.`,
          planId,
          price: plan.price,
        });
      }

      // Free plan can be updated directly
      const account = await storage.getDefaultCreditAccount();
      const currentCreditsUsed = parseFloat(account.creditsUsed || "0");
      const newCreditLimit = Math.max(plan.initialBalance, currentCreditsUsed);
      const newChatbotCredits = plan.chatbotCredits;
      
      await storage.updateCreditLimit(account.id, newCreditLimit.toFixed(2));
      await storage.updateVoiceflowCredits(account.id, newChatbotCredits.toFixed(0));
      await storage.updatePlanId(account.id, planId);

      const updatedAccount = await storage.getDefaultCreditAccount();
      const updatedCreditsUsed = parseFloat(updatedAccount.creditsUsed || "0");
      const updatedCreditLimit = parseFloat(updatedAccount.creditLimit || "0");
      const remainingBalance = updatedCreditLimit - updatedCreditsUsed;
      
      res.json({
        success: true,
        planId,
        creditLimit: updatedAccount.creditLimit,
        creditsUsed: updatedAccount.creditsUsed,
        remainingBalance: remainingBalance.toFixed(2),
        chatbotCredits: updatedAccount.voiceflowCredits,
        message: `Plan updated to ${planId}. Balance: $${remainingBalance.toFixed(2)}`
      });
    } catch (error: any) {
      console.error("Error updating plan:", error);
      res.status(500).json({ error: "Error updating plan: " + error.message });
    }
  });

  // Sync Voiceflow usage from API and create usage records
  app.post("/api/usage/sync-voiceflow", requireAuth, async (req, res) => {
    console.log("[Sync Voiceflow] Endpoint called");
    try {
      const projectId = req.session.projectId!;
      console.log("[Sync Voiceflow] Project ID:", projectId);
      
      // Get project config from database
      const config = await storage.getProjectConfig(projectId);
      
      // Get API key from database config (required)
      const apiKey = config.vf_api_key;
      if (!apiKey) {
        return res.status(400).json({ error: "Voiceflow API key not configured. Please set it in your project settings." });
      }

      // Use project_id from database config
      const reqProjectId = config.project_id;
      
      // Fetch Voiceflow usage from API (last 30 days)
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const items = await fetchUsageItems({ 
        apiKey, 
        projectId: reqProjectId, 
        metricName: "credit_usage",
        limit: 100,
        startTime,
        endTime
      });

      // Calculate total credits used
      const totalCredits = items.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
      
      if (totalCredits === 0) {
        return res.json({ 
          message: "No Voiceflow usage found",
          credits: 0,
          items: items.length,
          synced: 0
        });
      }

      // Get or create default account
      const account = await storage.getDefaultCreditAccount();
      
      // Check if we already have a record for this period (avoid duplicates)
      const existingRecords = await storage.getAllUsageRecords();
      const recentVoiceflowRecords = existingRecords.filter((r: any) => {
        const desc = r.description?.toLowerCase() || "";
        return desc.includes("voiceflow") && 
               new Date(r.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours
      });

      let synced = 0;
      if (recentVoiceflowRecords.length === 0) {
        // Deduct from Voiceflow credits (not from balance)
        const currentVoiceflowCreditsUsed = parseFloat(account.voiceflowCreditsUsed || "0");
        const newVoiceflowCreditsUsed = (currentVoiceflowCreditsUsed + totalCredits).toFixed(0);
        await storage.updateVoiceflowCreditsUsed(account.id, newVoiceflowCreditsUsed);

        // Create usage record for tracking (doesn't affect balance)
        await storage.createUsageRecord({
          accountId: account.id,
          amount: "0.00", // Voiceflow credits don't affect balance
          tokens: null,
          category: "compute",
          description: `Voiceflow Credits - ${totalCredits} credits used for project ${reqProjectId}`,
          metadata: JSON.stringify({ 
            projectId: reqProjectId,
            credits: totalCredits,
            voiceflowCredits: totalCredits,
            items: items.length,
            period: { startTime, endTime }
          }),
        });
        synced = 1;
      }

      const updatedAccount = await storage.getDefaultCreditAccount();
      
      res.json({
        message: "Voiceflow usage synced successfully",
        credits: totalCredits,
        creditsUsed: updatedAccount.voiceflowCreditsUsed || "0",
        creditsRemaining: (parseFloat(updatedAccount.voiceflowCredits || "0") - parseFloat(updatedAccount.voiceflowCreditsUsed || "0")).toFixed(0),
        items: items.length,
        synced,
        alreadySynced: recentVoiceflowRecords.length > 0
      });
    } catch (err: any) {
      console.error("Error syncing Voiceflow usage:", err);
      return res.status(502).json({ 
        error: err?.message || "Failed to sync Voiceflow usage", 
        details: err?.body 
      });
    }
  });

  // Create payment intent for Stripe
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const { amount, type } = req.body; // type: "balance" | "voiceflow_credits"
      
      if (!amount || amount < 1) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // TODO: Integrate with real Stripe API
      // For now, return mock client secret
      // When integrating Stripe, create payment intent with:
      // - amount: amount * 100 (convert to cents)
      // - currency: 'usd'
      // - metadata: { type: type || 'balance' }
      
      res.json({ clientSecret: `mock_secret_${Date.now()}` });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Complete payment and update credit limit or Voiceflow credits
  app.post("/api/complete-payment", requireAuth, async (req, res) => {
    try {
      const { amount, paymentIntentId, type } = req.body; // type: "balance" | "voiceflow_credits"

      if (!amount || amount < 1) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const account = await storage.getDefaultCreditAccount();

      if (type === "voiceflow_credits") {
        // Purchase Voiceflow credits (explicit purchase, not from balance)
        const creditsToAdd = Math.floor(amount / 0.006);
        const currentVoiceflowCredits = parseFloat(account.voiceflowCredits || "0");
        const newVoiceflowCredits = (currentVoiceflowCredits + creditsToAdd).toFixed(0);
        await storage.updateVoiceflowCredits(account.id, newVoiceflowCredits);
        
        await storage.createTransaction({
          accountId: account.id,
          type: "purchase",
          amount: amount.toFixed(2),
          description: `Purchased ${creditsToAdd.toLocaleString()} Voiceflow credits`,
          stripePaymentIntentId: paymentIntentId || null,
          status: "completed",
        });

        const updatedAccount = await storage.getDefaultCreditAccount();
        res.json({
          ...updatedAccount,
          creditsPurchased: creditsToAdd,
          paymentType: "voiceflow_credits"
        });
      } else {
        // Add to OpenAI balance (default)
        const currentLimit = parseFloat(account.creditLimit);
        const newLimit = (currentLimit + amount).toFixed(2);
        
        await storage.updateCreditLimit(account.id, newLimit);
        
        await storage.createTransaction({
          accountId: account.id,
          type: "purchase",
          amount: amount.toFixed(2),
          description: "Credit Top-up",
          stripePaymentIntentId: paymentIntentId || null,
          status: "completed",
        });

        const updatedAccount = await storage.getDefaultCreditAccount();
        res.json({
          ...updatedAccount,
          paymentType: "balance"
        });
      }
    } catch (error: any) {
      console.error("Error completing payment:", error);
      res.status(500).json({ message: "Error completing payment: " + error.message });
    }
  });

  // Purchase Chatbot credits (temporarily without Stripe for testing)
  app.post("/api/purchase/chatbot-credits", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body; // Amount in USD (temporarily direct purchase without Stripe)
      
      if (!amount || amount < 0.01) {
        return res.status(400).json({ error: "Invalid amount. Minimum is $0.01" });
      }

      const account = await storage.getDefaultCreditAccount();

      // Calculate credits: $30 = 5000 credits, so 1 credit = $0.006
      const creditsToAdd = Math.floor(amount / 0.006);
      const actualCost = creditsToAdd * 0.006;

      // Add Chatbot credits (DO NOT deduct from balance)
      const currentChatbotCredits = parseFloat(account.voiceflowCredits || "0");
      const newChatbotCredits = (currentChatbotCredits + creditsToAdd).toFixed(0);
      await storage.updateVoiceflowCredits(account.id, newChatbotCredits);

      // Create transaction record
      await storage.createTransaction({
        accountId: account.id,
        type: "purchase",
        amount: actualCost.toFixed(2),
        description: `Purchased ${creditsToAdd.toLocaleString()} Chatbot credits`,
        stripePaymentIntentId: null, // Temporarily no Stripe
        status: "completed",
      });

      const updatedAccount = await storage.getDefaultCreditAccount();
      
      res.json({
        success: true,
        credits: creditsToAdd,
        costUsd: actualCost.toFixed(2),
        newVoiceflowCredits: updatedAccount.voiceflowCredits || "0",
        message: `Successfully purchased ${creditsToAdd.toLocaleString()} Voiceflow credits for $${actualCost.toFixed(2)}`
      });
    } catch (error: any) {
      console.error("Error purchasing Voiceflow credits:", error);
      res.status(500).json({ error: "Error purchasing Voiceflow credits: " + error.message });
    }
  });

  // Add OpenAI balance using existing balance
  app.post("/api/purchase/openai-balance", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body; // Amount in USD to add to OpenAI balance
      
      if (!amount || amount < 0.01) {
        return res.status(400).json({ error: "Invalid amount. Minimum is $0.01" });
      }

      const account = await storage.getDefaultCreditAccount();
      const currentBalance = parseFloat(account.creditLimit) - parseFloat(account.creditsUsed);
      
      if (currentBalance < amount) {
        return res.status(400).json({ 
          error: `Insufficient balance. You have $${currentBalance.toFixed(2)} available, but need $${amount.toFixed(2)}` 
        });
      }

      // Increase credit limit (this adds to OpenAI balance)
      const newCreditLimit = (parseFloat(account.creditLimit) + amount).toFixed(2);
      await storage.updateCreditLimit(account.id, newCreditLimit);

      // Create transaction record
      await storage.createTransaction({
        accountId: account.id,
        type: "purchase",
        amount: amount.toFixed(2),
        description: `Added $${amount.toFixed(2)} to OpenAI balance`,
        stripePaymentIntentId: null,
        status: "completed",
      });

      const updatedAccount = await storage.getDefaultCreditAccount();
      
      res.json({
        success: true,
        amountAdded: amount.toFixed(2),
        newBalance: (parseFloat(updatedAccount.creditLimit) - parseFloat(updatedAccount.creditsUsed)).toFixed(2),
        newCreditLimit: updatedAccount.creditLimit,
        message: `Successfully added $${amount.toFixed(2)} to your OpenAI balance`
      });
    } catch (error: any) {
      console.error("Error adding OpenAI balance:", error);
      res.status(500).json({ error: "Error adding OpenAI balance: " + error.message });
    }
  });

  // Simulate usage deduction
  app.post("/api/usage/deduct", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const { tokens } = req.body;

      // Calculate usage based on tokens
      const tokenCount = tokens ?? Math.floor(Math.random() * 1500000 + 1000000);
      const categories = ['api_calls', 'storage', 'compute', 'bandwidth'] as const;
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Convert tokens to dollars: 10,000 tokens = $60, so 1 token = $0.006
      const amount = (tokenCount * 0.006).toFixed(2);

      const account = await storage.getDefaultCreditAccount();
      const currentCreditsUsed = parseFloat(account.creditsUsed);
      const creditLimit = parseFloat(account.creditLimit);
      const newCreditsUsed = currentCreditsUsed + parseFloat(amount);
      const remaining = creditLimit - newCreditsUsed;
      
      await storage.updateCreditsUsed(account.id, newCreditsUsed.toFixed(2));
      
      await storage.createUsageRecord({
        accountId: account.id,
        amount,
        tokens: tokenCount,
        category,
        description: `${category.replace('_', ' ').toUpperCase()} - Project ${projectId}`,
        metadata: JSON.stringify({ projectId, tokens: tokenCount }),
      });

      await storage.createTransaction({
        accountId: account.id,
        type: "deduction",
        amount,
        description: `${tokenCount.toLocaleString()} tokens for project ${projectId}`,
        stripePaymentIntentId: null,
        status: "completed",
      });

      const updatedAccount = await storage.getDefaultCreditAccount();
      
      // Invalidate usage records query so frontend refreshes
      
      res.json({
        success: true,
        projectId,
        tokens: tokenCount,
        amountDeducted: amount,
        category,
        creditsUsed: updatedAccount.creditsUsed,
        creditLimit: updatedAccount.creditLimit,
        remaining: remaining.toFixed(2),
        limitExceeded: remaining < 0 ? "limit_reached" : "within_limit",
      });
    } catch (error: any) {
      console.error("Error deducting usage:", error);
      res.status(500).json({ message: "Error deducting usage: " + error.message });
    }
  });

  // ========================================
  // AI ANALYSIS API ROUTES
  // ========================================

  // Fetch transcripts from Voiceflow and analyze with OpenAI
  app.post("/api/ai-analysis/analyze", requireAuth, async (req, res) => {
    try {
      const sessionProjectId = req.session.projectId!;
      const config = await storage.getProjectConfig(sessionProjectId);

      if (!config.vf_api_key) {
        return res.status(400).json({ error: "Voiceflow API key not configured" });
      }

      // Use project_id from database config (not from session)
      const projectId = config.project_id;

      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(400).json({ error: "OpenAI API key not configured" });
      }

      console.log("[AI Analysis] Starting transcript analysis for project:", projectId);
      console.log("[AI Analysis] Using API key from database config");

      // Step 1: Fetch transcripts from Voiceflow API (using the same method as the exporter)
      const ANALYTICS_BASE_URL = "https://analytics-api.voiceflow.com/v1";
      const headers = {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: config.vf_api_key,
      };

      const transcripts: any[] = [];
      let skip = 0;
      const pageSize = 100;

      // Fetch all transcripts with pagination
      while (true) {
        const url = `${ANALYTICS_BASE_URL}/transcript/project/${projectId}`;
        const params = new URLSearchParams({ take: pageSize.toString(), skip: skip.toString(), order: "DESC" });
        
        const response = await fetch(`${url}?${params}`, {
          method: "POST",
          headers,
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Voiceflow API error ${response.status}: ${errorText}`);
        }

        const payload = await response.json();
        const pageTranscripts = payload.transcripts || [];
        
        if (pageTranscripts.length === 0) break;
        
        transcripts.push(...pageTranscripts);
        
        if (pageTranscripts.length < pageSize) break;
        skip += pageTranscripts.length;
      }

      console.log(`[AI Analysis] Fetched ${transcripts.length} transcripts`);

      if (transcripts.length === 0) {
        return res.status(400).json({ error: "No transcripts found to analyze" });
      }

      // Step 2: Fetch detailed messages for each transcript
      const transcriptDetails: any[] = [];
      for (const transcript of transcripts.slice(0, 50)) { // Limit to 50 for performance
        try {
          const detailUrl = `${ANALYTICS_BASE_URL}/transcript/${transcript.id}`;
          const detailResponse = await fetch(detailUrl, { headers });
          
          if (detailResponse.ok) {
            const detailPayload = await detailResponse.json();
            const fullTranscript = detailPayload.transcript;
            const logs = fullTranscript?.logs || [];
            
            const messages: any[] = [];
            for (const log of logs) {
              const logType = log?.type;
              const data = log?.data || {};
              
              if (logType === "action" && data.type === "text") {
                messages.push({ role: "user", message: data.payload || "", createdAt: log.createdAt });
              } else if (logType === "trace" && data.type === "text") {
                const payload = data.payload || {};
                if (payload.ai && payload.message) {
                  messages.push({ role: "ai", message: payload.message, createdAt: log.createdAt });
                }
              }
            }
            
            transcriptDetails.push({
              id: transcript.id,
              messages,
              createdAt: transcript.createdAt,
            });
          }
        } catch (err) {
          console.error(`[AI Analysis] Error fetching transcript ${transcript.id}:`, err);
        }
      }

      console.log(`[AI Analysis] Fetched ${transcriptDetails.length} detailed transcripts`);

      // Step 3: Prepare data for OpenAI analysis
      const conversationSummaries = transcriptDetails.map(t => ({
        id: t.id,
        conversation: t.messages.map((m: any) => `${m.role}: ${m.message}`).join("\n"),
      }));

      const allConversationsText = conversationSummaries
        .map(c => `--- Transcript ${c.id} ---\n${c.conversation}`)
        .join("\n\n");

      // Step 4: Estimate cost and check balance BEFORE calling OpenAI
      // Estimate tokens: ~1 token per 4 characters, add 20% buffer for system prompt and response
      const estimatedInputTokens = Math.ceil(allConversationsText.length / 4 * 1.2);
      const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.3); // Assume response is ~30% of input
      const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;
      
      // Calculate estimated costs (no multiplier - use actual cost)
      const estimatedCostUsd = (estimatedTotalTokens / 1000) * 0.002;
      
      // Check balance before proceeding
      const account = await storage.getDefaultCreditAccount();
      const currentCreditsUsed = parseFloat(account.creditsUsed);
      const creditLimit = parseFloat(account.creditLimit);
      const remainingBalance = creditLimit - currentCreditsUsed;
      
      if (remainingBalance < estimatedCostUsd) {
        return res.status(400).json({ 
          error: `Insufficient balance. Estimated cost is $${estimatedCostUsd.toFixed(2)} but only have $${remainingBalance.toFixed(2)} remaining.`,
          code: "INSUFFICIENT_BALANCE",
          estimatedTokens: estimatedTotalTokens,
          estimatedCostUsd: estimatedCostUsd.toFixed(4),
          remainingBalance: remainingBalance.toFixed(2)
        });
      }
      
      // Step 5: Call OpenAI API for analysis
      console.log("[AI Analysis] Calling OpenAI for analysis...");
      console.log("[AI Analysis] Estimated tokens:", estimatedTotalTokens, "Estimated cost: $", estimatedCostUsd.toFixed(2));
      
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert business analyst. Analyze customer service transcripts and provide insights in JSON format.
              
Your response MUST be valid JSON with this exact structure:
{
  "keywords": [{"keyword": "string", "frequency": number, "relevanceScore": number, "category": "string"}],
  "keyphrases": [{"keyphrase": "string", "frequency": number, "relevanceScore": number, "context": "string"}],
  "conversionRate": number (0-1),
  "averageSentiment": number (-1 to 1),
  "insights": ["string"],
  "patterns": ["string"]
}

Rules:
- Keywords should be business-relevant terms (not common words like "if", "can", "the")
- Keyphrases should be meaningful 2-5 word phrases
- relevanceScore should be 0-1 based on business importance
- conversionRate is the ratio of successful outcomes to total conversations
- averageSentiment ranges from -1 (very negative) to 1 (very positive)
- insights should highlight key findings and business opportunities
- patterns should identify recurring themes or issues`
            },
            {
              role: "user",
              content: `Analyze these customer service transcripts and provide business insights:\n\n${allConversationsText.slice(0, 50000)}`
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        throw new Error(`OpenAI API error ${openaiResponse.status}: ${errorText}`);
      }

      const openaiResult = await openaiResponse.json();
      const analysisContent = openaiResult.choices[0]?.message?.content || "{}";
      
      // Extract token usage from OpenAI response
      const usage = openaiResult.usage || {};
      const tokensUsed = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
      const totalTokens = usage.total_tokens || tokensUsed;
      
      console.log("[AI Analysis] OpenAI response received");
      console.log("[AI Analysis] Tokens used:", totalTokens);
      
      // Calculate actual costs from API response
      // gpt-4o-mini pricing: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
      // Simplified: ~$0.002 per 1K tokens average
      const costUsd = (totalTokens / 1000) * 0.002;
      
      let analysisData;
      try {
        analysisData = JSON.parse(analysisContent);
      } catch (err) {
        console.error("[AI Analysis] Failed to parse OpenAI response:", analysisContent);
        throw new Error("Failed to parse AI analysis results");
      }
      
      // Deduct usage from account (using actual cost, no multiplier)
      const newCreditsUsed = currentCreditsUsed + costUsd;
      await storage.updateCreditsUsed(account.id, newCreditsUsed.toFixed(2));
      
      // Create usage record
      await storage.createUsageRecord({
        accountId: account.id,
        amount: costUsd.toFixed(2),
        tokens: totalTokens,
        category: "api_calls",
        description: `AI Analysis - OpenAI tokens for project ${projectId}`,
        metadata: JSON.stringify({ 
          projectId, 
          tokens: totalTokens,
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          costUsd: costUsd.toFixed(4),
          analysisType: "transcript_analysis"
        }),
      });
      
      // Create transaction record
      await storage.createTransaction({
        accountId: account.id,
        type: "deduction",
        amount: costUsd.toFixed(2),
        description: `AI Analysis: ${totalTokens.toLocaleString()} tokens (${transcriptDetails.length} transcripts)`,
        stripePaymentIntentId: null,
        status: "completed",
      });
      
      console.log("[AI Analysis] Usage tracked:", {
        tokens: totalTokens,
        costUsd: costUsd.toFixed(4),
        newBalance: (creditLimit - newCreditsUsed).toFixed(2)
      });

      // Step 5: Generate DOCX report
      console.log("[AI Analysis] Generating DOCX report...");
      
      // Create document sections
      const docParagraphs: Paragraph[] = [
        new Paragraph({
          text: "AI TRANSCRIPT ANALYSIS REPORT",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "Project ID: ", bold: true }),
            new TextRun(projectId),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Analysis Date: ", bold: true }),
            new TextRun(new Date().toLocaleString()),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Total Transcripts Analyzed: ", bold: true }),
            new TextRun(transcriptDetails.length.toString()),
          ],
        }),
        new Paragraph({ text: "" }),
        
        // Executive Summary
        new Paragraph({ text: "EXECUTIVE SUMMARY", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({
          children: [
            new TextRun({ text: "Conversion Rate: ", bold: true }),
            new TextRun(`${(analysisData.conversionRate * 100).toFixed(1)}%`),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Average Sentiment: ", bold: true }),
            new TextRun(`${analysisData.averageSentiment.toFixed(2)} (Scale: -1 to 1)`),
          ],
        }),
        new Paragraph({ text: "" }),
        
        // Key Insights
        new Paragraph({ text: "KEY INSIGHTS", heading: HeadingLevel.HEADING_1 }),
        ...(analysisData.insights || []).map((insight: string, i: number) =>
          new Paragraph({ text: `${i + 1}. ${insight}`, spacing: { after: 100 } })
        ),
        new Paragraph({ text: "" }),
        
        // Identified Patterns
        new Paragraph({ text: "IDENTIFIED PATTERNS", heading: HeadingLevel.HEADING_1 }),
        ...(analysisData.patterns || []).map((pattern: string, i: number) =>
          new Paragraph({ text: `${i + 1}. ${pattern}`, spacing: { after: 100 } })
        ),
        new Paragraph({ text: "" }),
        
        // Top Keywords
        new Paragraph({ text: "TOP KEYWORDS", heading: HeadingLevel.HEADING_1 }),
        ...(analysisData.keywords || []).slice(0, 20).map((kw: any, i: number) =>
          new Paragraph({
            text: `${i + 1}. ${kw.keyword} (Frequency: ${kw.frequency}, Relevance: ${(kw.relevanceScore * 100).toFixed(0)}%, Category: ${kw.category || "N/A"})`,
            spacing: { after: 100 },
          })
        ),
        new Paragraph({ text: "" }),
        
        // Top Keyphrases
        new Paragraph({ text: "TOP KEYPHRASES", heading: HeadingLevel.HEADING_1 }),
        ...(analysisData.keyphrases || []).slice(0, 20).flatMap((kp: any, i: number) => [
          new Paragraph({
            text: `${i + 1}. "${kp.keyphrase}" (Frequency: ${kp.frequency}, Relevance: ${(kp.relevanceScore * 100).toFixed(0)}%)`,
          }),
          new Paragraph({
            text: `   Context: ${kp.context || "N/A"}`,
            spacing: { after: 100 },
          }),
        ]),
        new Paragraph({ text: "" }),
        
        // Recommendations
        new Paragraph({ text: "RECOMMENDATIONS", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "Based on the analysis, consider the following actions:" }),
        new Paragraph({ text: "• Review transcripts related to top keyphrases for improvement opportunities" }),
        new Paragraph({ text: "• Address any negative sentiment patterns identified" }),
        new Paragraph({ text: "• Leverage successful conversation patterns to improve conversion rate" }),
        new Paragraph({ text: "• Train staff on handling common customer requests and concerns" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "Report generated on: ", bold: true }),
            new TextRun(new Date().toLocaleString()),
          ],
        }),
      ];

      // Create the document
      const doc = new Document({
        sections: [{
          properties: {},
          children: docParagraphs,
        }],
      });

      // Save report to temp file
      const reportFilename = `ai-analysis-report-${Date.now()}.docx`;
      const reportPath = join(process.cwd(), "uploads", reportFilename);
      const buffer = await Packer.toBuffer(doc);
      writeFileSync(reportPath, buffer);

      // Step 6: Store analysis in database
      const analysis = await storage.createAiAnalysis({
        projectId,
        analysisDate: new Date().toISOString(),
        conversionRate: analysisData.conversionRate || 0,
        averageSentiment: analysisData.averageSentiment || 0,
        totalTranscripts: transcriptDetails.length,
        reportUrl: `/api/ai-analysis/report/${reportFilename}`,
      });

      // Store keywords
      for (const kw of (analysisData.keywords || []).slice(0, 50)) {
        await storage.createAiKeyword({
          analysisId: analysis.id,
          keyword: kw.keyword,
          frequency: kw.frequency || 0,
          relevanceScore: kw.relevanceScore || 0,
          category: kw.category,
        });
      }

      // Store keyphrases
      for (const kp of (analysisData.keyphrases || []).slice(0, 50)) {
        await storage.createAiKeyphrase({
          analysisId: analysis.id,
          keyphrase: kp.keyphrase,
          frequency: kp.frequency || 0,
          relevanceScore: kp.relevanceScore || 0,
          context: kp.context,
        });
      }

      console.log("[AI Analysis] Analysis complete, stored with ID:", analysis.id);

      const updatedAccount = await storage.getDefaultCreditAccount();
      
      res.json({
        success: true,
        analysis: {
          ...analysis,
          insights: analysisData.insights || [],
          patterns: analysisData.patterns || [],
        },
        reportFilename,
        usage: {
          tokensUsed: totalTokens,
          costUsd: parseFloat(costUsd.toFixed(4)),
          remainingBalance: parseFloat((creditLimit - parseFloat(updatedAccount.creditsUsed)).toFixed(2)),
        },
      });
    } catch (error: any) {
      console.error("[AI Analysis] Error during analysis:", error);
      res.status(500).json({ error: error.message || "Failed to analyze transcripts" });
    }
  });

  // Get all analyses for the current project
  app.get("/api/ai-analysis", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const analyses = await storage.getAiAnalyses(projectId);
      res.json(analyses);
    } catch (error: any) {
      console.error("[AI Analysis] Error fetching analyses:", error);
      res.status(500).json({ error: error.message || "Failed to fetch analyses" });
    }
  });

  // Get specific analysis with details
  app.get("/api/ai-analysis/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getAiAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      const keywords = await storage.getAiKeywords(id);
      const keyphrases = await storage.getAiKeyphrases(id);

      res.json({
        ...analysis,
        keywords,
        keyphrases,
      });
    } catch (error: any) {
      console.error("[AI Analysis] Error fetching analysis:", error);
      res.status(500).json({ error: error.message || "Failed to fetch analysis" });
    }
  });

  // Download report file
  app.get("/api/ai-analysis/report/:filename", requireAuth, (req, res) => {
    try {
      const { filename } = req.params;
      const reportPath = join(process.cwd(), "uploads", filename);
      
      // Set content type for DOCX files
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.download(reportPath, filename, (err) => {
        if (err) {
          console.error("[AI Analysis] Error downloading report:", err);
          if (!res.headersSent) {
            res.status(404).json({ error: "Report not found" });
          }
        }
      });
    } catch (error: any) {
      console.error("[AI Analysis] Error downloading report:", error);
      res.status(500).json({ error: "Failed to download report" });
    }
  });

  // ========================================
  // PRODUCTS RAG API ROUTES
  // ========================================

  const ADD_PRODUCT_COST_USD = 10.00;

  async function getEmbedding(text: string, projectId?: string): Promise<{ embedding: number[]; tokensUsed?: number }> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('[Products] No OPENAI_API_KEY found, using mock embedding');
      // Return mock embedding if no API key
      const hash = createHash('md5').update(text).digest('hex');
      const seed = parseInt(hash.substring(0, 8), 16) % (2 ** 32);
      const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());
      return { embedding: mockEmbedding };
    }

    // Estimate tokens: text-embedding-ada-002 uses ~1 token per 4 characters
    const estimatedTokens = Math.ceil(text.length / 4);
    // text-embedding-ada-002 pricing: $0.0001 per 1K tokens
    const estimatedCost = (estimatedTokens / 1000) * 0.0001;

    // Check balance before calling OpenAI if projectId is provided
    if (projectId) {
      const account = await storage.getDefaultCreditAccount();
      const currentCreditsUsed = parseFloat(account.creditsUsed);
      const creditLimit = parseFloat(account.creditLimit);
      const remainingBalance = creditLimit - currentCreditsUsed;

      if (remainingBalance < estimatedCost) {
        throw new Error(`Insufficient balance. Estimated cost is $${estimatedCost.toFixed(4)} but only have $${remainingBalance.toFixed(2)} remaining.`);
      }
    }

    try {
      console.log('[Products] Generating embedding via OpenAI API...');
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          input: text.replace(/\n/g, ' '),
          model: 'text-embedding-ada-002',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Products] OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;
      const tokensUsed = data.usage?.total_tokens || estimatedTokens;
      
      console.log('[Products] Embedding generated successfully, dimensions:', embedding.length, 'tokens:', tokensUsed);
      
      // Track usage if projectId is provided
      if (projectId && tokensUsed) {
        const actualCost = (tokensUsed / 1000) * 0.0001;
        const account = await storage.getDefaultCreditAccount();
        const currentCreditsUsed = parseFloat(account.creditsUsed);
        const newCreditsUsed = currentCreditsUsed + actualCost;
        
        await storage.updateCreditsUsed(account.id, newCreditsUsed.toFixed(4));
        
        await storage.createUsageRecord({
          accountId: account.id,
          amount: actualCost.toFixed(4),
          tokens: tokensUsed,
          category: "api_calls",
          description: `Product Embedding - OpenAI tokens for project ${projectId}`,
          metadata: JSON.stringify({ 
            projectId, 
            tokens: tokensUsed,
            costUsd: actualCost.toFixed(4),
            embeddingModel: "text-embedding-ada-002"
          }),
        });
        
        await storage.createTransaction({
          accountId: account.id,
          type: "deduction",
          amount: actualCost.toFixed(4),
          description: `Product Embedding: ${tokensUsed} tokens`,
          stripePaymentIntentId: null,
          status: "completed",
        });
      }
      
      return { embedding, tokensUsed };
    } catch (error: any) {
      console.error('[Products] Error generating embedding:', error.message || error);
      // Don't return mock embedding if it's a balance error
      if (error.message?.includes('Insufficient balance')) {
        throw error;
      }
      // Return mock embedding on other errors (but log the error)
      const hash = createHash('md5').update(text).digest('hex');
      const seed = parseInt(hash.substring(0, 8), 16) % (2 ** 32);
      const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());
      console.warn('[Products] Using mock embedding due to error');
      return { embedding: mockEmbedding };
    }
  }

  function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normA * normB);
  }

  // GET /api/products/balance - Get user balance
  app.get('/api/products/balance', requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      if (!config.vf_api_key) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }
      const balance = await storage.getUserBalance(projectId, config.vf_api_key);
      res.json({ balance_usd: balance.balance_usd });
    } catch (error: any) {
      console.error('[Products] Error getting balance:', error);
      res.status(500).json({ error: error.message || 'Failed to get balance' });
    }
  });

  // POST /api/products/add - Add a single product
  app.post('/api/products/add', requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      if (!config.vf_api_key) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      const { name, description, image_url, product_url, tags } = req.body;

      // Validation
      const validationErrors: string[] = [];
      if (!name || name.trim().length < 3) {
        validationErrors.push('Product name is required (min 3 characters)');
      }
      if (!description || description.trim().length < 10) {
        validationErrors.push('Description is required (min 10 characters)');
      }
      if (!image_url || !image_url.startsWith('http')) {
        validationErrors.push('Valid image URL is required');
      }
      if (!product_url || !product_url.startsWith('http')) {
        validationErrors.push('Valid product URL is required');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Validation failed', validation_errors: validationErrors });
      }

      // Check for duplicates
      const existingProducts = await storage.getProducts(projectId, config.vf_api_key);
      if (existingProducts.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ error: 'Duplicate product', validation_errors: ['Product name already exists'] });
      }

      // Generate embedding (with balance check and token tracking)
      const combinedText = `Name: ${name}; Description: ${description}; Tags: ${tags || ''}`;
      console.log('[Products] Generating embedding for product:', name);
      const embeddingResult = await getEmbedding(combinedText, projectId);
      const embedding = embeddingResult.embedding;
      console.log('[Products] Embedding generated, saving product with embedding');

      // Create product via storage
      const newProduct = await storage.createProduct({
        projectId,
        vf_api_key: config.vf_api_key,
        name: name.trim(),
        description: description.trim(),
        image_url: image_url.trim(),
        product_url: product_url.trim(),
        tags: (tags || '').trim(),
        embedding,
      });

      console.log('[Products] Product saved with embedding:', newProduct.id);

      res.json({
        message: 'Product added successfully',
        product_id: newProduct.id,
      });
    } catch (error: any) {
      console.error('[Products] Error adding product:', error);
      res.status(500).json({ error: error.message || 'Failed to add product' });
    }
  });

  // POST /api/products/bulk - Bulk upload products
  app.post('/api/products/bulk', requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      if (!config.vf_api_key) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      const balanceData = await storage.getUserBalance(projectId, config.vf_api_key);
      const balance = balanceData.balance_usd;
      const { products: productsData } = req.body;

      if (!productsData || !Array.isArray(productsData) || productsData.length === 0) {
        return res.status(400).json({ error: 'No products provided' });
      }

      const totalCost = productsData.length * ADD_PRODUCT_COST_USD;
      if (balance < totalCost) {
        return res.status(400).json({
          error: `Insufficient balance. Need $${totalCost.toFixed(2)}, have $${balance.toFixed(2)}`,
          balance_usd: balance,
        });
      }

      const existingProducts = await storage.getProducts(projectId, config.vf_api_key);
      const addedProducts: string[] = [];
      const errors: string[] = [];

      for (let idx = 0; idx < productsData.length; idx++) {
        const productData = productsData[idx];
        const { name, description, image_url, product_url, tags } = productData;

        // Validation
        const validationErrors: string[] = [];
        if (!name || name.trim().length < 3) {
          validationErrors.push(`Row ${idx + 1}: Missing or invalid name`);
        }
        if (!description || description.trim().length < 10) {
          validationErrors.push(`Row ${idx + 1}: Missing or invalid description`);
        }
        if (!image_url || !image_url.startsWith('http')) {
          validationErrors.push(`Row ${idx + 1}: Invalid image_url`);
        }
        if (!product_url || !product_url.startsWith('http')) {
          validationErrors.push(`Row ${idx + 1}: Invalid product_url`);
        }

        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          continue;
        }

        // Check duplicates
        if (existingProducts.some(p => p.name.toLowerCase() === name.toLowerCase())) {
          errors.push(`Row ${idx + 1}: Duplicate product name "${name}"`);
          continue;
        }

        try {
          // Generate embedding (with balance check and token tracking)
          const combinedText = `Name: ${name}; Description: ${description}; Tags: ${tags || ''}`;
          console.log(`[Products] Generating embedding for bulk product ${idx + 1}:`, name);
          const embeddingResult = await getEmbedding(combinedText, projectId);
          const embedding = embeddingResult.embedding;
          console.log(`[Products] Embedding generated for bulk product ${idx + 1}`);

          // Create product via storage
          const newProduct = await storage.createProduct({
            projectId,
            vf_api_key: config.vf_api_key,
            name: name.trim(),
            description: description.trim(),
            image_url: image_url.trim(),
            product_url: product_url.trim(),
            tags: (tags || '').trim(),
            embedding,
          });

          addedProducts.push(newProduct.id);
          console.log(`[Products] Bulk product ${idx + 1} saved with embedding:`, newProduct.id);
        } catch (error: any) {
          console.error(`[Products] Error processing bulk product ${idx + 1}:`, error);
          errors.push(`Row ${idx + 1}: ${error.message}`);
        }
      }

      // Deduct balance
      const cost = addedProducts.length * ADD_PRODUCT_COST_USD;
      const newBalance = balance - cost;
      await storage.updateUserBalance(projectId, config.vf_api_key, newBalance);

      res.json({
        message: `Added ${addedProducts.length} products`,
        added: addedProducts.length,
        errors,
        balance_usd: newBalance,
      });
    } catch (error: any) {
      console.error('[Products] Error bulk uploading:', error);
      res.status(500).json({ error: error.message || 'Failed to bulk upload products' });
    }
  });

  // POST /api/products/search - Search products
  app.post('/api/products/search', requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      if (!config.vf_api_key) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      const { query, count = 5 } = req.body;

      if (!query || !query.trim()) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const products = await storage.getProducts(projectId, config.vf_api_key);
      if (products.length === 0) {
        return res.json({ results: [] });
      }

      // Generate query embedding
      const queryEmbedding = await getEmbedding(query.trim());

      // Calculate similarities
      const productsWithSimilarity = products.map(product => {
        // Check if embedding exists and is not null/undefined
        if (!product.embedding || product.embedding === null || product.embedding === undefined) {
          return { ...product, similarity: 0 };
        }
        
        // Ensure embedding is an array
        let embeddingArray: number[];
        
        if (Array.isArray(product.embedding)) {
          // Already an array - use directly
          embeddingArray = product.embedding;
        } else if (typeof product.embedding === 'string') {
          // Parse JSON string
          try {
            const parsed = JSON.parse(product.embedding);
            if (Array.isArray(parsed)) {
              embeddingArray = parsed;
            } else {
              console.warn(`[Products] Parsed embedding is not an array for product ${product.id}:`, typeof parsed);
              return { ...product, similarity: 0 };
            }
          } catch (e) {
            console.error(`[Products] Error parsing embedding string for product ${product.id}:`, e);
            return { ...product, similarity: 0 };
          }
        } else {
          console.warn(`[Products] Invalid embedding type for product ${product.id}:`, typeof product.embedding);
          return { ...product, similarity: 0 };
        }
        
        // Validate array
        if (!Array.isArray(embeddingArray) || embeddingArray.length === 0) {
          return { ...product, similarity: 0 };
        }
        
        // Ensure both embeddings have the same length
        if (embeddingArray.length !== queryEmbedding.length) {
          console.warn(`[Products] Embedding length mismatch for product ${product.id}: ${embeddingArray.length} vs ${queryEmbedding.length}`);
          return { ...product, similarity: 0 };
        }
        
        const similarity = cosineSimilarity(queryEmbedding, embeddingArray);
        return { ...product, similarity };
      });

      // Sort by similarity and get top results
      const results = productsWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, Math.min(count, 15))
        .map(({ embedding, projectId: _, vf_api_key: __, ...product }) => ({
          ...product,
          similarity: Number(product.similarity.toFixed(4)),
        }));

      res.json({ results });
    } catch (error: any) {
      console.error('[Products] Error searching:', error);
      res.status(500).json({ error: error.message || 'Failed to search products' });
    }
  });

  // GET /api/products - Get all products
  app.get('/api/products', requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      if (!config.vf_api_key) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      const products = await storage.getProducts(projectId, config.vf_api_key);
      const productsWithoutEmbedding = products.map(({ embedding, projectId: _, vf_api_key: __, ...product }) => product);
      res.json({ products: productsWithoutEmbedding });
    } catch (error: any) {
      console.error('[Products] Error getting products:', error);
      res.status(500).json({ error: error.message || 'Failed to get products' });
    }
  });

  // DELETE /api/products/:id - Delete a product
  app.delete('/api/products/:id', requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      if (!config.vf_api_key) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      const deleted = await storage.deleteProduct(req.params.id, projectId, config.vf_api_key);
      if (!deleted) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
      console.error('[Products] Error deleting product:', error);
      res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
  });

  // POST /api/products/ai-upload - AI-powered CSV conversion
  app.post('/api/products/ai-upload', requireAuth, async (req, res) => {
    try {
      const { csvData } = req.body;

      if (!csvData || !csvData.trim()) {
        return res.status(400).json({ error: 'CSV data is required' });
      }

      const projectId = req.session.projectId!;
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(400).json({ error: 'OpenAI API key not configured' });
      }

      // Estimate cost before calling OpenAI
      // Estimate tokens: ~1 token per 4 characters, add buffer for system prompt and response
      const estimatedInputTokens = Math.ceil(csvData.length / 4 * 1.2);
      const estimatedOutputTokens = 2000; // Max tokens is 4000, estimate ~2000 for response
      const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;
      const estimatedCost = (estimatedTotalTokens / 1000) * 0.002; // gpt-4o-mini pricing

      // Check balance before proceeding
      const account = await storage.getDefaultCreditAccount();
      const currentCreditsUsed = parseFloat(account.creditsUsed);
      const creditLimit = parseFloat(account.creditLimit);
      const remainingBalance = creditLimit - currentCreditsUsed;

      if (remainingBalance < estimatedCost) {
        return res.status(400).json({ 
          error: `Insufficient balance. Estimated cost is $${estimatedCost.toFixed(4)} but only have $${remainingBalance.toFixed(2)} remaining.`,
          code: "INSUFFICIENT_BALANCE",
          estimatedTokens: estimatedTotalTokens,
          estimatedCostUsd: estimatedCost.toFixed(4),
          remainingBalance: remainingBalance.toFixed(2)
        });
      }

      console.log('[AI Upload] Analyzing CSV with OpenAI...');

      // Use OpenAI to analyze and convert CSV
      const prompt = `You are a CSV conversion assistant. A user has provided a CSV file with product data, but the column names may not match the required format.

Required format columns:
- name (product name, 3-200 characters)
- description (product description, min 10 characters)
- image_url (must be a valid URL starting with http:// or https://)
- product_url (must be a valid URL starting with http:// or https://)
- tags (optional, comma-separated tags)

Analyze the following CSV data and convert it to the required format. Map the user's columns to the required columns intelligently. If a column doesn't exist, try to infer it from other columns or leave it empty (except name, description, image_url, and product_url which are required).

Return ONLY valid CSV data in the exact format:
name,description,image_url,product_url,tags

Do not include any explanations, just the CSV data. Ensure all URLs are valid (start with http:// or https://). If URLs are missing or invalid, try to create placeholder URLs or mark rows with errors.

User's CSV data:
${csvData.substring(0, 10000)}${csvData.length > 10000 ? '\n... (truncated)' : ''}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a CSV conversion assistant. Return only valid CSV data without explanations.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Upload] OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const convertedCsv = data.choices[0]?.message?.content?.trim() || '';

      // Extract token usage from OpenAI response
      const usage = data.usage || {};
      const tokensUsed = usage.total_tokens || (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
      const costUsd = (tokensUsed / 1000) * 0.002; // gpt-4o-mini pricing

      // Track usage (reuse account and currentCreditsUsed from balance check above)
      const newCreditsUsed = currentCreditsUsed + costUsd;
      
      await storage.updateCreditsUsed(account.id, newCreditsUsed.toFixed(4));
      
      await storage.createUsageRecord({
        accountId: account.id,
        amount: costUsd.toFixed(4),
        tokens: tokensUsed,
        category: "api_calls",
        description: `AI CSV Upload - OpenAI tokens for project ${projectId}`,
        metadata: JSON.stringify({ 
          projectId, 
          tokens: tokensUsed,
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          costUsd: costUsd.toFixed(4),
          uploadType: "csv_conversion"
        }),
      });
      
      await storage.createTransaction({
        accountId: account.id,
        type: "deduction",
        amount: costUsd.toFixed(4),
        description: `AI CSV Upload: ${tokensUsed.toLocaleString()} tokens`,
        stripePaymentIntentId: null,
        status: "completed",
      });

      console.log('[AI Upload] Usage tracked:', {
        tokens: tokensUsed,
        costUsd: costUsd.toFixed(4),
      });

      if (!convertedCsv) {
        throw new Error('No CSV data returned from AI');
      }

      // Clean up the response (remove markdown code blocks if present)
      let cleanCsv = convertedCsv;
      if (cleanCsv.includes('```')) {
        const match = cleanCsv.match(/```(?:csv)?\n([\s\S]*?)```/);
        if (match) {
          cleanCsv = match[1].trim();
        }
      }

      console.log('[AI Upload] CSV converted successfully');

      res.json({
        success: true,
        convertedCsv: cleanCsv,
        message: 'CSV converted successfully',
      });
    } catch (error: any) {
      console.error('[AI Upload] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to convert CSV with AI' });
    }
  });

  // GTM Analytics API endpoints
  app.get("/api/gtm/analytics", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      const data = await storage.getGtmAnalyticsData(projectId, startDate, endDate);
      res.json(data);
    } catch (error: any) {
      console.error("[GTM Analytics] Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch GTM analytics data" });
    }
  });

  app.get("/api/gtm/traffic-sources", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const date = req.query.date as string | undefined;
      
      const sources = await storage.getGtmTrafficSources(projectId, date);
      res.json(sources);
    } catch (error: any) {
      console.error("[GTM Traffic Sources] Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch traffic sources" });
    }
  });

  app.get("/api/gtm/page-views", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const date = req.query.date as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const views = await storage.getGtmPageViews(projectId, date, limit);
      res.json(views);
    } catch (error: any) {
      console.error("[GTM Page Views] Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch page views" });
    }
  });

  app.get("/api/gtm/referrers", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const date = req.query.date as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const referrers = await storage.getGtmReferrers(projectId, date, limit);
      res.json(referrers);
    } catch (error: any) {
      console.error("[GTM Referrers] Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch referrers" });
    }
  });

  app.get("/api/gtm/keywords", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const date = req.query.date as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const keywords = await storage.getGtmKeywords(projectId, date, limit);
      res.json(keywords);
    } catch (error: any) {
      console.error("[GTM Keywords] Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch keywords" });
    }
  });

  app.get("/api/gtm/campaigns", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const date = req.query.date as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const campaigns = await storage.getGtmCampaigns(projectId, date, limit);
      res.json(campaigns);
    } catch (error: any) {
      console.error("[GTM Campaigns] Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch campaigns" });
    }
  });

  // Sync real GTM data endpoint (requires GTM connection)
  app.post("/api/gtm/sync", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      
      // Check if GTM is connected
      const credentials = await storage.getGtmCredentials(projectId);
      if (!credentials) {
        return res.status(400).json({ 
          error: "GTM account not connected. Please connect your GTM account first." 
        });
      }
      
      // Import GTM sync function
      const { syncGtmData } = await import('./gtm-oauth');
      const syncResult = await syncGtmData(projectId);
      
      // Note: GTM doesn't provide analytics data. For page views, sessions, etc.,
      // you would need Google Analytics API integration.
      // For now, we'll use the seed endpoint logic to populate sample analytics data
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Seed analytics data for last 30 days (mock - replace with GA API)
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        await storage.upsertGtmAnalyticsData({
          projectId,
          date: dateStr,
          pageViews: Math.floor(Math.random() * 1000) + 500,
          sessions: Math.floor(Math.random() * 800) + 300,
          users: Math.floor(Math.random() * 600) + 200,
          clicks: Math.floor(Math.random() * 400) + 100,
          conversions: Math.floor(Math.random() * 50) + 10,
        });
      }
      
      // Seed other data (mock - replace with GA API)
      await storage.upsertGtmTrafficSources([
        { projectId, source: "Organic Search", sessions: 4520, percentage: 45, date: todayStr },
        { projectId, source: "Direct", sessions: 2800, percentage: 28, date: todayStr },
        { projectId, source: "Social Media", sessions: 1500, percentage: 15, date: todayStr },
        { projectId, source: "Referral", sessions: 800, percentage: 8, date: todayStr },
        { projectId, source: "Email", sessions: 380, percentage: 4, date: todayStr },
      ]);
      
      await storage.upsertGtmPageViews([
        { projectId, page: "/home", views: 12500, percentage: 32, date: todayStr },
        { projectId, page: "/products", views: 8900, percentage: 23, date: todayStr },
        { projectId, page: "/about", views: 6200, percentage: 16, date: todayStr },
        { projectId, page: "/contact", views: 4500, percentage: 12, date: todayStr },
        { projectId, page: "/blog", views: 3800, percentage: 10, date: todayStr },
        { projectId, page: "/pricing", views: 2100, percentage: 5, date: todayStr },
        { projectId, page: "/faq", views: 1000, percentage: 2, date: todayStr },
        { projectId, page: "/blog/post-1", views: 3200, percentage: 8, date: todayStr },
        { projectId, page: "/blog/post-2", views: 2800, percentage: 7, date: todayStr },
        { projectId, page: "/products/item-1", views: 2400, percentage: 6, date: todayStr },
        { projectId, page: "/products/item-2", views: 2100, percentage: 5, date: todayStr },
        { projectId, page: "/products/item-3", views: 1800, percentage: 5, date: todayStr },
        { projectId, page: "/checkout", views: 1500, percentage: 4, date: todayStr },
        { projectId, page: "/checkout/complete", views: 1200, percentage: 3, date: todayStr },
      ]);
      
      await storage.upsertGtmReferrers([
        { projectId, source: "google.com", visits: 4200, percentage: 42, date: todayStr },
        { projectId, source: "facebook.com", visits: 1800, percentage: 18, date: todayStr },
        { projectId, source: "twitter.com", visits: 1200, percentage: 12, date: todayStr },
        { projectId, source: "linkedin.com", visits: 900, percentage: 9, date: todayStr },
        { projectId, source: "reddit.com", visits: 600, percentage: 6, date: todayStr },
        { projectId, source: "youtube.com", visits: 500, percentage: 5, date: todayStr },
        { projectId, source: "Other", visits: 800, percentage: 8, date: todayStr },
      ]);
      
      await storage.upsertGtmKeywords([
        { projectId, keyword: "saas dashboard", searches: 3200, percentage: 32, date: todayStr },
        { projectId, keyword: "analytics tool", searches: 2100, percentage: 21, date: todayStr },
        { projectId, keyword: "business intelligence", searches: 1500, percentage: 15, date: todayStr },
        { projectId, keyword: "data visualization", searches: 1200, percentage: 12, date: todayStr },
        { projectId, keyword: "reporting software", searches: 900, percentage: 9, date: todayStr },
        { projectId, keyword: "dashboard software", searches: 600, percentage: 6, date: todayStr },
        { projectId, keyword: "analytics platform", searches: 500, percentage: 5, date: todayStr },
      ]);
      
      await storage.upsertGtmCampaigns([
        { projectId, campaign: "Summer Sale 2024", clicks: 5200, conversions: 420, date: todayStr },
        { projectId, campaign: "Product Launch", clicks: 3800, conversions: 310, date: todayStr },
        { projectId, campaign: "Blog Promotion", clicks: 2100, conversions: 180, date: todayStr },
        { projectId, campaign: "Newsletter Signup", clicks: 1500, conversions: 240, date: todayStr },
        { projectId, campaign: "Free Trial", clicks: 3200, conversions: 280, date: todayStr },
        { projectId, campaign: "Webinar Series", clicks: 1800, conversions: 150, date: todayStr },
        { projectId, campaign: "Case Study", clicks: 1200, conversions: 95, date: todayStr },
        { projectId, campaign: "Social Media", clicks: 900, conversions: 65, date: todayStr },
      ]);
      
      res.json({ 
        success: true, 
        message: "GTM data synced successfully",
        gtmData: syncResult,
        note: "Analytics metrics (page views, sessions) require Google Analytics API integration. Currently using sample data.",
        projectId 
      });
    } catch (error: any) {
      console.error("[GTM Sync] Error:", error);
      res.status(500).json({ error: error.message || "Failed to sync GTM data" });
    }
  });

  // Seed mock GTM data endpoint (for development/testing - use when GTM not connected)
  app.post("/api/gtm/seed-mock-data", requireAuth, async (req, res) => {
    try {
      console.log("[GTM Seed] ========== Seed Request Started ==========");
      console.log("[GTM Seed] Session ID:", req.sessionID);
      console.log("[GTM Seed] Has session:", !!req.session);
      console.log("[GTM Seed] Project ID from session:", req.session?.projectId);
      console.log("[GTM Seed] Request headers:", {
        cookie: req.headers.cookie ? "present" : "missing",
        origin: req.headers.origin,
      });
      
      const projectId = req.session?.projectId;
      if (!projectId) {
        console.error("[GTM Seed] No project ID in session!");
        return res.status(401).json({ error: "Authentication required" });
      }
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Seed analytics data for last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        await storage.upsertGtmAnalyticsData({
          projectId,
          date: dateStr,
          pageViews: Math.floor(Math.random() * 1000) + 500,
          sessions: Math.floor(Math.random() * 800) + 300,
          users: Math.floor(Math.random() * 600) + 200,
          clicks: Math.floor(Math.random() * 400) + 100,
          conversions: Math.floor(Math.random() * 50) + 10,
        });
      }
      
      // Seed traffic sources (latest date)
      await storage.upsertGtmTrafficSources([
        { projectId, source: "Organic Search", sessions: 4520, percentage: 45, date: todayStr },
        { projectId, source: "Direct", sessions: 2800, percentage: 28, date: todayStr },
        { projectId, source: "Social Media", sessions: 1500, percentage: 15, date: todayStr },
        { projectId, source: "Referral", sessions: 800, percentage: 8, date: todayStr },
        { projectId, source: "Email", sessions: 380, percentage: 4, date: todayStr },
      ]);
      
      // Seed page views (latest date)
      await storage.upsertGtmPageViews([
        { projectId, page: "/home", views: 12500, percentage: 32, date: todayStr },
        { projectId, page: "/products", views: 8900, percentage: 23, date: todayStr },
        { projectId, page: "/about", views: 6200, percentage: 16, date: todayStr },
        { projectId, page: "/contact", views: 4500, percentage: 12, date: todayStr },
        { projectId, page: "/blog", views: 3800, percentage: 10, date: todayStr },
        { projectId, page: "/pricing", views: 2100, percentage: 5, date: todayStr },
        { projectId, page: "/faq", views: 1000, percentage: 2, date: todayStr },
        { projectId, page: "/blog/post-1", views: 3200, percentage: 8, date: todayStr },
        { projectId, page: "/blog/post-2", views: 2800, percentage: 7, date: todayStr },
        { projectId, page: "/products/item-1", views: 2400, percentage: 6, date: todayStr },
        { projectId, page: "/products/item-2", views: 2100, percentage: 5, date: todayStr },
        { projectId, page: "/products/item-3", views: 1800, percentage: 5, date: todayStr },
        { projectId, page: "/checkout", views: 1500, percentage: 4, date: todayStr },
        { projectId, page: "/checkout/complete", views: 1200, percentage: 3, date: todayStr },
      ]);
      
      // Seed referrers
      await storage.upsertGtmReferrers([
        { projectId, source: "google.com", visits: 4200, percentage: 42, date: todayStr },
        { projectId, source: "facebook.com", visits: 1800, percentage: 18, date: todayStr },
        { projectId, source: "twitter.com", visits: 1200, percentage: 12, date: todayStr },
        { projectId, source: "linkedin.com", visits: 900, percentage: 9, date: todayStr },
        { projectId, source: "reddit.com", visits: 600, percentage: 6, date: todayStr },
        { projectId, source: "youtube.com", visits: 500, percentage: 5, date: todayStr },
        { projectId, source: "Other", visits: 800, percentage: 8, date: todayStr },
      ]);
      
      // Seed keywords
      await storage.upsertGtmKeywords([
        { projectId, keyword: "saas dashboard", searches: 3200, percentage: 32, date: todayStr },
        { projectId, keyword: "analytics tool", searches: 2100, percentage: 21, date: todayStr },
        { projectId, keyword: "business intelligence", searches: 1500, percentage: 15, date: todayStr },
        { projectId, keyword: "data visualization", searches: 1200, percentage: 12, date: todayStr },
        { projectId, keyword: "reporting software", searches: 900, percentage: 9, date: todayStr },
        { projectId, keyword: "dashboard software", searches: 600, percentage: 6, date: todayStr },
        { projectId, keyword: "analytics platform", searches: 500, percentage: 5, date: todayStr },
      ]);
      
      // Seed campaigns
      await storage.upsertGtmCampaigns([
        { projectId, campaign: "Summer Sale 2024", clicks: 5200, conversions: 420, date: todayStr },
        { projectId, campaign: "Product Launch", clicks: 3800, conversions: 310, date: todayStr },
        { projectId, campaign: "Blog Promotion", clicks: 2100, conversions: 180, date: todayStr },
        { projectId, campaign: "Newsletter Signup", clicks: 1500, conversions: 240, date: todayStr },
        { projectId, campaign: "Free Trial", clicks: 3200, conversions: 280, date: todayStr },
        { projectId, campaign: "Webinar Series", clicks: 1800, conversions: 150, date: todayStr },
        { projectId, campaign: "Case Study", clicks: 1200, conversions: 95, date: todayStr },
        { projectId, campaign: "Social Media", clicks: 900, conversions: 65, date: todayStr },
      ]);
      
      // Seed additional page views data for exit pages, landing pages, etc.
      // These will be used by the combined metrics chart
      await storage.upsertGtmPageViews([
        // Add exit page data as page views with exit information
        { projectId, page: "/checkout/complete", views: 2800, percentage: 28, date: todayStr },
        { projectId, page: "/blog/post-5", views: 1500, percentage: 15, date: todayStr },
        { projectId, page: "/faq", views: 1000, percentage: 10, date: todayStr },
        { projectId, page: "/products/item-3", views: 900, percentage: 9, date: todayStr },
        // Landing pages (already included above, but ensuring they're there)
        { projectId, page: "/home", views: 12500, percentage: 32, date: todayStr },
        { projectId, page: "/products", views: 8900, percentage: 23, date: todayStr },
        { projectId, page: "/blog/post-1", views: 3200, percentage: 8, date: todayStr },
        { projectId, page: "/pricing", views: 2100, percentage: 5, date: todayStr },
        { projectId, page: "/about", views: 6200, percentage: 16, date: todayStr },
        { projectId, page: "/contact", views: 4500, percentage: 12, date: todayStr },
      ]);
      
      res.json({ 
        success: true, 
        message: "Mock GTM data seeded successfully",
        projectId,
        seeded: {
          analyticsData: 30, // 30 days
          trafficSources: 5,
          pageViews: 14,
          referrers: 7,
          keywords: 7,
          campaigns: 8,
        }
      });
    } catch (error: any) {
      console.error("[GTM Seed] Error:", error);
      res.status(500).json({ error: error.message || "Failed to seed mock data" });
    }
  });

  // GTM OAuth endpoints
  app.get("/api/gtm/oauth/initiate", requireAuth, async (req, res) => {
    try {
      console.log("[GTM OAuth] ========== OAuth Initiate Started ==========");
      const projectId = req.session.projectId!;
      console.log("[GTM OAuth] Project ID:", projectId);
      
      // Check if OAuth credentials are configured
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      console.log("[GTM OAuth] Environment check:", {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdLength: clientId?.length || 0,
        clientSecretLength: clientSecret?.length || 0,
        clientIdPreview: clientId ? clientId.substring(0, 20) + "..." : "missing",
        nodeEnv: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('CLIENT')).join(', '),
      });
      
      if (!clientId || !clientSecret) {
        console.error("[GTM OAuth] OAuth credentials not configured");
        console.error("[GTM OAuth] Available env vars:", {
          googleClientId: !!process.env.GOOGLE_CLIENT_ID,
          googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          googleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
          allGoogleVars: Object.keys(process.env).filter(k => k.toUpperCase().includes('GOOGLE')),
        });
        return res.status(500).json({ 
          error: "GTM OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables in Render Dashboard.",
          details: "Go to Render Dashboard → Your Service → Environment tab → Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET",
          troubleshooting: "After adding variables, wait for Render to redeploy. Check Render logs to verify variables are loaded."
        });
      }
      
      // Import GTM OAuth functions
      const { getAuthUrl } = await import('./gtm-oauth');
      
      // Generate state with projectId for security
      const state = Buffer.from(JSON.stringify({ projectId, timestamp: Date.now() })).toString('base64');
      
      // Store state in session for verification
      req.session.gtmOAuthState = state;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log("[GTM OAuth] State stored in session:", state.substring(0, 20) + "...");
      
      const authUrl = getAuthUrl(state);
      console.log("[GTM OAuth] Generated auth URL:", authUrl.substring(0, 100) + "...");
      console.log("[GTM OAuth] ========== OAuth Initiate Completed ==========");
      
      res.json({ authUrl });
    } catch (error: any) {
      console.error("[GTM OAuth] Initiate error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to initiate OAuth",
        requiresTestUser: true, // Flag to show test user instructions
      });
      console.error("[GTM OAuth] Error details:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ 
        error: error.message || "Failed to initiate OAuth",
        details: error.stack
      });
    }
  });

  app.get("/api/gtm/oauth/callback", async (req, res) => {
    try {
      console.log("[GTM OAuth] ========== OAuth Callback Started ==========");
      console.log("[GTM OAuth] Query params:", {
        hasCode: !!req.query.code,
        hasState: !!req.query.state,
        hasError: !!req.query.error,
      });
      
      const { code, state, error } = req.query;
      
      if (error) {
        console.error("[GTM OAuth] OAuth error:", error);
        // Check if it's the "access_denied" error (testing mode)
        if (error === 'access_denied') {
          return res.redirect(`/?error=${encodeURIComponent('access_denied')}&requiresTestUser=true`);
        }
        return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
      }
      
      if (!code || !state) {
        console.error("[GTM OAuth] Missing code or state");
        return res.redirect(`/?error=${encodeURIComponent('Missing code or state')}`);
      }
      
      // Verify state matches session
      const session = req.session;
      console.log("[GTM OAuth] Session state check:", {
        hasSession: !!session,
        sessionState: session?.gtmOAuthState ? session.gtmOAuthState.substring(0, 20) + "..." : "missing",
        receivedState: (state as string).substring(0, 20) + "...",
        statesMatch: session?.gtmOAuthState === state,
      });
      
      if (!session || session.gtmOAuthState !== state) {
        console.error("[GTM OAuth] Invalid state - possible CSRF attack or session expired");
        return res.redirect(`/?error=${encodeURIComponent('Invalid state. Please try connecting again.')}`);
      }
      
      // Decode projectId from state
      let stateData;
      try {
        stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      } catch (e) {
        console.error("[GTM OAuth] Failed to decode state:", e);
        return res.redirect(`/?error=${encodeURIComponent('Invalid state format')}`);
      }
      
      const projectId = stateData.projectId;
      console.log("[GTM OAuth] Project ID from state:", projectId);
      
      if (!projectId) {
        return res.redirect(`/?error=${encodeURIComponent('Missing project ID')}`);
      }
      
      // Import GTM OAuth functions
      const { exchangeCodeForTokens } = await import('./gtm-oauth');
      
      console.log("[GTM OAuth] Exchanging code for tokens...");
      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code as string);
      console.log("[GTM OAuth] Tokens received:", {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });
      
      // Get GTM accounts to find account ID
      const oauth2Client = (await import('google-auth-library')).OAuth2Client;
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      // Auto-detect redirect URI
      let redirectUri = process.env.GOOGLE_REDIRECT_URI;
      if (!redirectUri) {
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
          const renderUrl = process.env.RENDER_EXTERNAL_URL || 'https://saasdashkit-v1.onrender.com';
          redirectUri = `${renderUrl}/api/gtm/oauth/callback`;
        } else {
          redirectUri = 'http://localhost:3000/api/gtm/oauth/callback';
        }
      }
      
      if (!clientId || !clientSecret) {
        throw new Error('OAuth credentials not configured');
      }
      
      const client = new oauth2Client(clientId, clientSecret, redirectUri);
      client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
      
      console.log("[GTM OAuth] Fetching GTM accounts...");
      const { google } = await import('googleapis');
      const tagmanager = google.tagmanager({ version: 'v2', auth: client });
      const accountsResponse = await tagmanager.accounts.list();
      const accounts = accountsResponse.data.account || [];
      console.log("[GTM OAuth] Found accounts:", accounts.length);
      
      if (accounts.length === 0) {
        return res.redirect(`/?error=${encodeURIComponent('No GTM accounts found. Please ensure you have access to a GTM account.')}`);
      }
      
      // Use first account (user can change later)
      const accountId = accounts[0].accountId || '';
      console.log("[GTM OAuth] Using account ID:", accountId);
      
      // Get containers for this account
      console.log("[GTM OAuth] Fetching containers...");
      const containersResponse = await tagmanager.accounts.containers.list({
        parent: `accounts/${accountId}`,
      });
      const containers = containersResponse.data.container || [];
      console.log("[GTM OAuth] Found containers:", containers.length);
      
      if (containers.length === 0) {
        return res.redirect(`/?error=${encodeURIComponent('No GTM containers found in this account.')}`);
      }
      
      // Use first container (user can change later)
      const containerId = containers[0].containerId || '';
      console.log("[GTM OAuth] Using container ID:", containerId);
      
      // Store credentials
      console.log("[GTM OAuth] Storing credentials...");
      await storage.createOrUpdateGtmCredentials({
        projectId,
        accountId,
        containerId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
        expiresAt: tokens.expiresAt,
      });
      console.log("[GTM OAuth] Credentials stored successfully");
      
      // Clear OAuth state from session
      delete session.gtmOAuthState;
      await new Promise<void>((resolve, reject) => {
        session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log("[GTM OAuth] ========== OAuth Callback Completed Successfully ==========");
      res.redirect('/?gtm_connected=true');
    } catch (error: any) {
      console.error("[GTM OAuth] Callback error:", error);
      console.error("[GTM OAuth] Error details:", {
        message: error.message,
        stack: error.stack,
      });
      res.redirect(`/?error=${encodeURIComponent(error.message || 'OAuth callback failed')}`);
    }
  });

  // Manual service account credentials endpoint (alternative to OAuth)
  app.post("/api/gtm/credentials/service-account", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const { serviceAccountKey, accountId, containerId } = req.body;

      if (!serviceAccountKey) {
        return res.status(400).json({ error: "Service account key is required" });
      }

      // Validate JSON format
      let parsedKey;
      try {
        parsedKey = typeof serviceAccountKey === 'string' ? JSON.parse(serviceAccountKey) : serviceAccountKey;
        if (!parsedKey.client_email || !parsedKey.private_key) {
          return res.status(400).json({ error: "Invalid service account key format. Must include client_email and private_key" });
        }
      } catch (error) {
        return res.status(400).json({ error: "Invalid JSON format for service account key" });
      }

      // Test the service account by fetching GTM accounts
      const { JWT } = await import('google-auth-library');
      const jwtClient = new JWT({
        email: parsedKey.client_email,
        key: parsedKey.private_key,
        scopes: [
          'https://www.googleapis.com/auth/tagmanager.readonly',
          'https://www.googleapis.com/auth/tagmanager.edit.containers',
        ],
      });

      const { google } = await import('googleapis');
      const tagmanager = google.tagmanager({ version: 'v2', auth: jwtClient });
      
      // Fetch accounts to verify access
      const accountsResponse = await tagmanager.accounts.list();
      const accounts = accountsResponse.data.account || [];

      if (accounts.length === 0) {
        return res.status(400).json({ error: "Service account has no access to any GTM accounts. Please grant access in Google Tag Manager." });
      }

      // Use provided accountId or first account
      const finalAccountId = accountId || accounts[0].accountId || '';
      
      // Fetch containers
      const containersResponse = await tagmanager.accounts.containers.list({
        parent: `accounts/${finalAccountId}`,
      });
      const containers = containersResponse.data.container || [];

      if (containers.length === 0) {
        return res.status(400).json({ error: "No GTM containers found in this account" });
      }

      // Use provided containerId or first container
      const finalContainerId = containerId || containers[0].containerId || '';

      // Store credentials
      await storage.createOrUpdateGtmCredentials({
        projectId,
        accountId: finalAccountId,
        containerId: finalContainerId,
        serviceAccountKey: JSON.stringify(parsedKey),
        authType: 'service_account',
      });

      res.json({ 
        success: true,
        message: "Service account connected successfully",
        accountId: finalAccountId,
        containerId: finalContainerId,
      });
    } catch (error: any) {
      console.error("[GTM Service Account] Error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to connect service account",
        details: error.response?.data || error.stack,
      });
    }
  });

  app.get("/api/gtm/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const credentials = await storage.getGtmCredentials(projectId);
      
      if (!credentials) {
        return res.json({ connected: false });
      }
      
      // Don't send sensitive tokens to client
      res.json({
        connected: true,
        accountId: credentials.accountId,
        containerId: credentials.containerId,
      });
    } catch (error: any) {
      console.error("[GTM Credentials] Error:", error);
      res.status(500).json({ error: error.message || "Failed to get credentials" });
    }
  });

  app.delete("/api/gtm/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      await storage.deleteGtmCredentials(projectId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[GTM Credentials] Delete error:", error);
      res.status(500).json({ error: error.message || "Failed to delete credentials" });
    }
  });

  // ========== GA4 (Google Analytics) OAuth endpoints ==========
  app.get("/api/ga4/oauth/initiate", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      
      // Check if OAuth credentials are configured
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.status(400).json({ 
          error: "GA4 OAuth not configured",
          message: "Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables"
        });
      }

      const { getAuthUrl } = await import('./ga4-oauth');
      const state = `${projectId}-${Date.now()}`;
      const authUrl = getAuthUrl(state);
      
      res.json({ authUrl, state });
    } catch (error: any) {
      console.error("[GA4 OAuth] Initiate error:", error);
      res.status(500).json({ error: error.message || "Failed to initiate OAuth" });
    }
  });

  app.get("/api/ga4/oauth/callback", async (req, res) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        console.error("[GA4 OAuth] Callback error:", error);
        if (error === 'access_denied') {
          return res.redirect(`/?error=${encodeURIComponent('GA4 access denied. Please try again or use Service Account method.')}`);
        }
        return res.redirect(`/?error=${encodeURIComponent(`GA4 OAuth error: ${error}`)}`);
      }

      if (!code || !state) {
        return res.redirect(`/?error=${encodeURIComponent('Missing authorization code or state')}`);
      }

      const projectId = (state as string).split('-')[0];
      if (!projectId) {
        return res.redirect(`/?error=${encodeURIComponent('Invalid state parameter')}`);
      }

      const { getTokensFromCode, getGa4Properties } = await import('./ga4-oauth');
      const tokens = await getTokensFromCode(code as string);
      
      // Fetch GA4 properties to get property ID
      // We need to temporarily set credentials to fetch properties
      const { OAuth2Client } = await import('google-auth-library');
      const { google } = await import('googleapis');
      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
        (process.env.NODE_ENV === 'production' 
          ? `${process.env.RENDER_EXTERNAL_URL || 'https://saasdashkit-v1.onrender.com'}/api/ga4/oauth/callback`
          : 'http://localhost:3000/api/ga4/oauth/callback');
      
      const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
      oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      const analytics = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });
      const propertiesResponse = await analytics.properties.list();
      const properties = propertiesResponse.data.properties || [];

      if (properties.length === 0) {
        return res.redirect(`/?error=${encodeURIComponent('No GA4 properties found. Please ensure you have access to a GA4 property.')}`);
      }

      // Use first property (user can change later)
      const propertyId = properties[0].name || '';
      
      // Store credentials
      await storage.createOrUpdateGa4Credentials({
        projectId,
        propertyId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        authType: 'oauth',
      });

      res.redirect(`/?ga4_connected=true`);
    } catch (error: any) {
      console.error("[GA4 OAuth] Callback error:", error);
      res.redirect(`/?error=${encodeURIComponent(`Failed to connect GA4: ${error.message}`)}`);
    }
  });

  // Manual service account credentials endpoint for GA4
  app.post("/api/ga4/credentials/service-account", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const { serviceAccountKey, propertyId } = req.body;

      if (!serviceAccountKey) {
        return res.status(400).json({ error: "Service account key is required" });
      }

      // Validate JSON format
      let parsedKey;
      try {
        parsedKey = typeof serviceAccountKey === 'string' ? JSON.parse(serviceAccountKey) : serviceAccountKey;
        if (!parsedKey.client_email || !parsedKey.private_key) {
          return res.status(400).json({ error: "Invalid service account key format. Must include client_email and private_key" });
        }
      } catch (error) {
        return res.status(400).json({ error: "Invalid JSON format for service account key" });
      }

      // Test the service account by fetching GA4 properties
      const { JWT } = await import('google-auth-library');
      const jwtClient = new JWT({
        email: parsedKey.client_email,
        key: parsedKey.private_key,
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      });

      const { google } = await import('googleapis');
      const analytics = google.analyticsdata({ version: 'v1beta', auth: jwtClient });
      
      // Fetch properties to verify access
      const propertiesResponse = await analytics.properties.list();
      const properties = propertiesResponse.data.properties || [];

      if (properties.length === 0) {
        return res.status(400).json({ error: "Service account has no access to any GA4 properties. Please grant access in Google Analytics." });
      }

      // Use provided propertyId or first property
      const finalPropertyId = propertyId || properties[0].name || '';

      // Store credentials
      await storage.createOrUpdateGa4Credentials({
        projectId,
        propertyId: finalPropertyId,
        serviceAccountKey: JSON.stringify(parsedKey),
        authType: 'service_account',
      });

      res.json({ 
        success: true,
        message: "GA4 service account connected successfully",
        propertyId: finalPropertyId,
      });
    } catch (error: any) {
      console.error("[GA4 Service Account] Error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to connect service account",
        details: error.response?.data || error.stack,
      });
    }
  });

  app.get("/api/ga4/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const credentials = await storage.getGa4Credentials(projectId);
      
      if (!credentials) {
        return res.json({ connected: false });
      }
      
      // Don't send sensitive tokens to client
      res.json({
        connected: true,
        propertyId: credentials.propertyId,
      });
    } catch (error: any) {
      console.error("[GA4 Credentials] Error:", error);
      res.status(500).json({ error: error.message || "Failed to get credentials" });
    }
  });

  app.delete("/api/ga4/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      await storage.deleteGa4Credentials(projectId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[GA4 Credentials] Delete error:", error);
      res.status(500).json({ error: error.message || "Failed to delete credentials" });
    }
  });

  // Sync GA4 analytics data
  app.post("/api/ga4/sync", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const { startDate, endDate } = req.body;
      
      const credentials = await storage.getGa4Credentials(projectId);
      if (!credentials) {
        return res.status(400).json({ error: "GA4 not connected. Please connect your Google Analytics account first." });
      }

      const { fetchGa4AnalyticsData } = await import('./ga4-oauth');
      const analyticsData = await fetchGa4AnalyticsData(
        projectId,
        credentials.propertyId,
        startDate || '30daysAgo',
        endDate || 'today'
      );

      // Store analytics data in GTM analytics table (reuse same schema)
      // Convert GA4 data format to our schema
      const rows = analyticsData.rows || [];
      for (const row of rows) {
        const date = row.dimensionValues?.[0]?.value || new Date().toISOString().split('T')[0];
        const metrics = row.metricValues || [];
        
        await storage.upsertGtmAnalyticsData({
          projectId,
          date,
          pageViews: parseInt(metrics[0]?.value || '0'),
          sessions: parseInt(metrics[1]?.value || '0'),
          users: parseInt(metrics[2]?.value || '0'),
          clicks: parseInt(metrics[3]?.value || '0'),
          conversions: 0,
        });
      }

      res.json({ 
        success: true,
        message: "GA4 data synced successfully",
        rowsProcessed: rows.length,
      });
    } catch (error: any) {
      console.error("[GA4 Sync] Error:", error);
      res.status(500).json({ error: error.message || "Failed to sync GA4 data" });
    }
  });

  // Shopify Storefront API Credentials Management (No OAuth needed!)
  console.log("[Shopify Routes] Registering Shopify routes...");
  
  // Debug middleware to log all Shopify API requests
  app.use("/api/shopify/*", (req, res, next) => {
    console.log("[Shopify Debug] Request received:", req.method, req.originalUrl, req.path);
    next();
  });

  // Test route to verify routing works
  app.get("/api/shopify/test", requireAuth, async (req, res) => {
    console.log("[Shopify Test] Test route hit!");
    res.json({ message: "Shopify routes are working", projectId: req.session.projectId });
  });

  app.post("/api/shopify/connect", requireAuth, async (req, res) => {
    console.log("[Shopify Connect] POST /api/shopify/connect route handler called!");
    console.log("[Shopify Connect] Route hit! Method:", req.method, "Path:", req.path, "Body:", { shopDomain: req.body?.shopDomain, hasToken: !!req.body?.storefrontAccessToken });
    try {
      const projectId = req.session.projectId!;
      const { shopDomain, storefrontAccessToken } = req.body;

      if (!shopDomain) {
        return res.status(400).json({ error: 'Shop domain is required' });
      }

      if (!storefrontAccessToken) {
        return res.status(400).json({ error: 'Storefront access token is required' });
      }

      // Normalize shop domain
      let normalizedDomain = shopDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (!normalizedDomain.includes('.myshopify.com')) {
        normalizedDomain = `${normalizedDomain}.myshopify.com`;
      }

      // Store credentials
      console.log("[Shopify Connect] Storing credentials for projectId:", projectId, "shopDomain:", normalizedDomain);
      const credentials = await storage.createOrUpdateShopifyCredentials({
        projectId,
        shopDomain: normalizedDomain,
        storefrontAccessToken,
      });

      console.log("[Shopify] Credentials stored successfully:", {
        id: credentials.id,
        projectId: credentials.projectId,
        shopDomain: credentials.shopDomain,
        hasToken: !!credentials.storefrontAccessToken,
        createdAt: credentials.createdAt,
      });

      res.json({
        message: "Shopify store connected successfully",
        shopDomain: credentials.shopDomain,
      });
    } catch (error: any) {
      console.error("[Shopify Connect] Error:", error);
      res.status(500).json({ error: error.message || "Failed to connect Shopify store" });
    }
  });

  app.get("/api/shopify/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      console.log("[Shopify Credentials] Fetching credentials for projectId:", projectId);
      const credentials = await storage.getShopifyCredentials(projectId);

      if (!credentials) {
        console.log("[Shopify Credentials] No credentials found for projectId:", projectId);
        // Return 200 with null when no credentials exist (not an error state)
        return res.json(null);
      }

      console.log("[Shopify Credentials] Found credentials for projectId:", projectId, "shopDomain:", credentials.shopDomain);
      // Don't send sensitive tokens to client
      res.json({
        shopDomain: credentials.shopDomain,
        hasAccessToken: !!credentials.storefrontAccessToken,
      });
    } catch (error: any) {
      console.error("[Shopify Credentials] Error:", error);
      res.status(500).json({ error: error.message || "Failed to get credentials" });
    }
  });

  app.delete("/api/shopify/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      await storage.deleteShopifyCredentials(projectId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Shopify Credentials] Delete error:", error);
      res.status(500).json({ error: error.message || "Failed to delete credentials" });
    }
  });

  // Import products from Shopify
  app.post("/api/shopify/import", requireAuth, async (req, res) => {
    console.log("[Shopify Import] Route hit! POST /api/shopify/import");
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      if (!config.vf_api_key) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      console.log("[Shopify Import] Starting product import for projectId:", projectId);
      
      // Fetch products from Shopify
      const { getShopifyProducts } = await import('./shopify-storefront');
      const shopifyData = await getShopifyProducts(projectId, 250);
      
      if (!shopifyData.products || shopifyData.products.length === 0) {
        return res.json({ 
          message: "No products found in Shopify store",
          imported: 0,
          skipped: 0 
        });
      }

      console.log(`[Shopify Import] Found ${shopifyData.products.length} products in Shopify`);

      let imported = 0;
      let skipped = 0;

      // Import each product
      for (const shopifyProduct of shopifyData.products) {
        try {
          // Check if product already exists (by checking if we have a product with same name and projectId)
          const existingProducts = await storage.getProducts(projectId, config.vf_api_key);
          const exists = existingProducts.some(p => 
            p.name === shopifyProduct.title && 
            p.product_url?.includes(shopifyProduct.handle)
          );

          if (exists) {
            skipped++;
            continue;
          }

          // Map Shopify product to Product schema
          const productUrl = shopifyProduct.handle 
            ? `https://${(await storage.getShopifyCredentials(projectId))?.shopDomain}/${shopifyProduct.handle}`
            : '';
          
          const imageUrl = shopifyProduct.images && shopifyProduct.images.length > 0
            ? shopifyProduct.images[0].url
            : '';

          const description = shopifyProduct.description || shopifyProduct.descriptionHtml || '';
          
          // Combine tags into a comma-separated string
          const tags = Array.isArray(shopifyProduct.tags) 
            ? shopifyProduct.tags.join(', ')
            : shopifyProduct.tags || '';

          const productName = shopifyProduct.title;
          const productDescription = description.substring(0, 5000);
          const productTags = tags.substring(0, 500);

          // Generate embedding for RAG search
          const combinedText = `Name: ${productName}; Description: ${productDescription}; Tags: ${productTags || ''}`;
          console.log(`[Shopify Import] Generating embedding for product: ${productName}`);
          const embedding = await getEmbedding(combinedText);
          console.log(`[Shopify Import] Embedding generated for product: ${productName}`);

          const insertProduct = {
            projectId,
            vf_api_key: config.vf_api_key,
            name: productName,
            description: productDescription,
            image_url: imageUrl,
            product_url: productUrl,
            tags: productTags,
            embedding,
          };

          await storage.createProduct(insertProduct);
          imported++;
        } catch (error: any) {
          console.error(`[Shopify Import] Error importing product ${shopifyProduct.title}:`, error);
          skipped++;
        }
      }

      console.log(`[Shopify Import] Import complete: ${imported} imported, ${skipped} skipped`);

      res.json({
        message: `Successfully imported ${imported} products from Shopify`,
        imported,
        skipped,
        total: shopifyData.products.length,
      });
    } catch (error: any) {
      console.error("[Shopify Import] Error:", error);
      res.status(500).json({ error: error.message || "Failed to import products from Shopify" });
    }
  });

  // WordPress/WooCommerce Integration Routes
  app.post("/api/wordpress/connect", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const { siteUrl, consumerKey, consumerSecret } = req.body;

      if (!siteUrl) {
        return res.status(400).json({ error: 'Site URL is required' });
      }

      if (!consumerKey) {
        return res.status(400).json({ error: 'Consumer Key is required' });
      }

      if (!consumerSecret) {
        return res.status(400).json({ error: 'Consumer Secret is required' });
      }

      // Normalize site URL
      let normalizedUrl = siteUrl.trim().toLowerCase();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      normalizedUrl = normalizedUrl.replace(/\/$/, '');

      // Store credentials
      const credentials = await storage.createOrUpdateWordPressCredentials({
        projectId,
        siteUrl: normalizedUrl,
        consumerKey,
        consumerSecret,
      });

      res.json({
        message: "WordPress site connected successfully",
        siteUrl: credentials.siteUrl,
      });
    } catch (error: any) {
      console.error("[WordPress Connect] Error:", error);
      res.status(500).json({ error: error.message || "Failed to connect WordPress site" });
    }
  });

  app.get("/api/wordpress/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const credentials = await storage.getWordPressCredentials(projectId);

      if (!credentials) {
        return res.json(null);
      }

      // Don't send sensitive secrets to client
      res.json({
        siteUrl: credentials.siteUrl,
        hasCredentials: !!(credentials.consumerKey && credentials.consumerSecret),
      });
    } catch (error: any) {
      console.error("[WordPress Credentials] Error:", error);
      res.status(500).json({ error: error.message || "Failed to get credentials" });
    }
  });

  app.delete("/api/wordpress/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      await storage.deleteWordPressCredentials(projectId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[WordPress Credentials] Delete error:", error);
      res.status(500).json({ error: error.message || "Failed to delete credentials" });
    }
  });

  // Import products from WordPress/WooCommerce
  app.post("/api/wordpress/import", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      if (!config.vf_api_key) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      console.log("[WordPress Import] Starting product import for projectId:", projectId);
      
      // Fetch products from WordPress
      const { getAllWordPressProducts } = await import('./wordpress-api');
      const products = await getAllWordPressProducts(projectId);
      
      if (!products || products.length === 0) {
        return res.json({ 
          message: "No products found in WordPress/WooCommerce store",
          imported: 0,
          skipped: 0 
        });
      }

      console.log(`[WordPress Import] Found ${products.length} products in WordPress`);

      let imported = 0;
      let skipped = 0;

      // Import each product
      for (const wpProduct of products) {
        try {
          // Check if product already exists
          const existingProducts = await storage.getProducts(projectId, config.vf_api_key);
          const exists = existingProducts.some(p => 
            p.name === wpProduct.name && 
            p.product_url?.includes(wpProduct.permalink || '')
          );

          if (exists) {
            skipped++;
            continue;
          }

          // Map WordPress/WooCommerce product to Product schema
          const imageUrl = wpProduct.images && wpProduct.images.length > 0
            ? wpProduct.images[0].src
            : '';

          const description = wpProduct.description || wpProduct.short_description || '';
          
          // Combine tags and categories into tags string
          const tags = [
            ...(wpProduct.tags || []).map((t: any) => t.name),
            ...(wpProduct.categories || []).map((c: any) => c.name),
          ].join(', ');

          const productName = wpProduct.name;
          const productDescription = description.substring(0, 5000);
          const productTags = tags.substring(0, 500);

          // Generate embedding for RAG search
          const combinedText = `Name: ${productName}; Description: ${productDescription}; Tags: ${productTags || ''}`;
          console.log(`[WordPress Import] Generating embedding for product: ${productName}`);
          const embedding = await getEmbedding(combinedText);
          console.log(`[WordPress Import] Embedding generated for product: ${productName}`);

          const insertProduct = {
            projectId,
            vf_api_key: config.vf_api_key,
            name: productName,
            description: productDescription,
            image_url: imageUrl,
            product_url: wpProduct.permalink || wpProduct.product_url || '',
            tags: productTags,
            embedding,
          };

          await storage.createProduct(insertProduct);
          imported++;
        } catch (error: any) {
          console.error(`[WordPress Import] Error importing product ${wpProduct.name}:`, error);
          skipped++;
        }
      }

      console.log(`[WordPress Import] Import complete: ${imported} imported, ${skipped} skipped`);

      res.json({
        message: `Successfully imported ${imported} products from WordPress`,
        imported,
        skipped,
        total: products.length,
      });
    } catch (error: any) {
      console.error("[WordPress Import] Error:", error);
      res.status(500).json({ error: error.message || "Failed to import products from WordPress" });
    }
  });

  // BigCommerce Integration Routes
  app.post("/api/bigcommerce/connect", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const { storeHash, accessToken } = req.body;

      if (!storeHash) {
        return res.status(400).json({ error: 'Store hash is required' });
      }

      if (!accessToken) {
        return res.status(400).json({ error: 'Access token is required' });
      }

      // Normalize store hash (remove .mybigcommerce.com if present)
      let normalizedHash = storeHash.trim();
      normalizedHash = normalizedHash.replace(/\.mybigcommerce\.com$/, '');

      // Store credentials
      const credentials = await storage.createOrUpdateBigCommerceCredentials({
        projectId,
        storeHash: normalizedHash,
        accessToken,
      });

      res.json({
        message: "BigCommerce store connected successfully",
        storeHash: credentials.storeHash,
      });
    } catch (error: any) {
      console.error("[BigCommerce Connect] Error:", error);
      res.status(500).json({ error: error.message || "Failed to connect BigCommerce store" });
    }
  });

  app.get("/api/bigcommerce/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const credentials = await storage.getBigCommerceCredentials(projectId);

      if (!credentials) {
        return res.json(null);
      }

      // Don't send sensitive token to client
      res.json({
        storeHash: credentials.storeHash,
        hasAccessToken: !!credentials.accessToken,
      });
    } catch (error: any) {
      console.error("[BigCommerce Credentials] Error:", error);
      res.status(500).json({ error: error.message || "Failed to get credentials" });
    }
  });

  app.delete("/api/bigcommerce/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      await storage.deleteBigCommerceCredentials(projectId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[BigCommerce Credentials] Delete error:", error);
      res.status(500).json({ error: error.message || "Failed to delete credentials" });
    }
  });

  // Import products from BigCommerce
  app.post("/api/bigcommerce/import", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      if (!config.vf_api_key) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      console.log("[BigCommerce Import] Starting product import for projectId:", projectId);
      
      // Verify credentials exist
      const credentials = await storage.getBigCommerceCredentials(projectId);
      if (!credentials) {
        return res.status(400).json({ error: 'BigCommerce credentials not found. Please connect your BigCommerce store first.' });
      }
      console.log("[BigCommerce Import] Credentials found:", {
        storeHash: credentials.storeHash,
        hasAccessToken: !!credentials.accessToken,
        tokenLength: credentials.accessToken?.length || 0,
      });
      
      // Fetch products from BigCommerce
      const { getAllBigCommerceProducts } = await import('./bigcommerce-api');
      const products = await getAllBigCommerceProducts(projectId);
      
      if (!products || products.length === 0) {
        return res.json({ 
          message: "No products found in BigCommerce store",
          imported: 0,
          skipped: 0 
        });
      }

      console.log(`[BigCommerce Import] Found ${products.length} products in BigCommerce`);

      let imported = 0;
      let skipped = 0;

      // Import each product
      for (const bcProduct of products) {
        try {
          // Check if product already exists
          const existingProducts = await storage.getProducts(projectId, config.vf_api_key);
          const exists = existingProducts.some(p => 
            p.name === bcProduct.name && 
            p.product_url?.includes(bcProduct.custom_url?.url || '')
          );

          if (exists) {
            skipped++;
            continue;
          }

          // Map BigCommerce product to Product schema
          const imageUrl = bcProduct.images && bcProduct.images.length > 0
            ? bcProduct.images[0].url_standard || bcProduct.images[0].url_thumbnail || ''
            : '';

          const description = bcProduct.description || bcProduct.description || '';
          
          // Combine categories and brand into tags string
          const tags = [
            bcProduct.brand_name,
            ...(bcProduct.categories || []).map((c: any) => c.name),
          ].filter(Boolean).join(', ');

          const productUrl = bcProduct.custom_url?.url 
            ? (bcProduct.custom_url.url.startsWith('http') 
                ? bcProduct.custom_url.url 
                : `https://${(await storage.getBigCommerceCredentials(projectId))?.storeHash}.mybigcommerce.com${bcProduct.custom_url.url}`)
            : '';

          const productName = bcProduct.name;
          const productDescription = description.substring(0, 5000);
          const productTags = tags.substring(0, 500);

          // Generate embedding for RAG search
          const combinedText = `Name: ${productName}; Description: ${productDescription}; Tags: ${productTags || ''}`;
          console.log(`[BigCommerce Import] Generating embedding for product: ${productName}`);
          const embedding = await getEmbedding(combinedText);
          console.log(`[BigCommerce Import] Embedding generated for product: ${productName}`);

          const insertProduct = {
            projectId,
            vf_api_key: config.vf_api_key,
            name: productName,
            description: productDescription,
            image_url: imageUrl,
            product_url: productUrl,
            tags: productTags,
            embedding,
          };

          await storage.createProduct(insertProduct);
          imported++;
        } catch (error: any) {
          console.error(`[BigCommerce Import] Error importing product ${bcProduct.name}:`, error);
          skipped++;
        }
      }

      console.log(`[BigCommerce Import] Import complete: ${imported} imported, ${skipped} skipped`);

      res.json({
        message: `Successfully imported ${imported} products from BigCommerce`,
        imported,
        skipped,
        total: products.length,
      });
    } catch (error: any) {
      console.error("[BigCommerce Import] Error:", error);
      res.status(500).json({ error: error.message || "Failed to import products from BigCommerce" });
    }
  });

  // Squarespace Integration Routes
  app.post("/api/squarespace/connect", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const { siteUrl, apiKey } = req.body;

      if (!siteUrl) {
        return res.status(400).json({ error: 'Site URL is required' });
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
      }

      // Normalize site URL
      let normalizedUrl = siteUrl.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      normalizedUrl = normalizedUrl.replace(/\/$/, '');

      // Store credentials
      const credentials = await storage.createOrUpdateSquarespaceCredentials({
        projectId,
        siteUrl: normalizedUrl,
        apiKey,
      });

      res.json({
        message: "Squarespace site connected successfully",
        siteUrl: credentials.siteUrl,
      });
    } catch (error: any) {
      console.error("[Squarespace Connect] Error:", error);
      res.status(500).json({ error: error.message || "Failed to connect Squarespace site" });
    }
  });

  app.get("/api/squarespace/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const credentials = await storage.getSquarespaceCredentials(projectId);

      if (!credentials) {
        return res.json(null);
      }

      // Don't send sensitive API key to client
      res.json({
        siteUrl: credentials.siteUrl,
        hasApiKey: !!credentials.apiKey,
      });
    } catch (error: any) {
      console.error("[Squarespace Credentials] Error:", error);
      res.status(500).json({ error: error.message || "Failed to get credentials" });
    }
  });

  app.delete("/api/squarespace/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      await storage.deleteSquarespaceCredentials(projectId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Squarespace Credentials] Delete error:", error);
      res.status(500).json({ error: error.message || "Failed to delete credentials" });
    }
  });

  // Import products from Squarespace
  app.post("/api/squarespace/import", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const config = await storage.getProjectConfig(projectId);
      if (!config.vf_api_key) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }

      console.log("[Squarespace Import] Starting product import for projectId:", projectId);
      
      // Verify credentials exist
      const credentials = await storage.getSquarespaceCredentials(projectId);
      if (!credentials) {
        return res.status(400).json({ error: 'Squarespace credentials not found. Please connect your Squarespace site first.' });
      }
      console.log("[Squarespace Import] Credentials found:", {
        siteUrl: credentials.siteUrl,
        hasApiKey: !!credentials.apiKey,
        apiKeyLength: credentials.apiKey?.length || 0,
      });
      
      // Fetch products from Squarespace
      const { getAllSquarespaceProducts } = await import('./squarespace-api');
      const products = await getAllSquarespaceProducts(projectId);
      
      console.log(`[Squarespace Import] API returned ${products?.length || 0} products`);
      
      if (!products || products.length === 0) {
        console.log(`[Squarespace Import] No products found - this could mean:`);
        console.log(`  - The store has no products`);
        console.log(`  - The API response structure is different than expected`);
        console.log(`  - The API key doesn't have proper permissions`);
        return res.json({ 
          message: "No products found in Squarespace store. Check server logs for details.",
          imported: 0,
          skipped: 0 
        });
      }

      console.log(`[Squarespace Import] Found ${products.length} products in Squarespace`);

      let imported = 0;
      let skipped = 0;

      // Import each product
      for (const sqProduct of products) {
        try {
          // Check if product already exists
          const existingProducts = await storage.getProducts(projectId, config.vf_api_key);
          const exists = existingProducts.some(p => 
            p.name === sqProduct.name && 
            p.product_url?.includes(sqProduct.url || '')
          );

          if (exists) {
            skipped++;
            continue;
          }

          // Map Squarespace product to Product schema
          const imageUrl = sqProduct.thumbnailImage?.url || sqProduct.images?.[0]?.url || '';
          const description = sqProduct.description || sqProduct.excerpt || '';
          
          // Combine tags and categories into tags string
          const tags = [
            ...(sqProduct.tags || []),
            ...(sqProduct.categories || []).map((c: any) => c.name),
          ].filter(Boolean).join(', ');

          const productUrl = sqProduct.url 
            ? (sqProduct.url.startsWith('http') 
                ? sqProduct.url 
                : `${credentials.siteUrl}${sqProduct.url}`)
            : '';

          const productName = sqProduct.name;
          const productDescription = description.substring(0, 5000);
          const productTags = tags.substring(0, 500);

          // Generate embedding for RAG search
          const combinedText = `Name: ${productName}; Description: ${productDescription}; Tags: ${productTags || ''}`;
          console.log(`[Squarespace Import] Generating embedding for product: ${productName}`);
          const embedding = await getEmbedding(combinedText);
          console.log(`[Squarespace Import] Embedding generated for product: ${productName}`);

          const insertProduct = {
            projectId,
            vf_api_key: config.vf_api_key,
            name: productName,
            description: productDescription,
            image_url: imageUrl,
            product_url: productUrl,
            tags: productTags,
            embedding,
          };

          await storage.createProduct(insertProduct);
          imported++;
        } catch (error: any) {
          console.error(`[Squarespace Import] Error importing product ${sqProduct.name}:`, error);
          skipped++;
        }
      }

      console.log(`[Squarespace Import] Import complete: ${imported} imported, ${skipped} skipped`);

      res.json({
        message: `Successfully imported ${imported} products from Squarespace`,
        imported,
        skipped,
        total: products.length,
      });
    } catch (error: any) {
      console.error("[Squarespace Import] Error:", error);
      res.status(500).json({ error: error.message || "Failed to import products from Squarespace" });
    }
  });

  // Wix Integration Routes
  app.post("/api/wix/connect", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const { siteId, accessToken } = req.body;

      if (!siteId) {
        return res.status(400).json({ error: 'Site ID is required' });
      }

      if (!accessToken) {
        return res.status(400).json({ error: 'Access token is required' });
      }

      await storage.createOrUpdateWixCredentials({
        projectId,
        siteId: siteId.trim(),
        accessToken: accessToken.trim(),
      });

      res.json({ message: 'Wix site connected successfully' });
    } catch (error: any) {
      console.error("[Wix Connect] Error:", error);
      res.status(500).json({ error: error.message || "Failed to connect Wix site" });
    }
  });

  app.get("/api/wix/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const credentials = await storage.getWixCredentials(projectId);
      
      if (!credentials) {
        return res.json(null);
      }

      // Don't send the full access token for security
      res.json({
        siteId: credentials.siteId,
        connected: true,
      });
    } catch (error: any) {
      console.error("[Wix Credentials] Error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve Wix credentials" });
    }
  });

  app.delete("/api/wix/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const deleted = await storage.deleteWixCredentials(projectId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Wix credentials not found' });
      }

      res.json({ message: 'Wix credentials deleted successfully' });
    } catch (error: any) {
      console.error("[Wix Delete] Error:", error);
      res.status(500).json({ error: error.message || "Failed to delete Wix credentials" });
    }
  });

  app.post("/api/wix/import", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const apiKey = await getApiKey(req);
      if (!apiKey) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }
      const config = await storage.getProjectConfig(projectId);

      console.log("[Wix Import] Starting product import for projectId:", projectId);
      
      // Verify credentials exist
      const credentials = await storage.getWixCredentials(projectId);
      if (!credentials) {
        return res.status(400).json({ error: 'Wix credentials not found. Please connect your Wix site first.' });
      }
      console.log("[Wix Import] Credentials found:", {
        siteId: credentials.siteId,
        hasAccessToken: !!credentials.accessToken,
        accessTokenLength: credentials.accessToken?.length || 0,
      });
      
      // Fetch products from Wix
      const { getAllWixProducts } = await import('./wix-api');
      const products = await getAllWixProducts(projectId);
      
      console.log(`[Wix Import] API returned ${products?.length || 0} products`);
      
      if (!products || products.length === 0) {
        console.log(`[Wix Import] No products found - this could mean:`);
        console.log(`  - The store has no products`);
        console.log(`  - The API response structure is different than expected`);
        console.log(`  - The access token doesn't have proper permissions`);
        return res.json({ 
          message: "No products found in Wix store. Check server logs for details.",
          imported: 0,
          skipped: 0 
        });
      }

      console.log(`[Wix Import] Found ${products.length} products in Wix`);

      let imported = 0;
      let skipped = 0;

      // Import each product
      for (const wixProduct of products) {
        try {
          // Check if product already exists
          const existingProducts = await storage.getProducts(projectId, apiKey);
          const exists = existingProducts.some(p => 
            p.name === wixProduct.name && 
            p.product_url?.includes(wixProduct.slug || '')
          );

          if (exists) {
            skipped++;
            continue;
          }

          // Map Wix product to Product schema
          const imageUrl = wixProduct.media?.mainMedia?.image?.url || wixProduct.media?.items?.[0]?.image?.url || '';
          const description = wixProduct.description || wixProduct.descriptionHtml || '';
          
          // Combine tags and collections into tags string
          const tags = [
            ...(wixProduct.collections || []).map((c: any) => c.name || c.slug),
            ...(wixProduct.tags || []),
          ].filter(Boolean).join(', ');

          const productUrl = wixProduct.slug 
            ? `https://${credentials.siteId}.wixsite.com/${wixProduct.slug}`
            : '';

          const productName = wixProduct.name;
          const productDescription = description.substring(0, 5000);
          const productTags = tags.substring(0, 500);

          // Generate embedding for RAG search
          const combinedText = `Name: ${productName}; Description: ${productDescription}; Tags: ${productTags || ''}`;
          console.log(`[Wix Import] Generating embedding for product: ${productName}`);
          const embedding = await getEmbedding(combinedText);
          console.log(`[Wix Import] Embedding generated for product: ${productName}`);

          const insertProduct = {
            projectId,
            vf_api_key: apiKey,
            name: productName,
            description: productDescription,
            image_url: imageUrl,
            product_url: productUrl,
            tags: productTags,
            embedding,
          };

          await storage.createProduct(insertProduct);
          imported++;
        } catch (error: any) {
          console.error(`[Wix Import] Error importing product ${wixProduct.name}:`, error);
          skipped++;
        }
      }

      console.log(`[Wix Import] Import complete: ${imported} imported, ${skipped} skipped`);

      res.json({
        message: `Successfully imported ${imported} products from Wix`,
        imported,
        skipped,
        total: products.length,
      });
    } catch (error: any) {
      console.error("[Wix Import] Error:", error);
      res.status(500).json({ error: error.message || "Failed to import products from Wix" });
    }
  });

  // Webflow Integration Routes
  app.post("/api/webflow/connect", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const { siteId, accessToken } = req.body;

      if (!siteId) {
        return res.status(400).json({ error: 'Site ID is required' });
      }

      if (!accessToken) {
        return res.status(400).json({ error: 'Access token is required' });
      }

      await storage.createOrUpdateWebflowCredentials({
        projectId,
        siteId: siteId.trim(),
        accessToken: accessToken.trim(),
      });

      res.json({ message: 'Webflow site connected successfully' });
    } catch (error: any) {
      console.error("[Webflow Connect] Error:", error);
      res.status(500).json({ error: error.message || "Failed to connect Webflow site" });
    }
  });

  app.get("/api/webflow/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const credentials = await storage.getWebflowCredentials(projectId);
      
      if (!credentials) {
        return res.json(null);
      }

      // Don't send the full access token for security
      res.json({
        siteId: credentials.siteId,
        connected: true,
      });
    } catch (error: any) {
      console.error("[Webflow Credentials] Error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve Webflow credentials" });
    }
  });

  app.delete("/api/webflow/credentials", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const deleted = await storage.deleteWebflowCredentials(projectId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Webflow credentials not found' });
      }

      res.json({ message: 'Webflow credentials deleted successfully' });
    } catch (error: any) {
      console.error("[Webflow Delete] Error:", error);
      res.status(500).json({ error: error.message || "Failed to delete Webflow credentials" });
    }
  });

  app.post("/api/webflow/import", requireAuth, async (req, res) => {
    try {
      const projectId = req.session.projectId!;
      const apiKey = await getApiKey(req);
      if (!apiKey) {
        return res.status(400).json({ error: 'Voiceflow API key not configured' });
      }
      const config = await storage.getProjectConfig(projectId);

      console.log("[Webflow Import] Starting product import for projectId:", projectId);
      
      // Verify credentials exist
      const credentials = await storage.getWebflowCredentials(projectId);
      if (!credentials) {
        return res.status(400).json({ error: 'Webflow credentials not found. Please connect your Webflow site first.' });
      }
      console.log("[Webflow Import] Credentials found:", {
        siteId: credentials.siteId,
        hasAccessToken: !!credentials.accessToken,
        accessTokenLength: credentials.accessToken?.length || 0,
      });
      
      // Fetch products from Webflow
      const { getAllWebflowProducts } = await import('./webflow-api');
      const products = await getAllWebflowProducts(projectId);
      
      console.log(`[Webflow Import] API returned ${products?.length || 0} products`);
      console.log(`[Webflow Import] Products array type:`, Array.isArray(products) ? 'array' : typeof products);
      if (products && products.length > 0) {
        console.log(`[Webflow Import] First product structure:`, JSON.stringify(products[0], null, 2).substring(0, 500));
      }
      
      if (!products || products.length === 0) {
        console.log(`[Webflow Import] No products found - this could mean:`);
        console.log(`  - The site has no products in Ecommerce`);
        console.log(`  - The API response structure is different than expected`);
        console.log(`  - The access token doesn't have proper permissions (needs ecommerce:read scope)`);
        console.log(`  - Products exist but are drafts (only published products are returned)`);
        return res.json({ 
          message: "No products found in Webflow site. Check server logs for details. Make sure you have products in Ecommerce and they are published.",
          imported: 0,
          skipped: 0 
        });
      }

      console.log(`[Webflow Import] Found ${products.length} products in Webflow`);

      let imported = 0;
      let skipped = 0;

      // Import each product
      for (const webflowProduct of products) {
        try {
          // Check if product already exists
          const existingProducts = await storage.getProducts(projectId, apiKey);
          const exists = existingProducts.some(p => 
            p.name === (webflowProduct.fieldData?.name || webflowProduct.name) && 
            p.product_url?.includes(webflowProduct.fieldData?.slug || webflowProduct.slug || '')
          );

          if (exists) {
            skipped++;
            continue;
          }

          // Map Webflow product to Product schema
          // Webflow Ecommerce products have fieldData with product fields
          const fieldData = webflowProduct.fieldData || {};
          const name = fieldData['name'] || 'Untitled Product';
          const slug = fieldData['slug'] || '';
          const description = fieldData['description'] || '';
          
          // Get main image from fieldData (could be 'main-image' or similar)
          // Webflow products may have images in fieldData or in SKUs
          let imageUrl = '';
          if (fieldData['main-image']) {
            imageUrl = typeof fieldData['main-image'] === 'string' 
              ? fieldData['main-image'] 
              : fieldData['main-image']?.url || '';
          }
          
          // If no main image, try to get from first SKU
          if (!imageUrl && webflowProduct.skus && webflowProduct.skus.length > 0) {
            const firstSku = webflowProduct.skus[0];
            if (firstSku.fieldData && firstSku.fieldData['main-image']) {
              imageUrl = typeof firstSku.fieldData['main-image'] === 'string'
                ? firstSku.fieldData['main-image']
                : firstSku.fieldData['main-image']?.url || '';
            }
          }
          
          // Get tags/categories from fieldData
          const tags = [
            fieldData['tax-category'],
            fieldData['ec-product-type'],
          ].filter(Boolean).join(', ');

          const productUrl = slug 
            ? `https://${credentials.siteId}.webflow.io/${slug}`
            : '';

          const productName = name;
          const productDescription = description.substring(0, 5000);
          const productTags = tags.substring(0, 500);

          // Generate embedding for RAG search
          const combinedText = `Name: ${productName}; Description: ${productDescription}; Tags: ${productTags || ''}`;
          console.log(`[Webflow Import] Generating embedding for product: ${productName}`);
          const embedding = await getEmbedding(combinedText);
          console.log(`[Webflow Import] Embedding generated for product: ${productName}`);

          const insertProduct = {
            projectId,
            vf_api_key: apiKey,
            name: productName,
            description: productDescription,
            image_url: imageUrl,
            product_url: productUrl,
            tags: productTags,
            embedding,
          };

          await storage.createProduct(insertProduct);
          imported++;
        } catch (error: any) {
          console.error(`[Webflow Import] Error importing product ${webflowProduct.fieldData?.name || webflowProduct.name}:`, error);
          skipped++;
        }
      }

      console.log(`[Webflow Import] Import complete: ${imported} imported, ${skipped} skipped`);

      res.json({
        message: `Successfully imported ${imported} products from Webflow`,
        imported,
        skipped,
        total: products.length,
      });
    } catch (error: any) {
      console.error("[Webflow Import] Error:", error);
      res.status(500).json({ error: error.message || "Failed to import products from Webflow" });
    }
  });

  // Log all registered routes for debugging
  console.log("[Routes] Registered routes:");
  const routes: string[] = [];
  app._router?.stack?.forEach((middleware: any) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
      routes.push(`${methods} ${middleware.route.path}`);
    }
  });
  const shopifyRoutes = routes.filter(r => r.includes('shopify'));
  const wixRoutes = routes.filter(r => r.includes('wix'));
  const webflowRoutes = routes.filter(r => r.includes('webflow'));
  console.log("[Routes] Shopify routes:", shopifyRoutes);
  console.log("[Routes] Wix routes:", wixRoutes);
  console.log("[Routes] Webflow routes:", webflowRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
