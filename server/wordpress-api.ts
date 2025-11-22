/**
 * WordPress/WooCommerce REST API Integration
 * 
 * This module handles product fetching from WordPress/WooCommerce sites
 * Uses WordPress REST API and WooCommerce REST API endpoints
 */

import { storage } from './storage';
import type { WordPressCredentials } from '@shared/schema';
import nodeFetch from 'node-fetch';

// WooCommerce REST API Configuration
const WOOCOMMERCE_API_VERSION = 'wc/v3';

/**
 * Get WordPress/WooCommerce API base URL
 */
function getWordPressApiUrl(siteUrl: string): string {
  // Normalize site URL
  let url = siteUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  return `${url}/wp-json/${WOOCOMMERCE_API_VERSION}`;
}

/**
 * Fetch products from WordPress/WooCommerce REST API
 * Uses query string authentication (WooCommerce standard)
 */
export async function getWordPressProducts(projectId: string, page = 1, perPage = 100) {
  const credentials = await storage.getWordPressCredentials(projectId);
  
  if (!credentials) {
    throw new Error('WordPress credentials not found. Please connect your WordPress site.');
  }

  if (!credentials.consumerKey || !credentials.consumerSecret) {
    throw new Error('WooCommerce API credentials not found. Please configure your Consumer Key and Secret.');
  }

  const apiUrl = getWordPressApiUrl(credentials.siteUrl);
  
  // WooCommerce REST API uses query string authentication
  // Append consumer_key and consumer_secret as query parameters
  const url = new URL(`${apiUrl}/products`);
  url.searchParams.set('consumer_key', credentials.consumerKey);
  url.searchParams.set('consumer_secret', credentials.consumerSecret);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('per_page', perPage.toString());
  url.searchParams.set('status', 'publish');
  
  const productsUrl = url.toString();
  
  console.log(`[WordPress API] Fetching products from: ${apiUrl}/products (page ${page})`);

  const response = await nodeFetch(productsUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[WordPress API] Error ${response.status} from ${productsUrl}:`, errorText);
    throw new Error(`WordPress API error (${response.status}): ${errorText}`);
  }

  const products = await response.json();
  const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1', 10);
  const totalProducts = parseInt(response.headers.get('x-wp-total') || '0', 10);

  return {
    products: Array.isArray(products) ? products : [],
    pagination: {
      page,
      perPage,
      totalPages,
      totalProducts,
    },
  };
}

/**
 * Fetch all products from WordPress/WooCommerce (handles pagination)
 */
export async function getAllWordPressProducts(projectId: string) {
  let allProducts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await getWordPressProducts(projectId, page, 100);
    allProducts = allProducts.concat(result.products);
    
    hasMore = page < result.pagination.totalPages;
    page++;
    
    // Safety limit to prevent infinite loops
    if (page > 100) {
      console.warn('[WordPress API] Reached pagination limit (100 pages)');
      break;
    }
  }

  return allProducts;
}

