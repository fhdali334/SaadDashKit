#!/usr/bin/env node

/**
 * Clear AI Analyses Script
 * 
 * This script deletes all AI analyses from the database.
 * Since ai_keywords and ai_keyphrases have ON DELETE CASCADE,
 * deleting analyses will automatically delete related keywords and keyphrases.
 * 
 * Usage:
 *   node scripts/clear-ai-analyses.js
 * 
 * Requires DATABASE_URL environment variable to be set
 */

import pg from 'pg';

const { Client } = pg;

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  console.error('   Please set it in your .env file or export it:');
  console.error('   export DATABASE_URL="postgres://user:pass@host:port/db"');
  process.exit(1);
}

// Clear AI analyses
async function clearAiAnalyses() {
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

    // First, check if tables exist
    console.log('🔍 Checking if tables exist...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_analyses'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  Table ai_analyses does not exist');
      console.log('   The app may be using in-memory storage (JSON files)');
      console.log('   Data has already been cleared from JSON files');
      return;
    }

    // Check how many analyses exist
    console.log('🔍 Checking existing analyses...');
    const countResult = await client.query('SELECT COUNT(*) FROM ai_analyses');
    const count = parseInt(countResult.rows[0].count);
    console.log(`   Found ${count} analysis record(s)`);

    if (count === 0) {
      console.log('✅ No analyses to delete');
      return;
    }

    // Delete all analyses (keywords and keyphrases will be cascade deleted)
    console.log('🗑️  Deleting all AI analyses...');
    const deleteResult = await client.query('DELETE FROM ai_analyses');
    console.log(`✅ Deleted ${deleteResult.rowCount} analysis record(s)`);

    // Verify deletion
    const verifyResult = await client.query('SELECT COUNT(*) FROM ai_analyses');
    const remaining = parseInt(verifyResult.rows[0].count);
    
    if (remaining === 0) {
      console.log('✅ All AI analyses successfully deleted');
    } else {
      console.log(`⚠️  Warning: ${remaining} analysis record(s) still remain`);
    }

    // Also verify keywords and keyphrases are gone
    const keywordsCount = await client.query('SELECT COUNT(*) FROM ai_keywords');
    const keyphrasesCount = await client.query('SELECT COUNT(*) FROM ai_keyphrases');
    console.log(`   Remaining keywords: ${keywordsCount.rows[0].count}`);
    console.log(`   Remaining keyphrases: ${keyphrasesCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error deleting AI analyses:');
    console.error(error.message);
    
    if (error.code === '42P01') {
      console.error('\n⚠️  Tables do not exist. Have you run the migration?');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

clearAiAnalyses().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

