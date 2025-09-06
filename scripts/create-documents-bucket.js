#!/usr/bin/env node

/**
 * Script to create the "documents" storage bucket in Supabase
 * Run this to fix the storage bucket error
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
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Please ensure you have:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDocumentsBucket() {
  console.log('🚀 Creating "documents" storage bucket...\n');
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return false;
    }
    
    const documentsBucketExists = buckets?.some(b => b.name === 'documents');
    
    if (documentsBucketExists) {
      console.log('✅ Bucket "documents" already exists!');
      return true;
    }
    
    // Create the documents bucket
    console.log('📦 Creating new bucket: documents');
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/json',
        'text/csv'
      ],
      fileSizeLimit: 52428800 // 50MB
    });
    
    if (error) {
      console.error('❌ Error creating bucket:', error);
      return false;
    }
    
    console.log('✅ Successfully created "documents" bucket!');
    console.log('   - Maximum file size: 50MB');
    console.log('   - Allowed types: PDF, TXT, MD, DOCX, DOC, JSON, CSV');
    
    // Create RLS policies for the bucket
    console.log('\n📝 Setting up RLS policies...');
    
    // Note: RLS policies need to be created via SQL
    console.log('\n⚠️  Important: Run the following SQL in Supabase SQL Editor to set up policies:\n');
    console.log(`
-- Storage policies for documents bucket
CREATE POLICY "Users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND 
        (auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can view documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND 
        (auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can update documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' AND 
        (auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can delete documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND 
        (auth.uid() IS NOT NULL)
    );
    `);
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('    Documents Bucket Creation Tool     ');
  console.log('========================================\n');
  
  const success = await createDocumentsBucket();
  
  if (success) {
    console.log('\n✅ Setup complete! Your RAG system can now upload documents.');
    console.log('\nNext steps:');
    console.log('1. Run the SQL policies shown above in Supabase SQL Editor');
    console.log('2. Test file upload in your application');
  } else {
    console.log('\n❌ Setup failed. Please check the errors above.');
    console.log('\nTroubleshooting:');
    console.log('1. Verify your Supabase credentials are correct');
    console.log('2. Ensure you\'re using a service role key (not anon key)');
    console.log('3. Check Supabase dashboard for any issues');
  }
}

main().catch(console.error);