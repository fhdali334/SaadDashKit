import "dotenv/config"; // Load environment variables from .env file (local dev only)
import express, { type Request, Response, NextFunction } from "express";

// Log environment variables status on startup (for debugging)
console.log("[Server Startup] Environment variables check:", {
  nodeEnv: process.env.NODE_ENV,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  hasSessionSecret: !!process.env.SESSION_SECRET,
  hasOpenaiKey: !!process.env.OPENAI_API_KEY,
  hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
  port: process.env.PORT,
});
import session from "express-session";
import createMemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Trust proxy - CRITICAL for Render and other reverse proxy setups
// This tells Express to trust the X-Forwarded-* headers from the proxy
app.set("trust proxy", 1);
console.log("[App Config] Trust proxy enabled for reverse proxy support");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
console.log("[Session Config] Initializing session middleware...");
console.log("[Session Config] NODE_ENV:", process.env.NODE_ENV);
console.log("[Session Config] SESSION_SECRET present:", !!process.env.SESSION_SECRET);
console.log("[Session Config] SESSION_SECRET length:", process.env.SESSION_SECRET?.length || 0);
console.log("[Session Config] PORT:", process.env.PORT);

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  console.error("[Session Config] ERROR: SESSION_SECRET missing in production!");
  throw new Error("SESSION_SECRET environment variable is required in production");
}

const sessionSecret = process.env.SESSION_SECRET || "dev-only-secret-change-in-production";
const isProduction = process.env.NODE_ENV === "production";
// In production (Render), always use secure cookies since we're behind HTTPS proxy
// The trust proxy setting ensures Express knows we're on HTTPS
const cookieSecure = isProduction;
// Use "none" for production to allow cookies across different subdomains/proxies if needed
// But "lax" should work fine for same-site requests
const cookieSameSite = isProduction ? "lax" : "lax";

console.log("[Session Config] Using session secret:", sessionSecret.substring(0, 10) + "...");
console.log("[Session Config] Cookie secure flag:", cookieSecure);
console.log("[Session Config] Cookie sameSite:", cookieSameSite);
console.log("[Session Config] Is production:", isProduction);
console.log("[Session Config] Trust proxy:", app.get("trust proxy"));

const MemoryStore = createMemoryStore(session);
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: "connect.sid", // Explicit cookie name
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      // In production, use secure cookies (HTTPS only)
      // In development, allow HTTP (secure: false)
      secure: cookieSecure,
      httpOnly: true,
      sameSite: cookieSameSite as "lax" | "strict" | "none",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/", // Available on all paths
      // Don't set domain - let browser use default (current domain)
    },
  })
);

console.log("[Session Config] Session middleware configured successfully");

// Cookie and session debugging middleware (only for auth-related routes)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth")) {
    console.log("[Request Debug]", req.method, req.path, {
      hasCookieHeader: !!req.headers.cookie,
      cookieHeader: req.headers.cookie?.substring(0, 150),
      sessionID: req.sessionID,
      hasSession: !!req.session,
      origin: req.headers.origin,
    });
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
    
    // Log cookie response headers for auth routes
    if (path.startsWith("/api/auth")) {
      const setCookieHeader = res.getHeader("set-cookie");
      const allHeaders = res.getHeaders();
      console.log("[Response Debug]", req.method, req.path, {
        statusCode: res.statusCode,
        hasSetCookie: !!setCookieHeader,
        setCookieHeader: setCookieHeader ? (Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]) : null,
        setCookieHeaderString: setCookieHeader ? (Array.isArray(setCookieHeader) ? setCookieHeader.join("; ") : String(setCookieHeader)) : "none",
        allSetCookieHeaders: allHeaders["set-cookie"],
        responseHeaders: Object.keys(allHeaders),
      });
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  console.log(`Attempting to start server on port ${port}...`);
  server.listen(port, (err) => {
    if (err) {
      console.error(`Failed to start server:`, err);
      process.exit(1);
    }
    log(`serving on port ${port}`);
  });
})();
