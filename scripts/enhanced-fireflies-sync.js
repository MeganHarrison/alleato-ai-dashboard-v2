#!/usr/bin/env node

/**
 * Enhanced Fireflies Sync Script
 * 
 * This script syncs Fireflies transcripts to Supabase with:
 * - Storage in the 'meetings' bucket
 * - Enhanced metadata extraction
 * - Saving to the 'meetings' table
 * - Proper deduplication
 * 
 * Usage:
 *   npm run sync:fireflies-enhanced
 *   
 * Or with environment variables:
 *   FIREFLIES_API_KEY=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/enhanced-fireflies-sync.js
 *   
 * Or with command line args:
 *   node scripts/enhanced-fireflies-sync.js --fireflies-key=xxx --supabase-url=xxx --supabase-key=xxx --limit=50
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

// Load environment variables from .env.local first
config({ path: path.join(__dirname, '../.env.local') });

// Configuration with fallback order: CLI args > ENV vars > .env.local
const SUPABASE_URL = args['supabase-url'] || 
                     process.env.SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_KEY = args['supabase-key'] || 
                              process.env.SUPABASE_SERVICE_ROLE_KEY || 
                              process.env.SUPABASE_SERVICE_KEY;

const FIREFLIES_API_KEY = args['fireflies-key'] || 
                           process.env.FIREFLIES_API_KEY;

const OPENAI_API_KEY = args['openai-key'] || 
                       process.env.OPENAI_API_KEY;

// Sync options from CLI
const SYNC_LIMIT = parseInt(args['limit'] || '50');
const DRY_RUN = args['dry-run'] === 'true';

// Display configuration (mask sensitive data)
console.log('🔧 Configuration:');
console.log(`   Supabase URL: ${SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET'}`);
console.log(`   Supabase Key: ${SUPABASE_SERVICE_KEY ? '***' + SUPABASE_SERVICE_KEY.slice(-4) : 'NOT SET'}`);
console.log(`   Fireflies Key: ${FIREFLIES_API_KEY ? '***' + FIREFLIES_API_KEY.slice(-4) : 'NOT SET'}`);
console.log(`   Sync Limit: ${SYNC_LIMIT}`);
console.log(`   Dry Run: ${DRY_RUN}`);
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !FIREFLIES_API_KEY) {
  console.error('❌ Missing required environment variables\n');
  console.log('Please provide the following:');
  console.log('  1. Via .env.local file:');
  console.log('     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('     SUPABASE_SERVICE_ROLE_KEY=your_service_key');
  console.log('     FIREFLIES_API_KEY=your_fireflies_key\n');
  console.log('  2. Via environment variables:');
  console.log('     FIREFLIES_API_KEY=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npm run sync:fireflies-enhanced\n');
  console.log('  3. Via command line arguments:');
  console.log('     node scripts/enhanced-fireflies-sync.js --fireflies-key=xxx --supabase-url=xxx --supabase-key=xxx\n');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Fireflies GraphQL client
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
      throw new Error(`Fireflies API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  async getTranscripts(limit = 50) {
    const query = `
      query GetTranscripts($limit: Int) {
        transcripts(limit: $limit) {
          title
          id
          transcript_url
          duration
          date
          participants
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

  async getTranscriptDetails(transcriptId) {
    const query = `
      query GetTranscriptContent($id: String!) {
        transcript(id: $id) {
          title
          id
          transcript_url
          duration
          date
          participants
          meeting_attendees {
            displayName
            email
            name
          }
          sentences {
            text
            speaker_id
            start_time
            end_time
          }
          summary {
            action_items
            keywords
            outline
            overview
            notes
            shorthand_bullet
          }
          topics {
            text
            start_time
            end_time
          }
          organizer_email
          user {
            name
            email
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, { id: transcriptId });
    return data.transcript;
  }

  /**
   * Enhanced metadata extraction with additional fields
   */
  extractEnhancedMetadata(transcript) {
    const metadata = {
      fireflies_id: transcript.id,
      title: transcript.title,
      date: new Date(transcript.date).toISOString(),
      duration_minutes: Math.round((transcript.duration || 0) / 60),
      participants: transcript.participants || [],
      speaker_count: new Set(transcript.sentences?.map(s => s.speaker_id) || []).size,
      transcript_url: transcript.transcript_url,
      organizer_email: transcript.organizer_email,
      
      // Enhanced fields
      meeting_attendees: transcript.meeting_attendees || [],
      topics: transcript.topics || [],
      
      // Summary fields
      summary: transcript.summary?.overview || null,
      action_items: transcript.summary?.action_items || [],
      keywords: transcript.summary?.keywords || [],
      outline: transcript.summary?.outline || null,
      notes: transcript.summary?.notes || null,
      bullet_points: transcript.summary?.shorthand_bullet || [],
      
      // Additional metadata
      total_words: transcript.sentences?.reduce((acc, s) => 
        acc + (s.text?.split(/\s+/).length || 0), 0) || 0,
      meeting_type: this.detectMeetingType(transcript),
      has_action_items: (transcript.summary?.action_items?.length || 0) > 0,
      
      // Timestamps
      synced_at: new Date().toISOString(),
    };

    return metadata;
  }

  /**
   * Detect meeting type based on title and content
   */
  detectMeetingType(transcript) {
    const title = transcript.title?.toLowerCase() || '';
    
    if (title.includes('daily') || title.includes('standup')) return 'daily_standup';
    if (title.includes('weekly') || title.includes('week')) return 'weekly_sync';
    if (title.includes('planning') || title.includes('sprint')) return 'planning';
    if (title.includes('retro') || title.includes('retrospective')) return 'retrospective';
    if (title.includes('1:1') || title.includes('one-on-one')) return 'one_on_one';
    if (title.includes('interview')) return 'interview';
    if (title.includes('demo') || title.includes('presentation')) return 'demo';
    if (title.includes('review')) return 'review';
    if (title.includes('client') || title.includes('customer')) return 'client_meeting';
    
    return 'general';
  }

  /**
   * Format transcript as enhanced markdown with sections
   */
  formatEnhancedMarkdown(transcript) {
    let markdown = `# ${transcript.title}\n\n`;
    
    // Meeting info
    markdown += `## Meeting Information\n\n`;
    markdown += `- **Date:** ${new Date(transcript.date).toLocaleString()}\n`;
    markdown += `- **Duration:** ${Math.round((transcript.duration || 0) / 60)} minutes\n`;
    markdown += `- **Participants:** ${transcript.participants?.join(', ') || 'N/A'}\n`;
    
    if (transcript.meeting_attendees?.length > 0) {
      markdown += `- **Attendees:**\n`;
      transcript.meeting_attendees.forEach(attendee => {
        markdown += `  - ${attendee.displayName || attendee.name} (${attendee.email || 'No email'})\n`;
      });
    }
    
    markdown += `- **Organizer:** ${transcript.organizer_email || 'N/A'}\n`;
    markdown += `- **Fireflies URL:** ${transcript.transcript_url || 'N/A'}\n\n`;

    // Summary section
    if (transcript.summary) {
      markdown += `## Summary\n\n`;
      
      if (transcript.summary.overview) {
        markdown += `### Overview\n${transcript.summary.overview}\n\n`;
      }
      
      if (transcript.summary.outline) {
        markdown += `### Outline\n${transcript.summary.outline}\n\n`;
      }
      
      if (transcript.summary.action_items?.length > 0) {
        markdown += `### Action Items\n`;
        transcript.summary.action_items.forEach((item, i) => {
          markdown += `${i + 1}. ${item}\n`;
        });
        markdown += '\n';
      }
      
      if (transcript.summary.keywords?.length > 0) {
        markdown += `### Keywords\n`;
        markdown += transcript.summary.keywords.map(k => `\`${k}\``).join(', ') + '\n\n';
      }
      
      if (transcript.summary.shorthand_bullet?.length > 0) {
        markdown += `### Key Points\n`;
        transcript.summary.shorthand_bullet.forEach(point => {
          markdown += `- ${point}\n`;
        });
        markdown += '\n';
      }
      
      if (transcript.summary.notes) {
        markdown += `### Notes\n${transcript.summary.notes}\n\n`;
      }
    }

    // Topics section
    if (transcript.topics?.length > 0) {
      markdown += `## Topics Discussed\n\n`;
      transcript.topics.forEach((topic, i) => {
        const startTime = Math.floor(topic.start_time / 60);
        const endTime = Math.floor(topic.end_time / 60);
        markdown += `${i + 1}. **[${startTime}:00 - ${endTime}:00]** ${topic.text}\n`;
      });
      markdown += '\n';
    }

    // Full transcript
    if (transcript.sentences?.length > 0) {
      markdown += `## Full Transcript\n\n`;
      let currentSpeaker = '';
      let speakerText = '';
      
      transcript.sentences.forEach((sentence, index) => {
        if (sentence.speaker_id !== currentSpeaker) {
          if (currentSpeaker && speakerText) {
            markdown += `**${currentSpeaker}:** ${speakerText.trim()}\n\n`;
          }
          currentSpeaker = sentence.speaker_id;
          speakerText = sentence.text + ' ';
        } else {
          speakerText += sentence.text + ' ';
        }
        
        // Add the last speaker's text
        if (index === transcript.sentences.length - 1 && speakerText) {
          markdown += `**${currentSpeaker}:** ${speakerText.trim()}\n\n`;
        }
      });
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
  console.log('🚀 Starting enhanced Fireflies sync...\n');
  
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
        if (existingIds.has(transcript.id)) {
          console.log(`   ⏭️  Skipped (already exists)`);
          results.skipped++;
          continue;
        }

        // Get full transcript details
        console.log(`   📥 Fetching full transcript details...`);
        const fullTranscript = await fireflies.getTranscriptDetails(transcript.id);
        
        // Extract enhanced metadata
        const metadata = fireflies.extractEnhancedMetadata(fullTranscript);
        console.log(`   📊 Extracted metadata (${metadata.total_words} words, ${metadata.speaker_count} speakers)`);
        
        // Format as markdown
        const markdown = fireflies.formatEnhancedMarkdown(fullTranscript);
        const fileName = `${transcript.id}.md`;
        
        let publicUrl = '';
        
        if (!DRY_RUN) {
          // Upload to Supabase Storage (meetings bucket)
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
          publicUrl = urlData.publicUrl;
        } else {
          console.log(`   📤 [DRY RUN] Would upload to storage: ${fileName}`);
          publicUrl = `https://dry-run-url/${fileName}`;
        }

        // Prepare meeting record
        const meetingRecord = {
          id: transcript.id, // Use Fireflies ID as primary key
          fireflies_id: transcript.id,
          title: metadata.title,
          date: metadata.date,
          duration_minutes: metadata.duration_minutes,
          participants: metadata.participants,
          speaker_count: metadata.speaker_count,
          transcript_url: metadata.transcript_url,
          storage_url: publicUrl,
          organizer_email: metadata.organizer_email,
          meeting_type: metadata.meeting_type,
          
          // Summary fields as JSONB
          summary: metadata.summary ? {
            overview: metadata.summary,
            action_items: metadata.action_items,
            keywords: metadata.keywords,
            outline: metadata.outline,
            notes: metadata.notes,
            bullet_points: metadata.bullet_points,
          } : null,
          
          // Additional fields
          topics: metadata.topics,
          meeting_attendees: metadata.meeting_attendees,
          total_words: metadata.total_words,
          has_action_items: metadata.has_action_items,
          
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
          console.log(`   ✅ [DRY RUN] Would be successfully processed`);
        }
        
        results.processed++;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

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

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Processed: ${results.processed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(err => {
        console.log(`   - ${err.title}: ${err.error}`);
      });
    }

    console.log('\n✨ Sync complete!');

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