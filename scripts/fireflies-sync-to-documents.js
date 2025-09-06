#!/usr/bin/env node

/**
 * Fireflies to Documents Sync Script
 * Syncs meeting transcripts from Fireflies.ai to the documents storage bucket
 * with enhanced metadata extraction and organization
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !FIREFLIES_API_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   Need: SUPABASE_URL, SUPABASE_SERVICE_KEY, FIREFLIES_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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
      throw new Error(`Fireflies API error: ${response.status} ${response.statusText}`);
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

// Enhanced metadata extraction
function extractEnhancedMetadata(transcript) {
  const metadata = {
    // Basic info
    fireflies_id: transcript.id,
    title: transcript.title,
    date: transcript.date,
    duration: transcript.duration,
    participants: transcript.participants,
    host_email: transcript.host_email,
    organizer_email: transcript.organizer_email,
    
    // URLs
    meeting_link: transcript.meeting_link,
    transcript_url: transcript.transcript_url,
    audio_url: transcript.audio_url,
    video_url: transcript.video_url,
    
    // Analytics
    sentiment_scores: transcript.analytics?.sentiments || {},
    speaker_analytics: transcript.analytics?.speakers || [],
    
    // Categories
    questions_count: transcript.analytics?.categories?.questions || 0,
    tasks_count: transcript.analytics?.categories?.tasks || 0,
    metrics_discussed: transcript.analytics?.categories?.metrics || 0,
    
    // Summary data
    keywords: transcript.summary?.keywords || [],
    action_items: transcript.summary?.action_items || [],
    topics: transcript.summary?.topics_discussed || [],
    meeting_type: transcript.summary?.meeting_type || 'general',
    chapters: transcript.summary?.transcript_chapters || [],
    
    // Attendees
    attendees: transcript.meeting_attendees || [],
    
    // Calculated metrics
    total_speakers: new Set(transcript.sentences?.map(s => s.speaker_id) || []).size,
    total_words: transcript.sentences?.reduce((sum, s) => sum + s.text.split(' ').length, 0) || 0,
    
    // AI insights from sentence filters
    questions: [],
    tasks: [],
    metrics: [],
    dates_mentioned: [],
  };

  // Extract AI-filtered insights from sentences
  if (transcript.sentences) {
    transcript.sentences.forEach(sentence => {
      if (sentence.ai_filters) {
        if (sentence.ai_filters.question) {
          metadata.questions.push({
            text: sentence.text,
            speaker: sentence.speaker_name,
            timestamp: sentence.start_time
          });
        }
        if (sentence.ai_filters.task) {
          metadata.tasks.push({
            text: sentence.text,
            speaker: sentence.speaker_name,
            timestamp: sentence.start_time
          });
        }
        if (sentence.ai_filters.metric) {
          metadata.metrics.push({
            text: sentence.text,
            speaker: sentence.speaker_name,
            timestamp: sentence.start_time
          });
        }
        if (sentence.ai_filters.date_and_time) {
          metadata.dates_mentioned.push({
            text: sentence.text,
            speaker: sentence.speaker_name,
            timestamp: sentence.start_time
          });
        }
      }
    });
  }

  return metadata;
}

// Format transcript as enhanced markdown
function formatEnhancedMarkdown(transcript, metadata) {
  let markdown = `# ${transcript.title}\n\n`;
  
  // Meeting info section
  markdown += `## Meeting Information\n`;
  markdown += `- **Date:** ${new Date(transcript.date).toLocaleString()}\n`;
  markdown += `- **Duration:** ${Math.floor(transcript.duration / 60)} minutes\n`;
  markdown += `- **Participants:** ${transcript.participants.join(', ')}\n`;
  markdown += `- **Host:** ${transcript.host_email || 'N/A'}\n`;
  markdown += `- **Meeting Type:** ${metadata.meeting_type}\n\n`;
  
  // Sentiment analysis
  if (metadata.sentiment_scores.positive_pct !== undefined) {
    markdown += `## Sentiment Analysis\n`;
    markdown += `- 😊 Positive: ${metadata.sentiment_scores.positive_pct}%\n`;
    markdown += `- 😐 Neutral: ${metadata.sentiment_scores.neutral_pct}%\n`;
    markdown += `- 😔 Negative: ${metadata.sentiment_scores.negative_pct}%\n\n`;
  }
  
  // Keywords
  if (metadata.keywords.length > 0) {
    markdown += `## Keywords\n`;
    markdown += `${metadata.keywords.join(', ')}\n\n`;
  }
  
  // Action items
  if (metadata.action_items.length > 0) {
    markdown += `## Action Items\n`;
    metadata.action_items.forEach(item => {
      markdown += `- [ ] ${item}\n`;
    });
    markdown += '\n';
  }
  
  // Topics discussed
  if (metadata.topics.length > 0) {
    markdown += `## Topics Discussed\n`;
    metadata.topics.forEach(topic => {
      markdown += `- ${topic}\n`;
    });
    markdown += '\n';
  }
  
  // Speaker statistics
  if (metadata.speaker_analytics.length > 0) {
    markdown += `## Speaker Statistics\n`;
    metadata.speaker_analytics.forEach(speaker => {
      markdown += `### ${speaker.name}\n`;
      markdown += `- Talk time: ${Math.round(speaker.duration_pct)}%\n`;
      markdown += `- Words spoken: ${speaker.word_count}\n`;
      markdown += `- Questions asked: ${speaker.questions}\n`;
      markdown += `- Words per minute: ${speaker.words_per_minute}\n\n`;
    });
  }
  
  // Questions asked
  if (metadata.questions.length > 0) {
    markdown += `## Questions Asked\n`;
    metadata.questions.forEach(q => {
      markdown += `- **${q.speaker}:** ${q.text}\n`;
    });
    markdown += '\n';
  }
  
  // Tasks mentioned
  if (metadata.tasks.length > 0) {
    markdown += `## Tasks Mentioned\n`;
    metadata.tasks.forEach(t => {
      markdown += `- **${t.speaker}:** ${t.text}\n`;
    });
    markdown += '\n';
  }
  
  // Full transcript with chapters
  markdown += `## Full Transcript\n\n`;
  
  // Add chapter markers if available
  let chapterIndex = 0;
  let currentChapter = metadata.chapters[chapterIndex];
  
  let currentSpeaker = '';
  transcript.sentences.forEach((sentence, index) => {
    // Check if we should insert a chapter marker
    if (currentChapter && sentence.start_time >= currentChapter.start_time) {
      markdown += `\n### 📍 ${currentChapter.title}\n\n`;
      chapterIndex++;
      currentChapter = metadata.chapters[chapterIndex];
    }
    
    // Add speaker changes
    if (sentence.speaker_name !== currentSpeaker) {
      currentSpeaker = sentence.speaker_name;
      markdown += `\n**${currentSpeaker}:**\n`;
    }
    
    // Add sentiment indicator for significant sentences
    let sentimentEmoji = '';
    if (sentence.ai_filters?.sentiment === 'positive') sentimentEmoji = '😊 ';
    else if (sentence.ai_filters?.sentiment === 'negative') sentimentEmoji = '😔 ';
    
    markdown += `${sentimentEmoji}${sentence.text} `;
  });
  
  // Add metadata footer
  markdown += `\n\n---\n`;
  markdown += `## Metadata\n`;
  markdown += `- Fireflies ID: ${transcript.id}\n`;
  markdown += `- Synced: ${new Date().toISOString()}\n`;
  if (transcript.transcript_url) {
    markdown += `- [View in Fireflies](${transcript.transcript_url})\n`;
  }
  
  return markdown;
}

// Main sync function
async function syncFirefliesToDocuments(options = {}) {
  const {
    limit = 10,
    fromDate = null,
    dryRun = false
  } = options;
  
  console.log('🚀 Fireflies to Documents Sync\n');
  console.log('================================\n');
  
  const fireflies = new FirefliesClient(FIREFLIES_API_KEY);
  
  try {
    // 1. Get recent transcripts
    console.log('📋 Fetching recent transcripts...');
    const transcripts = await fireflies.getRecentTranscripts(limit, fromDate);
    console.log(`   Found ${transcripts.length} transcripts\n`);
    
    if (transcripts.length === 0) {
      console.log('✅ No new transcripts to sync');
      return;
    }
    
    // 2. Check existing synced transcripts
    console.log('🔍 Checking for already synced transcripts...');
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('metadata->fireflies_id')
      .not('metadata->fireflies_id', 'is', null);
    
    const syncedIds = new Set(existingDocs?.map(d => d.metadata?.fireflies_id) || []);
    
    const newTranscripts = transcripts.filter(t => !syncedIds.has(t.id));
    console.log(`   ${newTranscripts.length} new transcripts to sync\n`);
    
    if (newTranscripts.length === 0) {
      console.log('✅ All transcripts already synced');
      return;
    }
    
    // 3. Process each transcript
    const results = {
      successful: 0,
      failed: 0,
      skipped: 0
    };
    
    for (const transcript of newTranscripts) {
      console.log(`\n📄 Processing: ${transcript.title}`);
      console.log(`   Date: ${new Date(transcript.date).toLocaleDateString()}`);
      console.log(`   Duration: ${Math.floor(transcript.duration / 60)} minutes`);
      
      try {
        // Get full transcript details
        console.log('   ⬇️ Fetching full transcript...');
        const fullTranscript = await fireflies.getFullTranscript(transcript.id);
        
        // Extract enhanced metadata
        console.log('   📊 Extracting metadata...');
        const metadata = extractEnhancedMetadata(fullTranscript);
        
        // Format as markdown
        console.log('   📝 Formatting content...');
        const markdownContent = formatEnhancedMarkdown(fullTranscript, metadata);
        
        if (dryRun) {
          console.log('   🏃 Dry run - skipping upload');
          results.skipped++;
          continue;
        }
        
        // Upload to storage in meetings subfolder
        const fileName = `${transcript.date.split('T')[0]}_${transcript.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
        const filePath = `meetings/${fileName}`;
        
        console.log('   ⬆️ Uploading to storage...');
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const file = new File([blob], fileName, { type: 'text/markdown' });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Create document record
        console.log('   💾 Creating document record...');
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            title: transcript.title,
            source: 'fireflies',
            file_path: filePath,
            file_type: 'md',
            file_size: markdownContent.length,
            content: '', // Will be populated during vectorization
            status: 'pending',
            category: 'meeting',
            tags: metadata.keywords,
            metadata: {
              ...metadata,
              source_type: 'fireflies_transcript',
              sync_timestamp: new Date().toISOString()
            }
          })
          .select()
          .single();
        
        if (docError) {
          throw docError;
        }
        
        console.log(`   ✅ Successfully synced (ID: ${docData.id})`);
        results.successful++;
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.failed++;
      }
    }
    
    // 4. Summary
    console.log('\n================================');
    console.log('📊 Sync Complete!\n');
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⏭️ Skipped: ${results.skipped}`);
    
    if (results.successful > 0) {
      console.log('\n💡 Next steps:');
      console.log('   1. Run vectorization: node scripts/vectorize-batch.js');
      console.log('   2. Documents are ready for RAG search!');
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
  dryRun: false
};

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--from=')) {
    options.fromDate = arg.split('=')[1];
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  }
});

// Show help if requested
if (args.includes('--help')) {
  console.log(`
Fireflies to Documents Sync Script

Usage:
  node scripts/fireflies-sync-to-documents.js [options]

Options:
  --limit=N        Number of transcripts to sync (default: 10)
  --from=DATE      Sync transcripts from this date (ISO format)
  --dry-run        Test sync without uploading
  --help           Show this help message

Examples:
  node scripts/fireflies-sync-to-documents.js
  node scripts/fireflies-sync-to-documents.js --limit=5
  node scripts/fireflies-sync-to-documents.js --from=2024-01-01
  node scripts/fireflies-sync-to-documents.js --dry-run
`);
  process.exit(0);
}

// Run sync
syncFirefliesToDocuments(options).catch(console.error);