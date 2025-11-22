#!/usr/bin/env node

/**
 * Clear Transcripts Script
 * 
 * This script deletes all transcripts from the CSV files.
 * 
 * Usage:
 *   node scripts/clear-transcripts.js
 */

import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

const transcriptsPath = join(process.cwd(), 'server', 'data', 'transcripts.csv');
const messagesPath = join(process.cwd(), 'server', 'data', 'transcripts_messages.csv');

console.log('🗑️  Clearing transcripts...');

try {
  // Delete transcripts CSV if it exists
  if (existsSync(transcriptsPath)) {
    console.log('   Deleting transcripts.csv...');
    unlinkSync(transcriptsPath);
    console.log('   ✅ Deleted transcripts.csv');
  } else {
    console.log('   ⚠️  transcripts.csv does not exist');
  }

  // Delete messages CSV if it exists
  if (existsSync(messagesPath)) {
    console.log('   Deleting transcripts_messages.csv...');
    unlinkSync(messagesPath);
    console.log('   ✅ Deleted transcripts_messages.csv');
  } else {
    console.log('   ⚠️  transcripts_messages.csv does not exist');
  }

  // Create empty CSV files with headers
  console.log('   Creating empty CSV files with headers...');
  
  const transcriptHeaders = [
    'id', 'sessionID', 'projectID', 'environmentID', 'createdAt', 'updatedAt',
    'expiresAt', 'endedAt', 'recordingURL', 'properties_count', 'properties_json',
    'evaluations_count', 'evaluations_json'
  ].join(',');

  const messageHeaders = [
    'transcriptID', 'sessionID', 'role', 'message', 'logCreatedAt'
  ].join(',');

  writeFileSync(transcriptsPath, transcriptHeaders + '\n', 'utf-8');
  writeFileSync(messagesPath, messageHeaders + '\n', 'utf-8');

  console.log('✅ All transcripts cleared successfully!');
  console.log('   Empty CSV files created with headers');
  console.log('   You can now refresh transcripts from the UI');
} catch (error) {
  console.error('❌ Error clearing transcripts:', error.message);
  process.exit(1);
}

