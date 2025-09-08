#!/usr/bin/env node

/**
 * Test script to verify the AI insights trigger fix
 * This directly inserts into ai_insights without the workaround
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testDirectInsight() {
  try {
    console.log('🧪 Testing direct insertion into ai_insights table...\n');
    
    // 1. Get a document to use for testing
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title')
      .limit(1)
      .single();
    
    if (docError || !document) {
      throw new Error('No documents found for testing');
    }
    
    console.log(`Using document: ${document.title} (${document.id})`);
    
    // 2. Try to insert directly into ai_insights
    console.log('Attempting direct insertion...');
    const testInsight = {
      meeting_id: document.id, // Using document ID as meeting_id
      insight_type: 'test',
      title: 'Direct Insert Test',
      description: 'Testing if the trigger has been fixed',
      severity: 'low',
      confidence_score: 1.0,
      resolved: 0
    };
    
    const { data, error } = await supabase
      .from('ai_insights')
      .insert(testInsight)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Direct insertion failed:', error.message);
      console.error('Full error:', error);
      
      if (error.message.includes('meeting_title')) {
        console.log('\n⚠️  The trigger issue is NOT fixed yet.');
        console.log('Please follow the instructions in documentation/fix-supabase-trigger-guide.md');
      }
      return false;
    }
    
    console.log('✅ Direct insertion successful!');
    console.log('Inserted insight:', data);
    
    // 3. Clean up test data
    console.log('\nCleaning up test data...');
    const { error: deleteError } = await supabase
      .from('ai_insights')
      .delete()
      .eq('id', data.id);
    
    if (deleteError) {
      console.warn('Warning: Could not delete test insight:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('\n🎉 Success! The trigger has been fixed.');
    console.log('You can now generate insights directly without the workaround.');
    return true;
    
  } catch (error) {
    console.error('Fatal error:', error);
    return false;
  }
}

// Run the test
testDirectInsight().then(success => {
  if (success) {
    console.log('\n✨ You can now run: npx tsx scripts/generate-insights-batch.ts');
    process.exit(0);
  } else {
    console.log('\n❌ Test failed. Please fix the trigger first.');
    process.exit(1);
  }
});