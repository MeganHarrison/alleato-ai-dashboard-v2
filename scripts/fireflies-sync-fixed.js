#!/usr/bin/env node

/**
 * Fixed Fireflies Sync Script
 * Syncs meeting transcripts to documents table with proper schema
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
          transcript_url
        }
      }
    `;

    const data = await this.graphqlRequest(query, { limit });
    return data.transcripts;
  }

  async getTranscriptFull(transcriptId) {
    // Using ONLY validated working fields from API test
    const query = `
      query GetTranscriptFull($id: String!) {
        transcript(id: $id) {
          id
          title
          date
          duration
          participants
          host_email
          organizer_email
          transcript_url
          audio_url
          video_url
          
          meeting_attendees {
            displayName
            email
            name
          }
          
          user {
            name
            email
          }
          
          summary {
            action_items
            keywords
            outline
            overview
            shorthand_bullet
          }
          
          sentences {
            text
            speaker_id
            start_time
            ai_filters {
              sentiment
              task
              question
            }
          }
          
          analytics {
            sentiments {
              negative_pct
              neutral_pct
              positive_pct
            }
            speakers {
              speaker_id
              name
              duration
            }
          }
        }
      }
    `;

    const variables = { id: transcriptId };
    const data = await this.graphqlRequest(query, variables);
    return data.transcript;
  }
}

// Format transcript for documents table
function formatTranscriptForDocument(transcript) {
  // Build the full content text
  let content = `# ${transcript.title}\n\n`;
  
  // Meeting info
  content += `**Date:** ${new Date(transcript.date * 1000).toLocaleString()}\n`;
  content += `**Duration:** ${Math.floor((transcript.duration || 0) / 60)} minutes\n`;
  content += `**Participants:** ${transcript.participants || 'N/A'}\n\n`;
  
  // Meeting Attendees
  if (transcript.meeting_attendees && transcript.meeting_attendees.length > 0) {
    content += `**Attendees:**\n`;
    transcript.meeting_attendees.forEach(attendee => {
      const name = attendee.displayName || attendee.name || 'Unknown';
      const email = attendee.email ? ` (${attendee.email})` : '';
      content += `- ${name}${email}\n`;
    });
    content += '\n';
  }
  
  // Summary
  if (transcript.summary) {
    content += `## Summary\n`;
    content += `${transcript.summary.overview || 'No summary available'}\n\n`;
    
    // Keywords - can be string or array
    if (transcript.summary.keywords) {
      const kw = Array.isArray(transcript.summary.keywords)
        ? transcript.summary.keywords
        : [transcript.summary.keywords];
      
      if (kw.length > 0 && kw[0]) {
        content += `**Keywords:** ${kw.join(', ')}\n\n`;
      }
    }
    
    // Key Points (shorthand_bullet) - can be string or array
    if (transcript.summary.shorthand_bullet) {
      const bullets = Array.isArray(transcript.summary.shorthand_bullet) 
        ? transcript.summary.shorthand_bullet 
        : [transcript.summary.shorthand_bullet];
      
      if (bullets.length > 0 && bullets[0]) {
        content += `## Key Points\n`;
        bullets.forEach(point => {
          if (point) content += `- ${point}\n`;
        });
        content += '\n';
      }
    }
    
    // Action Items - can be string or array
    if (transcript.summary.action_items) {
      const items = Array.isArray(transcript.summary.action_items)
        ? transcript.summary.action_items
        : [transcript.summary.action_items];
      
      if (items.length > 0 && items[0]) {
        content += `## Action Items\n`;
        items.forEach(item => {
          if (item) content += `- ${item}\n`;
        });
        content += '\n';
      }
    }
    
    // Outline - can be string or array
    if (transcript.summary.outline) {
      const outlineItems = Array.isArray(transcript.summary.outline)
        ? transcript.summary.outline
        : [transcript.summary.outline];
      
      if (outlineItems.length > 0 && outlineItems[0]) {
        content += `## Meeting Outline\n`;
        outlineItems.forEach(section => {
          if (section) content += `- ${section}\n`;
        });
        content += '\n';
      }
    }
  }
  
  // Analytics Summary
  if (transcript.analytics) {
    if (transcript.analytics.sentiments) {
      content += `## Sentiment Analysis\n`;
      content += `- Positive: ${Math.round(transcript.analytics.sentiments.positive_pct || 0)}%\n`;
      content += `- Neutral: ${Math.round(transcript.analytics.sentiments.neutral_pct || 0)}%\n`;
      content += `- Negative: ${Math.round(transcript.analytics.sentiments.negative_pct || 0)}%\n\n`;
    }
    
    if (transcript.analytics.speakers && transcript.analytics.speakers.length > 0) {
      content += `## Speaker Statistics\n`;
      transcript.analytics.speakers.forEach(speaker => {
        const name = speaker.name || speaker.speaker_id;
        const duration = Math.round((speaker.duration || 0) / 60);
        content += `- ${name}: ${duration} minutes\n`;
      });
      content += '\n';
    }
  }
  
  // Full Transcript with speaker identification
  if (transcript.sentences && transcript.sentences.length > 0) {
    content += `## Full Transcript\n\n`;
    
    // Group sentences by speaker for better readability
    let currentSpeaker = null;
    let speakerText = [];
    
    transcript.sentences.forEach((sentence, index) => {
      const speaker = sentence.speaker_id || 'Unknown';
      
      if (speaker !== currentSpeaker) {
        // Output previous speaker's text
        if (currentSpeaker && speakerText.length > 0) {
          content += `**${currentSpeaker}:** ${speakerText.join(' ')}\n\n`;
        }
        currentSpeaker = speaker;
        speakerText = [sentence.text];
      } else {
        speakerText.push(sentence.text);
      }
      
      // Output last speaker's text
      if (index === transcript.sentences.length - 1 && speakerText.length > 0) {
        content += `**${currentSpeaker}:** ${speakerText.join(' ')}\n\n`;
      }
    });
  }
  
  // Extract key questions and tasks
  const keyQuestions = [];
  const keyTasks = [];
  
  if (transcript.sentences) {
    transcript.sentences.forEach(sentence => {
      if (sentence.ai_filters) {
        if (sentence.ai_filters.question) {
          keyQuestions.push({
            text: sentence.text,
            speaker: sentence.speaker_id,
            sentiment: sentence.ai_filters.sentiment
          });
        }
        if (sentence.ai_filters.task) {
          keyTasks.push({
            text: sentence.text,
            speaker: sentence.speaker_id
          });
        }
      }
    });
  }
  
  // Create metadata object with all meeting data
  const metadata = {
    fireflies_id: transcript.id,
    meeting_date: new Date(transcript.date * 1000).toISOString(),
    duration_minutes: Math.floor((transcript.duration || 0) / 60),
    participants: transcript.participants,
    attendees: transcript.meeting_attendees || [],
    host_email: transcript.host_email,
    organizer_email: transcript.organizer_email,
    user: transcript.user || null,
    transcript_url: transcript.transcript_url || `https://app.fireflies.ai/view/${transcript.id}`,
    audio_url: transcript.audio_url,
    video_url: transcript.video_url,
    keywords: Array.isArray(transcript.summary?.keywords)
      ? transcript.summary.keywords
      : (transcript.summary?.keywords ? [transcript.summary.keywords] : []),
    action_items: Array.isArray(transcript.summary?.action_items)
      ? transcript.summary.action_items
      : (transcript.summary?.action_items ? [transcript.summary.action_items] : []),
    key_points: Array.isArray(transcript.summary?.shorthand_bullet) 
      ? transcript.summary.shorthand_bullet 
      : (transcript.summary?.shorthand_bullet ? [transcript.summary.shorthand_bullet] : []),
    outline: Array.isArray(transcript.summary?.outline)
      ? transcript.summary.outline
      : (transcript.summary?.outline ? [transcript.summary.outline] : []),
    sentiment_scores: transcript.analytics?.sentiments || null,
    speaker_analytics: transcript.analytics?.speakers || null,
    key_questions: keyQuestions.slice(0, 10), // Limit to top 10
    key_tasks: keyTasks.slice(0, 10), // Limit to top 10
    total_sentences: transcript.sentences?.length || 0,
    source_type: 'fireflies',
    sync_date: new Date().toISOString()
  };
  
  // Return document data in the correct format for the documents table
  return {
    source: `fireflies_${transcript.id}.md`,
    content: content,
    title: transcript.title || `Meeting - ${new Date(transcript.date * 1000).toLocaleDateString()}`,
    metadata: metadata
  };
}

// Check if transcript already exists
async function checkExistingTranscript(firefliesId) {
  const { data, error } = await supabase
    .from('documents')
    .select('id')
    .eq('metadata->>fireflies_id', firefliesId)
    .limit(1);
  
  if (error) {
    console.error('Error checking existing transcript:', error);
    return false;
  }
  
  return data && data.length > 0;
}

// Main sync function
async function syncFirefliesTranscripts() {
  console.log('🚀 Fixed Fireflies Sync Script');
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
        
        // Check if already exists
        const exists = await checkExistingTranscript(basicTranscript.id);
        if (exists) {
          console.log(`   ⏭️  Already synced, skipping\n`);
          stats.skipped++;
          continue;
        }
        
        // Fetch full transcript data
        console.log('   ⬇️  Fetching full transcript...');
        const fullTranscript = await fireflies.getTranscriptFull(basicTranscript.id);
        
        // Format for documents table
        const documentData = formatTranscriptForDocument(fullTranscript);
        
        // Save to Supabase
        console.log('   💾 Saving to documents table...');
        const { error: insertError } = await supabase
          .from('documents')
          .insert(documentData);
        
        if (insertError) {
          throw insertError;
        }
        
        console.log('   ✅ Successfully synced\n');
        stats.synced++;
        
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
    console.log('\n🧮 Now run vectorization script to generate embeddings:');
    console.log('   node scripts/vectorize-all-documents.js');
  }
}

// Run the sync
syncFirefliesTranscripts().catch(console.error);