#!/usr/bin/env node

/**
 * Fireflies Sync to Meetings Table
 * Syncs meeting transcripts to the meetings table with complete participant information
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
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, FIREFLIES_API_KEY');
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

// Extract participants list for meetings table
function extractParticipants(transcript) {
  const participants = [];
  
  // Add participants from meeting_attendees (most reliable source)
  if (transcript.meeting_attendees && transcript.meeting_attendees.length > 0) {
    transcript.meeting_attendees.forEach(attendee => {
      const identifier = attendee.email || attendee.displayName || attendee.name;
      if (identifier && !participants.includes(identifier)) {
        participants.push(identifier);
      }
    });
  }
  
  // Add from participants string if available
  if (transcript.participants && typeof transcript.participants === 'string') {
    // Parse participants string (usually comma-separated)
    const parsed = transcript.participants.split(',').map(p => p.trim());
    parsed.forEach(p => {
      if (p && !participants.includes(p)) {
        participants.push(p);
      }
    });
  }
  
  // Add host if not already included
  if (transcript.host_email && !participants.includes(transcript.host_email)) {
    participants.push(transcript.host_email);
  }
  
  // Add organizer if not already included
  if (transcript.organizer_email && !participants.includes(transcript.organizer_email)) {
    participants.push(transcript.organizer_email);
  }
  
  // Add user if not already included
  if (transcript.user && transcript.user.email && !participants.includes(transcript.user.email)) {
    participants.push(transcript.user.email);
  }
  
  // Add speakers from analytics if available
  if (transcript.analytics && transcript.analytics.speakers) {
    transcript.analytics.speakers.forEach(speaker => {
      if (speaker.name && speaker.name !== 'Unknown' && !participants.includes(speaker.name)) {
        participants.push(speaker.name);
      }
    });
  }
  
  return participants;
}

// Build raw transcript text
function buildRawTranscript(transcript) {
  let rawTranscript = '';
  
  if (transcript.sentences && transcript.sentences.length > 0) {
    // Group sentences by speaker for better readability
    let currentSpeaker = null;
    let speakerText = [];
    
    transcript.sentences.forEach((sentence, index) => {
      const speaker = sentence.speaker_id || 'Unknown';
      
      if (speaker !== currentSpeaker) {
        // Output previous speaker's text
        if (currentSpeaker && speakerText.length > 0) {
          rawTranscript += `${currentSpeaker}: ${speakerText.join(' ')}\n\n`;
        }
        currentSpeaker = speaker;
        speakerText = [sentence.text];
      } else {
        speakerText.push(sentence.text);
      }
      
      // Output last speaker's text
      if (index === transcript.sentences.length - 1 && speakerText.length > 0) {
        rawTranscript += `${currentSpeaker}: ${speakerText.join(' ')}\n\n`;
      }
    });
  }
  
  return rawTranscript || 'No transcript available';
}

// Build summary text
function buildSummary(transcript) {
  let summary = '';
  
  if (transcript.summary) {
    // Overview
    if (transcript.summary.overview) {
      summary = transcript.summary.overview + '\n\n';
    }
    
    // Key Points
    if (transcript.summary.shorthand_bullet) {
      const bullets = Array.isArray(transcript.summary.shorthand_bullet) 
        ? transcript.summary.shorthand_bullet 
        : [transcript.summary.shorthand_bullet];
      
      if (bullets.length > 0 && bullets[0]) {
        summary += 'Key Points:\n';
        bullets.forEach(point => {
          if (point) summary += `• ${point}\n`;
        });
        summary += '\n';
      }
    }
    
    // Action Items
    if (transcript.summary.action_items) {
      const items = Array.isArray(transcript.summary.action_items)
        ? transcript.summary.action_items
        : [transcript.summary.action_items];
      
      if (items.length > 0 && items[0]) {
        summary += 'Action Items:\n';
        items.forEach(item => {
          if (item) summary += `• ${item}\n`;
        });
      }
    }
  }
  
  return summary || 'No summary available';
}

// Format transcript for meetings table
function formatTranscriptForMeetings(transcript) {
  // Extract participants with all available data
  const participants = extractParticipants(transcript);
  
  // Build metadata object
  const metadata = {
    fireflies_id: transcript.id,
    host_email: transcript.host_email,
    organizer_email: transcript.organizer_email,
    user: transcript.user || null,
    meeting_attendees: transcript.meeting_attendees || [],
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
    total_sentences: transcript.sentences?.length || 0,
    source: 'fireflies',
    sync_date: new Date().toISOString()
  };
  
  // Return meeting data in the correct format for the actual meetings table
  // Note: Fireflies returns timestamps in milliseconds, NOT seconds
  const meetingDate = new Date(transcript.date);
  
  return {
    fireflies_id: transcript.id,
    fireflies_link: transcript.transcript_url || `https://app.fireflies.ai/view/${transcript.id}`,
    storage_bucket_path: `fireflies/${transcript.id}`, // Use storage_bucket_path (not storage_path)
    title: transcript.title || `Meeting - ${meetingDate.toLocaleDateString()}`,
    date: meetingDate.toISOString(), // Use 'date' column (not 'meeting_date')
    duration_minutes: Math.floor((transcript.duration || 0) / 60),
    participants: participants, // PostgreSQL array of participant names/emails
    transcript_url: transcript.transcript_url || `https://app.fireflies.ai/view/${transcript.id}`,
    summary: buildSummary(transcript),
    raw_metadata: metadata // Store full metadata in raw_metadata column
  };
}

// Check if transcript already exists in meetings table
async function checkExistingMeeting(firefliesId) {
  const { data, error } = await supabase
    .from('meetings')
    .select('id')
    .eq('fireflies_id', firefliesId)
    .limit(1);
  
  if (error) {
    console.error('Error checking existing meeting:', error);
    return false;
  }
  
  return data && data.length > 0;
}

// Main sync function
async function syncFirefliesTranscripts() {
  console.log('🚀 Fireflies Sync to Meetings Table');
  console.log('=========================================\n');
  
  const fireflies = new FirefliesClient(FIREFLIES_API_KEY);
  
  const stats = {
    total: 0,
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    missingParticipants: []
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
        
        // Check if already exists in meetings table
        const exists = await checkExistingMeeting(basicTranscript.id);
        if (exists) {
          console.log(`   ⏭️  Already synced to meetings table, skipping\n`);
          stats.skipped++;
          continue;
        }
        
        // Fetch full transcript data
        console.log('   ⬇️  Fetching full transcript with participants...');
        const fullTranscript = await fireflies.getTranscriptFull(basicTranscript.id);
        
        // Format for meetings table
        const meetingData = formatTranscriptForMeetings(fullTranscript);
        
        // Check if participants were extracted
        if (!meetingData.participants || meetingData.participants.length === 0) {
          console.log('   ⚠️  WARNING: No participants found for this meeting');
          stats.missingParticipants.push(basicTranscript.title);
        } else {
          console.log(`   👥 Found ${meetingData.participants.length} participants: ${meetingData.participants.slice(0, 3).join(', ')}${meetingData.participants.length > 3 ? '...' : ''}`);
        }
        
        // Save to Supabase meetings table
        console.log('   💾 Saving to meetings table...');
        const { data: insertedMeeting, error: insertError } = await supabase
          .from('meetings')
          .insert(meetingData)
          .select()
          .single();
        
        if (insertError) {
          throw insertError;
        }
        
        console.log('   ✅ Successfully synced to meetings table\n');
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
  console.log(`✅ Successful: ${stats.synced} meetings added to meetings table`);
  console.log(`⏭️  Skipped (already exist): ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📝 Total processed: ${stats.total}`);
  
  if (stats.missingParticipants.length > 0) {
    console.log(`\n⚠️  Meetings with missing participants (${stats.missingParticipants.length}):`);
    stats.missingParticipants.forEach((title, idx) => {
      console.log(`  ${idx + 1}. ${title}`);
    });
    console.log('\n  Note: These meetings may need manual review to identify attendees');
  }
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    stats.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. ${err.transcript || 'General'}: ${err.error}`);
    });
  }
  
  console.log('\n✨ Sync completed at:', new Date().toLocaleString());
  
  // Provide next steps
  if (stats.synced > 0) {
    console.log('\n📝 Next steps:');
    console.log('   1. Review the meetings table in Supabase');
    console.log('   2. Check participant data for employee/client identification');
    console.log('   3. Associate meetings with projects as needed');
    console.log('   4. Run vectorization if needed for RAG search');
  }
}

// Run the sync
syncFirefliesTranscripts().catch(console.error);