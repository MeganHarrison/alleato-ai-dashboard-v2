const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFirefliesData() {
  console.log('=== FIREFLIES DATA STATUS REPORT ===\n');
  
  try {
    // First, check the table structure
    console.log('1. CHECKING TABLE STRUCTURE:');
    console.log('----------------------------');
    
    // Get a sample row to see the columns
    const { data: sampleRow, error: sampleError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error fetching sample row:', sampleError);
    } else if (sampleRow && sampleRow.length > 0) {
      const columns = Object.keys(sampleRow[0]);
      console.log('Available columns:', columns.join(', '));
      
      // Check for Fireflies-specific columns
      const hasFirefliesId = columns.includes('fireflies_id');
      const hasFirefliesUrl = columns.includes('fireflies_url');
      const hasSummary = columns.includes('summary');
      
      console.log('\nFireflies columns status:');
      console.log(`- fireflies_id: ${hasFirefliesId ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`- fireflies_url: ${hasFirefliesUrl ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`- summary: ${hasSummary ? '✅ EXISTS' : '❌ MISSING'}`);
    }
    
    // Get total document count
    console.log('\n2. DOCUMENT STATISTICS:');
    console.log('------------------------');
    
    const { count: totalCount, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting documents:', countError);
    } else {
      console.log(`Total documents: ${totalCount}`);
    }
    
    // Get count of documents with fireflies_id
    const { count: firefliesCount, error: firefliesCountError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .not('fireflies_id', 'is', null);
    
    if (firefliesCountError) {
      console.log('Note: fireflies_id column may not exist');
    } else {
      console.log(`Documents with fireflies_id: ${firefliesCount}`);
      console.log(`Percentage synced: ${totalCount > 0 ? ((firefliesCount / totalCount) * 100).toFixed(1) : 0}%`);
    }
    
    // Get sample of document titles
    console.log('\n3. SAMPLE DOCUMENT TITLES:');
    console.log('---------------------------');
    
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title, fireflies_id, fireflies_url, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (docsError) {
      // If specific columns don't exist, try with just basic columns
      const { data: basicDocs, error: basicError } = await supabase
        .from('documents')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (basicError) {
        console.error('Error fetching documents:', basicError);
      } else {
        console.log('Recent documents (basic info only):');
        basicDocs.forEach((doc, index) => {
          console.log(`${index + 1}. Title: "${doc.title || 'No title'}" (ID: ${doc.id})`);
        });
      }
    } else {
      console.log('Recent documents:');
      documents.forEach((doc, index) => {
        const syncStatus = doc.fireflies_id ? '✅ Synced' : '❌ Not synced';
        console.log(`${index + 1}. Title: "${doc.title || 'No title'}" ${syncStatus}`);
        if (doc.fireflies_id) {
          console.log(`   - Fireflies ID: ${doc.fireflies_id}`);
          console.log(`   - URL: ${doc.fireflies_url || 'No URL'}`);
        }
      });
    }
    
    // Check for documents that might be meetings (based on title patterns)
    console.log('\n4. POTENTIAL MEETING DOCUMENTS:');
    console.log('---------------------------------');
    
    const meetingKeywords = ['meeting', 'call', 'sync', 'standup', 'review', 'discussion', 'chat'];
    const searchPattern = meetingKeywords.map(k => `%${k}%`).join(',');
    
    const { data: potentialMeetings, error: meetingError } = await supabase
      .from('documents')
      .select('id, title')
      .or(meetingKeywords.map(k => `title.ilike.%${k}%`).join(','))
      .limit(5);
    
    if (meetingError) {
      console.error('Error searching for meetings:', meetingError);
    } else if (potentialMeetings && potentialMeetings.length > 0) {
      console.log('Documents with meeting-related titles:');
      potentialMeetings.forEach((doc, index) => {
        console.log(`${index + 1}. "${doc.title}"`);
      });
    } else {
      console.log('No documents found with meeting-related keywords in title');
    }
    
    // Summary and recommendations
    console.log('\n5. SUMMARY & RECOMMENDATIONS:');
    console.log('------------------------------');
    
    if (firefliesCount === undefined) {
      console.log('⚠️  The fireflies_id column appears to be missing from the documents table');
      console.log('📋 Action needed: Add fireflies_id, fireflies_url, and summary columns to the table');
      console.log('\nSuggested SQL migration:');
      console.log(`
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS fireflies_id TEXT,
ADD COLUMN IF NOT EXISTS fireflies_url TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_fireflies_id 
ON documents(fireflies_id) 
WHERE fireflies_id IS NOT NULL;
      `);
    } else if (firefliesCount === 0) {
      console.log('⚠️  No documents are currently synced with Fireflies');
      console.log('📋 Action needed: Implement Fireflies sync to populate fireflies_id and related data');
    } else {
      console.log(`✅ ${firefliesCount} documents are synced with Fireflies`);
      if (firefliesCount < totalCount) {
        console.log(`📋 ${totalCount - firefliesCount} documents still need to be synced`);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkFirefliesData().then(() => {
  console.log('\n=== END OF REPORT ===');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});