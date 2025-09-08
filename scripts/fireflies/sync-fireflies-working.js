#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY;

class FirefliesClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.endpoint = 'https://api.fireflies.ai/graphql';
  }

  async getRecentTranscripts(limit = 10) {
    const query = `
      query GetTranscripts($limit: Int!) {
        transcripts(limit: $limit) {
          id
          title
          date
          duration
          host_email
          participants
          meeting_link
          summary {
            overview
            shorthand_bullet
            action_items
            keywords
            bullet_gist
          }
        }
      }
    `;

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        query,
        variables: { limit }
      })
    });

    const data = await response.json();
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error('Failed to fetch transcripts');
    }

    return data.data?.transcripts || [];
  }

  async getFullTranscript(transcriptId) {
    const query = `
      query GetTranscript($transcriptId: String!) {
        transcript(id: $transcriptId) {
          id
          title
          date
          duration
          host_email
          participants
          meeting_link
          summary {
            overview
            shorthand_bullet
            action_items
            keywords
            bullet_gist
          }
          sentences {
            text
            speaker_name
            start_time
          }
        }
      }
    `;

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        query,
        variables: { transcriptId }
      })
    });

    const data = await response.json();
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error('Failed to fetch transcript details');
    }

    return data.data?.transcript;
  }
}

function formatTranscriptContent(transcript) {
  let content = '';
  
  // Title and metadata
  content += `# ${transcript.title}\n\n`;
  content += `**Date:** ${new Date(transcript.date).toLocaleDateString()}\n`;
  content += `**Duration:** ${Math.floor((transcript.duration || 0) / 60)} minutes\n`;
  
  if (transcript.participants && transcript.participants.length > 0) {
    content += `**Participants:** ${transcript.participants.join(', ')}\n`;
  }
  
  if (transcript.host_email) {
    content += `**Host:** ${transcript.host_email}\n`;
  }
  
  content += '\n';
  
  // Summary/Overview
  if (transcript.summary?.overview) {
    content += `## Summary\n${transcript.summary.overview}\n\n`;
  }
  
  // Keywords
  if (transcript.summary?.keywords && Array.isArray(transcript.summary.keywords) && transcript.summary.keywords.length > 0) {
    content += `## Keywords\n${transcript.summary.keywords.join(', ')}\n\n`;
  }
  
  // Action Items
  if (transcript.summary?.action_items) {
    // Handle both array and string formats
    const actionItems = Array.isArray(transcript.summary.action_items) 
      ? transcript.summary.action_items 
      : (typeof transcript.summary.action_items === 'string' ? [transcript.summary.action_items] : []);
    
    if (actionItems.length > 0) {
      content += `## Action Items\n`;
      actionItems.forEach(item => {
        content += `- [ ] ${item}\n`;
      });
      content += '\n';
    }
  }
  
  // Bullet Points
  if (transcript.summary?.bullet_gist) {
    const bulletPoints = Array.isArray(transcript.summary.bullet_gist)
      ? transcript.summary.bullet_gist
      : (typeof transcript.summary.bullet_gist === 'string' ? [transcript.summary.bullet_gist] : []);
    
    if (bulletPoints.length > 0) {
      content += `## Key Points\n`;
      bulletPoints.forEach(point => {
        content += `- ${point}\n`;
      });
      content += '\n';
    }
  }
  
  // Full transcript
  if (transcript.sentences && transcript.sentences.length > 0) {
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

async function syncFirefliesToDocuments() {
  console.log('🚀 Fireflies to Documents Sync\n');
  console.log('================================\n');
  
  const fireflies = new FirefliesClient(FIREFLIES_API_KEY);
  
  try {
    // Get recent transcripts
    console.log('📋 Fetching recent transcripts...');
    const transcripts = await fireflies.getRecentTranscripts(20);
    console.log(`   Found ${transcripts.length} transcripts\n`);
    
    if (transcripts.length === 0) {
      console.log('✅ No transcripts to sync');
      return;
    }
    
    // Check existing synced documents
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('metadata')
      .not('metadata', 'is', null);
    
    const syncedIds = new Set();
    existingDocs?.forEach(doc => {
      if (doc.metadata?.fireflies_id) {
        syncedIds.add(doc.metadata.fireflies_id);
      }
    });
    
    const newTranscripts = transcripts.filter(t => !syncedIds.has(t.id));
    
    console.log(`   ${syncedIds.size} already synced`);
    console.log(`   ${newTranscripts.length} new transcripts to sync\n`);
    
    if (newTranscripts.length === 0) {
      console.log('✅ All transcripts already synced');
      return;
    }
    
    // Process each transcript
    const results = { successful: 0, failed: 0 };
    
    for (const transcriptSummary of newTranscripts) {
      console.log(`\n📄 Processing: ${transcriptSummary.title}`);
      console.log(`   Date: ${new Date(transcriptSummary.date).toLocaleDateString()}`);
      
      try {
        // Get full transcript
        console.log('   ⬇️ Fetching full transcript...');
        const transcript = await fireflies.getFullTranscript(transcriptSummary.id);
        
        if (!transcript) {
          console.log('   ⚠️ Could not fetch full transcript');
          results.failed++;
          continue;
        }
        
        // Format content
        console.log('   📝 Formatting content...');
        const content = formatTranscriptContent(transcript);
        
        // Prepare action items and bullet points
        const actionItems = transcript.summary?.action_items;
        const bulletPoints = transcript.summary?.bullet_gist;
        
        // Handle different data formats safely
        let actionItemsArray = [];
        if (actionItems) {
          if (Array.isArray(actionItems)) {
            actionItemsArray = actionItems;
          } else if (typeof actionItems === 'string') {
            actionItemsArray = [actionItems];
          }
        }
        
        let bulletPointsArray = [];
        if (bulletPoints) {
          if (Array.isArray(bulletPoints)) {
            bulletPointsArray = bulletPoints;
          } else if (typeof bulletPoints === 'string') {
            bulletPointsArray = [bulletPoints];
          }
        }
        
        // Prepare document data
        const documentData = {
          title: transcript.title,
          content: content,
          summary: transcript.summary?.overview || null,
          action_items: actionItemsArray.length > 0 ? actionItemsArray : null,
          bullet_points: bulletPointsArray.length > 0 ? bulletPointsArray : null,
          participants: Array.isArray(transcript.participants) ? transcript.participants : null,
          source: 'fireflies',
          metadata: {
            fireflies_id: transcript.id,
            meeting_date: transcript.date,
            duration_minutes: Math.floor((transcript.duration || 0) / 60),
            host_email: transcript.host_email || null,
            meeting_link: transcript.meeting_link || null,
            keywords: Array.isArray(transcript.summary?.keywords) ? transcript.summary.keywords : [],
            sync_timestamp: new Date().toISOString()
          }
        };
        
        // Save to database
        console.log('   💾 Saving to documents table...');
        const { error } = await supabase
          .from('documents')
          .insert(documentData);
        
        if (error) {
          console.error(`   ❌ Database error: ${error.message}`);
          results.failed++;
        } else {
          console.log('   ✅ Successfully saved');
          results.successful++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.failed++;
      }
    }
    
    // Summary
    console.log('\n================================');
    console.log('📊 Sync Complete!\n');
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`❌ Failed: ${results.failed}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the sync
syncFirefliesToDocuments().catch(console.error);