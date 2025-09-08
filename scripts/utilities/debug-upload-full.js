#!/usr/bin/env node

/**
 * Complete debug script for upload issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUpload() {
  console.log('🔍 COMPLETE UPLOAD DEBUG\n');
  console.log('========================\n');
  
  // 1. Check bucket
  console.log('1️⃣ Storage Bucket Check:');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.error('❌ Bucket error:', bucketError);
  } else {
    const docBucket = buckets?.find(b => b.name === 'documents');
    console.log(docBucket ? '✅ "documents" bucket exists' : '❌ "documents" bucket NOT FOUND');
  }
  
  // 2. Check tables
  console.log('\n2️⃣ Database Tables Check:');
  const tables = ['documents', 'document_chunks', 'chat_history', 'processing_queue'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: EXISTS (${count || 0} records)`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
  
  // 3. Check columns in documents table
  console.log('\n3️⃣ Documents Table Columns:');
  const { data: testInsert, error: insertError } = await supabase
    .from('documents')
    .select('*')
    .limit(0);
  
  if (insertError) {
    console.log('❌ Cannot query documents table:', insertError.message);
  } else {
    console.log('✅ Documents table structure OK');
    // Try to list columns
    const { data: oneRow } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (oneRow && oneRow.length > 0) {
      console.log('   Columns:', Object.keys(oneRow[0]).join(', '));
    }
  }
  
  // 4. Test actual upload flow
  console.log('\n4️⃣ Testing Upload Flow:');
  
  // Create test file
  const testContent = `Test Upload Debug ${new Date().toISOString()}`;
  const blob = new Blob([testContent], { type: 'text/plain' });
  const file = new File([blob], `debug-${Date.now()}.txt`, { type: 'text/plain' });
  
  console.log('📄 Test file created');
  
  // Try storage upload
  const filePath = `test/debug-${Date.now()}.txt`;
  console.log('⏳ Uploading to storage...');
  
  const { data: storageData, error: storageError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);
  
  if (storageError) {
    console.log('❌ Storage upload failed:', storageError.message);
    return;
  }
  
  console.log('✅ Storage upload successful:', storageData.path);
  
  // Try database insert
  console.log('⏳ Creating database record...');
  
  const { data: dbData, error: dbError } = await supabase
    .from('documents')
    .insert({
      title: 'Debug Test Document',
      source: 'Debug Script',
      file_path: storageData.path,
      file_type: 'text/plain',
      file_size: file.size,
      content: '', // Provide empty content initially
      status: 'pending',
      user_id: null, // Service key doesn't have user_id
      metadata: { test: true }
    })
    .select()
    .single();
  
  if (dbError) {
    console.log('❌ Database insert failed:', dbError.message);
    console.log('   Error details:', dbError);
    
    // Clean up storage
    await supabase.storage.from('documents').remove([filePath]);
  } else {
    console.log('✅ Database record created:', dbData.id);
    
    // Clean up
    await supabase.from('documents').delete().eq('id', dbData.id);
    await supabase.storage.from('documents').remove([filePath]);
    console.log('🧹 Cleaned up test data');
  }
  
  // 5. Check for stuck processing jobs
  console.log('\n5️⃣ Processing Queue Status:');
  const { data: queue, error: queueError } = await supabase
    .from('processing_queue')
    .select('*')
    .in('status', ['queued', 'processing'])
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (queueError) {
    console.log('❌ Cannot check queue:', queueError.message);
  } else if (queue && queue.length > 0) {
    console.log(`⚠️ ${queue.length} jobs in queue:`);
    queue.forEach(job => {
      console.log(`   - ${job.job_type} (${job.status}) - Created: ${job.created_at}`);
    });
  } else {
    console.log('✅ Queue is empty');
  }
  
  // 6. Check recent errors
  console.log('\n6️⃣ Recent Failed Documents:');
  const { data: failed, error: failedError } = await supabase
    .from('documents')
    .select('id, title, error_message, created_at')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (failed && failed.length > 0) {
    console.log('❌ Found failed documents:');
    failed.forEach(doc => {
      console.log(`   - ${doc.title}: ${doc.error_message || 'No error message'}`);
    });
  } else {
    console.log('✅ No failed documents');
  }
  
  console.log('\n========================');
  console.log('🎯 DIAGNOSIS COMPLETE\n');
  
  // Summary
  console.log('Summary:');
  console.log('- Storage: ' + (storageData ? '✅ Working' : '❌ Not working'));
  console.log('- Database: ' + (!dbError ? '✅ Working' : '❌ Not working'));
  console.log('- Full flow: ' + (storageData && !dbError ? '✅ Working' : '❌ Has issues'));
  
  if (dbError) {
    console.log('\n⚠️ Main Issue: Database operations failing');
    console.log('   Likely cause: Missing columns or RLS policies');
    console.log('   Solution: Run the SQL migrations to add missing columns');
  }
}

debugUpload().catch(console.error);