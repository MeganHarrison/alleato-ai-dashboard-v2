#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addUniqueConstraint() {
  console.log('🔧 Adding unique constraint on fireflies_id...\n');

  try {
    // First check if fireflies_id column exists
    const { data: testData, error: testError } = await supabase
      .from('documents')
      .select('id, fireflies_id')
      .limit(1);

    if (testError && testError.message.includes('fireflies_id')) {
      console.log('❌ fireflies_id column does not exist');
      console.log('   Please add it first with:');
      console.log('   ALTER TABLE documents ADD COLUMN fireflies_id TEXT;');
      return;
    }

    console.log('✅ fireflies_id column exists');

    // Check for existing duplicates
    const { data: duplicates, error: dupError } = await supabase
      .from('documents')
      .select('fireflies_id, count:id')
      .not('fireflies_id', 'is', null)
      .order('fireflies_id');

    if (duplicates) {
      const dupsMap = {};
      duplicates.forEach(row => {
        if (row.fireflies_id) {
          dupsMap[row.fireflies_id] = (dupsMap[row.fireflies_id] || 0) + 1;
        }
      });
      
      const hasDuplicates = Object.values(dupsMap).some(count => count > 1);
      if (hasDuplicates) {
        console.log('⚠️  Found duplicate fireflies_id values:');
        Object.entries(dupsMap).forEach(([id, count]) => {
          if (count > 1) {
            console.log(`   ${id}: ${count} occurrences`);
          }
        });
        
        // Remove duplicates keeping only the most recent
        console.log('\n🧹 Removing duplicates (keeping most recent)...');
        for (const [firefliesId, count] of Object.entries(dupsMap)) {
          if (count > 1) {
            const { data: docs } = await supabase
              .from('documents')
              .select('id, created_at')
              .eq('fireflies_id', firefliesId)
              .order('created_at', { ascending: false });
            
            if (docs && docs.length > 1) {
              // Keep the first (most recent), delete the rest
              const toDelete = docs.slice(1).map(d => d.id);
              const { error: deleteError } = await supabase
                .from('documents')
                .delete()
                .in('id', toDelete);
              
              if (deleteError) {
                console.log(`   Failed to delete duplicates for ${firefliesId}:`, deleteError.message);
              } else {
                console.log(`   Deleted ${toDelete.length} duplicates for ${firefliesId}`);
              }
            }
          }
        }
      } else {
        console.log('✅ No duplicate fireflies_id values found');
      }
    }

    // Now try to add the unique constraint
    console.log('\n📝 Adding unique constraint...');
    console.log('   Please run this SQL in Supabase Dashboard:');
    console.log('   ALTER TABLE documents');
    console.log('   ADD CONSTRAINT documents_fireflies_id_unique UNIQUE (fireflies_id);');
    console.log('\n   Or if it already exists, drop and recreate:');
    console.log('   ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_fireflies_id_unique;');
    console.log('   ALTER TABLE documents ADD CONSTRAINT documents_fireflies_id_unique UNIQUE (fireflies_id);');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addUniqueConstraint().catch(console.error);