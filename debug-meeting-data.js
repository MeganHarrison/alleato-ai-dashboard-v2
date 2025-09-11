const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMeetingData() {
  try {
    console.log('🔍 Fetching meeting data...');
    
    const { data: meeting, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', '31891fe4-b67c-44aa-a994-222c94b272a6')
      .single();
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('📄 Meeting data fields:');
    Object.keys(meeting || {}).forEach(key => {
      const value = meeting[key];
      if (typeof value === 'string' && value.length > 100) {
        console.log(`  ${key}: "${value.substring(0, 100)}..." (${value.length} chars)`);
      } else {
        console.log(`  ${key}:`, value);
      }
    });
    
    // Check if there's a separate transcript
    if (meeting.transcript_url) {
      console.log('\n📝 Found transcript_url:', meeting.transcript_url);
      
      // Try to fetch from storage if it's a storage path
      if (meeting.transcript_url.includes('supabase.co') || meeting.transcript_url.includes('storage')) {
        try {
          const response = await fetch(meeting.transcript_url);
          const transcriptContent = await response.text();
          console.log('📄 Transcript content preview:', transcriptContent.substring(0, 500) + '...');
        } catch (e) {
          console.log('❌ Could not fetch transcript from URL:', e.message);
        }
      }
    }
    
    // Check the content field
    if (meeting.content) {
      console.log('\n📝 Content field preview:');
      console.log(meeting.content.substring(0, 500) + '...');
      
      // Check if this looks like a transcript (has speaker names, timestamps, etc.)
      const looksLikeTranscript = meeting.content.includes(':') && 
                                 (meeting.content.includes('Speaker') || 
                                  meeting.content.includes('00:') ||
                                  meeting.content.toLowerCase().includes('transcript'));
      console.log('🎙️ Content looks like a transcript:', looksLikeTranscript);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugMeetingData();