/**
 * Shopify OAuth 2.0 Integration
 * 
 * This module handles OAuth 2.0 authentication with Shopify Admin API
 */

import { createHmac } from 'crypto';
import { storage } from './storage';
import type { ShopifyCredentials, InsertShopifyCredentials } from '@shared/schema';

// Shopify OAuth Configuration
const SHOPIFY_API_VERSION = '2024-10';
const SHOPIFY_SCOPES = [
  'read_products',
  'read_product_listings',
].join(',');

/**
 * Generate Shopify OAuth authorization URL
 * Uses user-provided API key
 */
export function getAuthUrl(shopDomain: string, apiKey: string, state: string, redirectUri?: string): string {
  const finalRedirectUri = redirectUri || process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3000/api/shopify/oauth/callback';

  if (!apiKey) {
    throw new Error('Shopify API key is required');
  }

  // Normalize shop domain (remove https://, trailing slashes, etc.)
  const normalizedShop = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  
  // Ensure it ends with .myshopify.com or add it
  const shop = normalizedShop.includes('.myshopify.com') 
    ? normalizedShop 
    : `${normalizedShop}.myshopify.com`;

  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${encodeURIComponent(apiKey)}&` +
    `scope=${encodeURIComponent(SHOPIFY_SCOPES)}&` +
    `redirect_uri=${encodeURIComponent(finalRedirectUri)}&` +
    `state=${encodeURIComponent(state)}`;

  return authUrl;
}

/**
 * Exchange authorization code for access token
 * Uses user-provided API credentials
 */
export async function exchangeCodeForTokens(
  shopDomain: string,
  apiKey: string,
  apiSecret: string,
  code: string,
  redirectUri?: string
): Promise<{
  accessToken: string;
  scope: string;
}> {
  const finalRedirectUri = redirectUri || process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3000/api/shopify/oauth/callback';

  if (!apiKey || !apiSecret) {
    throw new Error('Shopify API key and secret are required');
  }

  // Normalize shop domain
  const normalizedShop = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  const shop = normalizedShop.includes('.myshopify.com') 
    ? normalizedShop 
    : `${normalizedShop}.myshopify.com`;

  // Exchange code for access token
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${errorText}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('Failed to get access token from Shopify');
  }

  return {
    accessToken: data.access_token,
    scope: data.scope || SHOPIFY_SCOPES,
  };
}

/**
 * Verify Shopify HMAC signature (for webhook verification)
 */
export function verifyHmac(query: Record<string, string>): boolean {
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiSecret) {
    throw new Error('SHOPIFY_API_SECRET must be set for HMAC verification');
  }

  const hmac = query.hmac;
  if (!hmac) {
    return false;
  }

  // Remove hmac and signature from query for verification
  const { hmac: _, signature: __, ...params } = query;
  
  // Sort and encode parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Calculate HMAC
  const calculatedHmac = createHmac('sha256', apiSecret)
    .update(sortedParams)
    .digest('hex');

  return calculatedHmac === hmac;
}

/**
 * Get authenticated Shopify API client
 */
export async function getShopifyApiClient(projectId: string) {
  const credentials = await storage.getShopifyCredentials(projectId);
  
  if (!credentials) {
    throw new Error('Shopify credentials not found. Please connect your Shopify store.');
  }

  if (!credentials.accessToken) {
    throw new Error('Shopify access token not found. Please complete the OAuth authorization flow.');
  }

  return {
    shopDomain: credentials.shopDomain,
    accessToken: credentials.accessToken,
    apiVersion: SHOPIFY_API_VERSION,
  };
}

/**
 * Make authenticated Shopify API request
 */
export async function callShopifyApi<T>(
  projectId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const client = await getShopifyApiClient(projectId);
  
  const url = `https://${client.shopDomain}/admin/api/${client.apiVersion}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': client.accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch products from Shopify
 */
export async function getShopifyProducts(projectId: string, limit = 250, pageInfo?: string) {
  let endpoint = `/products.json?limit=${limit}`;
  if (pageInfo) {
    endpoint += `&page_info=${encodeURIComponent(pageInfo)}`;
  }

  return callShopifyApi<{
    products: Array<{
      id: number;
      title: string;
      body_html: string;
      vendor: string;
      product_type: string;
      created_at: string;
      handle: string;
      updated_at: string;
      published_at: string;
      template_suffix: string | null;
      status: string;
      published_scope: string;
      tags: string;
      admin_graphql_api_id: string;
      variants: Array<any>;
      options: Array<any>;
      images: Array<{
        id: number;
        product_id: number;
        position: number;
        created_at: string;
        updated_at: string;
        alt: string | null;
        width: number;
        height: number;
        src: string;
        variant_ids: number[];
        admin_graphql_api_id: string;
      }>;
    }>;
  }>(projectId, endpoint);
}

