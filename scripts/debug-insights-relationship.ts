#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugInsightsRelationship() {
  console.log('=== Debugging AI Insights Relationships ===\n');

  // 1. Get raw insights data
  console.log('1. Raw AI Insights data:');
  const { data: insights, error: insightsError } = await supabase
    .from('ai_insights')
    .select('*')
    .limit(3);
  
  if (insightsError) {
    console.error('Error:', insightsError);
  } else if (insights?.length) {
    console.log(`Found ${insights.length} insights`);
    console.log('\nFirst insight:');
    console.log('- ID:', insights[0].id);
    console.log('- Title:', insights[0].title);
    console.log('- document_id:', insights[0].document_id);
    console.log('- project_id:', insights[0].project_id);
    console.log('- meeting_id:', insights[0].meeting_id);
  }

  // 2. Check if document_id values exist in documents table
  console.log('\n2. Checking document_id relationships:');
  if (insights?.length && insights[0].document_id) {
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, title')
      .eq('id', insights[0].document_id)
      .single();
    
    if (docError) {
      console.error('Document lookup error:', docError);
    } else if (doc) {
      console.log('✅ Document found:', doc.title);
    } else {
      console.log('❌ No document found with ID:', insights[0].document_id);
    }
  }

  // 3. Try the original join query
  console.log('\n3. Testing original join query (with document_id):');
  const { data: joinedInsights1, error: joinError1 } = await supabase
    .from('ai_insights')
    .select(`
      id, title, insight_type, severity,
      documents:document_id(
        id, title
      )
    `)
    .limit(3);
  
  if (joinError1) {
    console.error('Join error:', joinError1);
  } else {
    console.log(`Result: ${joinedInsights1?.length || 0} insights`);
    if (joinedInsights1?.length) {
      console.log('First result documents field:', joinedInsights1[0].documents);
    }
  }

  // 4. Try without the foreign key join
  console.log('\n4. Testing simple query without joins:');
  const { data: simpleInsights, error: simpleError } = await supabase
    .from('ai_insights')
    .select('id, title, insight_type, severity, project_id, document_id')
    .limit(6);
  
  if (simpleError) {
    console.error('Simple query error:', simpleError);
  } else {
    console.log(`✅ Found ${simpleInsights?.length || 0} insights`);
    if (simpleInsights?.length) {
      console.log('\nInsights summary:');
      simpleInsights.forEach(insight => {
        console.log(`- ${insight.title} (${insight.insight_type})`);
        console.log(`  project_id: ${insight.project_id}, document_id: ${insight.document_id}`);
      });
    }
  }

  // 5. Get project names separately
  console.log('\n5. Getting project names for insights:');
  if (simpleInsights?.length) {
    const projectIds = [...new Set(simpleInsights.map(i => i.project_id).filter(Boolean))];
    
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds);
    
    if (projects?.length) {
      console.log('Projects found:');
      projects.forEach(p => console.log(`- ${p.id}: ${p.name}`));
    }
  }
}

debugInsightsRelationship().catch(console.error);