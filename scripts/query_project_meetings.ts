import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryMeetings() {
  try {
    // 1. Check meetings table for project 59
    console.log('\n=== CHECKING MEETINGS TABLE FOR PROJECT 59 ===');
    
    // First get all meetings to see structure
    const { data: allMeetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: false })
      .limit(10);

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
    } else {
      console.log(`\nSample of recent meetings (first 10):`);
      allMeetings?.forEach((meeting, index) => {
        console.log(`\nMeeting ${index + 1}:`);
        console.log(`- ID: ${meeting.id}`);
        console.log(`- Title: ${meeting.title}`);
        console.log(`- Project ID: ${meeting.project_id}`);
        console.log(`- Meeting Date: ${meeting.meeting_date}`);
        console.log(`- Participants: ${meeting.participants}`);
      });
    }

    // 2. Check for meetings with project_id = 59
    const { data: project59Meetings, error: project59Error } = await supabase
      .from('meetings')
      .select('*')
      .eq('project_id', 59);

    if (project59Error) {
      console.error('Error fetching project 59 meetings:', project59Error);
    } else {
      console.log(`\n=== MEETINGS FOR PROJECT 59 ===`);
      if (project59Meetings && project59Meetings.length > 0) {
        console.log(`Found ${project59Meetings.length} meetings for project 59:`);
        project59Meetings.forEach(meeting => {
          console.log(`\n- Meeting ID: ${meeting.id}`);
          console.log(`  Title: ${meeting.title}`);
          console.log(`  Date: ${meeting.meeting_date}`);
          console.log(`  Participants: ${meeting.participants}`);
        });
      } else {
        console.log('No meetings found with project_id = 59');
      }
    }

    // 3. Search for Tampa-related meetings by title
    const { data: tampaMeetings, error: tampaError } = await supabase
      .from('meetings')
      .select('*')
      .or('title.ilike.%tampa%,title.ilike.%event%,title.ilike.%party%');

    if (tampaError) {
      console.error('Error searching Tampa meetings:', tampaError);
    } else {
      console.log(`\n=== TAMPA-RELATED MEETINGS (by title) ===`);
      if (tampaMeetings && tampaMeetings.length > 0) {
        console.log(`Found ${tampaMeetings.length} Tampa-related meetings:`);
        tampaMeetings.forEach(meeting => {
          console.log(`\n- Meeting ID: ${meeting.id}`);
          console.log(`  Title: ${meeting.title}`);
          console.log(`  Project ID: ${meeting.project_id}`);
          console.log(`  Date: ${meeting.meeting_date}`);
        });
      } else {
        console.log('No Tampa-related meetings found');
      }
    }

    // 4. Check documents with Tampa in title (should be meetings)
    console.log(`\n=== DOCUMENTS WITH TAMPA IN TITLE ===`);
    const { data: tampaDocs, error: tampaDocsError } = await supabase
      .from('documents')
      .select('id, title, metadata, created_at')
      .or('title.ilike.%tampa%');

    if (tampaDocsError) {
      console.error('Error searching Tampa documents:', tampaDocsError);
    } else if (tampaDocs && tampaDocs.length > 0) {
      console.log(`Found ${tampaDocs.length} Tampa-related documents:`);
      
      // These documents appear to be meeting transcripts
      // Let's associate them with project 59
      const documentIds = tampaDocs.map(doc => {
        console.log(`\n- Document ID: ${doc.id}`);
        console.log(`  Title: ${doc.title}`);
        console.log(`  Created: ${doc.created_at}`);
        
        // Check if metadata has fireflies_id (indicates it's a meeting)
        const metadata = typeof doc.metadata === 'string' 
          ? JSON.parse(doc.metadata) 
          : doc.metadata;
        
        if ((metadata as any)?.fireflies_id) {
          console.log(`  Meeting ID (Fireflies): ${(metadata as any).fireflies_id}`);
          console.log(`  Meeting Date: ${new Date((metadata as any).meeting_date).toLocaleDateString()}`);
        }
        
        return doc.id;
      });
      
      console.log(`\n=== RECOMMENDATION ===`);
      console.log(`Found ${tampaDocs.length} Tampa-related documents that should be associated with Project 59.`);
      console.log(`These documents appear to be meeting transcripts based on their metadata.`);
      console.log(`\nDocument IDs to associate with Project 59:`);
      documentIds.forEach(id => console.log(`- ${id}`));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

queryMeetings();