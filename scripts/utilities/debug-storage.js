#!/usr/bin/env node

/**
 * Debug script to check storage bucket configuration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugStorage() {
  try {
    console.log('🔍 Debugging Supabase Storage Configuration...\n');

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    console.log('1️⃣ Environment Variables:');
    console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   ANON_KEY: ${anonKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SERVICE_KEY: ${serviceKey ? '✅ Set' : '❌ Missing'}`);

    if (!supabaseUrl || !anonKey) {
      throw new Error('Missing required environment variables');
    }

    // Test with anon client (what the app uses)
    console.log('\n2️⃣ Testing with Anon Client:');
    const anonClient = createClient(supabaseUrl, anonKey);
    
    // List buckets with anon client
    const { data: anonBuckets, error: anonListError } = await anonClient.storage.listBuckets();
    
    if (anonListError) {
      console.log(`   ❌ Cannot list buckets with anon key: ${anonListError.message}`);
    } else {
      console.log(`   ✅ Can list buckets: ${anonBuckets?.length || 0} found`);
      anonBuckets?.forEach(bucket => {
        console.log(`      - ${bucket.name} (Public: ${bucket.public})`);
      });
    }

    // Try to upload with anon client
    const testContent = 'Test upload with anon client';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test/anon-test-${Date.now()}.txt`;
    
    console.log(`\n   Testing upload to documents bucket...`);
    const { data: anonUpload, error: anonUploadError } = await anonClient.storage
      .from('documents')
      .upload(testFileName, testFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (anonUploadError) {
      console.log(`   ❌ Anon upload failed: ${anonUploadError.message}`);
      console.log(`      Error details: ${JSON.stringify(anonUploadError)}`);
    } else {
      console.log(`   ✅ Anon upload successful!`);
      console.log(`      File path: ${anonUpload.path}`);
      
      // Clean up
      await anonClient.storage.from('documents').remove([anonUpload.path]);
      console.log(`      Test file cleaned up`);
    }

    // Test with service client if available
    if (serviceKey) {
      console.log('\n3️⃣ Testing with Service Client:');
      const serviceClient = createClient(supabaseUrl, serviceKey);
      
      // List buckets
      const { data: serviceBuckets, error: serviceListError } = await serviceClient.storage.listBuckets();
      
      if (serviceListError) {
        console.log(`   ❌ Cannot list buckets: ${serviceListError.message}`);
      } else {
        console.log(`   ✅ Buckets found: ${serviceBuckets?.length || 0}`);
        
        const docBucket = serviceBuckets?.find(b => b.name === 'documents');
        if (docBucket) {
          console.log('\n4️⃣ Documents Bucket Configuration:');
          console.log(`   Name: ${docBucket.name}`);
          console.log(`   ID: ${docBucket.id}`);
          console.log(`   Public: ${docBucket.public}`);
          console.log(`   Created: ${docBucket.created_at}`);
          console.log(`   Updated: ${docBucket.updated_at}`);
          console.log(`   File size limit: ${docBucket.file_size_limit || 'No limit'}`);
          console.log(`   Allowed MIME types: ${docBucket.allowed_mime_types?.join(', ') || 'All types'}`);
        } else {
          console.log('   ❌ Documents bucket not found');
        }
      }

      // Get bucket details directly
      console.log('\n5️⃣ Checking Bucket Existence:');
      const { data: bucketExists, error: bucketError } = await serviceClient.storage.getBucket('documents');
      
      if (bucketError) {
        console.log(`   ❌ Bucket check failed: ${bucketError.message}`);
        
        // Try to create it
        console.log('\n   Attempting to create documents bucket...');
        const { data: newBucket, error: createError } = await serviceClient.storage.createBucket('documents', {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: ['text/plain', 'text/markdown', 'text/csv']
        });
        
        if (createError) {
          console.log(`   ❌ Could not create bucket: ${createError.message}`);
        } else {
          console.log(`   ✅ Bucket created successfully!`);
        }
      } else {
        console.log(`   ✅ Documents bucket exists`);
      }
    }

    console.log('\n🎯 Debugging Summary:');
    console.log('- Check the console output above for specific issues');
    console.log('- If anon upload fails, the bucket may need different RLS policies');
    console.log('- Visit Supabase dashboard to manually check/fix bucket settings');

  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
}

if (require.main === module) {
  debugStorage();
}

module.exports = { debugStorage };