/**
 * Shopify Storefront API Integration
 * 
 * This module handles product fetching using Shopify Storefront API
 * Uses @shopify/storefront-api-client for GraphQL queries
 */

import { createStorefrontApiClient, CustomFetchApi } from '@shopify/storefront-api-client';
import { storage } from './storage';
import type { ShopifyCredentials } from '@shared/schema';

// Shopify Storefront API Configuration
// Use API version as shown in Shopify docs examples
const STOREFRONT_API_VERSION = '2023-10';

/**
 * Get Shopify Storefront API client
 */
export async function getShopifyStorefrontClient(projectId: string) {
  const credentials = await storage.getShopifyCredentials(projectId);
  
  if (!credentials) {
    throw new Error('Shopify credentials not found. Please connect your Shopify store.');
  }

  if (!credentials.storefrontAccessToken) {
    throw new Error('Storefront access token not found. Please configure your Storefront API access token.');
  }

  // Use node-fetch for server-side requests
  const nodeFetch = await import('node-fetch');
  const customFetch: CustomFetchApi = (nodeFetch.default || nodeFetch) as any;

  // Format domain according to docs: "http://your-shop-name.myshopify.com" or "https://your-shop-name.myshopify.com"
  // Docs show http:// in examples, but https:// is more secure
  let storeDomain = credentials.shopDomain;
  // Ensure it has protocol (https://)
  if (!storeDomain.startsWith('http://') && !storeDomain.startsWith('https://')) {
    storeDomain = `https://${storeDomain}`;
  }
  // Remove trailing slash
  storeDomain = storeDomain.replace(/\/$/, '');

  // Storefront API client initialized with public access token

  // Try publicAccessToken first (most common for Storefront API)
  // Storefront API access tokens are typically public tokens
  // If you have a private delegate token, you can use privateAccessToken instead
  const client = createStorefrontApiClient({
    storeDomain: storeDomain,
    apiVersion: STOREFRONT_API_VERSION,
    publicAccessToken: credentials.storefrontAccessToken,
    customFetchApi: customFetch,
  });

  return client;
}

/**
 * Fetch products from Shopify Storefront API
 */
export async function getShopifyProducts(projectId: string, first = 250, after?: string) {
  const client = await getShopifyStorefrontClient(projectId);

  const productsQuery = `
    query GetProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            description
            descriptionHtml
            vendor
            productType
            tags
            createdAt
            updatedAt
            publishedAt
            images(first: 10) {
              edges {
                node {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  sku
                  availableForSale
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const { data, errors } = await client.request(productsQuery, {
    variables: {
      first,
      after,
    },
  });

  if (errors) {
    console.error('[Shopify Storefront] GraphQL errors:', errors);
    // Provide more detailed error information
    const errorMessages = errors.map((e: any) => e.message || JSON.stringify(e)).join(', ');
    throw new Error(`Shopify API error: ${errorMessages}`);
  }

  return {
    products: data?.products?.edges?.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description,
      descriptionHtml: edge.node.descriptionHtml,
      vendor: edge.node.vendor,
      productType: edge.node.productType,
      tags: edge.node.tags,
      createdAt: edge.node.createdAt,
      updatedAt: edge.node.updatedAt,
      publishedAt: edge.node.publishedAt,
      images: edge.node.images.edges.map((imgEdge: any) => ({
        id: imgEdge.node.id,
        url: imgEdge.node.url,
        altText: imgEdge.node.altText,
        width: imgEdge.node.width,
        height: imgEdge.node.height,
      })),
      variants: edge.node.variants.edges.map((variantEdge: any) => ({
        id: variantEdge.node.id,
        title: variantEdge.node.title,
        price: variantEdge.node.price,
        sku: variantEdge.node.sku,
        availableForSale: variantEdge.node.availableForSale,
        compareAtPrice: variantEdge.node.compareAtPrice,
      })),
    })) || [],
    pageInfo: data?.products?.pageInfo,
  };
}

/**
 * Search products by query
 */
export async function searchShopifyProducts(projectId: string, query: string, first = 20) {
  const client = await getShopifyStorefrontClient(projectId);

  const searchQuery = `
    query SearchProducts($query: String!, $first: Int!) {
      products(first: $first, query: $query) {
        edges {
          node {
            id
            title
            handle
            description
            vendor
            productType
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const { data, errors } = await client.request(searchQuery, {
    variables: {
      query,
      first,
    },
  });

  if (errors) {
    throw new Error(`Shopify API error: ${JSON.stringify(errors)}`);
  }

  return data?.products?.edges?.map((edge: any) => ({
    id: edge.node.id,
    title: edge.node.title,
    handle: edge.node.handle,
    description: edge.node.description,
    vendor: edge.node.vendor,
    productType: edge.node.productType,
    image: edge.node.images.edges[0]?.node?.url,
    price: edge.node.variants.edges[0]?.node?.price,
  })) || [];
}

