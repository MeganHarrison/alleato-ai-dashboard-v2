const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUploadedDocuments() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    console.log('📄 Checking uploaded documents in rag_documents table...\n');

    // Check documents in database
    const { data: documents, error: docError } = await supabase
      .from('rag_documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (docError) {
      console.error('❌ Error fetching documents:', docError.message);
      return;
    }

    console.log(`Found ${documents.length} documents:`);
    documents.forEach((doc, index) => {
      console.log(`\n${index + 1}. ${doc.title}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Status: ${doc.status}`);
      console.log(`   File Type: ${doc.file_type}`);
      console.log(`   File Size: ${doc.file_size} bytes`);
      console.log(`   File Path: ${doc.file_path}`);
      console.log(`   Created: ${new Date(doc.created_at).toLocaleString()}`);
      console.log(`   Tags: ${doc.tags?.join(', ') || 'none'}`);
      console.log(`   Category: ${doc.category || 'none'}`);
    });

    // Check storage files
    console.log('\n🗂️ Checking storage files...');
    const { data: files, error: filesError } = await supabase.storage
      .from('rag_documents')
      .list('documents', { limit: 10 });

    if (filesError) {
      console.error('❌ Error listing files:', filesError.message);
      return;
    }

    console.log(`Found ${files.length} files in storage:`);
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'} bytes)`);
    });

    // Check if our specific test file exists
    const testDocument = documents.find(doc => doc.title.includes('test-document-upload'));
    if (testDocument) {
      console.log('\n✅ Test document found successfully!');
      console.log('   This confirms the table name fix worked and upload is functional.');
    } else {
      console.log('\n⚠️ Test document not found in database.');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkUploadedDocuments();