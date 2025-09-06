#!/usr/bin/env node

/**
 * Batch vectorization with resume capability
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiKey });

const BATCH_SIZE = 5; // Process 5 documents at a time
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const EMBEDDING_MODEL = 'text-embedding-3-small';

async function checkStatus() {
  console.log('📊 Checking Current Status...\n');
  
  const { data: docs, error } = await supabase
    .from('documents')
    .select('status');
  
  if (error) {
    console.error('Error fetching status:', error);
    return;
  }
  
  const statusCount = docs.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Document Status:');
  Object.entries(statusCount).forEach(([status, count]) => {
    const emoji = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⏳';
    console.log(`${emoji} ${status}: ${count} documents`);
  });
  
  const pendingCount = (statusCount.pending || 0) + (statusCount.processing || 0);
  
  if (pendingCount > 0) {
    console.log(`\n🔄 ${pendingCount} documents need processing`);
    console.log(`   Will process in batches of ${BATCH_SIZE}\n`);
  } else {
    console.log('\n✅ All documents are processed!');
  }
  
  return pendingCount;
}

async function processNextBatch() {
  // Get next batch of unprocessed documents
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .in('status', ['pending', 'processing'])
    .limit(BATCH_SIZE)
    .order('created_at', { ascending: true });
  
  if (error || !documents || documents.length === 0) {
    return 0;
  }
  
  console.log(`\n🔄 Processing batch of ${documents.length} documents...\n`);
  
  for (const doc of documents) {
    console.log(`📄 ${doc.title || doc.file_path}`);
    
    try {
      // Mark as processing
      await supabase
        .from('documents')
        .update({ status: 'processing' })
        .eq('id', doc.id);
      
      // Get content
      let content = doc.content;
      if (!content && doc.file_path) {
        const { data: fileData } = await supabase.storage
          .from('documents')
          .download(doc.file_path);
        
        if (fileData) {
          content = await fileData.text();
          await supabase
            .from('documents')
            .update({ content })
            .eq('id', doc.id);
        }
      }
      
      if (!content) {
        throw new Error('No content available');
      }
      
      // Create chunks
      const chunks = [];
      let position = 0;
      while (position < content.length) {
        chunks.push(content.slice(position, position + CHUNK_SIZE));
        position += CHUNK_SIZE - CHUNK_OVERLAP;
      }
      
      console.log(`   ✂️ ${chunks.length} chunks`);
      
      // Generate embeddings
      const chunkRecords = [];
      for (let i = 0; i < chunks.length; i++) {
        if (i % 10 === 0 && i > 0) {
          process.stdout.write(`   🧮 ${i}/${chunks.length}\r`);
        }
        
        const embedding = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: chunks[i],
        });
        
        chunkRecords.push({
          document_id: doc.id,
          chunk_index: i,
          content: chunks[i],
          embedding: embedding.data[0].embedding,
          tokens: Math.ceil(chunks[i].length / 4),
        });
        
        // Rate limit protection
        await new Promise(r => setTimeout(r, 50));
      }
      
      console.log(`   🧮 ${chunks.length}/${chunks.length} done`);
      
      // Store chunks
      await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', doc.id);
      
      for (let i = 0; i < chunkRecords.length; i += 50) {
        await supabase
          .from('document_chunks')
          .insert(chunkRecords.slice(i, i + 50));
      }
      
      // Mark complete
      await supabase
        .from('documents')
        .update({
          status: 'completed',
          chunks_count: chunkRecords.length,
          processed_at: new Date().toISOString()
        })
        .eq('id', doc.id);
      
      console.log(`   ✅ Complete\n`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', doc.id);
    }
  }
  
  return documents.length;
}

async function main() {
  console.log('🚀 Batch Document Vectorization\n');
  console.log('================================\n');
  
  const pendingCount = await checkStatus();
  
  if (pendingCount === 0) {
    return;
  }
  
  let totalProcessed = 0;
  let batchNum = 1;
  
  while (true) {
    console.log(`\n📦 Batch ${batchNum}:`);
    const processed = await processNextBatch();
    
    if (processed === 0) {
      break;
    }
    
    totalProcessed += processed;
    batchNum++;
    
    console.log(`✅ Batch complete. Total processed: ${totalProcessed}/${pendingCount}`);
    
    // Small delay between batches
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n================================');
  console.log('✅ Vectorization Complete!\n');
  
  await checkStatus();
}

main().catch(console.error);