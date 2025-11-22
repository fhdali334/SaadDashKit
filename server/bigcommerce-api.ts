/**
 * BigCommerce REST API Integration
 * 
 * This module handles product fetching from BigCommerce stores
 * Uses BigCommerce V3 REST API
 */

import { storage } from './storage';
import type { BigCommerceCredentials } from '@shared/schema';
import nodeFetch from 'node-fetch';

// BigCommerce API Configuration
const BIGCOMMERCE_API_VERSION = 'v3';

/**
 * Get BigCommerce API base URL
 */
function getBigCommerceApiUrl(storeHash: string): string {
  // Store hash is the part before .mybigcommerce.com
  // e.g., "abc123" from "abc123.mybigcommerce.com"
  const normalizedHash = storeHash.trim().replace(/\.mybigcommerce\.com$/, '');
  return `https://api.bigcommerce.com/stores/${normalizedHash}/${BIGCOMMERCE_API_VERSION}`;
}

/**
 * Fetch products from BigCommerce REST API
 */
export async function getBigCommerceProducts(storeHash: string, accessToken: string, page = 1, limit = 250) {
  const apiUrl = getBigCommerceApiUrl(storeHash);
  const productsUrl = `${apiUrl}/catalog/products?page=${page}&limit=${limit}`;
  
  console.log(`[BigCommerce API] Fetching products from: ${productsUrl}`);
  console.log(`[BigCommerce API] Store hash: ${storeHash}`);
  console.log(`[BigCommerce API] Access token present: ${!!accessToken}, length: ${accessToken?.length || 0}`);
  console.log(`[BigCommerce API] Headers:`, {
    'Accept': 'application/json',
    'X-Auth-Token': accessToken ? `${accessToken.substring(0, 10)}...` : 'MISSING',
  });

  // BigCommerce API GET request format (per documentation):
  // GET https://api.bigcommerce.com/stores/{store_hash}/v3/catalog/products
  // Headers:
  //   X-Auth-Token: {access_token}
  //   Accept: application/json
  // Note: Content-Type is NOT needed for GET requests
  const response = await nodeFetch(productsUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Auth-Token': accessToken,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[BigCommerce API] Error ${response.status} from ${productsUrl}:`, errorText);
    throw new Error(`BigCommerce API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  // BigCommerce V3 API returns data in a 'data' property
  const products = data.data || [];
  const meta = data.meta || {};
  
  return {
    products: Array.isArray(products) ? products : [],
    pagination: {
      page: meta.pagination?.current_page || page,
      limit: meta.pagination?.per_page || limit,
      totalPages: meta.pagination?.total_pages || 1,
      totalProducts: meta.pagination?.total || products.length,
    },
  };
}

/**
 * Fetch all products from BigCommerce (handles pagination)
 */
export async function getAllBigCommerceProducts(projectId: string) {
  const credentials = await storage.getBigCommerceCredentials(projectId);
  
  if (!credentials) {
    throw new Error('BigCommerce credentials not found. Please connect your BigCommerce store.');
  }

  if (!credentials.accessToken) {
    throw new Error('BigCommerce access token not found. Please configure your API access token.');
  }

  let allProducts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await getBigCommerceProducts(credentials.storeHash, credentials.accessToken, page, 250);
    allProducts = allProducts.concat(result.products);
    
    hasMore = page < result.pagination.totalPages;
    page++;
    
    // Safety limit to prevent infinite loops
    if (page > 100) {
      console.warn('[BigCommerce API] Reached pagination limit (100 pages)');
      break;
    }
  }

  return allProducts;
}

