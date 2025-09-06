#!/usr/bin/env node

/**
 * Fireflies Sync Script - Updated for new documents table schema
 * Syncs meeting transcripts to documents table using the new column structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !FIREFLIES_API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Fireflies GraphQL client
class FirefliesClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.fireflies.ai/graphql';
  }

  async graphqlRequest(query, variables = {}) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response:', errorText);
      throw new Error(`Fireflies API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.errors) {
      console.error('GraphQL Errors:', JSON.stringify(data.errors, null, 2));
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  async getAllTranscripts(limit = 50) {
    const query = `
      query GetTranscripts($limit: Int) {
        transcripts(limit: $limit) {
          id
          title
          date
          duration
          participants
          host_email
          organizer_email
          meeting_link
          transcript_url
        }
      }
    `;

    const data = await this.graphqlRequest(query, { limit });
    return data.transcripts;
  }

  async getTranscriptById(transcriptId) {
    const query = `
      query GetTranscript($transcriptId: String!) {
        transcript(id: $transcriptId) {
          id
          title
          date
          duration
          participants
          host_email
          organizer_email
          meeting_link
          transcript_url
          audio_url
          video_url
          
          summary {
            overview
            shorthand_bullet
            keywords
            action_items
            outline
            topics_discussed
            meeting_type
          }
          
          sentences {
            text
            speaker_name
            start_time
            end_time
          }
          
          analytics {
            sentiments {
              positive_pct
              neutral_pct
              negative_pct
            }
            speakers {
              name
              duration_pct
              word_count
              questions
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, { transcriptId });
    return data.transcript;
  }
}

// Format transcript for documents table
function formatTranscriptForDocument(transcript) {
  // Build the full content text
  let content = `# ${transcript.title}\n\n`;
  
  // Meeting info
  content += `**Date:** ${new Date(transcript.date).toLocaleString()}\n`;
  content += `**Duration:** ${Math.floor((transcript.duration || 0) / 60)} minutes\n`;
  content += `**Participants:** ${transcript.participants || 'N/A'}\n`;
  content += `**Organizer:** ${transcript.organizer_email || transcript.host_email || 'N/A'}\n\n`;
  
  // Summary
  if (transcript.summary) {
    content += `## Summary\n`;
    content += `${transcript.summary.overview || 'No summary available'}\n\n`;
    
    // Key Points
    if (transcript.summary.shorthand_bullet) {
      content += `## Key Points\n`;
      if (Array.isArray(transcript.summary.shorthand_bullet)) {
        transcript.summary.shorthand_bullet.forEach(point => {
          content += `- ${point}\n`;
        });
      } else if (typeof transcript.summary.shorthand_bullet === 'string') {
        content += `${transcript.summary.shorthand_bullet}\n`;
      }
      content += '\n';
    }
    
    // Keywords
    if (transcript.summary.keywords && transcript.summary.keywords.length > 0) {
      content += `**Keywords:** ${transcript.summary.keywords.join(', ')}\n\n`;
    }
    
    // Action Items
    if (transcript.summary.action_items) {
      if (Array.isArray(transcript.summary.action_items) && transcript.summary.action_items.length > 0) {
        content += `## Action Items\n`;
        transcript.summary.action_items.forEach(item => {
          content += `- ${item}\n`;
        });
        content += '\n';
      }
    }
  }
  
  // Full Transcript
  if (transcript.sentences && transcript.sentences.length > 0) {
    content += `## Full Transcript\n\n`;
    transcript.sentences.forEach(sentence => {
      const time = sentence.start_time ? Math.floor(sentence.start_time / 60) : 0;
      const seconds = sentence.start_time ? sentence.start_time % 60 : 0;
      content += `[${time}:${seconds.toString().padStart(2, '0')}] **${sentence.speaker_name}:** ${sentence.text}\n\n`;
    });
  }
  
  // Extract participants array
  let participantsArray = [];
  if (transcript.participants) {
    if (typeof transcript.participants === 'string') {
      participantsArray = transcript.participants.split(',').map(p => p.trim());
    } else if (Array.isArray(transcript.participants)) {
      participantsArray = transcript.participants.map(p => 
        typeof p === 'object' ? (p.displayName || p.email || p.name) : p
      );
    }
  }
  
  // Extract tasks/action items for the tasks JSONB column
  const tasks = transcript.summary?.action_items?.map((item, index) => ({
    id: index + 1,
    description: item,
    status: 'pending',
    created_at: new Date().toISOString()
  })) || [];
  
  // Calculate sentiment score (placeholder - would need actual analysis)
  let sentimentScore = null;
  if (transcript.analytics?.sentiments) {
    const sentiments = transcript.analytics.sentiments;
    sentimentScore = (sentiments.positive_pct * 1 + sentiments.neutral_pct * 0.5 - sentiments.negative_pct * 1) / 100;
  }
  
  // Create metadata object for additional data
  const metadata = {
    fireflies_sync: true,
    sync_timestamp: new Date().toISOString(),
    keywords: transcript.summary?.keywords || [],
    outline: transcript.summary?.outline || [],
    host_email: transcript.host_email,
    organizer_email: transcript.organizer_email,
    meeting_link: transcript.meeting_link,
    audio_url: transcript.audio_url,
    video_url: transcript.video_url,
    speaker_count: transcript.sentences ? 
      [...new Set(transcript.sentences.map(s => s.speaker_name))].length : 0
  };
  
  // Return document data using the new schema columns
  return {
    // Required fields
    title: transcript.title || `Meeting - ${new Date(transcript.date).toLocaleDateString()}`,
    content: content,
    
    // File/source information
    source: `fireflies_${transcript.id}`,
    file_path: `meetings/${transcript.id}.md`,
    file_type: 'md',
    file_size: content.length,
    mime_type: 'text/markdown',
    
    // Meeting-specific columns
    fireflies_id: transcript.id,
    fireflies_link: transcript.transcript_url || `https://app.fireflies.ai/view/${transcript.id}`,
    summary: transcript.summary?.overview || null,
    participants: participantsArray,
    storage_bucket_path: `meetings/${transcript.id}.md`,
    duration: Math.floor((transcript.duration || 0) / 60), // in minutes
    sentiment_score: sentimentScore,
    tasks: tasks.length > 0 ? tasks : null,
    
    // Status and categorization
    category: 'meeting',
    status: 'completed',
    processing_status: 'completed',
    tags: ['meeting', 'fireflies', 'transcript'],
    
    // Metadata for additional info
    metadata: metadata,
    
    // Timestamps
    processed_at: new Date().toISOString()
  };
}

// Check if transcript already exists
async function checkExistingTranscript(firefliesId) {
  const { data, error } = await supabase
    .from('documents')
    .select('id')
    .eq('fireflies_id', firefliesId)
    .limit(1);
  
  if (error) {
    console.error('Error checking existing transcript:', error);
    return false;
  }
  
  return data && data.length > 0;
}

// Main sync function
async function syncFirefliesTranscripts() {
  console.log('🚀 Fireflies Sync - New Schema Version');
  console.log('=========================================\n');
  
  const fireflies = new FirefliesClient(FIREFLIES_API_KEY);
  
  const stats = {
    total: 0,
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };
  
  try {
    // Fetch all transcripts (up to 50 - API limit)
    console.log('📋 Fetching transcripts from Fireflies...');
    const transcripts = await fireflies.getAllTranscripts(50);
    
    if (!transcripts || transcripts.length === 0) {
      console.log('✅ No transcripts found');
      return;
    }
    
    console.log(`   Found ${transcripts.length} transcripts\n`);
    stats.total = transcripts.length;
    
    // Process each transcript
    for (const basicTranscript of transcripts) {
      try {
        console.log(`📄 Processing: ${basicTranscript.title}`);
        console.log(`   Date: ${new Date(basicTranscript.date).toLocaleDateString()}`);
        console.log(`   Duration: ${Math.floor(basicTranscript.duration / 60)} minutes`);
        
        // Check if already exists
        const exists = await checkExistingTranscript(basicTranscript.id);
        if (exists) {
          console.log(`   ⏭️  Already synced, skipping\n`);
          stats.skipped++;
          continue;
        }
        
        // Fetch full transcript data
        console.log('   ⬇️  Fetching full transcript...');
        const fullTranscript = await fireflies.getTranscriptById(basicTranscript.id);
        
        if (!fullTranscript) {
          throw new Error('Failed to fetch full transcript');
        }
        
        // Format for documents table
        const documentData = formatTranscriptForDocument(fullTranscript);
        
        // Save to Supabase
        console.log('   💾 Saving to documents table...');
        const { data, error: insertError } = await supabase
          .from('documents')
          .insert(documentData)
          .select();
        
        if (insertError) {
          throw insertError;
        }
        
        console.log(`   ✅ Successfully synced (ID: ${data[0].id})\n`);
        stats.synced++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        stats.failed++;
        stats.errors.push({
          transcript: basicTranscript.title,
          error: error.message
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    stats.errors.push({ error: error.message });
  }
  
  // Print summary
  console.log('=========================================');
  console.log('📊 Sync Complete!\n');
  console.log(`✅ Successful: ${stats.synced}`);
  console.log(`⏭️  Skipped (already exist): ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📝 Total processed: ${stats.total}`);
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    stats.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. ${err.transcript || 'General'}: ${err.error}`);
    });
  }
  
  console.log('\n✨ Sync completed at:', new Date().toLocaleString());
  
  // Trigger vectorization if any new documents were added
  if (stats.synced > 0) {
    console.log('\n🧮 Starting vectorization for new documents...');
    await vectorizeNewDocuments();
  }
}

// Vectorize new documents
async function vectorizeNewDocuments() {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, content, title')
    .is('embedding', null)
    .eq('fireflies_id', true, { nullValue: false })
    .limit(10);
  
  if (error) {
    console.error('Error fetching documents for vectorization:', error);
    return;
  }
  
  if (!documents || documents.length === 0) {
    console.log('✅ All documents already vectorized');
    return;
  }
  
  console.log(`\n📊 Vectorizing ${documents.length} documents...`);
  
  let vectorized = 0;
  for (const doc of documents) {
    try {
      // Call edge function to generate embedding
      const { data: result, error: embedError } = await supabase.functions.invoke(
        'generate-embedding',
        {
          body: { 
            text: doc.content.substring(0, 8000) // Limit for embedding
          }
        }
      );
      
      if (embedError || !result?.embedding) {
        console.error(`Failed to generate embedding for ${doc.title}:`, embedError);
        continue;
      }
      
      // Update document with embedding
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          embedding: result.embedding,
          updated_at: new Date().toISOString()
        })
        .eq('id', doc.id);
      
      if (updateError) {
        console.error(`Failed to update embedding for ${doc.title}:`, updateError);
        continue;
      }
      
      console.log(`   ✅ Vectorized: ${doc.title}`);
      vectorized++;
      
    } catch (error) {
      console.error(`Error vectorizing ${doc.title}:`, error);
    }
  }
  
  console.log(`\n✅ Vectorized ${vectorized} documents`);
}

// Run the sync
syncFirefliesTranscripts().catch(console.error);