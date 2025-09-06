#!/usr/bin/env node

/**
 * Script to create RAG system database tables
 * This solves the "rag_documents table not found" error
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRAGTables() {
  console.log('🚀 Creating RAG System Database Tables\n');
  console.log('=====================================\n');
  
  // Read the migration SQL file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250901_create_rag_tables.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return false;
  }
  
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📋 Running migration: 20250901_create_rag_tables.sql\n');
  
  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    // Extract a description from the statement
    let description = 'SQL statement';
    if (statement.includes('CREATE TABLE')) {
      const match = statement.match(/CREATE TABLE[^(]*\s+(\w+)/i);
      if (match) description = `Creating table: ${match[1]}`;
    } else if (statement.includes('CREATE INDEX')) {
      const match = statement.match(/CREATE INDEX[^(]*\s+(\w+)/i);
      if (match) description = `Creating index: ${match[1]}`;
    } else if (statement.includes('CREATE EXTENSION')) {
      description = 'Enabling vector extension';
    } else if (statement.includes('CREATE FUNCTION')) {
      description = 'Creating update trigger function';
    } else if (statement.includes('CREATE TRIGGER')) {
      const match = statement.match(/CREATE TRIGGER\s+(\w+)/i);
      if (match) description = `Creating trigger: ${match[1]}`;
    }
    
    console.log(`⏳ ${description}...`);
    
    try {
      // Execute the SQL statement
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      }).single();
      
      if (error) {
        // Try direct execution as fallback
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement + ';' })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
      
      console.log(`✅ ${description} - Success`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${description} - Failed:`, error.message);
      errorCount++;
      
      // Some errors are expected (e.g., "already exists")
      if (error.message?.includes('already exists') || 
          error.message?.includes('duplicate')) {
        console.log('   ℹ️  This is OK - object already exists');
        successCount++;
        errorCount--;
      }
    }
  }
  
  console.log('\n=====================================');
  console.log(`📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  
  // Verify tables were created
  console.log('\n🔍 Verifying tables...\n');
  
  const tablesToCheck = [
    'rag_documents',
    'rag_chunks', 
    'rag_chat_history',
    'rag_processing_queue'
  ];
  
  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table ${table}: NOT FOUND`);
      } else {
        console.log(`✅ Table ${table}: EXISTS (${count || 0} records)`);
      }
    } catch (e) {
      console.log(`❌ Table ${table}: ERROR - ${e.message}`);
    }
  }
  
  return errorCount === 0;
}

async function main() {
  console.log('========================================');
  console.log('     RAG Tables Creation Tool          ');
  console.log('========================================\n');
  
  console.log('⚠️  IMPORTANT: This script needs to run SQL commands.');
  console.log('   If it fails, you may need to run the SQL manually');
  console.log('   in the Supabase SQL Editor.\n');
  
  const success = await createRAGTables();
  
  if (success) {
    console.log('\n✅ RAG tables created successfully!');
    console.log('\nYour RAG system should now be able to:');
    console.log('- Store uploaded documents');
    console.log('- Process document chunks');
    console.log('- Save chat history');
    console.log('- Manage processing queue');
  } else {
    console.log('\n⚠️  Some operations failed.');
    console.log('\nTo fix this manually:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy the contents of: supabase/migrations/20250901_create_rag_tables.sql');
    console.log('3. Paste and run the SQL');
    console.log('\nThe file is located at:');
    console.log(join(__dirname, '..', 'supabase', 'migrations', '20250901_create_rag_tables.sql'));
  }
}

main().catch(console.error);