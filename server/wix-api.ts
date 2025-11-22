/**
 * Wix eCommerce API Integration
 * 
 * This module handles product fetching from Wix stores
 * Uses Wix eCommerce REST API
 */

import { storage } from './storage';
import type { WixCredentials } from '@shared/schema';
import nodeFetch from 'node-fetch';

// Wix API Configuration
const WIX_API_BASE = 'https://www.wixapis.com';
const WIX_API_VERSION = 'v1';

/**
 * Get Wix API base URL
 */
function getWixApiUrl(): string {
  return `${WIX_API_BASE}/stores/${WIX_API_VERSION}`;
}

/**
 * Fetch products from Wix eCommerce API
 */
export async function getWixProducts(siteId: string, accessToken: string, cursor?: string) {
  const apiUrl = getWixApiUrl();
  const productsUrl = `${apiUrl}/products/query`;
  
  // Wix query API format - simpler structure
  const requestBody: Record<string, any> = {
    paging: {
      limit: 250,
    },
  };
  
  // Add cursor if provided for pagination
  if (cursor) {
    requestBody.paging.cursor = cursor;
  }
  
  console.log(`[Wix API] Fetching products from: ${productsUrl}`);
  console.log(`[Wix API] Site ID: ${siteId}`);
  console.log(`[Wix API] Access token present: ${!!accessToken}, length: ${accessToken?.length || 0}`);
  console.log(`[Wix API] Request body:`, JSON.stringify(requestBody, null, 2));
  console.log(`[Wix API] Headers:`, {
    'Authorization': `Bearer ${accessToken ? `${accessToken.substring(0, 10)}...` : 'MISSING'}`,
    'wix-site-id': siteId,
    'Content-Type': 'application/json',
  });

  // Wix API request format (per documentation):
  // POST https://www.wixapis.com/stores/v1/products/query
  // Headers:
  //   Authorization: Bearer {access_token}
  //   wix-site-id: {site_id}
  //   Content-Type: application/json
  const response = await nodeFetch(productsUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'wix-site-id': siteId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Wix API] Error ${response.status} from ${productsUrl}:`, errorText);
    console.error(`[Wix API] Request body that was sent:`, JSON.stringify(requestBody, null, 2));
    try {
      const errorJson = JSON.parse(errorText);
      console.error(`[Wix API] Parsed error:`, JSON.stringify(errorJson, null, 2));
    } catch (e) {
      // Error text is not JSON, that's fine
    }
    throw new Error(`Wix API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Log the full response structure for debugging
  console.log(`[Wix API] Response structure:`, JSON.stringify(data, null, 2).substring(0, 500));
  console.log(`[Wix API] Response keys:`, Object.keys(data || {}));

  // Wix API returns products in data.products array
  const products = data.products || data.items || [];
  const pagination = data.paging || {};

  console.log(`[Wix API] Found ${products.length} products in response`);
  if (products.length > 0) {
    console.log(`[Wix API] First product sample:`, JSON.stringify(products[0], null, 2).substring(0, 300));
  }

  return {
    products: Array.isArray(products) ? products : [],
    pagination: {
      cursor: pagination.nextCursor || data.nextCursor || undefined,
      hasNextPage: !!(pagination.nextCursor || data.nextCursor),
    },
  };
}

export async function getAllWixProducts(projectId: string) {
  const credentials = await storage.getWixCredentials(projectId);
  
  if (!credentials) {
    throw new Error('Wix credentials not found. Please connect your Wix site.');
  }

  if (!credentials.accessToken) {
    throw new Error('Wix access token not found. Please configure your access token.');
  }

  let allProducts: any[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;
  let pageCount = 0;

  while (hasMore) {
    const result = await getWixProducts(credentials.siteId, credentials.accessToken, cursor);
    allProducts = allProducts.concat(result.products);
    
    hasMore = result.pagination.hasNextPage || false;
    cursor = result.pagination.cursor;
    pageCount++;

    // Safety limit to prevent infinite loops
    if (pageCount > 100) {
      console.warn('[Wix API] Reached pagination limit (100 pages)');
      break;
    }
  }

  return allProducts;
}

