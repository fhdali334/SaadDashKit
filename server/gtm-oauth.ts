/**
 * Google Tag Manager OAuth 2.0 Integration
 * 
 * This module handles OAuth 2.0 authentication with Google Tag Manager API
 */

import { OAuth2Client } from 'google-auth-library';
import { google, tagmanager_v2 } from 'googleapis';
import { storage } from './storage';
import type { GtmCredentials, InsertGtmCredentials } from '@shared/schema';

// GTM API Scopes - we need read-only access to GTM data
const GTM_SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
];

// Initialize OAuth2 client
function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // Auto-detect redirect URI based on environment
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      // For production, use the Render URL or custom domain
      const renderUrl = process.env.RENDER_EXTERNAL_URL || 'https://saasdashkit-v1.onrender.com';
      redirectUri = `${renderUrl}/api/gtm/oauth/callback`;
    } else {
      // For development
      redirectUri = 'http://localhost:3000/api/gtm/oauth/callback';
    }
  }

  console.log('[GTM OAuth] OAuth2 Client Config:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    redirectUri,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!clientId || !clientSecret) {
    const error = 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables';
    console.error('[GTM OAuth]', error);
    throw new Error(error);
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    scope: GTM_SCOPES,
    state, // Include projectId in state for security
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token) {
    throw new Error('Failed to get access token');
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
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
  
  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  return {
    accessToken: credentials.access_token,
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  };
}

/**
 * Get authenticated GTM API client with automatic token refresh
 * Supports both OAuth and Service Account authentication
 */
export async function getGtmApiClient(projectId: string) {
  const credentials = await storage.getGtmCredentials(projectId);
  
  if (!credentials) {
    throw new Error('GTM credentials not found. Please connect your GTM account.');
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
      scopes: GTM_SCOPES,
    });

    console.log(`[GTM Service Account] Authenticated with: ${serviceAccountCreds.client_email}`);

    return google.tagmanager({
      version: 'v2',
      auth: jwtClient,
    });
  }

  // Otherwise, use OAuth flow
  if (!credentials.accessToken) {
    throw new Error('GTM credentials incomplete. Please reconnect your GTM account.');
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  let accessToken = credentials.accessToken;
  let expiresAt = credentials.expiresAt;
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  // Refresh if expired or expiring soon
  if (expiresAt && new Date(expiresAt) < fiveMinutesFromNow) {
    if (!credentials.refreshToken) {
      throw new Error('Access token expired and no refresh token available. Please reconnect your GTM account.');
    }
    
    try {
      // Refresh the token
      const refreshed = await refreshAccessToken(credentials.refreshToken);
      accessToken = refreshed.accessToken;
      expiresAt = refreshed.expiresAt;
      
      // Update stored credentials
      await storage.createOrUpdateGtmCredentials({
        ...credentials,
        accessToken,
        expiresAt,
      });
      
      console.log(`[GTM OAuth] Token refreshed for project ${projectId}`);
    } catch (error: any) {
      console.error(`[GTM OAuth] Token refresh failed for project ${projectId}:`, error);
      // If refresh fails, try using existing token (might still be valid)
      // If it fails on API call, user will need to reconnect
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
      // Update refresh token if provided
      storage.createOrUpdateGtmCredentials({
        ...credentials,
        accessToken: tokens.access_token || accessToken,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : expiresAt,
      }).catch(err => {
        console.error('[GTM OAuth] Failed to update tokens:', err);
      });
    }
  });

  return google.tagmanager({
    version: 'v2',
    auth: oauth2Client,
  });
}

/**
 * Wrapper function to handle API calls with automatic token refresh on 401 errors
 */
export async function callGtmApi<T>(
  projectId: string,
  apiCall: (client: ReturnType<typeof google.tagmanager>) => Promise<T>
): Promise<T> {
  try {
    const client = await getGtmApiClient(projectId);
    return await apiCall(client);
  } catch (error: any) {
    // If we get a 401, try refreshing token once more
    if (error.code === 401 || error.response?.status === 401) {
      console.log('[GTM OAuth] Got 401, attempting token refresh...');
      
      const credentials = await storage.getGtmCredentials(projectId);
      if (credentials?.refreshToken) {
        try {
          const refreshed = await refreshAccessToken(credentials.refreshToken);
          await storage.createOrUpdateGtmCredentials({
            ...credentials,
            accessToken: refreshed.accessToken,
            expiresAt: refreshed.expiresAt,
          });
          
          // Retry the API call
          const client = await getGtmApiClient(projectId);
          return await apiCall(client);
        } catch (refreshError: any) {
          console.error('[GTM OAuth] Token refresh failed:', refreshError);
          throw new Error('Authentication failed. Please reconnect your GTM account.');
        }
      }
    }
    
    throw error;
  }
}

/**
 * Get GTM accounts for authenticated user (with automatic token refresh)
 */
export async function getGtmAccounts(projectId: string) {
  return callGtmApi(projectId, async (tagmanager) => {
    const response = await tagmanager.accounts.list();
    return response.data.account || [];
  });
}

/**
 * Get GTM containers for an account (with automatic token refresh)
 */
export async function getGtmContainers(projectId: string, accountId: string) {
  return callGtmApi(projectId, async (tagmanager) => {
    const response = await tagmanager.accounts.containers.list({
      parent: `accounts/${accountId}`,
    });
    return response.data.container || [];
  });
}

/**
 * Fetch real GTM data and sync to database
 * Note: GTM doesn't provide analytics data directly. For page views, sessions, etc.,
 * you would need Google Analytics integration. This function fetches GTM-specific data.
 */
export async function syncGtmData(projectId: string) {
  const credentials = await storage.getGtmCredentials(projectId);
  
  if (!credentials) {
    throw new Error('GTM credentials not found. Please connect your GTM account.');
  }

  // Use callGtmApi wrapper for automatic token refresh
  const containerData = await callGtmApi(projectId, async (tagmanager) => {
    return await tagmanager.accounts.containers.get({
      path: `accounts/${credentials.accountId}/containers/${credentials.containerId}`,
    });
  });
  
  const tagsData = await callGtmApi(projectId, async (tagmanager) => {
    return await tagmanager.accounts.containers.tags.list({
      parent: `accounts/${credentials.accountId}/containers/${credentials.containerId}`,
    });
  });
  
  const triggersData = await callGtmApi(projectId, async (tagmanager) => {
    return await tagmanager.accounts.containers.triggers.list({
      parent: `accounts/${credentials.accountId}/containers/${credentials.containerId}`,
    });
  });
  
  const variablesData = await callGtmApi(projectId, async (tagmanager) => {
    return await tagmanager.accounts.containers.variables.list({
      parent: `accounts/${credentials.accountId}/containers/${credentials.containerId}`,
    });
  });
  
  const tags = tagsData.data.tag || [];
  const triggers = triggersData.data.trigger || [];
  const variables = variablesData.data.variable || [];
  
  // For now, we'll still use mock data for analytics metrics since GTM doesn't provide them
  // In a real implementation, you would integrate with Google Analytics API
  // to get actual page views, sessions, etc.
  
  return {
    container: containerData.data,
    tags: tags.length,
    triggers: triggers.length,
    variables: variables.length,
    message: 'GTM data synced. Note: Analytics metrics require Google Analytics integration.',
  };
}

