#!/usr/bin/env node

/**
 * Import Data to Your Database
 * 
 * This script imports data from exported JSON files into your database.
 * 
 * Usage:
 *   node scripts/import-to-database.js
 * 
 * Requires DATABASE_URL environment variable to be set (your new database)
 * Make sure you've run the migration first: npm run db:migrate
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get target database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  console.error('   Please set it in your .env file:');
  console.error('   DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"');
  process.exit(1);
}

const exportDir = join(__dirname, '..', 'data-export');

if (!existsSync(exportDir)) {
  console.error(`❌ Error: Export directory not found: ${exportDir}`);
  console.error('   Please run export-from-neon.js first to export data from Neon');
  process.exit(1);
}

// Read export summary
const summaryPath = join(exportDir, 'export-summary.json');
if (!existsSync(summaryPath)) {
  console.error(`❌ Error: Export summary not found: ${summaryPath}`);
  console.error('   Please run export-from-neon.js first');
  process.exit(1);
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));

// Tables in order (respecting foreign key constraints)
const importOrder = [
  'users',
  'project_configs',
  'credit_accounts',
  'transactions',
  'usage_records',
  'ai_analyses',
  'ai_keywords',
  'ai_keyphrases',
  'knowledge_base_files',
  'shared_links',
  'gtm_credentials',
  'gtm_analytics_data',
  'gtm_traffic_sources',
  'gtm_page_views',
  'gtm_referrers',
  'gtm_keywords',
  'gtm_campaigns',
  'shopify_credentials',
  'wordpress_credentials',
  'bigcommerce_credentials',
  'squarespace_credentials',
  'wix_credentials',
  'webflow_credentials',
  'products',
  'user_balances',
];

async function importTable(client, tableName) {
  const filePath = join(exportDir, `${tableName}.json`);
  
  if (!existsSync(filePath)) {
    console.log(`   ⚠️  File ${tableName}.json not found, skipping...`);
    return { table: tableName, imported: 0 };
  }

  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    
    if (data.length === 0) {
      console.log(`   ⚠️  No data to import for ${tableName}`);
      return { table: tableName, imported: 0 };
    }

    // Get column names from first row
    const columns = Object.keys(data[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = columns.join(', ');
    
    // Build INSERT query with ON CONFLICT handling
    const query = `
      INSERT INTO ${tableName} (${columnNames})
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
    `;

    let imported = 0;
    for (const row of data) {
      const values = columns.map(col => {
        // Handle null values and special types
        if (row[col] === null) return null;
        // Handle JSON strings in metadata fields
        if (col === 'metadata' && typeof row[col] === 'string') {
          return row[col];
        }
        return row[col];
      });

      try {
        await client.query(query, values);
        imported++;
      } catch (error) {
        // Skip duplicate key errors (ON CONFLICT should handle this, but just in case)
        if (error.code !== '23505') {
          console.error(`   ⚠️  Error importing row into ${tableName}:`, error.message);
        }
      }
    }

    console.log(`   ✅ Imported ${imported}/${data.length} rows into ${tableName}`);
    return { table: tableName, imported };
  } catch (error) {
    console.error(`   ❌ Error importing ${tableName}:`, error.message);
    return { table: tableName, imported: 0, error: error.message };
  }
}

async function importAll() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('🔄 Connecting to target database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Verify tables exist
    console.log('🔍 Verifying tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    console.log(`   Found ${existingTables.length} tables in database\n`);

    console.log('📥 Starting data import...\n');

    const results = [];
    
    for (const table of importOrder) {
      if (existsSync(join(exportDir, `${table}.json`))) {
        const result = await importTable(client, table);
        results.push(result);
      }
    }

    // Summary
    const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
    
    console.log('\n📊 Import Summary:');
    console.log(`   Tables processed: ${results.length}`);
    console.log(`   Total rows imported: ${totalImported}`);
    console.log(`\n✅ Import complete!`);

  } catch (error) {
    console.error('❌ Import failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

importAll().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

