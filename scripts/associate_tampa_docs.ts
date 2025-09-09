import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function associateDocumentsWithProject() {
  try {
    // Tampa document IDs that need to be associated with project 59
    const tampaDocumentIds = [
      '6f1de4be-6bd8-4023-b86d-0ac9a144d57a',  // Tampa/ Alleato Group
      'c4a7658e-96ea-4000-9b38-dac9aa4ad7c3',  // Tampa event follow up
      '39b280c5-a2ab-4fa9-9e6c-617787225414',  // Tampa event follow up
      '786e63bd-01b3-455b-a9ac-df5e9e39e615'   // Tampa event follow up
    ];

    // Tampa meeting IDs
    const tampaMeetingIds = [
      '83c4f69c-343c-46c4-a8fc-78892507f221',  // Tampa/ Alleato Group
      '06e1ea61-54e5-4c36-8518-d83aec7c0812',  // Tampa event follow up
      '3e078c9b-5820-4d11-9d82-3dffa668ae58',  // Tampa event follow up
      'e8de2da6-5e0c-4381-bcd4-338569902e9f'   // Tampa event follow up
    ];

    console.log('=== UPDATING DOCUMENTS WITH PROJECT ASSOCIATION ===\n');

    // Update each document's metadata to include project_id
    for (const docId of tampaDocumentIds) {
      // First fetch the current document
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('metadata, title')
        .eq('id', docId)
        .single();

      if (fetchError) {
        console.error(`Error fetching document ${docId}:`, fetchError);
        continue;
      }

      // Parse existing metadata
      let metadata = typeof doc.metadata === 'string' 
        ? JSON.parse(doc.metadata) 
        : doc.metadata || {};

      // Add project_id to metadata
      metadata.project_id = 59;
      metadata.project_name = 'Tampa Event/Party';

      // Update the document
      const { error: updateError } = await supabase
        .from('documents')
        .update({ metadata })
        .eq('id', docId);

      if (updateError) {
        console.error(`Error updating document ${docId}:`, updateError);
      } else {
        console.log(`✅ Updated document: ${doc.title} (${docId})`);
        console.log(`   Added project_id: 59 and project_name: "Tampa Event/Party"`);
      }
    }

    console.log('\n=== CREATING MEETING-DOCUMENT ASSOCIATIONS ===\n');

    // Create associations in meeting_documents table if it exists
    const { error: tableError } = await supabase
      .from('meeting_documents')
      .select('id')
      .limit(1);

    if (!tableError) {
      // Table exists, create associations
      const associations = [];
      
      // Map each meeting to its corresponding document based on title
      for (let i = 0; i < tampaMeetingIds.length; i++) {
        associations.push({
          meeting_id: tampaMeetingIds[i],
          document_id: tampaDocumentIds[i]
        });
      }

      const { error: insertError } = await supabase
        .from('meeting_documents')
        .insert(associations);

      if (insertError) {
        console.error('Error creating meeting-document associations:', insertError);
      } else {
        console.log('✅ Created meeting-document associations');
        associations.forEach(a => {
          console.log(`   Meeting ${a.meeting_id} -> Document ${a.document_id}`);
        });
      }
    } else {
      console.log('ℹ️  meeting_documents table does not exist, skipping associations');
    }

    console.log('\n=== VERIFICATION ===\n');

    // Verify the updates
    const { data: updatedDocs, error: verifyError } = await supabase
      .from('documents')
      .select('id, title, metadata')
      .in('id', tampaDocumentIds);

    if (verifyError) {
      console.error('Error verifying updates:', verifyError);
    } else {
      console.log('Verified document updates:');
      updatedDocs?.forEach(doc => {
        const metadata = typeof doc.metadata === 'string' 
          ? JSON.parse(doc.metadata) 
          : doc.metadata;
        console.log(`\n- ${doc.title}`);
        console.log(`  Project ID: ${metadata?.project_id}`);
        console.log(`  Project Name: ${metadata?.project_name}`);
      });
    }

    console.log('\n✅ All updates completed successfully!');
    console.log('\nThe DocumentsTable on the project page should now display these 4 documents for Project 59.');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the association
associateDocumentsWithProject();