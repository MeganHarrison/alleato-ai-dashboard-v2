#!/usr/bin/env node

/**
 * Simplified Fireflies Sync Script
 * Updates existing meetings with Fireflies summary data
 * Works with current table structure
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

  async getRecentTranscripts(limit = 10) {
    const query = `
      query GetTranscripts($limit: Int) {
        transcripts(limit: $limit) {
          id
          title
          date
          duration
          participants
        }
      }
    `;

    const data = await this.graphqlRequest(query, { limit });
    return data.transcripts;
  }

  async getTranscriptSummary(transcriptId) {
    const query = `
      query GetTranscriptSummary($id: String!) {
        transcript(id: $id) {
          id
          title
          date
          duration
          participants
          transcript_url
          
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
          
          summary {
            keywords
            action_items
            overview
            topics_discussed
            meeting_type
          }
          
          sentences {
            speaker_name
            text
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, { id: transcriptId });
    return data.transcript;
  }
}

// Format transcript for storage
function formatTranscriptContent(transcript) {
  let content = `# ${transcript.title}\n\n`;
  
  // Basic info
  content += `**Date:** ${new Date(transcript.date).toLocaleString()}\n`;
  content += `**Duration:** ${Math.floor((transcript.duration || 0) / 60)} minutes\n`;
  content += `**Participants:** ${transcript.participants?.join(', ') || 'N/A'}\n\n`;
  
  // Summary
  if (transcript.summary?.overview) {
    content += `## Summary\n${transcript.summary.overview}\n\n`;
  }
  
  // Keywords
  if (transcript.summary?.keywords?.length > 0) {
    content += `## Keywords\n${transcript.summary.keywords.join(', ')}\n\n`;
  }
  
  // Action Items
  if (Array.isArray(transcript.summary?.action_items) && transcript.summary.action_items.length > 0) {
    content += `## Action Items\n`;
    transcript.summary.action_items.forEach(item => {
      content += `- ${item}\n`;
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
  
  // Sentiment
  if (transcript.analytics?.sentiments) {
    const s = transcript.analytics.sentiments;
    content += `## Sentiment Analysis\n`;
    content += `- Positive: ${s.positive_pct?.toFixed(0) || 0}%\n`;
    content += `- Neutral: ${s.neutral_pct?.toFixed(0) || 0}%\n`;
    content += `- Negative: ${s.negative_pct?.toFixed(0) || 0}%\n\n`;
  }
  
  // Speaker Stats
  if (transcript.analytics?.speakers?.length > 0) {
    content += `## Speaker Participation\n`;
    transcript.analytics.speakers.forEach(speaker => {
      content += `- **${speaker.name}**: ${Math.round(speaker.duration_pct || 0)}% talk time, ${speaker.questions || 0} questions\n`;
    });
    content += '\n';
  }
  
  // Transcript
  if (transcript.sentences?.length > 0) {
    content += `## Transcript\n\n`;
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

// Main sync function
async function syncMeetings(options = {}) {
  const { limit = 5, dryRun = false } = options;
  
  console.log('🚀 Simplified Fireflies Sync\n');
  console.log('=============================\n');
  
  const fireflies = new FirefliesClient(FIREFLIES_API_KEY);
  
  try {
    // Get recent transcripts
    console.log('📋 Fetching recent transcripts from Fireflies...');
    const transcripts = await fireflies.getRecentTranscripts(limit);
    console.log(`   Found ${transcripts.length} transcripts\n`);
    
    if (transcripts.length === 0) {
      console.log('✅ No transcripts found');
      return;
    }
    
    // Check which ones are already synced
    const { data: existingMeetings } = await supabase
      .from('meetings')
      .select('fireflies_id, id, title')
      .not('fireflies_id', 'is', null);
    
    const syncedIds = new Set(existingMeetings?.map(m => m.fireflies_id) || []);
    console.log(`   ${syncedIds.size} meetings already have Fireflies IDs\n`);
    
    // Process each transcript
    let successCount = 0;
    let updateCount = 0;
    let failCount = 0;
    
    for (const transcript of transcripts) {
      try {
        const isUpdate = syncedIds.has(transcript.id);
        console.log(`📄 ${isUpdate ? 'Updating' : 'Processing'}: ${transcript.title}`);
        
        if (dryRun) {
          console.log('   🏃 Dry run - skipping database update\n');
          successCount++;
          continue;
        }
        
        // Get full transcript with summary
        console.log('   ⬇️ Fetching summary data...');
        const fullTranscript = await fireflies.getTranscriptSummary(transcript.id);
        
        // Format content
        const content = formatTranscriptContent(fullTranscript);
        
        // Calculate sentiment score (0-1 scale, where 1 is most positive)
        let sentimentScore = null;
        if (fullTranscript.analytics?.sentiments) {
          const s = fullTranscript.analytics.sentiments;
          sentimentScore = ((s.positive_pct || 0) - (s.negative_pct || 0) + 100) / 200;
        }
        
        // Prepare update data
        const updateData = {
          fireflies_id: fullTranscript.id,
          fireflies_link: fullTranscript.transcript_url || `https://app.fireflies.ai/view/${fullTranscript.id}`,
          summary: fullTranscript.summary?.overview || null,
          sentiment_score: sentimentScore,
          raw_metadata: {
            keywords: fullTranscript.summary?.keywords || [],
            action_items: fullTranscript.summary?.action_items || [],
            topics: fullTranscript.summary?.topics_discussed || [],
            meeting_type: fullTranscript.summary?.meeting_type || null,
            sentiment_details: fullTranscript.analytics?.sentiments || {},
            speakers: fullTranscript.analytics?.speakers || [],
            transcript_content: content
          },
          speaker_count: fullTranscript.analytics?.speakers?.length || 0,
          word_count: fullTranscript.analytics?.speakers?.reduce((sum, s) => sum + (s.word_count || 0), 0) || 0
        };
        
        if (isUpdate) {
          // Update existing meeting
          console.log('   💾 Updating existing meeting...');
          const { error } = await supabase
            .from('meetings')
            .update(updateData)
            .eq('fireflies_id', fullTranscript.id);
          
          if (error) throw error;
          updateCount++;
        } else {
          // Try to match by title and date
          const meetingDate = new Date(fullTranscript.date);
          const dateStart = new Date(meetingDate);
          dateStart.setHours(0, 0, 0, 0);
          const dateEnd = new Date(meetingDate);
          dateEnd.setHours(23, 59, 59, 999);
          
          const { data: matchingMeetings } = await supabase
            .from('meetings')
            .select('id, title')
            .ilike('title', `%${fullTranscript.title.substring(0, 20)}%`)
            .gte('date', dateStart.toISOString())
            .lte('date', dateEnd.toISOString())
            .limit(1);
          
          if (matchingMeetings && matchingMeetings.length > 0) {
            console.log('   🔗 Found matching meeting by title/date');
            const { error } = await supabase
              .from('meetings')
              .update(updateData)
              .eq('id', matchingMeetings[0].id);
            
            if (error) throw error;
            updateCount++;
          } else {
            console.log('   ⚠️ No matching meeting found in database');
            failCount++;
            continue;
          }
        }
        
        console.log('   ✅ Successfully synced\n');
        successCount++;
        
        // Rate limit
        await new Promise(r => setTimeout(r, 500));
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        failCount++;
      }
    }
    
    // Summary
    console.log('=============================');
    console.log('📊 Sync Complete!\n');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`🔄 Updated: ${updateCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\n💡 Meeting summaries are now available!');
      console.log('   The enhanced data will be displayed in the meeting details view.');
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const options = {
  limit: 5,
  dryRun: false
};

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1]);
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  }
});

if (args.includes('--help')) {
  console.log(`
Simplified Fireflies Sync

Updates existing meetings with Fireflies summary data.

Usage:
  node scripts/fireflies-sync-simple.js [options]

Options:
  --limit=N    Number of transcripts to sync (default: 5)
  --dry-run    Test without updating database
  --help       Show this help

Examples:
  node scripts/fireflies-sync-simple.js
  node scripts/fireflies-sync-simple.js --limit=10
  node scripts/fireflies-sync-simple.js --dry-run
`);
  process.exit(0);
}

// Run sync
syncMeetings(options).catch(console.error);