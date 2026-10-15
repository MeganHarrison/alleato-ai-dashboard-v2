// Debug script to check meeting insights issue
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const meetingId = '9c92288d-e0bf-4db4-8877-dd12fa321589';

async function debugMeetingInsights() {
  console.log('🔍 Debugging Meeting Insights');
  console.log('Meeting ID:', meetingId);
  console.log('---');

  // 1. Check if the meeting/document exists
  console.log('1. Checking if meeting/document exists...');
  const { data: meeting, error: meetingError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', meetingId)
    .single();

  if (meetingError) {
    console.error('❌ Meeting not found:', meetingError.message);
    return;
  }

  console.log('✅ Meeting found:', {
    id: meeting.id,
    title: meeting.title,
    project_id: meeting.project_id,
    created_at: meeting.created_at
  });
  console.log('---');

  // 2. Check insights with document_id (new schema)
  console.log('2. Checking insights with document_id...');
  const { data: documentInsights, error: docInsightError } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('document_id', meetingId);

  if (docInsightError) {
    console.error('❌ Error querying document insights:', docInsightError.message);
  } else {
    console.log(`📊 Found ${documentInsights?.length || 0} insights with document_id`);
    if (documentInsights && documentInsights.length > 0) {
      documentInsights.forEach((insight, i) => {
        console.log(`  ${i + 1}. ${insight.title} (${insight.insight_type}, ${insight.severity})`);
      });
    }
  }
  console.log('---');

  // 3. Check insights with meeting_id (legacy schema)
  console.log('3. Checking insights with meeting_id (legacy)...');
  const { data: meetingInsights, error: meetingInsightError } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('meeting_id', meetingId);

  if (meetingInsightError) {
    console.error('❌ Error querying meeting insights:', meetingInsightError.message);
  } else {
    console.log(`📊 Found ${meetingInsights?.length || 0} insights with meeting_id`);
    if (meetingInsights && meetingInsights.length > 0) {
      meetingInsights.forEach((insight, i) => {
        console.log(`  ${i + 1}. ${insight.title} (${insight.insight_type}, ${insight.severity})`);
      });
    }
  }
  console.log('---');

  // 4. Check all insights for this project
  console.log('4. Checking all insights for this project...');
  const { data: projectInsights, error: projectInsightError } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('project_id', meeting.project_id)
    .order('created_at', { ascending: false });

  if (projectInsightError) {
    console.error('❌ Error querying project insights:', projectInsightError.message);
  } else {
    console.log(`📈 Found ${projectInsights?.length || 0} total insights for project ${meeting.project_id}`);
    
    // Group by document_id vs meeting_id
    const byDocumentId = projectInsights?.filter(i => i.document_id) || [];
    const byMeetingId = projectInsights?.filter(i => i.meeting_id && !i.document_id) || [];
    
    console.log(`  - ${byDocumentId.length} insights with document_id`);
    console.log(`  - ${byMeetingId.length} insights with meeting_id only`);
    
    // Show some recent insights
    const recent = projectInsights?.slice(0, 5) || [];
    console.log('  Recent insights:');
    recent.forEach((insight, i) => {
      const source = insight.document_id ? `doc:${insight.document_id.slice(0, 8)}` : `meeting:${insight.meeting_id?.slice(0, 8) || 'none'}`;
      console.log(`    ${i + 1}. ${insight.title} (${source})`);
    });
  }
  console.log('---');

  // 5. Check ai_insights table structure
  console.log('5. Checking ai_insights table structure...');
  const { data: tableInfo, error: tableError } = await supabase
    .from('ai_insights')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('❌ Error checking table structure:', tableError.message);
  } else if (tableInfo && tableInfo.length > 0) {
    console.log('✅ Table fields available:');
    console.log(Object.keys(tableInfo[0]).join(', '));
  }
  console.log('---');

  // Summary and recommendation
  console.log('💡 SUMMARY & RECOMMENDATIONS:');
  const totalDocumentInsights = documentInsights?.length || 0;
  const totalMeetingInsights = meetingInsights?.length || 0;
  
  if (totalDocumentInsights === 0 && totalMeetingInsights === 0) {
    console.log('❌ No insights found for this meeting');
    console.log('🔧 ACTION: Need to generate insights for this document');
    console.log(`   Run: POST /api/generate-insights with { "documentId": "${meetingId}", "mode": "document" }`);
  } else if (totalDocumentInsights > 0) {
    console.log('✅ Document insights exist, meeting page should show them');
    console.log('🔧 ISSUE: Frontend is using wrong query field');
    console.log('   Fix: Change .eq("document_id", meetingId) in meeting page component');
  } else if (totalMeetingInsights > 0) {
    console.log('⚠️  Legacy meeting insights found, but meeting page uses document_id');
    console.log('🔧 FIX: Update meeting page to check both fields or migrate insights');
  }
}

debugMeetingInsights().catch(console.error);