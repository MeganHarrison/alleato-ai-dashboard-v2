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

async function debugHomepageData() {
  console.log('=== Debugging Homepage Data ===\n');

  // 1. Check documents table for meetings
  console.log('1. Checking documents table for meetings (with meeting_date NOT NULL):');
  const { data: documentsWithMeetingDate, error: docError1 } = await supabase
    .from('documents')
    .select('id, title, date, meeting_date, created_at, project_id')
    .not('meeting_date', 'is', null)
    .order('meeting_date', { ascending: false })
    .limit(5);

  if (docError1) {
    console.error('Error fetching documents with meeting_date:', docError1);
  } else {
    console.log(`Found ${documentsWithMeetingDate?.length || 0} documents with meeting_date`);
    if (documentsWithMeetingDate?.length) {
      console.table(documentsWithMeetingDate);
    }
  }

  // 2. Check all documents to see what data exists
  console.log('\n2. Checking all documents (first 10):');
  const { data: allDocs, error: docError2 } = await supabase
    .from('documents')
    .select('id, title, date, meeting_date, category, source, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (docError2) {
    console.error('Error fetching all documents:', docError2);
  } else {
    console.log(`Total documents found: ${allDocs?.length || 0}`);
    if (allDocs?.length) {
      console.table(allDocs);
    }
  }

  // 3. Check meetings table (if it exists)
  console.log('\n3. Checking meetings table:');
  const { data: meetings, error: meetingError } = await supabase
    .from('meetings')
    .select('id, title, meeting_date, date, project_id')
    .order('meeting_date', { ascending: false })
    .limit(5);

  if (meetingError) {
    console.error('Error fetching meetings:', meetingError);
  } else {
    console.log(`Found ${meetings?.length || 0} meetings`);
    if (meetings?.length) {
      console.table(meetings);
    }
  }

  // 4. Check ai_insights table
  console.log('\n4. Checking ai_insights table:');
  const { data: insights, error: insightError } = await supabase
    .from('ai_insights')
    .select('id, title, insight_type, severity, meeting_id, project_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (insightError) {
    console.error('Error fetching ai_insights:', insightError);
  } else {
    console.log(`Found ${insights?.length || 0} AI insights`);
    if (insights?.length) {
      console.table(insights);
    }
  }

  // 5. Test the exact query from ModernHomepage for meetings
  console.log('\n5. Testing exact ModernHomepage meetings query:');
  const { data: meetingData, error: meetingQueryError } = await supabase
    .from('documents')
    .select(`
      id, title, date, meeting_date, created_at,
      projects(id, name)
    `)
    .not('meeting_date', 'is', null)
    .order('meeting_date', { ascending: false })
    .limit(8);

  if (meetingQueryError) {
    console.error('Error with ModernHomepage meetings query:', meetingQueryError);
  } else {
    console.log(`ModernHomepage meetings query returned: ${meetingData?.length || 0} results`);
    if (meetingData?.length) {
      console.log(JSON.stringify(meetingData, null, 2));
    }
  }

  // 6. Test the exact query from ModernHomepage for insights
  console.log('\n6. Testing exact ModernHomepage insights query:');
  const { data: insightData, error: insightQueryError } = await supabase
    .from('ai_insights')
    .select(`
      id, title, insight_type, severity, created_at,
      documents!inner(
        id, title,
        projects(id, name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(6);

  if (insightQueryError) {
    console.error('Error with ModernHomepage insights query:', insightQueryError);
    
    // Try simpler query without the join
    console.log('\n   Trying simpler insights query without documents join:');
    const { data: simpleInsights, error: simpleError } = await supabase
      .from('ai_insights')
      .select('id, title, insight_type, severity, created_at')
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (simpleError) {
      console.error('Simple query also failed:', simpleError);
    } else {
      console.log(`Simple query returned: ${simpleInsights?.length || 0} results`);
      if (simpleInsights?.length) {
        console.table(simpleInsights);
      }
    }
  } else {
    console.log(`ModernHomepage insights query returned: ${insightData?.length || 0} results`);
    if (insightData?.length) {
      console.log(JSON.stringify(insightData, null, 2));
    }
  }

  // 7. Check if there's a relationship between ai_insights and documents
  console.log('\n7. Checking ai_insights table structure for document relationships:');
  const { data: aiInsightsWithDocId } = await supabase
    .from('ai_insights')
    .select('*')
    .limit(1);
  
  if (aiInsightsWithDocId?.length) {
    console.log('AI Insights columns:', Object.keys(aiInsightsWithDocId[0]));
  }

  // 8. Check projects to ensure they exist
  console.log('\n8. Checking projects table:');
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .limit(5);

  if (projectError) {
    console.error('Error fetching projects:', projectError);
  } else {
    console.log(`Found ${projects?.length || 0} projects`);
    if (projects?.length) {
      console.table(projects);
    }
  }
}

debugHomepageData().catch(console.error);