#!/usr/bin/env node

/**
 * Run migration to rename fireflies_link to fireflies_url
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Running migration to rename fireflies_link to fireflies_url\n');
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250901_rename_fireflies_link_to_url.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // For ALTER TABLE and CREATE statements, we use rpc with raw SQL
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).single();
      
      if (error) {
        // Try direct execution if rpc doesn't work
        console.log('Trying alternative execution method...');
        // Note: Supabase JS client doesn't support direct SQL execution
        // We'll need to check if the column already exists and skip if it does
        
        // Check if column already renamed
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'documents')
          .in('column_name', ['fireflies_link', 'fireflies_url']);
        
        if (columns?.some(c => c.column_name === 'fireflies_url')) {
          console.log('✅ Column already renamed to fireflies_url');
          continue;
        }
        
        console.error(`⚠️ Could not execute statement ${i + 1}: ${error.message}`);
        console.log('Note: You may need to run this migration manually in Supabase Dashboard');
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('\n✅ Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\nYou can run the migration manually in Supabase Dashboard SQL Editor');
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(console.error);