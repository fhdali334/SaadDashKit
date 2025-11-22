/**
 * BigCommerce API Test Script
 * Tests the BigCommerce API using the same code as the server
 */

import { getAllBigCommerceProducts } from './server/bigcommerce-api.js';
import { storage } from './server/storage.js';

// Get credentials from storage
const projectId = '66aeff0ea380c590e96e8e70'; // Your project ID
const credentials = await storage.getBigCommerceCredentials(projectId);

if (!credentials) {
  console.error('❌ BigCommerce credentials not found');
  console.log('Please connect your BigCommerce store in the app first.');
  process.exit(1);
}

console.log('🔍 Testing BigCommerce API...');
console.log(`Store Hash: ${credentials.storeHash}`);
console.log(`Access Token: ${credentials.accessToken.substring(0, 10)}...`);
console.log('');

try {
  console.log('📦 Fetching products...');
  const products = await getAllBigCommerceProducts(projectId);
  
  console.log(`✅ Success! Found ${products.length} products`);
  console.log('');
  
  if (products.length > 0) {
    console.log('📋 First product:');
    const firstProduct = products[0];
    console.log(`  ID: ${firstProduct.id}`);
    console.log(`  Name: ${firstProduct.name}`);
    console.log(`  SKU: ${firstProduct.sku || 'N/A'}`);
    console.log(`  Description: ${firstProduct.description ? firstProduct.description.substring(0, 100) + '...' : 'N/A'}`);
  }
  
  console.log('');
  console.log('✅ API test successful!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  
  if (error.message.includes('403')) {
    console.log('');
    console.log('💡 This is a scope issue. Make sure your API token has:');
    console.log('   - Products: read-only (store_v2_products_read_only)');
    console.log('   - Store Inventory: read-only (store_v2_inventory_read_only)');
    console.log('');
    console.log('   Then regenerate the token and reconnect in the app.');
  }
  
  process.exit(1);
}

