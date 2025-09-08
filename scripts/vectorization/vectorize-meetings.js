#!/usr/bin/env node

/**
 * Vectorize Un-vectorized Meeting Transcripts
 * Processes meeting transcripts that have been synced but not yet vectorized
 * Prioritizes most recent meetings first
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

if (!supabaseUrl || !supabaseServiceKey || !openaiKey) {
  console.error('❌ Missing required environment variables');
  console.error('   Need: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Configuration
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 5;

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
 * Create document record for meeting
 */
async function createDocumentForMeeting(meeting) {
  // Create comprehensive content for vectorization
  let content = `# ${meeting.title}\n\n`;
  
  // Add metadata
  content += `Date: ${new Date(meeting.meeting_date).toLocaleDateString()}\n`;
  content += `Duration: ${meeting.duration_minutes} minutes\n`;
  if (meeting.participants?.length > 0) {
    content += `Participants: ${meeting.participants.join(', ')}\n`;
  }
  if (meeting.meeting_type) {
    content += `Meeting Type: ${meeting.meeting_type}\n`;
  }
  content += '\n';
  
  // Add keywords
  if (meeting.keywords?.length > 0) {
    content += `## Keywords\n${meeting.keywords.join(', ')}\n\n`;
  }
  
  // Add summary
  if (meeting.summary) {
    content += `## Summary\n${meeting.summary}\n\n`;
  }
  
  // Add topics
  if (meeting.topics_discussed?.length > 0) {
    content += `## Topics Discussed\n`;
    meeting.topics_discussed.forEach(topic => {
      content += `- ${topic}\n`;
    });
    content += '\n';
  }
  
  // Add action items
  if (meeting.action_items?.length > 0) {
    content += `## Action Items\n`;
    meeting.action_items.forEach(item => {
      content += `- ${item}\n`;
    });
    content += '\n';
  }
  
  // Add questions
  if (meeting.questions_asked?.length > 0) {
    content += `## Questions Asked\n`;
    meeting.questions_asked.slice(0, 10).forEach(q => {
      content += `- ${q.speaker}: ${q.text}\n`;
    });
    content += '\n';
  }
  
  // Add raw transcript if available
  if (meeting.raw_transcript) {
    content += `## Transcript\n${meeting.raw_transcript}\n`;
  }
  
  // Create document record
  const fileName = `meeting_${meeting.fireflies_id || meeting.id}.md`;
  const filePath = `meetings/${fileName}`;
  
  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert({
      title: meeting.title,
      source: 'meeting_transcript',
      file_path: filePath,
      file_type: 'md',
      file_size: content.length,
      content: content, // Store full content for vectorization
      status: 'pending',
      category: 'meeting',
      tags: meeting.keywords || [],
      metadata: {
        meeting_id: meeting.id,
        fireflies_id: meeting.fireflies_id,
        meeting_date: meeting.meeting_date,
        participants: meeting.participants,
        sentiment_scores: meeting.sentiment_scores,
        action_items_count: meeting.action_items?.length || 0,
        questions_count: meeting.questions_asked?.length || 0,
        project_id: meeting.project_id
      }
    })
    .select()
    .single();
  
  if (docError) {
    // Check if document already exists
    if (docError.message?.includes('duplicate')) {
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('*')
        .eq('file_path', filePath)
        .single();
      
      if (existingDoc) {
        // Update existing document
        const { data: updatedDoc, error: updateError } = await supabase
          .from('documents')
          .update({
            content: content,
            status: 'pending',
            metadata: {
              ...existingDoc.metadata,
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', existingDoc.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return updatedDoc;
      }
    }
    throw docError;
  }
  
  return docData;
}

/**
 * Process a meeting for vectorization
 */
async function vectorizeMeeting(meeting) {
  console.log(`\n📄 Processing: ${meeting.title}`);
  console.log(`   Date: ${new Date(meeting.meeting_date).toLocaleDateString()}`);
  console.log(`   Meeting ID: ${meeting.id}`);
  
  try {
    // Check if already vectorized as a document
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('id, status, chunks_count')
      .or(`metadata->meeting_id.eq.${meeting.id},metadata->fireflies_id.eq.${meeting.fireflies_id}`)
      .single();
    
    if (existingDocs && existingDocs.status === 'completed') {
      console.log(`   ✓ Already vectorized (${existingDocs.chunks_count} chunks)`);
      return { success: true, skipped: true };
    }
    
    // Create or update document record
    console.log('   📝 Creating document record...');
    const document = await createDocumentForMeeting(meeting);
    
    // Create chunks
    console.log('   ✂️ Creating text chunks...');
    const chunks = chunkText(document.content);
    console.log(`   📊 Created ${chunks.length} chunks`);
    
    // Generate embeddings
    console.log('   🧮 Generating embeddings...');
    const chunkRecords = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      if (i % 10 === 0 && chunks.length > 10) {
        process.stdout.write(`      Progress: ${i}/${chunks.length} chunks\r`);
      }
      
      try {
        const embedding = await generateEmbedding(chunk);
        
        chunkRecords.push({
          document_id: document.id,
          chunk_index: i,
          content: chunk,
          embedding,
          tokens: Math.ceil(chunk.length / 4),
          metadata: {
            meeting_id: meeting.id,
            chunk_position: i,
            total_chunks: chunks.length
          }
        });
        
        // Small delay to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`   ❌ Error on chunk ${i}:`, error.message);
      }
    }
    
    console.log(`      Progress: ${chunks.length}/${chunks.length} chunks ✓`);
    
    // Store chunks in database
    if (chunkRecords.length > 0) {
      console.log('   💾 Storing chunks in database...');
      
      // Delete existing chunks for this document
      await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', document.id);
      
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
    
    // Update document status
    await supabase
      .from('documents')
      .update({
        status: 'completed',
        chunks_count: chunkRecords.length,
        processed_at: new Date().toISOString()
      })
      .eq('id', document.id);
    
    // Update meeting vectorized_at
    await supabase
      .from('meetings')
      .update({
        vectorized_at: new Date().toISOString()
      })
      .eq('id', meeting.id);
    
    console.log(`   ✅ Successfully vectorized ${chunkRecords.length} chunks`);
    return { success: true, chunks: chunkRecords.length };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to vectorize meetings
 */
async function vectorizeMeetings(options = {}) {
  const {
    limit = null,
    batchSize = BATCH_SIZE,
    includeAlreadyVectorized = false
  } = options;
  
  console.log('🚀 Meeting Vectorization Process\n');
  console.log('==================================\n');
  
  // Get un-vectorized meetings, most recent first
  console.log('1️⃣ Fetching meetings to vectorize...');
  
  let query = supabase
    .from('meetings')
    .select('*')
    .order('meeting_date', { ascending: false });
  
  // Filter for un-vectorized meetings unless explicitly including all
  if (!includeAlreadyVectorized) {
    query = query.is('vectorized_at', null);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data: meetings, error: fetchError } = await query;
  
  if (fetchError) {
    console.error('❌ Error fetching meetings:', fetchError);
    return;
  }
  
  if (!meetings || meetings.length === 0) {
    console.log('✅ No meetings need vectorization!');
    
    // Show current status
    const { data: allMeetings } = await supabase
      .from('meetings')
      .select('id, vectorized_at');
    
    if (allMeetings) {
      const vectorizedCount = allMeetings.filter(m => m.vectorized_at).length;
      const totalCount = allMeetings.length;
      console.log(`\n📊 Current Status:`);
      console.log(`   Total meetings: ${totalCount}`);
      console.log(`   Vectorized: ${vectorizedCount}`);
      console.log(`   Pending: ${totalCount - vectorizedCount}`);
    }
    return;
  }
  
  console.log(`📚 Found ${meetings.length} meetings to process\n`);
  
  // Process in batches
  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    totalChunks: 0
  };
  
  for (let i = 0; i < meetings.length; i += batchSize) {
    const batch = meetings.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(meetings.length / batchSize);
    
    console.log(`\n📦 Batch ${batchNum}/${totalBatches}:`);
    console.log('─'.repeat(40));
    
    for (const meeting of batch) {
      const result = await vectorizeMeeting(meeting);
      
      if (result.skipped) {
        results.skipped++;
      } else if (result.success) {
        results.successful++;
        results.totalChunks += result.chunks || 0;
      } else {
        results.failed++;
      }
      
      // Small delay between meetings
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Batch ${batchNum} complete`);
    console.log(`   Progress: ${i + batch.length}/${meetings.length} meetings`);
  }
  
  // Summary
  console.log('\n==================================');
  console.log('📊 Vectorization Complete!\n');
  console.log(`✅ Successful: ${results.successful} meetings`);
  console.log(`⏭️ Skipped: ${results.skipped} meetings (already vectorized)`);
  console.log(`❌ Failed: ${results.failed} meetings`);
  console.log(`📄 Total chunks created: ${results.totalChunks}`);
  
  // Final status check
  const { data: finalStatus } = await supabase
    .from('meetings')
    .select('id, title, vectorized_at')
    .order('meeting_date', { ascending: false })
    .limit(5);
  
  if (finalStatus) {
    console.log('\n📈 Recent Meetings Status:');
    finalStatus.forEach(meeting => {
      const status = meeting.vectorized_at ? '✅' : '⏳';
      console.log(`   ${status} ${meeting.title}`);
    });
  }
  
  console.log('\n💡 Your meetings are now searchable through the RAG system!');
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  limit: null,
  batchSize: BATCH_SIZE,
  includeAlreadyVectorized: false
};

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--batch=')) {
    options.batchSize = parseInt(arg.split('=')[1]);
  } else if (arg === '--include-vectorized') {
    options.includeAlreadyVectorized = true;
  }
});

// Show help if requested
if (args.includes('--help')) {
  console.log(`
Meeting Vectorization Script

Processes meeting transcripts for vector search, prioritizing most recent meetings.
Creates document records and generates embeddings for RAG search.

Usage:
  node scripts/vectorize-meetings.js [options]

Options:
  --limit=N              Process only N most recent meetings
  --batch=N              Process N meetings at a time (default: 5)
  --include-vectorized   Re-process already vectorized meetings
  --help                 Show this help message

Examples:
  node scripts/vectorize-meetings.js                    # Process all un-vectorized meetings
  node scripts/vectorize-meetings.js --limit=10         # Process 10 most recent un-vectorized
  node scripts/vectorize-meetings.js --batch=3          # Process in batches of 3
  node scripts/vectorize-meetings.js --include-vectorized --limit=5  # Re-process 5 recent
`);
  process.exit(0);
}

// Run vectorization
vectorizeMeetings(options).catch(console.error);