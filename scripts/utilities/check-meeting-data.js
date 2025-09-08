const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
);

async function checkMeetingData() {
  console.log('Checking meeting data...\n');
  
  // Get recent meetings
  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('id, title, transcript, summary, date')
    .order('date', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('Error fetching meetings:', error);
    return;
  }
  
  if (!meetings || meetings.length === 0) {
    console.log('No meetings found');
    return;
  }
  
  console.log(`Found ${meetings.length} meetings:\n`);
  
  meetings.forEach(m => {
    console.log(`📅 ${m.title || 'Untitled'} (${m.id})`);
    console.log(`   Date: ${m.date}`);
    console.log(`   Has transcript: ${!!m.transcript} ${m.transcript ? `(${m.transcript.length} chars)` : ''}`);
    console.log(`   Has summary: ${!!m.summary} ${m.summary ? `(${m.summary.length} chars)` : ''}`);
    console.log('---');
  });
  
  // Check for meeting chunks
  console.log('\n📊 Checking meeting chunks...\n');
  
  for (const meeting of meetings.slice(0, 3)) {
    const { count } = await supabase
      .from('meeting_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('meeting_id', meeting.id);
      
    console.log(`${meeting.title || meeting.id}: ${count || 0} chunks`);
  }
}

checkMeetingData().catch(console.error);