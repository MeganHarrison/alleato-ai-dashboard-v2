#!/usr/bin/env node

/**
 * Corrected Fireflies Sync Script
 * 
 * This corrected version uses the actual Fireflies API schema and includes:
 * - Proper GraphQL queries that match the documented schema
 * - Correct field names and structure
 * - Proper error handling
 * - Client-side analysis of transcript data
 * 
 * Usage:
 *   node scripts/corrected-fireflies-sync.js --limit=50 --dry-run=false
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  if (key && value) {
    acc[key.replace('--', '')] = value;
  }
  return acc;
}, {});

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = args['supabase-url'] || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = args['supabase-key'] || process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIREFLIES_API_KEY = args['fireflies-key'] || process.env.FIREFLIES_API_KEY;
const SYNC_LIMIT = parseInt(args['limit'] || '10');
const DRY_RUN = args['dry-run'] === 'true';
const VERBOSE = args['verbose'] === 'true';

console.log('🔧 Corrected Fireflies Sync Configuration:');
console.log(`   Sync Limit: ${SYNC_LIMIT}`);
console.log(`   Dry Run: ${DRY_RUN}`);
console.log(`   Verbose: ${VERBOSE}\n`);

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !FIREFLIES_API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Corrected Fireflies GraphQL client using actual API schema
 */
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
      throw new Error(`Fireflies API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
    }

    return data.data;
  }

  /**
   * Get list of transcripts using correct schema
   */
  async getTranscripts(limit = 10) {
    const query = `
      query GetTranscripts($limit: Int) {
        transcripts(limit: $limit) {
          id
          title
          date
          duration
          transcript_url
          audio_url
          video_url
          participants
          host_email
          organizer_email
          meeting_attendees {
            displayName
            email
            name
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, { limit });
    return data.transcripts;
  }

  /**
   * Get detailed transcript using ONLY documented fields
   */
  async getTranscriptDetails(transcriptId) {
    const query = `
      query GetTranscriptDetails($transcriptId: String!) {
        transcript(id: $transcriptId) {
          id
          title
          date
          duration
          transcript_url
          audio_url
          video_url
          participants
          host_email
          organizer_email
          meeting_attendees {
            displayName
            email
            name
          }
          sentences {
            index
            text
            raw_text
            start_time
            end_time
            speaker_id
            speaker_name
            ai_filters {
              task
              question
              sentiment
              pricing
              metric
              date_and_time
            }
          }
          summary {
            action_items
            keywords
            outline
            overview
            bullet_gist
            gist
            shorthand_bullet
            short_summary
            short_overview
          }
          user {
            user_id
            name
            email
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, { transcriptId });
    return data.transcript;
  }

  /**
   * Extract metadata from transcript data (client-side analysis)
   */
  extractMetadata(transcript) {
    const metadata = {
      // Basic fields
      fireflies_id: transcript.id,
      title: transcript.title,
      date: new Date(transcript.date).toISOString(),
      duration_minutes: Math.round((transcript.duration || 0) / 60),
      participants: transcript.participants || [],
      transcript_url: transcript.transcript_url,
      audio_url: transcript.audio_url,
      video_url: transcript.video_url,
      organizer_email: transcript.organizer_email,
      host_email: transcript.host_email,
      meeting_attendees: transcript.meeting_attendees || [],
      
      // Summary data
      summary: transcript.summary?.overview || null,
      action_items: transcript.summary?.action_items || [],
      keywords: transcript.summary?.keywords || [],
      outline: transcript.summary?.outline || null,
      bullet_points: transcript.summary?.shorthand_bullet || [],
      
      // Client-side analysis
      speaker_analytics: this.analyzeSpeakers(transcript),
      sentiment_analysis: this.analyzeSentiment(transcript),
      questions_analysis: this.analyzeQuestions(transcript),
      tasks_analysis: this.analyzeTasks(transcript),
      meeting_insights: this.extractInsights(transcript),
      
      // Timestamps
      synced_at: new Date().toISOString(),
    };

    return metadata;
  }

  /**
   * Analyze speakers from sentences (client-side)
   */
  analyzeSpeakers(transcript) {
    if (!transcript.sentences || transcript.sentences.length === 0) {
      return [];
    }

    const speakerMap = new Map();
    let totalDuration = 0;

    // Analyze each sentence
    transcript.sentences.forEach(sentence => {
      const speakerId = sentence.speaker_id || 'Unknown';
      const duration = (sentence.end_time || 0) - (sentence.start_time || 0);
      const wordCount = sentence.text ? sentence.text.split(/\s+/).length : 0;
      
      if (!speakerMap.has(speakerId)) {
        speakerMap.set(speakerId, {
          speaker_id: speakerId,
          speaker_name: sentence.speaker_name || speakerId,
          total_duration: 0,
          word_count: 0,
          sentence_count: 0,
          questions: 0,
          tasks_mentioned: 0,
        });
      }

      const speaker = speakerMap.get(speakerId);
      speaker.total_duration += duration;
      speaker.word_count += wordCount;
      speaker.sentence_count += 1;
      
      // Count AI filters
      if (sentence.ai_filters?.question) speaker.questions += 1;
      if (sentence.ai_filters?.task) speaker.tasks_mentioned += 1;
      
      totalDuration = Math.max(totalDuration, sentence.end_time || 0);
    });

    // Calculate percentages and rates
    return Array.from(speakerMap.values()).map(speaker => ({
      ...speaker,
      duration_percentage: totalDuration > 0 ? (speaker.total_duration / totalDuration) * 100 : 0,
      words_per_minute: speaker.total_duration > 0 ? (speaker.word_count / (speaker.total_duration / 60)) : 0,
      avg_words_per_sentence: speaker.sentence_count > 0 ? speaker.word_count / speaker.sentence_count : 0,
    }));
  }

  /**
   * Analyze sentiment from sentences
   */
  analyzeSentiment(transcript) {
    if (!transcript.sentences) {
      return { positive: 0, neutral: 0, negative: 0, dominant: 'neutral' };
    }

    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    let totalSentiments = 0;

    transcript.sentences.forEach(sentence => {
      if (sentence.ai_filters?.sentiment) {
        const sentiment = sentence.ai_filters.sentiment.toLowerCase();
        if (sentiments.hasOwnProperty(sentiment)) {
          sentiments[sentiment] += 1;
          totalSentiments += 1;
        }
      }
    });

    // Calculate percentages
    const percentages = {};
    Object.keys(sentiments).forEach(key => {
      percentages[key] = totalSentiments > 0 ? (sentiments[key] / totalSentiments) * 100 : 0;
    });

    // Determine dominant sentiment
    const dominant = Object.keys(percentages).reduce((a, b) => 
      percentages[a] > percentages[b] ? a : b
    );

    return {
      counts: sentiments,
      percentages,
      dominant,
      total_analyzed: totalSentiments,
    };
  }

  /**
   * Analyze questions from sentences
   */
  analyzeQuestions(transcript) {
    if (!transcript.sentences) {
      return { total: 0, by_speaker: {}, questions: [] };
    }

    const questions = [];
    const bySpeaker = {};

    transcript.sentences.forEach(sentence => {
      if (sentence.ai_filters?.question) {
        const speakerId = sentence.speaker_id || 'Unknown';
        
        questions.push({
          text: sentence.ai_filters.question,
          speaker_id: speakerId,
          speaker_name: sentence.speaker_name || speakerId,
          timestamp: sentence.start_time,
          context: sentence.text,
        });

        bySpeaker[speakerId] = (bySpeaker[speakerId] || 0) + 1;
      }
    });

    return {
      total: questions.length,
      by_speaker: bySpeaker,
      questions,
    };
  }

  /**
   * Analyze tasks from sentences
   */
  analyzeTasks(transcript) {
    if (!transcript.sentences) {
      return { total: 0, tasks: [] };
    }

    const tasks = [];

    transcript.sentences.forEach(sentence => {
      if (sentence.ai_filters?.task) {
        tasks.push({
          text: sentence.ai_filters.task,
          speaker_id: sentence.speaker_id || 'Unknown',
          speaker_name: sentence.speaker_name || 'Unknown',
          timestamp: sentence.start_time,
          context: sentence.text,
          priority: this.determinePriority(sentence.text),
        });
      }
    });

    return {
      total: tasks.length,
      tasks,
    };
  }

  /**
   * Extract meeting insights
   */
  extractInsights(transcript) {
    const insights = [];

    // Meeting duration insight
    const duration = transcript.duration || 0;
    if (duration > 3600) { // > 1 hour
      insights.push({
        type: 'duration',
        severity: 'medium',
        message: `Meeting duration was ${Math.round(duration/60)} minutes. Consider shorter meetings for better engagement.`,
      });
    }

    // Participation insight
    const speakers = this.analyzeSpeakers(transcript);
    if (speakers.length > 0) {
      const maxParticipation = Math.max(...speakers.map(s => s.duration_percentage));
      if (maxParticipation > 70) {
        insights.push({
          type: 'participation',
          severity: 'medium',
          message: `One speaker dominated ${maxParticipation.toFixed(1)}% of the meeting. Encourage more balanced participation.`,
        });
      }
    }

    // Action items insight
    const tasks = this.analyzeTasks(transcript);
    if (tasks.total === 0) {
      insights.push({
        type: 'action_items',
        severity: 'low',
        message: 'No clear action items identified. Consider adding specific next steps.',
      });
    }

    return insights;
  }

  /**
   * Helper to determine task priority
   */
  determinePriority(text) {
    const textLower = text?.toLowerCase() || '';
    if (textLower.includes('urgent') || textLower.includes('asap')) return 'urgent';
    if (textLower.includes('important') || textLower.includes('priority')) return 'high';
    if (textLower.includes('when you can') || textLower.includes('nice to have')) return 'low';
    return 'medium';
  }

  /**
   * Format markdown from transcript data
   */
  formatMarkdown(transcript, metadata) {
    let markdown = `# ${transcript.title}\n\n`;
    
    // Meeting info
    markdown += `## Meeting Information\n\n`;
    markdown += `- **Date:** ${new Date(transcript.date).toLocaleString()}\n`;
    markdown += `- **Duration:** ${Math.round((transcript.duration || 0) / 60)} minutes\n`;
    markdown += `- **Participants:** ${transcript.participants?.join(', ') || 'N/A'}\n`;
    
    if (transcript.meeting_attendees?.length > 0) {
      markdown += `\n### Attendees\n`;
      transcript.meeting_attendees.forEach(attendee => {
        markdown += `- ${attendee.displayName || attendee.name} (${attendee.email || 'No email'})\n`;
      });
    }

    // Summary
    if (transcript.summary?.overview) {
      markdown += `\n## Summary\n\n${transcript.summary.overview}\n`;
    }

    // Action Items
    if (metadata.tasks_analysis.total > 0) {
      markdown += `\n## Action Items\n\n`;
      metadata.tasks_analysis.tasks.forEach((task, i) => {
        markdown += `${i + 1}. **${task.text}**\n`;
        markdown += `   - Mentioned by: ${task.speaker_name}\n`;
        markdown += `   - Priority: ${task.priority}\n`;
        if (task.timestamp) {
          const minutes = Math.floor(task.timestamp / 60);
          const seconds = Math.floor(task.timestamp % 60);
          markdown += `   - Time: ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
        }
        markdown += `\n`;
      });
    }

    // Questions
    if (metadata.questions_analysis.total > 0) {
      markdown += `\n## Questions Asked\n\n`;
      metadata.questions_analysis.questions.forEach((question, i) => {
        markdown += `${i + 1}. ${question.text}\n`;
        markdown += `   - Asked by: ${question.speaker_name}\n`;
        if (question.timestamp) {
          const minutes = Math.floor(question.timestamp / 60);
          const seconds = Math.floor(question.timestamp % 60);
          markdown += `   - Time: ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
        }
        markdown += `\n`;
      });
    }

    // Speaker Analytics
    if (metadata.speaker_analytics.length > 0) {
      markdown += `\n## Speaker Analytics\n\n`;
      metadata.speaker_analytics.forEach(speaker => {
        markdown += `### ${speaker.speaker_name}\n`;
        markdown += `- Talk time: ${speaker.duration_percentage.toFixed(1)}%\n`;
        markdown += `- Words per minute: ${speaker.words_per_minute.toFixed(0)}\n`;
        markdown += `- Questions asked: ${speaker.questions}\n`;
        markdown += `- Tasks mentioned: ${speaker.tasks_mentioned}\n\n`;
      });
    }

    // Sentiment Analysis
    if (metadata.sentiment_analysis.total_analyzed > 0) {
      markdown += `\n## Sentiment Analysis\n\n`;
      markdown += `- **Dominant:** ${metadata.sentiment_analysis.dominant}\n`;
      markdown += `- Positive: ${metadata.sentiment_analysis.percentages.positive.toFixed(1)}%\n`;
      markdown += `- Neutral: ${metadata.sentiment_analysis.percentages.neutral.toFixed(1)}%\n`;
      markdown += `- Negative: ${metadata.sentiment_analysis.percentages.negative.toFixed(1)}%\n\n`;
    }

    // Insights
    if (metadata.meeting_insights.length > 0) {
      markdown += `\n## Meeting Insights\n\n`;
      metadata.meeting_insights.forEach(insight => {
        const emoji = insight.severity === 'high' ? '🔴' : insight.severity === 'medium' ? '🟡' : '🟢';
        markdown += `${emoji} **${insight.type}:** ${insight.message}\n\n`;
      });
    }

    // Keywords
    if (transcript.summary?.keywords?.length > 0) {
      markdown += `\n## Keywords\n\n`;
      markdown += transcript.summary.keywords.join(', ') + '\n\n';
    }

    // Footer
    markdown += `---\n\n`;
    markdown += `*Synced from Fireflies on ${new Date().toISOString()}*\n`;
    markdown += `*Transcript ID: ${transcript.id}*\n`;
    
    return markdown;
  }
}

/**
 * Main sync function
 */
async function syncFirefliesTranscripts() {
  console.log('🚀 Starting Corrected Fireflies Sync...\n');
  
  const fireflies = new FirefliesClient(FIREFLIES_API_KEY);
  const results = {
    processed: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Step 1: Get list of transcripts
    console.log(`📋 Fetching transcript list from Fireflies (limit: ${SYNC_LIMIT})...`);
    const transcripts = await fireflies.getTranscripts(SYNC_LIMIT);
    console.log(`Found ${transcripts.length} transcripts\n`);

    // Step 2: Check which ones already exist
    console.log('🔍 Checking existing meetings in database...');
    const existingIds = new Set();
    
    const { data: existingMeetings, error: fetchError } = await supabase
      .from('meetings')
      .select('fireflies_id')
      .not('fireflies_id', 'is', null);
    
    if (fetchError) {
      console.error('Error fetching existing meetings:', fetchError);
    } else {
      existingMeetings?.forEach(m => existingIds.add(m.fireflies_id));
      console.log(`Found ${existingIds.size} existing meetings\n`);
    }

    // Step 3: Process each transcript
    for (const transcript of transcripts) {
      console.log(`\n📄 Processing: ${transcript.title}`);
      console.log(`   ID: ${transcript.id}`);
      
      try {
        // Skip if already processed
        if (existingIds.has(transcript.id) && !args['force']) {
          console.log(`   ⏭️  Skipped (already exists)`);
          results.skipped++;
          continue;
        }

        // Get detailed transcript
        console.log(`   📥 Fetching transcript details...`);
        const fullTranscript = await fireflies.getTranscriptDetails(transcript.id);
        
        // Extract metadata
        const metadata = fireflies.extractMetadata(fullTranscript);
        console.log(`   📊 Extracted metadata:`);
        console.log(`      - ${metadata.speaker_analytics.length} speakers`);
        console.log(`      - ${metadata.tasks_analysis.total} action items`);
        console.log(`      - ${metadata.questions_analysis.total} questions`);
        console.log(`      - Dominant sentiment: ${metadata.sentiment_analysis.dominant}`);
        
        // Format as markdown
        const markdown = fireflies.formatMarkdown(fullTranscript, metadata);
        const fileName = `${transcript.id}.md`;
        
        let storageUrl = '';
        
        if (!DRY_RUN) {
          // Upload to Supabase Storage
          console.log(`   📤 Uploading to storage...`);
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('meetings')
            .upload(fileName, markdown, {
              contentType: 'text/markdown',
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('meetings')
            .getPublicUrl(fileName);
          storageUrl = urlData.publicUrl;
        } else {
          console.log(`   📤 [DRY RUN] Would upload: ${fileName}`);
          storageUrl = `https://dry-run-url/${fileName}`;
        }

        // Prepare meeting record
        const meetingRecord = {
          id: transcript.id,
          fireflies_id: transcript.id,
          title: metadata.title,
          date: metadata.date,
          duration_minutes: metadata.duration_minutes,
          participants: metadata.participants,
          speaker_count: metadata.speaker_analytics.length,
          transcript_url: metadata.transcript_url,
          audio_url: metadata.audio_url,
          video_url: metadata.video_url,
          storage_bucket_path: fileName,
          organizer_email: metadata.organizer_email,
          host_email: metadata.host_email,
          
          // Analysis results stored in raw_metadata
          raw_metadata: {
            meeting_attendees: metadata.meeting_attendees,
            speaker_analytics: metadata.speaker_analytics,
            sentiment_analysis: metadata.sentiment_analysis,
            questions_analysis: metadata.questions_analysis,
            tasks_analysis: metadata.tasks_analysis,
            meeting_insights: metadata.meeting_insights,
          },
          
          // Summary fields
          summary: metadata.summary,
          word_count: metadata.speaker_analytics.reduce((total, speaker) => total + speaker.word_count, 0),
          
          // Timestamps
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          synced_at: metadata.synced_at,
        };

        // Save to meetings table
        if (!DRY_RUN) {
          console.log(`   💾 Saving to database...`);
          const { error: insertError } = await supabase
            .from('meetings')
            .upsert(meetingRecord, {
              onConflict: 'id',
            });

          if (insertError) {
            throw insertError;
          }
          console.log(`   ✅ Successfully processed`);
        } else {
          console.log(`   💾 [DRY RUN] Would save to database`);
          console.log(`   ✅ [DRY RUN] Processing complete`);
        }
        
        results.processed++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.failed++;
        results.errors.push({
          transcript_id: transcript.id,
          title: transcript.title,
          error: error.message,
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Processed: ${results.processed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(err => {
        console.log(`   - ${err.title}: ${err.error}`);
      });
    }

    console.log('\n✨ Sync complete!\n');

  } catch (error) {
    console.error('Fatal error during sync:', error);
    process.exit(1);
  }
}

// Run the sync
syncFirefliesTranscripts()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });