#!/usr/bin/env tsx

/**
 * Script to test if duplicate prevention is working on ai_insights table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function testDuplicatePrevention() {
  console.log('🧪 Testing duplicate prevention on ai_insights table...\n');

  // First, check the current structure
  console.log('📊 Checking table structure...');
  
  const { data: columns, error: columnError } = await supabase
    .rpc('get_table_columns', { 
      table_name: 'ai_insights',
      schema_name: 'public'
    });

  if (columnError) {
    // Try a different approach - select a row to see columns
    const { data: sample, error: sampleError } = await supabase
      .from('ai_insights')
      .select('*')
      .limit(1)
      .single();
    
    if (!sampleError && sample) {
      console.log('   Sample row columns:', Object.keys(sample).join(', '));
      console.log('   Has content_hash:', 'content_hash' in sample ? '✅ Yes' : '❌ No');
    }
  } else if (columns) {
    const hasContentHash = columns.some((col: any) => col.column_name === 'content_hash');
    console.log('   Has content_hash column:', hasContentHash ? '✅ Yes' : '❌ No');
  }

  // Check for existing duplicates
  console.log('\n🔍 Checking for existing duplicates...');
  
  const { data: insights, error: fetchError } = await supabase
    .from('ai_insights')
    .select('id, meeting_id, insight_type, title, created_at')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('❌ Error fetching insights:', fetchError.message);
    return;
  }

  if (!insights || insights.length === 0) {
    console.log('   No insights found in the table');
    return;
  }

  // Find duplicates
  const keyMap = new Map<string, typeof insights>();
  const duplicates: typeof insights = [];

  insights.forEach(insight => {
    const key = `${insight.meeting_id}_${insight.insight_type}_${insight.title?.toLowerCase().trim()}`;
    
    if (keyMap.has(key)) {
      const existing = keyMap.get(key)!;
      duplicates.push(insight);
      if (!existing.some(e => e.id === insight.id)) {
        existing.push(insight);
      }
    } else {
      keyMap.set(key, [insight]);
    }
  });

  const duplicateGroups = Array.from(keyMap.values()).filter(group => group.length > 1);

  if (duplicateGroups.length > 0) {
    console.log(`   ⚠️  Found ${duplicateGroups.length} groups with duplicates:`);
    
    duplicateGroups.slice(0, 5).forEach((group, index) => {
      const first = group[0];
      console.log(`\n   Group ${index + 1}:`);
      console.log(`     Type: ${first.insight_type}`);
      console.log(`     Title: ${first.title}`);
      console.log(`     Meeting ID: ${first.meeting_id}`);
      console.log(`     Duplicate count: ${group.length}`);
      console.log(`     IDs: ${group.map(g => g.id.substring(0, 8)).join(', ')}`);
    });

    if (duplicateGroups.length > 5) {
      console.log(`\n   ... and ${duplicateGroups.length - 5} more duplicate groups`);
    }

    // Offer to clean duplicates
    console.log('\n🧹 Duplicate cleanup summary:');
    const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);
    console.log(`   Total duplicate records that could be removed: ${totalDuplicates}`);
    
  } else {
    console.log('   ✅ No duplicates found!');
  }

  // Test if we can create duplicates
  console.log('\n🧪 Testing duplicate creation prevention...');
  
  // Get a recent insight to try duplicating
  const { data: recentInsight } = await supabase
    .from('ai_insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentInsight) {
    const testDuplicate = {
      meeting_id: recentInsight.meeting_id,
      project_id: recentInsight.project_id,
      insight_type: recentInsight.insight_type,
      title: recentInsight.title,
      description: recentInsight.description + ' (DUPLICATE TEST)',
      severity: recentInsight.severity,
      confidence_score: recentInsight.confidence_score
    };

    const { error: dupError } = await supabase
      .from('ai_insights')
      .insert(testDuplicate);

    if (dupError) {
      if (dupError.message.includes('duplicate') || dupError.message.includes('unique')) {
        console.log('   ✅ Duplicate prevention is ACTIVE - duplicates are blocked!');
      } else {
        console.log('   ⚠️  Insert failed with different error:', dupError.message);
      }
    } else {
      console.log('   ❌ Duplicate prevention NOT active - duplicate was created');
      console.log('   Please run the migration SQL in Supabase SQL Editor');
    }
  }

  console.log('\n✨ Test complete!');
}

// Run the test
testDuplicatePrevention().catch(console.error);