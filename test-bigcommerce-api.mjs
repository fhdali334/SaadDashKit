/**
 * BigCommerce API Test Script
 * Tests the BigCommerce API using the same code as the server
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import nodeFetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read credentials directly from the JSON file
const credentialsPath = join(__dirname, 'server', 'data', 'configs', 'bigcommerce-credentials.json');
const credentialsData = JSON.parse(readFileSync(credentialsPath, 'utf-8'));

if (!credentialsData || credentialsData.length === 0) {
  console.error('❌ BigCommerce credentials not found');
  console.log('Please connect your BigCommerce store in the app first.');
  process.exit(1);
}

const credentials = credentialsData[0];
const storeHash = credentials.storeHash;
const accessToken = credentials.accessToken;

console.log('🔍 Testing BigCommerce API...');
console.log(`Store Hash: ${storeHash}`);
console.log(`Access Token: ${accessToken.substring(0, 10)}...`);
console.log('');

// Build API URL
const apiUrl = `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?page=1&limit=10`;

console.log('📡 Making request...');
console.log(`URL: ${apiUrl}`);
console.log('Headers:');
console.log('  X-Auth-Token: ' + accessToken.substring(0, 10) + '...');
console.log('  Accept: application/json');
console.log('');

try {
  const response = await nodeFetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Auth-Token': accessToken,
    },
  });

  const statusCode = response.status;
  const responseText = await response.text();

  console.log(`📊 Response Status: ${statusCode}`);
  console.log('');

  if (statusCode === 200) {
    const data = JSON.parse(responseText);
    const products = data.data || [];
    const meta = data.meta || {};

    console.log('✅ Success!');
    console.log('');
    console.log('📋 Response Summary:');
    if (meta.pagination) {
      console.log(`  Total Products: ${meta.pagination.total}`);
      console.log(`  Current Page: ${meta.pagination.current_page}`);
      console.log(`  Per Page: ${meta.pagination.per_page}`);
      console.log(`  Total Pages: ${meta.pagination.total_pages}`);
    }
    console.log(`  Products in this page: ${products.length}`);
    console.log('');

    if (products.length > 0) {
      console.log('📦 First Product:');
      const firstProduct = products[0];
      console.log(`  ID: ${firstProduct.id}`);
      console.log(`  Name: ${firstProduct.name}`);
      console.log(`  SKU: ${firstProduct.sku || 'N/A'}`);
      console.log(`  Price: ${firstProduct.price || 'N/A'}`);
    }

    console.log('');
    console.log('✅ API test successful!');
  } else if (statusCode === 403) {
    console.log('❌ Forbidden (403)');
    console.log('');
    console.log('💡 This is a scope issue. Make sure your API token has:');
    console.log('   - Products: read-only (store_v2_products_read_only)');
    console.log('   - Store Inventory: read-only (store_v2_inventory_read_only)');
    console.log('');
    console.log('   Then regenerate the token and reconnect in the app.');
    console.log('');
    console.log('Response:', responseText);
    process.exit(1);
  } else if (statusCode === 401) {
    console.log('❌ Unauthorized (401)');
    console.log('Check your access token.');
    console.log('');
    console.log('Response:', responseText);
    process.exit(1);
  } else if (statusCode === 404) {
    console.log('❌ Not Found (404)');
    console.log('Check your store hash.');
    console.log('');
    console.log('Response:', responseText);
    process.exit(1);
  } else {
    console.log(`❌ Error (${statusCode})`);
    console.log('');
    console.log('Response:', responseText);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error);
  process.exit(1);
}

