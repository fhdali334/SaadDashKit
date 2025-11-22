/**
 * Google Analytics (GA4) OAuth 2.0 Integration
 * 
 * This module handles OAuth 2.0 authentication with Google Analytics Data API (GA4)
 */

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { storage } from './storage';
import type { Ga4Credentials, InsertGa4Credentials } from '@shared/schema';

// GA4 API Scopes - we need read-only access to Analytics data
const GA4_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
];

// Initialize OAuth2 client (reuse same credentials as GTM)
function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // Auto-detect redirect URI based on environment
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      const renderUrl = process.env.RENDER_EXTERNAL_URL || 'https://saasdashkit-v1.onrender.com';
      redirectUri = `${renderUrl}/api/ga4/oauth/callback`;
    } else {
      redirectUri = 'http://localhost:3000/api/ga4/oauth/callback';
    }
  }

  if (!clientId || !clientSecret) {
    const error = 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables';
    console.error('[GA4 OAuth]', error);
    throw new Error(error);
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

/**
 * Generate OAuth authorization URL for GA4
 */
export function getAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GA4_SCOPES,
    state,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || '',
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date | null;
}> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  return {
    accessToken: credentials.access_token!,
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  };
}

/**
 * Get authenticated GA4 API client with automatic token refresh
 * Supports both OAuth and Service Account authentication
 */
export async function getGa4ApiClient(projectId: string) {
  const credentials = await storage.getGa4Credentials(projectId);
  
  if (!credentials) {
    throw new Error('GA4 credentials not found. Please connect your Google Analytics account.');
  }

  // If using service account, use service account authentication
  if (credentials.authType === 'service_account' && credentials.serviceAccountKey) {
    const { JWT } = await import('google-auth-library');
    let serviceAccountCreds;
    try {
      serviceAccountCreds = typeof credentials.serviceAccountKey === 'string' 
        ? JSON.parse(credentials.serviceAccountKey) 
        : credentials.serviceAccountKey;
    } catch (error) {
      throw new Error('Invalid service account key format');
    }

    const jwtClient = new JWT({
      email: serviceAccountCreds.client_email,
      key: serviceAccountCreds.private_key,
      scopes: GA4_SCOPES,
    });

    console.log(`[GA4 Service Account] Authenticated with: ${serviceAccountCreds.client_email}`);

    return google.analyticsdata({
      version: 'v1beta',
      auth: jwtClient,
    });
  }

  // Otherwise, use OAuth flow
  if (!credentials.accessToken) {
    throw new Error('GA4 credentials incomplete. Please reconnect your Google Analytics account.');
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  let accessToken = credentials.accessToken;
  let expiresAt = credentials.expiresAt;
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  // Refresh if expired or expiring soon
  if (expiresAt && new Date(expiresAt) < fiveMinutesFromNow) {
    if (!credentials.refreshToken) {
      throw new Error('Access token expired and no refresh token available. Please reconnect your Google Analytics account.');
    }
    
    try {
      // Refresh the token
      const refreshed = await refreshAccessToken(credentials.refreshToken);
      accessToken = refreshed.accessToken;
      expiresAt = refreshed.expiresAt;
      
      // Update stored credentials
      await storage.createOrUpdateGa4Credentials({
        ...credentials,
        accessToken,
        expiresAt,
      });
      
      console.log(`[GA4 OAuth] Token refreshed for project ${projectId}`);
    } catch (error: any) {
      console.error(`[GA4 OAuth] Token refresh failed for project ${projectId}:`, error);
    }
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: credentials.refreshToken,
  });

  // Set up automatic token refresh on 401 errors
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      storage.createOrUpdateGa4Credentials({
        ...credentials,
        accessToken: tokens.access_token || accessToken,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : expiresAt,
      }).catch(err => {
        console.error('[GA4 OAuth] Failed to update tokens:', err);
      });
    }
  });

  return google.analyticsdata({
    version: 'v1beta',
    auth: oauth2Client,
  });
}

/**
 * Fetch GA4 properties for the authenticated user
 */
export async function getGa4Properties(projectId: string) {
  const analytics = await getGa4ApiClient(projectId);
  
  // List all GA4 properties accessible by the user
  const response = await analytics.properties.list();
  return response.data.properties || [];
}

/**
 * Fetch analytics data from GA4
 */
export async function fetchGa4AnalyticsData(
  projectId: string,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  const analytics = await getGa4ApiClient(projectId);
  
  // Run report for page views, sessions, users
  const response = await analytics.properties.runReport({
    property: propertyId,
    dateRanges: [
      { startDate, endDate }
    ],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'eventCount' },
    ],
  });

  return response.data;
}

