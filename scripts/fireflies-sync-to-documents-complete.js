#!/usr/bin/env node

/**
 * Complete Fireflies to Documents Sync Script
 * Syncs meeting transcripts directly to documents table with ALL fields
 * Replaces the need for separate meetings table
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
      throw new Error(`Fireflies API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  async getRecentTranscripts(limit = 10, fromDate = null) {
    const query = `
      query GetTranscripts($limit: Int, $fromDate: DateTime) {
        transcripts(limit: $limit, fromDate: $fromDate) {
          id
          title
          date
          duration
          participants
          host_email
          organizer_email
          meeting_link
        }
      }
    `;

    const variables = { limit, fromDate };
    const data = await this.graphqlRequest(query, variables);
    return data.transcripts;
  }

  async getFullTranscript(transcriptId) {
    const query = `
      query GetTranscriptDetails($id: String!) {
        transcript(id: $id) {
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
          
          analytics {
            sentiments {
              negative_pct
              neutral_pct
              positive_pct
            }
            categories {
              questions
              date_times
              metrics
              tasks
            }
            speakers {
              speaker_id
              name
              duration
              word_count
              longest_monologue
              questions
              duration_pct
              words_per_minute
            }
          }
          
          summary {
            keywords
            action_items
            outline
            overview
            topics_discussed
            transcript_chapters
            meeting_type
            short_summary
          }
          
          sentences {
            index
            speaker_name
            speaker_id
            text
            raw_text
            start_time
            end_time
            ai_filters {
              task
              pricing
              metric
              question
              date_and_time
              sentiment
            }
          }
          
          meeting_attendees {
            displayName
            email
            phoneNumber
            location
          }
        }
      }
    `;

    const variables = { id: transcriptId };
    const data = await this.graphqlRequest(query, variables);
    return data.transcript;
  }
}

// Extract AI-filtered content
function extractAIFilteredContent(sentences) {
  const questions = [];
  const tasks = [];

  if (!sentences) return { questions, tasks };

  sentences.forEach(sentence => {
    if (sentence.ai_filters) {
      if (sentence.ai_filters.question) {
        questions.push({
          text: sentence.text,
          speaker: sentence.speaker_name,
          timestamp: sentence.start_time
        });
      }
      if (sentence.ai_filters.task) {
        tasks.push({
          text: sentence.text,
          speaker: sentence.speaker_name,
          timestamp: sentence.start_time
        });
      }
    }
  });

  return { questions, tasks };
}

// Format transcript for content field
function formatTranscriptContent(transcript, extractedContent) {
  let content = `# ${transcript.title}\n\n`;
  
  // Meeting info
  content += `**Date:** ${new Date(transcript.date).toLocaleString()}\n`;
  content += `**Duration:** ${Math.floor((transcript.duration || 0) / 60)} minutes\n`;
  content += `**Participants:** ${transcript.participants?.join(', ') || 'N/A'}\n`;
  if (transcript.host_email) {
    content += `**Host:** ${transcript.host_email}\n`;
  }
  content += '\n';
  
  // Summary
  if (transcript.summary?.overview || transcript.summary?.short_summary) {
    content += `## Summary\n`;
    content += `${transcript.summary.overview || transcript.summary.short_summary}\n\n`;
  }
  
  // Keywords
  if (transcript.summary?.keywords?.length > 0) {
    content += `## Keywords\n`;
    content += `${transcript.summary.keywords.join(', ')}\n\n`;
  }
  
  // Action Items
  if (Array.isArray(transcript.summary?.action_items) && transcript.summary.action_items.length > 0) {
    content += `## Action Items\n`;
    transcript.summary.action_items.forEach(item => {
      content += `- [ ] ${item}\n`;
    });
    content += '\n';
  }
  
  // Topics
  if (Array.isArray(transcript.summary?.topics_discussed) && transcript.summary.topics_discussed.length > 0) {
    content += `## Topics Discussed\n`;
    transcript.summary.topics_discussed.forEach(topic => {
      content += `- ${topic}\n`;
    });
    content += '\n';
  }
  
  // Questions
  if (extractedContent.questions.length > 0) {
    content += `## Key Questions\n`;
    extractedContent.questions.slice(0, 10).forEach(q => {
      content += `- **${q.speaker}:** ${q.text}\n`;
    });
    content += '\n';
  }
  
  // Full transcript
  if (transcript.sentences?.length > 0) {
    content += `## Full Transcript\n\n`;
    let currentSpeaker = '';
    
    transcript.sentences.forEach(sentence => {
      if (sentence.speaker_name !== currentSpeaker) {
        currentSpeaker = sentence.speaker_name;
        content += `\n**${currentSpeaker}:**\n`;
      }
      content += `${sentence.text} `;
    });
  }
  
  return content;
}

// Extract all participants from various sources
function extractAllParticipants(transcript) {
  const participants = new Set();
  
  // From participants field
  if (transcript.participants?.length > 0) {
    transcript.participants.forEach(p => participants.add(p));
  }
  
  // From speakers
  if (transcript.analytics?.speakers?.length > 0) {
    transcript.analytics.speakers.forEach(s => {
      if (s.name) participants.add(s.name);
    });
  }
  
  // From attendees
  if (transcript.meeting_attendees?.length > 0) {
    transcript.meeting_attendees.forEach(a => {
      if (a.displayName) participants.add(a.displayName);
      else if (a.email) participants.add(a.email);
    });
  }
  
  return Array.from(participants);
}

// Main sync function
async function syncFirefliesToDocuments(options = {}) {
  const { limit = 10, fromDate = null, dryRun = false, projectId = null } = options;
  
  console.log('🚀 Complete Fireflies to Documents Sync\n');
  console.log('=========================================\n');
  
  const fireflies = new FirefliesClient(FIREFLIES_API_KEY);
  
  try {
    // Get recent transcripts
    console.log('📋 Fetching recent transcripts...');
    const transcripts = await fireflies.getRecentTranscripts(limit, fromDate);
    console.log(`   Found ${transcripts.length} transcripts\n`);
    
    if (transcripts.length === 0) {
      console.log('✅ No transcripts to sync');
      return;
    }
    
    // Check existing synced documents
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('fireflies_id')
      .not('fireflies_id', 'is', null);
    
    const syncedIds = new Set(existingDocs?.map(d => d.fireflies_id) || []);
    const newTranscripts = transcripts.filter(t => !syncedIds.has(t.id));
    
    console.log(`   ${syncedIds.size} already synced`);
    console.log(`   ${newTranscripts.length} new transcripts to sync\n`);
    
    if (newTranscripts.length === 0) {
      console.log('✅ All transcripts already synced');
      return;
    }
    
    // Process each transcript
    const results = { successful: 0, failed: 0, skipped: 0 };
    
    for (const transcriptSummary of newTranscripts) {
      console.log(`\n📄 Processing: ${transcriptSummary.title}`);
      console.log(`   Date: ${new Date(transcriptSummary.date).toLocaleDateString()}`);
      
      if (dryRun) {
        console.log('   🏃 Dry run - skipping database operations');
        results.skipped++;
        continue;
      }
      
      try {
        // Get full transcript
        console.log('   ⬇️ Fetching full transcript...');
        const transcript = await fireflies.getFullTranscript(transcriptSummary.id);
        
        // Extract content
        const extractedContent = extractAIFilteredContent(transcript.sentences);
        const participants = extractAllParticipants(transcript);
        const content = formatTranscriptContent(transcript, extractedContent);
        
        // Prepare document data
        const documentData = {
          title: transcript.title,
          source: 'fireflies',
          category: 'meeting',
          file_path: `meetings/${transcript.id}.md`,
          file_type: 'md',
          file_size: content.length,
          content: content,
          status: 'pending', // Will be vectorized
          
          // Meeting-specific fields
          participants: participants,
          summary: transcript.summary?.overview || transcript.summary?.short_summary || null,
          project_id: projectId,
          fireflies_id: transcript.id,
          fireflies_link: transcript.transcript_url || `https://app.fireflies.ai/view/${transcript.id}`,
          storage_bucket_path: `meetings/${transcript.id}.md`,
          meeting_date: new Date(transcript.date),
          duration_minutes: Math.floor((transcript.duration || 0) / 60),
          keywords: Array.isArray(transcript.summary?.keywords) ? transcript.summary.keywords : [],
          action_items: Array.isArray(transcript.summary?.action_items) ? transcript.summary.action_items : [],
          topics_discussed: Array.isArray(transcript.summary?.topics_discussed) ? transcript.summary.topics_discussed : [],
          meeting_type: transcript.summary?.meeting_type || null,
          sentiment_scores: transcript.analytics?.sentiments || null,
          speaker_analytics: transcript.analytics?.speakers || null,
          questions_asked: extractedContent.questions.length > 0 ? extractedContent.questions : null,
          tasks_mentioned: extractedContent.tasks.length > 0 ? extractedContent.tasks : null,
          host_email: transcript.host_email || null,
          organizer_email: transcript.organizer_email || null,
          meeting_link: transcript.meeting_link || null,
          audio_url: transcript.audio_url || null,
          video_url: transcript.video_url || null,
          transcript_url: transcript.transcript_url || null,
          
          // Additional metadata
          metadata: {
            fireflies_sync: true,
            sync_timestamp: new Date().toISOString(),
            attendees: transcript.meeting_attendees || [],
            categories: transcript.analytics?.categories || {},
            transcript_chapters: transcript.summary?.transcript_chapters || []
          }
        };
        
        // Upsert to documents table
        console.log('   💾 Saving to documents table...');
        const { data: docRecord, error: dbError } = await supabase
          .from('documents')
          .upsert(documentData, {
            onConflict: 'fireflies_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
        
        if (dbError) {
          throw dbError;
        }
        
        console.log(`   ✅ Successfully synced (Document ID: ${docRecord.id})`);
        console.log(`   📊 Stats: ${participants.length} participants, ${documentData.keywords.length} keywords, ${documentData.action_items.length} action items`);
        
        results.successful++;
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.failed++;
      }
    }
    
    // Summary
    console.log('\n=========================================');
    console.log('📊 Sync Complete!\n');
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`❌ Failed: ${results.failed}`);
    if (results.skipped > 0) {
      console.log(`⏭️ Skipped (dry run): ${results.skipped}`);
    }
    
    if (results.successful > 0) {
      console.log('\n💡 Documents are ready!');
      console.log('   All meeting fields are now in the documents table:');
      console.log('   - Participants, summary, keywords, action items');
      console.log('   - Fireflies ID and links');
      console.log('   - Sentiment scores and speaker analytics');
      console.log('   - Ready for vectorization with: npm run vectorize:batch');
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  limit: 10,
  fromDate: null,
  dryRun: false,
  projectId: null
};

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--from=')) {
    options.fromDate = arg.split('=')[1];
  } else if (arg.startsWith('--project=')) {
    options.projectId = arg.split('=')[1];
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  }
});

if (args.includes('--help')) {
  console.log(`
Complete Fireflies to Documents Sync

Syncs meeting transcripts from Fireflies.ai directly to the documents table
with ALL meeting fields (participants, summary, keywords, action items, etc.)

Usage:
  node scripts/fireflies-sync-to-documents-complete.js [options]

Options:
  --limit=N        Number of transcripts to sync (default: 10)
  --from=DATE      Sync transcripts from this date (ISO format)
  --project=UUID   Associate all meetings with this project ID
  --dry-run        Test sync without database operations
  --help           Show this help message

Examples:
  node scripts/fireflies-sync-to-documents-complete.js
  node scripts/fireflies-sync-to-documents-complete.js --limit=5
  node scripts/fireflies-sync-to-documents-complete.js --from=2024-01-01
  node scripts/fireflies-sync-to-documents-complete.js --project=123e4567-e89b-12d3-a456-426614174000
`);
  process.exit(0);
}

// Run sync
syncFirefliesToDocuments(options).catch(console.error);