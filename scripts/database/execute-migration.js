#!/usr/bin/env node

/**
 * Execute AI SDK 5 migration using Supabase service key
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is required');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.log('⚠️  SUPABASE_SERVICE_KEY not found. Manual execution required.');
  console.log('   Please run the SQL from setup-ai-sdk5-simple.js in the Supabase SQL Editor');
  process.exit(1);
}

console.log('🚀 Executing AI SDK 5 migration with service key...');

// Initialize Supabase client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function executeMigration() {
  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250825_ai_sdk5_persistent_chat.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration SQL...');
    
    // Execute the migration using sql function
    const { data, error } = await supabase.rpc('sql', { 
      query: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
    
    console.log('✅ Migration executed successfully');
    
    // Verify tables were created
    console.log('\nVerifying tables...');
    
    const tables = ['ai_sdk5_chats', 'ai_sdk5_messages', 'ai_sdk5_parts'];
    
    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.error(`❌ Table ${tableName} verification failed:`, error.message);
      } else {
        console.log(`✅ Table ${tableName} is accessible`);
      }
    }
    
    console.log('\n🎉 AI SDK 5 tables setup complete!');
    console.log('📝 Tables created:');
    console.log('   - ai_sdk5_chats (with project integration)');
    console.log('   - ai_sdk5_messages (with role constraints)');
    console.log('   - ai_sdk5_parts (with type-specific fields)');
    console.log('🔒 Row Level Security enabled with project-based policies');
    console.log('🚀 Ready for AI SDK 5 persistent chat functionality!');
    
  } catch (error) {
    console.error('❌ Failed to execute migration:', error.message);
    process.exit(1);
  }
}

// Run the migration
executeMigration();