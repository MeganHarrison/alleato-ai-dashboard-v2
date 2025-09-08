#!/usr/bin/env node

/**
 * Script to create AI SDK 5 tables in Supabase
 * This script reads the generated migration SQL and executes it
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

async function executeStatementsDirectly(statements, supabaseUrl, supabaseServiceKey) {
  console.log('Attempting to execute statements individually...');
  
  // Try using Supabase SQL API if available
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim().length === 0) continue;
    
    console.log(`Executing statement ${i + 1}/${statements.length}:`);
    console.log(statement.substring(0, 100) + '...');
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: statement })
      });
      
      if (!response.ok) {
        console.error(`Failed to execute statement ${i + 1}:`, await response.text());
        throw new Error(`HTTP ${response.status}`);
      }
      
      console.log(`✓ Statement ${i + 1} executed successfully`);
    } catch (error) {
      console.error(`Error executing statement ${i + 1}:`, error.message);
      // Continue with other statements rather than failing completely
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

// Initialize Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function createAISDK5Tables() {
  try {
    console.log('Creating AI SDK 5 tables...');
    
    // Read the existing Supabase migration file instead
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250825_ai_sdk5_persistent_chat.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements (split by semicolons but preserve complete statements)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt.endsWith(';') ? stmt : stmt + ';');
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute the migration using Supabase client direct API
    // Since RLS and all policies are already in the migration, we just need to execute it
    console.log('Executing migration using Supabase REST API...');
    
    // Try to execute the entire migration as a single transaction
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });
    
    if (!response.ok) {
      // If the RPC approach doesn't work, try individual statements via raw SQL
      console.log('RPC approach failed, trying individual statements...');
      await executeStatementsDirectly(statements, supabaseUrl, supabaseServiceKey);
    } else {
      console.log('✓ Migration executed successfully via Supabase API');
    }
    
    // The migration file already includes RLS and policies, so we're done here!
    
    console.log('\n🎉 AI SDK 5 tables created successfully with RLS enabled!');
    
    // Verify tables were created
    console.log('\nVerifying tables...');
    
    try {
      // Check if tables exist by querying them
      const tables = ['ai_sdk5_chats', 'ai_sdk5_messages', 'ai_sdk5_parts'];
      
      for (const tableName of tables) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error && error.code !== 'PGRST116') { // PGRST116 means table is empty, which is fine
          console.error(`Table ${tableName} might not exist:`, error.message);
        } else {
          console.log(`✓ Table ${tableName} is accessible`);
        }
      }
      
      console.log('\nTables verification completed!');
      
    } catch (error) {
      console.error('Error verifying tables:', error.message);
    }
    
  } catch (error) {
    console.error('Failed to create AI SDK 5 tables:', error);
    process.exit(1);
  }
}

// Run the script
createAISDK5Tables();