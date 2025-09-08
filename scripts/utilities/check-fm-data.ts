/**
 * Check FM Global Data in Supabase
 * 
 * PURPOSE: Verify what data exists in FM Global tables
 * USAGE: npx tsx scripts/check-fm-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkData() {
  console.log('🔍 Checking FM Global data in Supabase...\n');
  
  // Check figures
  console.log('📊 Checking fm_global_figures table:');
  const { data: figures, error: figError, count: figCount } = await supabase
    .from('fm_global_figures')
    .select('*', { count: 'exact' })
    .limit(3);
  
  if (figError) {
    console.error('   ❌ Error querying figures:', figError.message);
    console.log('   Details:', figError);
  } else {
    console.log(`   ✅ Total figures: ${figCount || 0}`);
    if (figures && figures.length > 0) {
      console.log('   Sample figure columns:', Object.keys(figures[0]));
      console.log('   First figure:', {
        id: figures[0].id,
        figure_number: figures[0].figure_number,
        title: figures[0].title,
        has_description: !!figures[0].description,
        has_embedding: !!figures[0].embedding
      });
    }
  }
  
  // Check tables
  console.log('\n📊 Checking fm_global_tables table:');
  const { data: tables, error: tabError, count: tabCount } = await supabase
    .from('fm_global_tables')
    .select('*', { count: 'exact' })
    .limit(3);
  
  if (tabError) {
    console.error('   ❌ Error querying tables:', tabError.message);
    console.log('   Details:', tabError);
  } else {
    console.log(`   ✅ Total tables: ${tabCount || 0}`);
    if (tables && tables.length > 0) {
      console.log('   Sample table columns:', Object.keys(tables[0]));
      console.log('   First table:', {
        id: tables[0].id,
        table_number: tables[0].table_number,
        title: tables[0].title,
        has_description: !!tables[0].description,
        has_embedding: !!tables[0].embedding
      });
    }
  }
  
  // Test specific query that the API uses
  console.log('\n🔍 Testing text search (as used by API):');
  const testQuery = 'shuttle ASRS closed-top';
  
  const { data: searchFigures, error: searchFigError } = await supabase
    .from('fm_global_figures')
    .select('*')
    .or(`title.ilike.%${testQuery}%,description.ilike.%${testQuery}%`)
    .limit(5);
  
  if (searchFigError) {
    console.error('   ❌ Figure search error:', searchFigError.message);
  } else {
    console.log(`   ✅ Figures matching "${testQuery}": ${searchFigures?.length || 0}`);
    if (searchFigures && searchFigures.length > 0) {
      searchFigures.forEach(f => {
        console.log(`      - Figure ${f.figure_number}: ${f.title}`);
      });
    }
  }
  
  const { data: searchTables, error: searchTabError } = await supabase
    .from('fm_global_tables')
    .select('*')
    .or(`title.ilike.%${testQuery}%,description.ilike.%${testQuery}%,commodity_types.ilike.%${testQuery}%`)
    .limit(5);
  
  if (searchTabError) {
    console.error('   ❌ Table search error:', searchTabError.message);
    // Try without description column
    console.log('   🔄 Retrying without description column...');
    const { data: retryTables, error: retryError } = await supabase
      .from('fm_global_tables')
      .select('*')
      .or(`title.ilike.%${testQuery}%,commodity_types.ilike.%${testQuery}%`)
      .limit(5);
    
    if (retryError) {
      console.error('      ❌ Retry also failed:', retryError.message);
    } else {
      console.log(`      ✅ Tables found (without description): ${retryTables?.length || 0}`);
    }
  } else {
    console.log(`   ✅ Tables matching "${testQuery}": ${searchTables?.length || 0}`);
    if (searchTables && searchTables.length > 0) {
      searchTables.forEach(t => {
        console.log(`      - Table ${t.table_number}: ${t.title}`);
      });
    }
  }
  
  // Check if search functions exist
  console.log('\n🔍 Checking search functions:');
  
  // Test fm_figures_search (requires embedding)
  console.log('   Testing fm_figures_search function...');
  const dummyEmbedding = new Array(1536).fill(0);
  const { data: figSearchResult, error: figSearchError } = await supabase
    .rpc('fm_figures_search', {
      query_embedding: dummyEmbedding,
      match_threshold: 0.1,
      match_count: 5
    });
  
  if (figSearchError) {
    console.log('   ⚠️  fm_figures_search not available:', figSearchError.message);
  } else {
    console.log('   ✅ fm_figures_search function exists');
  }
  
  // Test fm_tables_search
  console.log('   Testing fm_tables_search function...');
  const { data: tabSearchResult, error: tabSearchError } = await supabase
    .rpc('fm_tables_search', {
      search_text: 'shuttle',
      match_count: 5
    });
  
  if (tabSearchError) {
    console.log('   ⚠️  fm_tables_search not available:', tabSearchError.message);
  } else {
    console.log('   ✅ fm_tables_search function exists');
  }
}

async function main() {
  console.log('🚀 FM Global Data Check');
  console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('');
  
  await checkData();
  
  console.log('\n📋 Summary:');
  console.log('   - Check if tables have data');
  console.log('   - Verify column names match API expectations');
  console.log('   - Ensure search functions are created');
  console.log('   - Add embeddings for vector search (optional but recommended)');
}

if (require.main === module) {
  main().catch(console.error);
}

export default checkData;