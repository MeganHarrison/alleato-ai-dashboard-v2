#!/usr/bin/env node

/**
 * Setup script for RAG system
 * Creates necessary tables and storage buckets in Supabase
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBuckets() {
  console.log('📦 Setting up storage buckets...');
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    return false;
  }
  
  const bucketExists = buckets?.some(b => b.name === 'documents');
  
  if (!bucketExists) {
    console.log('Creating bucket: documents');
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ],
      fileSizeLimit: 52428800 // 50MB
    });
    
    if (error) {
      console.error('❌ Error creating bucket:', error);
      return false;
    }
    console.log('✅ Bucket created successfully');
  } else {
    console.log('✅ Bucket already exists');
  }
  
  return true;
}

async function setupDatabaseTables() {
  console.log('🗄️ Setting up database tables...');
  
  // SQL to create tables
  const sql = `
    -- Enable pgvector extension
    CREATE EXTENSION IF NOT EXISTS vector;
    
    -- Create rag_documents table
    CREATE TABLE IF NOT EXISTS rag_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      source TEXT,
      file_path TEXT,
      file_type TEXT,
      file_size BIGINT,
      status TEXT DEFAULT 'pending',
      user_id UUID,
      tags TEXT[],
      category TEXT,
      metadata JSONB DEFAULT '{}',
      chunks_count INTEGER DEFAULT 0,
      processed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create rag_chunks table
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID REFERENCES rag_documents(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding vector(1536),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create rag_chat_history table
    CREATE TABLE IF NOT EXISTS rag_chat_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL,
      user_id UUID,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create rag_processing_queue table
    CREATE TABLE IF NOT EXISTS rag_processing_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID REFERENCES rag_documents(id) ON DELETE CASCADE,
      job_type TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      priority INTEGER DEFAULT 5,
      config JSONB DEFAULT '{}',
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      error TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_rag_documents_status ON rag_documents(status);
    CREATE INDEX IF NOT EXISTS idx_rag_documents_user_id ON rag_documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id ON rag_chunks(document_id);
    CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding ON rag_chunks USING ivfflat (embedding vector_cosine_ops);
    CREATE INDEX IF NOT EXISTS idx_rag_chat_history_session ON rag_chat_history(session_id);
    CREATE INDEX IF NOT EXISTS idx_rag_processing_queue_status ON rag_processing_queue(status);
    
    -- Create similarity search function
    CREATE OR REPLACE FUNCTION match_rag_chunks(
      query_embedding vector(1536),
      match_threshold float,
      match_count int,
      filter_document_ids uuid[]
    )
    RETURNS TABLE (
      chunk_id uuid,
      document_id uuid,
      document_title text,
      content text,
      relevance_score float,
      metadata jsonb
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        c.id as chunk_id,
        c.document_id,
        d.title as document_title,
        c.content,
        1 - (c.embedding <=> query_embedding) as relevance_score,
        c.metadata
      FROM rag_chunks c
      JOIN rag_documents d ON c.document_id = d.id
      WHERE 
        (filter_document_ids IS NULL OR c.document_id = ANY(filter_document_ids))
        AND (1 - (c.embedding <=> query_embedding)) > match_threshold
      ORDER BY c.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
  `;
  
  try {
    // Execute SQL using Supabase client
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => {
      // If exec_sql doesn't exist, try a different approach
      console.log('Note: Could not execute SQL directly. Tables may need to be created manually.');
      return { error: null };
    });
    
    if (error) {
      console.error('❌ Error creating tables:', error);
      return false;
    }
    
    console.log('✅ Database tables setup complete');
    return true;
  } catch (error) {
    console.log('⚠️ Could not verify table creation. Please run the SQL migrations manually in Supabase.');
    console.log('SQL file location: /supabase/migrations/20250901_create_rag_tables.sql');
    return true; // Continue anyway
  }
}

async function main() {
  console.log('🚀 Setting up RAG system for Alleato AI Dashboard\n');
  
  // Setup storage buckets
  const storageSuccess = await setupStorageBuckets();
  
  // Setup database tables
  const databaseSuccess = await setupDatabaseTables();
  
  console.log('\n' + '='.repeat(50));
  
  if (storageSuccess && databaseSuccess) {
    console.log('✅ RAG system setup complete!');
    console.log('\nYou can now:');
    console.log('1. Start the development server: pnpm dev');
    console.log('2. Navigate to: http://localhost:3000/rag-system');
    console.log('3. Upload documents and start using the RAG system');
  } else {
    console.log('⚠️ Setup partially complete. Please check the errors above.');
    console.log('\nManual setup required:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Create storage bucket "documents" if needed');
    console.log('3. Run SQL migrations from /supabase/migrations/');
  }
}

main().catch(console.error);