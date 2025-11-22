/**
 * Webflow API Integration
 * 
 * This module handles product fetching from Webflow sites
 * Uses Webflow Ecommerce Products API (v2)
 */

import { storage } from './storage';
import type { WebflowCredentials } from '@shared/schema';
import nodeFetch from 'node-fetch';

// Webflow API Configuration
const WEBFLOW_API_BASE = 'https://api.webflow.com';
const WEBFLOW_API_VERSION = 'v2';

/**
 * Get Webflow API base URL
 */
function getWebflowApiUrl(): string {
  return `${WEBFLOW_API_BASE}/${WEBFLOW_API_VERSION}`;
}

/**
 * Get products from Webflow Ecommerce API
 */
export async function getWebflowProducts(
  siteId: string,
  accessToken: string,
  offset = 0,
  limit = 100
) {
  const apiUrl = getWebflowApiUrl();
  const productsUrl = `${apiUrl}/sites/${siteId}/products?offset=${offset}&limit=${limit}`;
  
  console.log(`[Webflow API] Fetching products from: ${productsUrl}`);
  console.log(`[Webflow API] Site ID: ${siteId}`);
  console.log(`[Webflow API] Access token present: ${!!accessToken}, length: ${accessToken?.length || 0}`);

  const response = await nodeFetch(productsUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'accept-version': '1.0.0',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Webflow API] Error ${response.status} from ${productsUrl}:`, errorText);
    console.error(`[Webflow API] Request headers:`, {
      'Authorization': `Bearer ${accessToken ? `${accessToken.substring(0, 10)}...` : 'MISSING'}`,
      'accept-version': '1.0.0',
    });
    throw new Error(`Webflow API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  // Log the full response structure for debugging
  console.log(`[Webflow API] Full response structure:`, JSON.stringify(data, null, 2).substring(0, 1000));
  console.log(`[Webflow API] Response keys:`, Object.keys(data || {}));
  
  // Webflow API might return products in different structures:
  // - data.products (array of products)
  // - data.items (alternative structure)
  // - data (direct array)
  const products = data.products || data.items || (Array.isArray(data) ? data : []);
  const pagination = data.pagination || {};
  
  console.log(`[Webflow API] Found ${products.length} products`);
  if (products.length > 0) {
    console.log(`[Webflow API] First product sample:`, JSON.stringify(products[0], null, 2).substring(0, 500));
  } else {
    console.log(`[Webflow API] No products found. Full response:`, JSON.stringify(data, null, 2));
  }

  return {
    products: Array.isArray(products) ? products : [],
    pagination: {
      offset: pagination.offset !== undefined ? pagination.offset : offset,
      limit: pagination.limit !== undefined ? pagination.limit : limit,
      total: pagination.total !== undefined ? pagination.total : products.length,
      hasMore: pagination.total !== undefined 
        ? (pagination.offset + pagination.limit < pagination.total)
        : (products.length >= limit),
    },
  };
}

/**
 * Get all products from a Webflow site
 * Uses Webflow Ecommerce Products API
 */
export async function getAllWebflowProducts(projectId: string) {
  const credentials = await storage.getWebflowCredentials(projectId);
  
  if (!credentials) {
    throw new Error('Webflow credentials not found. Please connect your Webflow site.');
  }

  if (!credentials.accessToken) {
    throw new Error('Webflow access token not found. Please configure your access token.');
  }

  let allProducts: any[] = [];
  let offset = 0;
  let hasMore = true;
  const limit = 100;
  let pageCount = 0;

  while (hasMore) {
    try {
      const result = await getWebflowProducts(
        credentials.siteId,
        credentials.accessToken,
        offset,
        limit
      );

      allProducts = allProducts.concat(result.products);

      hasMore = result.pagination.hasMore;
      offset = result.pagination.offset + result.pagination.limit;
      pageCount++;

      // Safety limit to prevent infinite loops
      if (pageCount > 100) {
        console.warn('[Webflow API] Reached pagination limit (100 pages)');
        break;
      }
    } catch (error: any) {
      console.error(`[Webflow API] Error fetching products at offset ${offset}:`, error);
      throw error; // Re-throw to stop pagination on error
    }
  }

  return allProducts;
}

