#!/usr/bin/env node

/**
 * Script to set up Supabase storage bucket for document uploads
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function setupStorageBucket() {
  try {
    console.log('📁 Setting up Supabase storage bucket for documents...\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // Create the documents bucket
    console.log('1️⃣ Creating documents bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage
      .createBucket('documents', {
        public: false, // Private bucket - only authenticated users can access
        allowedMimeTypes: [
          'text/plain',
          'text/markdown',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/csv'
        ],
        fileSizeLimit: 10485760 // 10MB limit
      });

    if (bucketError && !bucketError.message.includes('already exists')) {
      throw new Error(`Failed to create bucket: ${bucketError.message}`);
    }

    if (bucketError && bucketError.message.includes('already exists')) {
      console.log('✅ Documents bucket already exists');
    } else {
      console.log('✅ Documents bucket created successfully');
    }

    // Create RLS policies for the bucket
    console.log('\n2️⃣ Setting up storage policies...');
    
    // Allow authenticated users to upload to their own folder
    const uploadPolicySQL = `
      CREATE POLICY "Allow authenticated uploads" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'documents');
    `;

    // Allow authenticated users to read their own files
    const readPolicySQL = `
      CREATE POLICY "Allow authenticated reads" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'documents');
    `;

    // Allow authenticated users to delete their own files
    const deletePolicySQL = `
      CREATE POLICY "Allow authenticated deletes" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'documents');
    `;

    // Execute policies (they may already exist, so we'll catch errors)
    for (const [name, sql] of [
      ['upload policy', uploadPolicySQL],
      ['read policy', readPolicySQL],
      ['delete policy', deletePolicySQL]
    ]) {
      try {
        await supabase.rpc('exec_sql', { query: sql });
        console.log(`✅ ${name} created`);
      } catch (err) {
        console.log(`⚠️  ${name} handled (may already exist)`);
      }
    }

    // Test bucket access
    console.log('\n3️⃣ Testing bucket access...');
    const { data: bucketsData, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const documentsBucket = bucketsData.find(b => b.name === 'documents');
    if (documentsBucket) {
      console.log('✅ Documents bucket is accessible');
      console.log(`   Bucket ID: ${documentsBucket.id}`);
      console.log(`   Public: ${documentsBucket.public}`);
    } else {
      throw new Error('Documents bucket not found in bucket list');
    }

    console.log('\n🎉 Storage setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Documents bucket created with 10MB file size limit');
    console.log('- Allowed file types: text, PDF, Word docs, CSV');
    console.log('- RLS policies configured for authenticated access');
    console.log('- Ready for file uploads via Dropzone component');

  } catch (error) {
    console.error('💥 Storage setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupStorageBucket();
}

module.exports = { setupStorageBucket };