#!/usr/bin/env node

/**
 * Initialize Database Script
 * 
 * This script connects to your TimescaleDB/PostgreSQL database
 * and runs the initial schema migration.
 * 
 * Usage:
 *   node scripts/run-migration.js
 * 
 * Requires DATABASE_URL environment variable to be set
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  console.error('   Please set it in your .env file or export it:');
  console.error('   export DATABASE_URL="postgres://user:pass@host:port/db"');
  process.exit(1);
}

// Read migration file
const migrationPath = join(__dirname, '..', 'migrations', '001_initial_schema.sql');
let migrationSQL;

try {
  migrationSQL = readFileSync(migrationPath, 'utf-8');
} catch (error) {
  console.error(`❌ Error: Could not read migration file: ${migrationPath}`);
  console.error(error.message);
  process.exit(1);
}

// Run migration
async function runMigration() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Required for TimescaleDB Cloud
    }
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('📝 Running migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log(`\n✅ Database setup complete! (${result.rows.length} tables)`);

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    
    if (error.code === '23505') {
      console.error('\n⚠️  Some tables may already exist. This is okay.');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

