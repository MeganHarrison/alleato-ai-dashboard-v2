#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🔄 Applying bullet_points column migration...\n');

  try {
    // Add bullet_points column
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE documents
        ADD COLUMN IF NOT EXISTS bullet_points TEXT[];
      `
    }).single();

    if (addColumnError && !addColumnError.message?.includes('already exists')) {
      console.error('❌ Error adding column:', addColumnError);
      // Try direct SQL approach
      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Cannot connect to database:', error);
        return;
      }
      
      console.log('⚠️  Note: The bullet_points column may need to be added manually via Supabase dashboard');
      console.log('   SQL: ALTER TABLE documents ADD COLUMN IF NOT EXISTS bullet_points TEXT[];');
    } else {
      console.log('✅ bullet_points column added or already exists');
    }

    // Check if column exists by querying
    const { data: testData, error: testError } = await supabase
      .from('documents')
      .select('id, bullet_points')
      .limit(1);

    if (testError) {
      if (testError.message.includes('bullet_points')) {
        console.log('\n⚠️  The bullet_points column needs to be added manually:');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log('   2. Run this SQL:');
        console.log('      ALTER TABLE documents ADD COLUMN IF NOT EXISTS bullet_points TEXT[];');
        console.log('   3. Then run: npm run sync:fireflies');
      } else {
        console.error('❌ Unexpected error:', testError);
      }
    } else {
      console.log('✅ bullet_points column is available and ready');
      
      // Count documents that could use bullet points
      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'fireflies')
        .is('bullet_points', null);
      
      if (count > 0) {
        console.log(`\n📊 Found ${count} Fireflies documents without bullet points`);
        console.log('   Run sync to populate: npm run sync:fireflies');
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Please add the column manually in Supabase SQL Editor:');
    console.log('   ALTER TABLE documents ADD COLUMN IF NOT EXISTS bullet_points TEXT[];');
  }
}

applyMigration().catch(console.error);