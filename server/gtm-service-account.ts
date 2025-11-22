/**
 * Google Tag Manager Service Account Integration
 * 
 * Alternative to OAuth - uses service account JSON key for authentication
 * No user consent screen needed, works automatically
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// GTM API Scopes
const GTM_SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
];

/**
 * Get service account credentials from environment variable
 */
function getServiceAccountCredentials(): any {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

  if (keyJson) {
    try {
      return typeof keyJson === 'string' ? JSON.parse(keyJson) : keyJson;
    } catch (error) {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON format');
    }
  }

  if (keyPath) {
    // If using file path, require fs (Node.js built-in)
    const fs = require('fs');
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Service account key file not found: ${keyPath}`);
    }
    return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }

  throw new Error(
    'GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_PATH must be set'
  );
}

/**
 * Get authenticated GTM API client using service account
 * No token refresh needed - service accounts don't expire
 */
export function getGtmApiClient() {
  try {
    const credentials = getServiceAccountCredentials();

    // Create JWT client for service account
    const jwtClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: GTM_SCOPES,
    });

    console.log('[GTM Service Account] Authenticated with:', credentials.client_email);

    return google.tagmanager({
      version: 'v2',
      auth: jwtClient,
    });
  } catch (error: any) {
    console.error('[GTM Service Account] Error:', error.message);
    throw new Error(`Service account authentication failed: ${error.message}`);
  }
}

/**
 * Get GTM accounts using service account
 */
export async function getGtmAccounts() {
  const tagmanager = getGtmApiClient();
  const response = await tagmanager.accounts.list();
  return response.data.account || [];
}

/**
 * Get GTM containers for an account
 */
export async function getGtmContainers(accountId: string) {
  const tagmanager = getGtmApiClient();
  const response = await tagmanager.accounts.containers.list({
    parent: `accounts/${accountId}`,
  });
  return response.data.container || [];
}

/**
 * Get container details
 */
export async function getContainer(accountId: string, containerId: string) {
  const tagmanager = getGtmApiClient();
  const response = await tagmanager.accounts.containers.get({
    path: `accounts/${accountId}/containers/${containerId}`,
  });
  return response.data;
}

/**
 * Get tags for a container
 */
export async function getTags(accountId: string, containerId: string) {
  const tagmanager = getGtmApiClient();
  const response = await tagmanager.accounts.containers.tags.list({
    parent: `accounts/${accountId}/containers/${containerId}`,
  });
  return response.data.tag || [];
}

/**
 * Get triggers for a container
 */
export async function getTriggers(accountId: string, containerId: string) {
  const tagmanager = getGtmApiClient();
  const response = await tagmanager.accounts.containers.triggers.list({
    parent: `accounts/${accountId}/containers/${containerId}`,
  });
  return response.data.trigger || [];
}

/**
 * Get variables for a container
 */
export async function getVariables(accountId: string, containerId: string) {
  const tagmanager = getGtmApiClient();
  const response = await tagmanager.accounts.containers.variables.list({
    parent: `accounts/${accountId}/containers/${containerId}`,
  });
  return response.data.variable || [];
}

/**
 * Sync GTM data (similar to OAuth version but using service account)
 */
export async function syncGtmData(accountId: string, containerId: string) {
  const container = await getContainer(accountId, containerId);
  const tags = await getTags(accountId, containerId);
  const triggers = await getTriggers(accountId, containerId);
  const variables = await getVariables(accountId, containerId);

  return {
    container,
    tags: tags.length,
    triggers: triggers.length,
    variables: variables.length,
    message: 'GTM data synced via service account',
  };
}

