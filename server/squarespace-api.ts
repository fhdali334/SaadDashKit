/**
 * Squarespace Commerce API Integration
 * 
 * This module handles product fetching from Squarespace stores
 * Uses Squarespace Commerce API v1.0
 */

import { storage } from './storage';
import type { SquarespaceCredentials } from '@shared/schema';
import nodeFetch from 'node-fetch';

// Squarespace API Configuration
const SQUARESPACE_API_VERSION = '1.0';
const SQUARESPACE_API_BASE = 'https://api.squarespace.com';

/**
 * Get Squarespace API base URL
 */
function getSquarespaceApiUrl(): string {
  return `${SQUARESPACE_API_BASE}/${SQUARESPACE_API_VERSION}/commerce`;
}

/**
 * Fetch products from Squarespace Commerce API
 */
export async function getSquarespaceProducts(siteUrl: string, apiKey: string, cursor?: string) {
  const apiUrl = getSquarespaceApiUrl();
  // Try /commerce/products endpoint first (standard endpoint)
  let productsUrl = `${apiUrl}/products`;
  
  // Add cursor for pagination if provided
  if (cursor) {
    productsUrl += `?cursor=${encodeURIComponent(cursor)}`;
  }
  
  console.log(`[Squarespace API] Fetching products from: ${productsUrl}`);
  console.log(`[Squarespace API] Site URL: ${siteUrl}`);
  console.log(`[Squarespace API] API key present: ${!!apiKey}, length: ${apiKey?.length || 0}`);
  console.log(`[Squarespace API] Headers:`, {
    'Authorization': `Bearer ${apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING'}`,
    'User-Agent': 'SaaSDashKit/1.0',
    'Accept': 'application/json',
  });

  // Squarespace API request format (per documentation):
  // GET https://api.squarespace.com/1.0/commerce/products
  // Headers:
  //   Authorization: Bearer {api_key}
  //   User-Agent: {app_description}
  //   Accept: application/json
  const response = await nodeFetch(productsUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'SaaSDashKit/1.0',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Squarespace API] Error ${response.status} from ${productsUrl}:`, errorText);
    throw new Error(`Squarespace API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Log the full response structure for debugging
  console.log(`[Squarespace API] Response structure:`, JSON.stringify(data, null, 2).substring(0, 500));
  console.log(`[Squarespace API] Response keys:`, Object.keys(data || {}));

  // Squarespace API might return products in different structures:
  // - data.result (for store-pages endpoint)
  // - data.products (for products endpoint)
  // - data (direct array)
  const products = data.result || data.products || data.data || (Array.isArray(data) ? data : []);
  const pagination = data.pagination || {};

  console.log(`[Squarespace API] Found ${products.length} products in response`);
  if (products.length > 0) {
    console.log(`[Squarespace API] First product sample:`, JSON.stringify(products[0], null, 2).substring(0, 300));
  }

  return {
    products: Array.isArray(products) ? products : [],
    pagination: {
      cursor: pagination.nextPageCursor, // Use nextPageCursor as shown in API docs
      hasNextPage: pagination.hasNextPage || false,
    },
  };
}

/**
 * Fetch all products from Squarespace (handles pagination)
 */
export async function getAllSquarespaceProducts(projectId: string) {
  const credentials = await storage.getSquarespaceCredentials(projectId);
  
  if (!credentials) {
    throw new Error('Squarespace credentials not found. Please connect your Squarespace site.');
  }

  if (!credentials.apiKey) {
    throw new Error('Squarespace API key not found. Please configure your API key.');
  }

  let allProducts: any[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;
  let pageCount = 0;

  while (hasMore) {
    const result = await getSquarespaceProducts(credentials.siteUrl, credentials.apiKey, cursor);
    allProducts = allProducts.concat(result.products);
    
    hasMore = result.pagination.hasNextPage || false;
    cursor = result.pagination.cursor; // This is now nextPageCursor from the API response
    pageCount++;

    // Safety limit to prevent infinite loops
    if (pageCount > 100) {
      console.warn('[Squarespace API] Reached pagination limit (100 pages)');
      break;
    }
  }

  return allProducts;
}

