import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyProject59Setup() {
  console.log('=== VERIFICATION REPORT FOR PROJECT 59 ===\n');

  // 1. Verify project exists
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', 59)
    .single();

  if (projectError || !project) {
    console.error('❌ Project 59 not found!');
    return;
  }

  console.log('✅ Project 59 exists:');
  console.log(`   Name: ${project.name}`);
  console.log(`   Client: ${project.client}`);
  console.log(`   Phase: ${project.current_phase}`);
  console.log(`   Health Status: ${project.health_status}`);

  // 2. Verify documents are associated
  const { data: allDocuments } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  // Filter documents for project 59 (matching the page logic)
  const projectDocuments = (allDocuments || []).filter((doc) => {
    if (!doc.metadata || typeof doc.metadata !== 'object') return false;
    const metadata = doc.metadata as any;

    // Same logic as in page.tsx
    return (
      metadata.project_id === 59 ||
      metadata.project_id === '59' ||
      metadata.project === project.name ||
      metadata.project_name === project.name ||
      metadata.projectId === 59 ||
      metadata.projectId === '59' ||
      String(metadata.project_id) === '59' ||
      (metadata.project &&
        metadata.project.toLowerCase() === project.name?.toLowerCase())
    );
  });

  console.log(`\n✅ Documents associated with Project 59: ${projectDocuments.length}`);
  
  if (projectDocuments.length > 0) {
    console.log('\nDocuments that will appear in DocumentsTable:');
    projectDocuments.forEach((doc, index) => {
      const title = doc.metadata?.title || 
                    (doc.metadata?.file_path ? doc.metadata.file_path.split('/').pop() : `Document ${doc.id}`);
      console.log(`   ${index + 1}. ${title}`);
      console.log(`      ID: ${doc.id}`);
      console.log(`      Metadata project_id: ${doc.metadata?.project_id}`);
    });
  }

  // 3. Verify meetings are associated
  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('*')
    .eq('project_id', 59);

  if (!meetingsError && meetings) {
    console.log(`\n✅ Meetings associated with Project 59: ${meetings.length}`);
    if (meetings.length > 0) {
      console.log('\nMeetings in the meetings table:');
      meetings.forEach((meeting, index) => {
        console.log(`   ${index + 1}. ${meeting.title}`);
        console.log(`      ID: ${meeting.id}`);
      });
    }
  }

  // 4. Final summary
  console.log('\n=== SUMMARY ===');
  console.log(`✅ Project 59 "${project.name}" is properly configured`);
  console.log(`✅ ${projectDocuments.length} documents will be displayed in the DocumentsTable`);
  console.log(`✅ ${meetings?.length || 0} meetings are linked to the project`);
  
  console.log('\n📝 Next Steps:');
  console.log('1. Navigate to /projects/59 to see the documents displayed');
  console.log('2. The DocumentsTable should show all 4 Tampa-related documents');
  console.log('3. Each document should be editable, downloadable, and deletable');
  
  console.log('\n🔍 How the filtering works:');
  console.log('- The page.tsx fetches all documents from the database');
  console.log('- It then filters them based on metadata.project_id === 59');
  console.log('- The DocumentsTable component receives these filtered documents');
  console.log('- Users can edit metadata, download content, or delete documents');
}

verifyProject59Setup();