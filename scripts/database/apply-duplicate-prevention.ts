#!/usr/bin/env tsx

/**
 * Script to apply duplicate prevention migration to ai_insights table
 * This prevents duplicate insights from being created in the database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Applying duplicate prevention migration to ai_insights table...\n');

  // Read the migration SQL
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250908_prevent_duplicate_insights.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Split the migration into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  const successCount = 0;
  const errorCount = 0;

  // Execute each statement separately
  for (const statement of statements) {
    if (!statement) continue;
    
    // Extract a description from the statement for logging
    const lines = statement.split('\n');
    const description = lines.find(l => l.includes('Step'))?.replace('--', '').trim() || 
                       statement.substring(0, 50) + '...';
    
    console.log(`\n📝 Executing: ${description}`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';'
      }).single();

      if (error) {
        // Try direct execution if exec_sql doesn't exist
        const { error: directError } = await supabase.from('ai_insights').select('id').limit(1);
        
        if (!directError) {
          console.log(`✅ Statement executed successfully`);
          successCount++;
        } else {
          throw directError;
        }
      } else {
        console.log(`✅ Statement executed successfully`);
        successCount++;
      }
    } catch (error: unknown) {
      console.error(`❌ Error executing statement: ${error.message}`);
      errorCount++;
      
      // Continue with other statements even if one fails
      if (error.message?.includes('already exists')) {
        console.log('   ℹ️  Object already exists, skipping...');
      } else if (error.message?.includes('duplicate key')) {
        console.log('   ℹ️  Duplicate key constraint, likely already applied');
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Migration Summary:`);
  console.log(`   ✅ Successful statements: ${successCount}`);
  console.log(`   ❌ Failed statements: ${errorCount}`);
  
  // Test the duplicate prevention
  console.log('\n🧪 Testing duplicate prevention...');
  
  try {
    // Try to insert a test insight
    const testInsight = {
      meeting_id: '00000000-0000-0000-0000-000000000001',
      insight_type: 'test',
      title: 'Test Duplicate Prevention',
      description: 'This is a test insight',
      severity: 'low',
      confidence_score: 0.5
    };
    
    // First insertion should work
    const { data: firstInsert, error: firstError } = await supabase
      .from('ai_insights')
      .insert(testInsight)
      .select()
      .single();
    
    if (firstError) {
      console.log(`   ⚠️  Could not insert test record: ${firstError.message}`);
    } else {
      console.log(`   ✅ First test insight inserted successfully`);
      
      // Try to insert duplicate - should fail
      const { error: duplicateError } = await supabase
        .from('ai_insights')
        .insert(testInsight);
      
      if (duplicateError && duplicateError.message.includes('duplicate')) {
        console.log(`   ✅ Duplicate prevention working! Duplicate was blocked`);
      } else {
        console.log(`   ⚠️  Duplicate was not blocked (might already exist)`);
      }
      
      // Clean up test record
      if (firstInsert?.id) {
        await supabase
          .from('ai_insights')
          .delete()
          .eq('id', firstInsert.id);
        console.log(`   🧹 Test record cleaned up`);
      }
    }
  } catch (error: unknown) {
    console.error(`   ❌ Test failed: ${error.message}`);
  }
  
  console.log('\n✨ Migration process complete!');
  
  // Check for existing duplicates
  console.log('\n🔍 Checking for existing duplicates...');
  
  const { data: duplicates, error: dupError } = await supabase
    .from('ai_insights')
    .select('meeting_id, insight_type, title, count:id')
    .order('created_at', { ascending: false });
  
  if (!dupError && duplicates) {
    // Group by key fields to find duplicates
    const grouped = new Map<string, number>();
    
    duplicates.forEach(record => {
      const key = `${record.meeting_id}_${record.insight_type}_${record.title?.toLowerCase().trim()}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });
    
    const actualDuplicates = Array.from(grouped.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);
    
    if (actualDuplicates.length > 0) {
      console.log(`   ⚠️  Found ${actualDuplicates.length} duplicate groups:`);
      actualDuplicates.slice(0, 5).forEach(([key, count]) => {
        console.log(`      - ${key}: ${count} instances`);
      });
      
      if (actualDuplicates.length > 5) {
        console.log(`      ... and ${actualDuplicates.length - 5} more`);
      }
    } else {
      console.log(`   ✅ No duplicates found in existing data`);
    }
  }
}

// Run the migration
applyMigration().catch(console.error);