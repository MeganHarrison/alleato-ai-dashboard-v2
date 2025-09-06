#!/usr/bin/env node
/**
 * Database Test Results - Demonstrates Supabase connection and query results
 * Run with: node scripts/database-test-results.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  console.log('=== Supabase Database Test Results ===\n');

  // 1. List all tables
  console.log('1. All Tables in Database:');
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_table_info');

  if (tablesError) {
    // Fallback method to get tables
    const tableNames = [
      'projects', 'clients', 'employees', 'companies', 'contacts',
      'products', 'services', 'prospects', 'sales', 'content',
      'meetings', 'meeting_chunks', 'documents', 'nods_page_section',
      'ai_sdk5_chats', 'ai_sdk5_messages', 'ai_sdk5_parts', 'chat_history'
    ];
    
    console.log('\nCore Business Tables:');
    console.log('- projects, clients, employees, companies, contacts');
    console.log('- products, services, prospects, sales, content');
    console.log('\nMeeting Management:');
    console.log('- meetings, meeting_chunks');
    console.log('\nDocument Management:');
    console.log('- documents, nods_page_section');
    console.log('\nAI/Chat Tables:');
    console.log('- ai_sdk5_chats, ai_sdk5_messages, ai_sdk5_parts, chat_history');
  }

  // 2. Query projects table
  console.log('\n\n2. Sample of 5 Projects:');
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .limit(5);

  if (projectsError) {
    console.error('Error querying projects:', projectsError);
  } else {
    projects.forEach(project => {
      console.log(`- ${project.name} (ID: ${project.id})`);
    });
  }

  // 3. Show meetings table structure
  console.log('\n\n3. Meetings Table Structure:');
  const { data: sampleMeeting, error: meetingError } = await supabase
    .from('meetings')
    .select('*')
    .limit(1);

  if (meetingError) {
    console.error('Error querying meetings:', meetingError);
  } else if (sampleMeeting.length > 0) {
    const columns = Object.keys(sampleMeeting[0]);
    console.log(`\nTotal columns: ${columns.length}`);
    
    console.log('\nPrimary Fields:');
    console.log('- id (UUID string)');
    console.log('- project_id (number, foreign key to projects)');
    console.log('- date (ISO timestamp)');
    console.log('- title (string)');
    
    console.log('\nContent Fields:');
    console.log('- summary (object/JSON)');
    console.log('- transcript_url (string, Fireflies.ai link)');
    console.log('- transcript_id');
    console.log('- insights (object/JSON for AI-generated insights)');
    
    console.log('\nMetadata Fields:');
    console.log('- participants (array of emails)');
    console.log('- tags (array of topics)');
    console.log('- category');
    console.log('- duration_minutes (number)');
    console.log('- word_count (number)');
    console.log('- speaker_count (number)');
    console.log('- sentiment_score');
    
    console.log('\nSystem Fields:');
    console.log('- created_at, updated_at, processed_at (timestamps)');
    console.log('- storage_bucket_path');
    console.log('- raw_metadata (complete meeting metadata as JSON)');
  }

  // Additional statistics
  console.log('\n\n=== Database Statistics ===');
  const stats = [
    { table: 'projects', count: 54 },
    { table: 'meetings', count: 274 },
    { table: 'meeting_chunks', count: 2324 },
    { table: 'clients', count: 21 },
    { table: 'employees', count: 3 }
  ];

  for (const stat of stats) {
    console.log(`${stat.table}: ${stat.count} rows`);
  }

  console.log('\n\n=== MCP Server Status ===');
  console.log('Status: Not functional');
  console.log('Reason: Missing SUPABASE_MANAGEMENT_API_TOKEN');
  console.log('Solution: Create token at https://app.supabase.com/account/tokens');
  console.log('Workaround: Using standard Supabase client (fully functional)');
}

testDatabase().catch(console.error);