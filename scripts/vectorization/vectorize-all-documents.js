#!/usr/bin/env node

/**
 * Script to vectorize all documents in the storage bucket
 * Processes any documents that haven't been vectorized yet
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !openaiKey) {
  console.error('❌ Missing required environment variables');
  console.error('   Need: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Chunking configuration
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Split text into chunks with overlap
 */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let position = 0;
  
  while (position < text.length) {
    const chunk = text.slice(position, position + chunkSize);
    chunks.push(chunk);
    position += chunkSize - overlap;
    
    // Avoid tiny last chunk
    if (position + overlap >= text.length && position < text.length) {
      break;
    }
  }
  
  return chunks;
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Process a single document
 */
async function processDocument(doc) {
  console.log(`\n📄 Processing: ${doc.title || doc.file_path}`);
  
  try {
    // 1. Download file content if not already in database
    let content = doc.content;
    
    if (!content && doc.file_path) {
      console.log('   ⬇️  Downloading file from storage...');
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(doc.file_path);
      
      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`);
      }
      
      // Convert blob to text
      content = await fileData.text();
      
      // Update document with content
      await supabase
        .from('documents')
        .update({ content })
        .eq('id', doc.id);
    }
    
    if (!content) {
      console.log('   ⚠️  No content to process');
      return { success: false, error: 'No content' };
    }
    
    // 2. Create chunks
    console.log('   ✂️  Creating text chunks...');
    const chunks = chunkText(content);
    console.log(`   📊 Created ${chunks.length} chunks`);
    
    // 3. Generate embeddings for each chunk
    console.log('   🧮 Generating embeddings...');
    const chunkRecords = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Show progress for large documents
      if (i % 10 === 0 && chunks.length > 10) {
        console.log(`      Progress: ${i}/${chunks.length} chunks`);
      }
      
      try {
        const embedding = await generateEmbedding(chunk);
        
        chunkRecords.push({
          document_id: doc.id,
          chunk_index: i,
          content: chunk,
          embedding,
          tokens: Math.ceil(chunk.length / 4), // Rough estimate
          metadata: {
            position: i,
            total_chunks: chunks.length
          }
        });
        
        // Small delay to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`   ❌ Error on chunk ${i}:`, error.message);
        // Continue with other chunks
      }
    }
    
    // 4. Store chunks in database
    if (chunkRecords.length > 0) {
      console.log('   💾 Storing chunks in database...');
      
      // Delete existing chunks for this document
      await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', doc.id);
      
      // Insert new chunks in batches
      const batchSize = 50;
      for (let i = 0; i < chunkRecords.length; i += batchSize) {
        const batch = chunkRecords.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('document_chunks')
          .insert(batch);
        
        if (insertError) {
          console.error('   ❌ Error inserting chunks:', insertError.message);
        }
      }
    }
    
    // 5. Update document status
    await supabase
      .from('documents')
      .update({
        status: 'completed',
        chunks_count: chunkRecords.length,
        processed_at: new Date().toISOString()
      })
      .eq('id', doc.id);
    
    console.log(`   ✅ Successfully processed ${chunkRecords.length} chunks`);
    return { success: true, chunks: chunkRecords.length };
    
  } catch (error) {
    console.error(`   ❌ Error processing document:`, error.message);
    
    // Update document with error
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', doc.id);
    
    return { success: false, error: error.message };
  }
}

/**
 * Main vectorization process
 */
async function vectorizeAllDocuments() {
  console.log('🚀 Document Vectorization Process\n');
  console.log('==================================\n');
  
  // 1. Get all documents that need processing
  console.log('1️⃣ Fetching documents...');
  const { data: documents, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .in('status', ['pending', 'processing', 'failed'])
    .order('created_at', { ascending: true });
  
  if (fetchError) {
    console.error('❌ Error fetching documents:', fetchError);
    return;
  }
  
  if (!documents || documents.length === 0) {
    console.log('✅ No documents need processing!');
    
    // Show current status
    const { data: allDocs } = await supabase
      .from('documents')
      .select('status')
      .order('status');
    
    if (allDocs) {
      const statusCount = allDocs.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Current Document Status:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} documents`);
      });
    }
    return;
  }
  
  console.log(`📚 Found ${documents.length} documents to process\n`);
  
  // 2. Process each document
  const results = {
    successful: 0,
    failed: 0,
    totalChunks: 0
  };
  
  for (const doc of documents) {
    const result = await processDocument(doc);
    
    if (result.success) {
      results.successful++;
      results.totalChunks += result.chunks;
    } else {
      results.failed++;
    }
  }
  
  // 3. Summary
  console.log('\n==================================');
  console.log('📊 Vectorization Complete!\n');
  console.log(`✅ Successful: ${results.successful} documents`);
  console.log(`❌ Failed: ${results.failed} documents`);
  console.log(`📄 Total chunks created: ${results.totalChunks}`);
  
  // 4. Check final status
  const { data: finalStatus } = await supabase
    .from('documents')
    .select('status');
  
  if (finalStatus) {
    const statusCount = finalStatus.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Final Document Status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} documents`);
    });
  }
}

// Run the script
vectorizeAllDocuments().catch(console.error);