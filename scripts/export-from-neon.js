#!/usr/bin/env node

/**
 * Export Data from Neon Database
 * 
 * This script exports all data from your Neon database to JSON files.
 * 
 * Usage:
 *   node scripts/export-from-neon.js
 * 
 * Requires NEON_DATABASE_URL environment variable to be set
 * Example: NEON_DATABASE_URL="postgresql://neondb_owner:npg_jP7dqls4rpNf@ep-frosty-meadow-ahksg3ku.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Neon database URL from environment
const neonDatabaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!neonDatabaseUrl) {
  console.error('❌ Error: NEON_DATABASE_URL or DATABASE_URL environment variable is not set');
  console.error('   Please set it in your .env file:');
  console.error('   NEON_DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"');
  process.exit(1);
}

// Create export directory
const exportDir = join(__dirname, '..', 'data-export');
mkdirSync(exportDir, { recursive: true });

// List of tables to export (in order to respect foreign keys)
const tables = [
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

async function exportTable(client, tableName) {
  try {
    console.log(`📤 Exporting ${tableName}...`);
    
    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      console.log(`   ⚠️  Table ${tableName} does not exist, skipping...`);
      return { table: tableName, count: 0, data: [] };
    }
    
    // Get all data from table
    const result = await client.query(`SELECT * FROM ${tableName}`);
    
    // Save to JSON file
    const filePath = join(exportDir, `${tableName}.json`);
    writeFileSync(filePath, JSON.stringify(result.rows, null, 2), 'utf-8');
    
    console.log(`   ✅ Exported ${result.rows.length} rows from ${tableName}`);
    
    return { table: tableName, count: result.rows.length, data: result.rows };
  } catch (error) {
    console.error(`   ❌ Error exporting ${tableName}:`, error.message);
    return { table: tableName, count: 0, data: [], error: error.message };
  }
}

async function exportAll() {
  const client = new Client({
    connectionString: neonDatabaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const results = [];
    
    for (const table of tables) {
      const result = await exportTable(client, table);
      results.push(result);
    }

    // Create summary file
    const summary = {
      exportDate: new Date().toISOString(),
      sourceDatabase: 'Neon',
      tables: results.map(r => ({
        table: r.table,
        count: r.count,
        exported: r.count > 0,
        error: r.error || null
      })),
      totalRows: results.reduce((sum, r) => sum + r.count, 0)
    };

    const summaryPath = join(exportDir, 'export-summary.json');
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

    console.log('\n📊 Export Summary:');
    console.log(`   Total tables: ${results.length}`);
    console.log(`   Total rows exported: ${summary.totalRows}`);
    console.log(`   Export directory: ${exportDir}`);
    console.log(`\n✅ Export complete! Data saved to: ${exportDir}`);

  } catch (error) {
    console.error('❌ Export failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

exportAll().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

