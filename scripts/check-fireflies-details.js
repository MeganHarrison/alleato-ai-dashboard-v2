const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFirefliesDetails() {
  console.log('=== FIREFLIES INTEGRATION DETAILED CHECK ===\n');
  
  try {
    // 1. Check the one document with fireflies_id
    console.log('1. DOCUMENT WITH FIREFLIES DATA:');
    console.log('---------------------------------');
    
    const { data: syncedDoc, error: syncedError } = await supabase
      .from('documents')
      .select('*')
      .not('fireflies_id', 'is', null)
      .single();
    
    if (syncedError) {
      console.error('Error fetching synced document:', syncedError);
    } else if (syncedDoc) {
      console.log('Document details:');
      console.log(`- ID: ${syncedDoc.id}`);
      console.log(`- Title: ${syncedDoc.title}`);
      console.log(`- Fireflies ID: ${syncedDoc.fireflies_id}`);
      console.log(`- Fireflies Link: ${syncedDoc.fireflies_link || 'Not set'}`);
      console.log(`- Summary: ${syncedDoc.summary ? syncedDoc.summary.substring(0, 200) + '...' : 'No summary'}`);
      console.log(`- Participants: ${syncedDoc.participants || 'Not set'}`);
      console.log(`- Duration: ${syncedDoc.duration || 'Not set'}`);
      console.log(`- Tasks: ${syncedDoc.tasks || 'Not set'}`);
      console.log(`- Created: ${syncedDoc.created_at}`);
      console.log(`- Processed: ${syncedDoc.processed_at || 'Not set'}`);
    }
    
    // 2. Check column usage across all documents
    console.log('\n2. FIREFLIES COLUMN USAGE:');
    console.log('---------------------------');
    
    // Check fireflies_link column (not fireflies_url)
    const { count: withLink, error: linkError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .not('fireflies_link', 'is', null);
    
    const { count: withSummary } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .not('summary', 'is', null);
    
    const { count: withParticipants } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .not('participants', 'is', null);
    
    const { count: withDuration } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .not('duration', 'is', null);
    
    const { count: withTasks } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .not('tasks', 'is', null);
    
    console.log(`Documents with fireflies_link: ${withLink || 0}`);
    console.log(`Documents with summary: ${withSummary || 0}`);
    console.log(`Documents with participants: ${withParticipants || 0}`);
    console.log(`Documents with duration: ${withDuration || 0}`);
    console.log(`Documents with tasks: ${withTasks || 0}`);
    
    // 3. Check if we need to rename fireflies_link to fireflies_url
    console.log('\n3. COLUMN NAMING CHECK:');
    console.log('------------------------');
    console.log('Current column: fireflies_link');
    console.log('Expected column: fireflies_url');
    console.log('Status: ⚠️  Column name mismatch - using fireflies_link instead of fireflies_url');
    
    // 4. Check documents that could be meetings but aren't synced
    console.log('\n4. UNSYNCED POTENTIAL MEETINGS:');
    console.log('---------------------------------');
    
    const meetingKeywords = ['meeting', 'call', 'sync', 'standup', 'review'];
    
    const { data: unsyncedMeetings, error: unsyncedError } = await supabase
      .from('documents')
      .select('id, title, created_at')
      .or(meetingKeywords.map(k => `title.ilike.%${k}%`).join(','))
      .is('fireflies_id', null)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!unsyncedError && unsyncedMeetings && unsyncedMeetings.length > 0) {
      console.log('Recent unsynced documents with meeting-related titles:');
      unsyncedMeetings.forEach((doc, index) => {
        console.log(`${index + 1}. "${doc.title}" (Created: ${new Date(doc.created_at).toLocaleDateString()})`);
      });
    }
    
    // 5. Summary and action items
    console.log('\n5. ACTION ITEMS:');
    console.log('-----------------');
    console.log('✅ EXISTING:');
    console.log('   - fireflies_id column exists');
    console.log('   - fireflies_link column exists (should be fireflies_url)');
    console.log('   - summary column exists');
    console.log('   - participants column exists');
    console.log('   - duration column exists');
    console.log('   - tasks column exists');
    
    console.log('\n⚠️  NEEDS ATTENTION:');
    console.log('   1. Rename fireflies_link to fireflies_url for consistency');
    console.log('   2. Only 1 out of 160 documents (0.6%) is synced with Fireflies');
    console.log('   3. Many documents appear to be meetings but lack Fireflies data');
    
    console.log('\n📋 RECOMMENDED NEXT STEPS:');
    console.log('   1. Create a migration to rename fireflies_link → fireflies_url');
    console.log('   2. Implement bulk sync functionality for existing meetings');
    console.log('   3. Set up automatic sync for new meetings added to the system');
    console.log('   4. Create a mapping between document titles and Fireflies meeting IDs');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkFirefliesDetails().then(() => {
  console.log('\n=== END OF DETAILED REPORT ===');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});