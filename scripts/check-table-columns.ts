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

async function checkTableColumns() {
  console.log('=== Checking Table Columns ===\n');

  // Check documents table columns
  console.log('1. Documents table columns:');
  const { data: docSample } = await supabase
    .from('documents')
    .select('*')
    .limit(1);
  
  if (docSample?.length) {
    console.log('Documents columns:', Object.keys(docSample[0]));
  }

  // Check meetings table columns
  console.log('\n2. Meetings table columns:');
  const { data: meetingSample } = await supabase
    .from('meetings')
    .select('*')
    .limit(1);
  
  if (meetingSample?.length) {
    console.log('Meetings columns:', Object.keys(meetingSample[0]));
  }

  // Check ai_insights columns
  console.log('\n3. AI Insights table columns:');
  const { data: insightSample } = await supabase
    .from('ai_insights')
    .select('*')
    .limit(1);
  
  if (insightSample?.length) {
    console.log('AI Insights columns:', Object.keys(insightSample[0]));
  }

  // Look for documents with meeting-like data
  console.log('\n4. Checking documents with meeting category:');
  const { data: meetingDocs, error: meetingDocsError } = await supabase
    .from('documents')
    .select('id, title, date, category, source, project_id')
    .eq('category', 'meeting')
    .limit(5);
  
  if (meetingDocsError) {
    console.error('Error:', meetingDocsError);
  } else {
    console.log(`Found ${meetingDocs?.length || 0} documents with category='meeting'`);
    if (meetingDocs?.length) {
      console.table(meetingDocs);
    }
  }

  // Check documents with date field
  console.log('\n5. Checking documents with date field (recent):');
  const { data: docsWithDate, error: docsWithDateError } = await supabase
    .from('documents')
    .select('id, title, date, category, source')
    .not('date', 'is', null)
    .order('date', { ascending: false })
    .limit(5);
  
  if (docsWithDateError) {
    console.error('Error:', docsWithDateError);
  } else {
    console.log(`Found ${docsWithDate?.length || 0} documents with date field`);
    if (docsWithDate?.length) {
      console.table(docsWithDate);
    }
  }

  // Check meetings with date field
  console.log('\n6. Checking meetings table with date field:');
  const { data: meetingsWithDate, error: meetingsError } = await supabase
    .from('meetings')
    .select('id, title, date, project_id')
    .order('date', { ascending: false })
    .limit(5);
  
  if (meetingsError) {
    console.error('Error:', meetingsError);
  } else {
    console.log(`Found ${meetingsWithDate?.length || 0} meetings`);
    if (meetingsWithDate?.length) {
      console.table(meetingsWithDate);
    }
  }
}

checkTableColumns().catch(console.error);