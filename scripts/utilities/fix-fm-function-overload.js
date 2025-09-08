#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFunctionOverload() {
  console.log('Fixing match_fm_tables function overloading issue...');

  try {
    // Drop existing overloaded functions
    const dropQuery = `
      DROP FUNCTION IF EXISTS public.match_fm_tables(public.vector, integer, double precision);
      DROP FUNCTION IF EXISTS public.match_fm_tables(public.vector, double precision, integer);
    `;
    
    const { error: dropError } = await supabase.rpc('query', { query: dropQuery });
    if (dropError && !dropError.message.includes('does not exist')) {
      console.log('Note: Functions may not exist, continuing...');
    }

    // Create the corrected function
    const createQuery = `
      CREATE OR REPLACE FUNCTION public.match_fm_tables(
        query_embedding vector,
        match_count integer DEFAULT 5,
        match_threshold double precision DEFAULT 0.5
      )
      RETURNS TABLE (
        table_id uuid,
        content_text text,
        metadata jsonb,
        similarity double precision
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          fm.table_id,
          fm.content_text,
          fm.metadata,
          1 - (fm.embedding <=> query_embedding) AS similarity
        FROM fm_table_vectors fm
        WHERE fm.embedding IS NOT NULL
          AND (1 - (fm.embedding <=> query_embedding)) >= match_threshold
        ORDER BY fm.embedding <=> query_embedding
        LIMIT match_count;
      END;
      $$;
    `;

    // Execute via direct SQL since we can't use rpc for DDL
    console.log('Note: You may need to run the SQL migration directly in Supabase dashboard:');
    console.log('\nSQL to execute:');
    console.log('================');
    console.log(dropQuery);
    console.log(createQuery);
    console.log('================\n');

    // Test the API endpoint
    console.log('Testing FM RAG API endpoint...');
    const testResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fm-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'What are the sprinkler requirements for shuttle ASRS?',
        limit: 3
      }),
    });

    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('✅ API test successful!');
      console.log('Response preview:', data.content?.substring(0, 200) + '...');
    } else {
      const error = await testResponse.text();
      console.log('⚠️  API returned error:', error);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixFunctionOverload().then(() => {
  console.log('\nProcess complete. If the function still has issues, please run the SQL directly in Supabase dashboard.');
});