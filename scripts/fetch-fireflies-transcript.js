#!/usr/bin/env node
import { config } from 'dotenv';

config({ path: '.env.local' });

const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY;

class FirefliesClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.endpoint = 'https://api.fireflies.ai/graphql';
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
      throw new Error('Failed to fetch transcript');
    }

    return data.data?.transcript;
  }

  formatTranscriptAsMarkdown(transcript) {
    let content = '';
    
    // Title and metadata
    content += `# ${transcript.title}\n\n`;
    content += `**Date:** ${new Date(transcript.date).toLocaleDateString()}\n`;
    content += `**Duration:** ${Math.floor((transcript.duration || 0) / 60)} minutes\n`;
    
    if (transcript.participants && transcript.participants.length > 0) {
      const participants = Array.isArray(transcript.participants) 
        ? transcript.participants 
        : transcript.participants.split(',').map(p => p.trim());
      content += `**Participants:** ${participants.join(', ')}\n`;
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
      const actionItems = Array.isArray(transcript.summary.action_items) 
        ? transcript.summary.action_items 
        : [transcript.summary.action_items];
      
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
        : [transcript.summary.bullet_gist];
      
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
}

async function fetchAndSaveTranscript() {
  console.log('🚀 Fetching Fireflies transcript...\n');
  
  const fireflies = new FirefliesClient(FIREFLIES_API_KEY);
  
  // Use one of the known transcript IDs
  const transcriptId = '01K4DD1TCQXTD2AWCQEFR9W2FG'; // GWB TB meeting
  
  try {
    console.log(`📋 Fetching transcript: ${transcriptId}`);
    const transcript = await fireflies.getTranscriptById(transcriptId);
    
    if (!transcript) {
      console.log('❌ Could not fetch transcript');
      return;
    }
    
    console.log(`✅ Fetched: ${transcript.title}`);
    console.log(`   Date: ${new Date(transcript.date).toLocaleDateString()}`);
    console.log(`   Duration: ${Math.floor((transcript.duration || 0) / 60)} minutes`);
    
    // Format as markdown
    console.log('\n📝 Formatting as markdown...');
    const markdownContent = fireflies.formatTranscriptAsMarkdown(transcript);
    
    // Save to file
    const filename = `fireflies-transcript-${transcriptId}.md`;
    const fs = await import('fs/promises');
    await fs.writeFile(filename, markdownContent);
    
    console.log(`\n✅ Saved to: ${filename}`);
    console.log(`   File size: ${(markdownContent.length / 1024).toFixed(2)} KB`);
    console.log(`   Sentences: ${transcript.sentences?.length || 0}`);
    console.log(`   Action items: ${Array.isArray(transcript.summary?.action_items) ? transcript.summary.action_items.length : 0}`);
    console.log(`   Bullet points: ${Array.isArray(transcript.summary?.bullet_gist) ? transcript.summary.bullet_gist.length : 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchAndSaveTranscript().catch(console.error);