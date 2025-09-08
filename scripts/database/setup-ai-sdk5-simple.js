#!/usr/bin/env node

/**
 * Simple script to setup AI SDK 5 tables
 * This script will output the SQL that needs to be run in Supabase SQL Editor
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAISDK5Tables() {
  console.log('🚀 Setting up AI SDK 5 tables...\n');
  
  try {
    // First check if tables already exist
    console.log('Checking if AI SDK 5 tables already exist...');
    
    const tables = ['ai_sdk5_chats', 'ai_sdk5_messages', 'ai_sdk5_parts'];
    const existingTables = [];
    
    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        existingTables.push(tableName);
      }
    }
    
    if (existingTables.length > 0) {
      console.log('✓ The following AI SDK 5 tables already exist:');
      existingTables.forEach(table => console.log(`  - ${table}`));
      
      if (existingTables.length === 3) {
        console.log('\n🎉 All AI SDK 5 tables are already set up and ready to use!');
        return;
      } else {
        console.log(`\n⚠️  Some tables are missing. Expected 3, found ${existingTables.length}.`);
      }
    } else {
      console.log('No AI SDK 5 tables found. Need to create them.');
    }
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250825_ai_sdk5_persistent_chat.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\n📋 To create the AI SDK 5 tables, run the following SQL in your Supabase SQL Editor:');
    console.log('   (Go to https://supabase.com/dashboard/project/lgveqfnpkxvzbnnwuled/sql/new)');
    console.log('\n' + '='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    
    console.log('\n📌 After running the SQL:');
    console.log('1. The tables will be created with proper indexes');
    console.log('2. Row Level Security (RLS) will be enabled');
    console.log('3. Appropriate policies will be set up');
    console.log('4. Run this script again to verify everything is working\n');
    
  } catch (error) {
    console.error('Error setting up AI SDK 5 tables:', error.message);
    process.exit(1);
  }
}

// Run the script
setupAISDK5Tables();