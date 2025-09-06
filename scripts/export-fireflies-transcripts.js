#!/usr/bin/env node

/**
 * Local script to export the last 20 Fireflies transcripts
 * This uses the FirefliesClient logic from the worker but runs locally
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration from environment
const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!FIREFLIES_API_KEY) {
  console.error('❌ Missing FIREFLIES_API_KEY in .env.local');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Simple logger
const logger = {
  info: (msg, data) => console.log(`ℹ️  ${msg}`, data || ''),
  error: (msg, error) => console.error(`❌ ${msg}`, error?.message || error || ''),
  success: (msg, data) => console.log(`✅ ${msg}`, data || ''),
  debug: (msg, data) => process.env.DEBUG && console.log(`🐛 ${msg}`, data || '')
};

// Fireflies GraphQL client
class FirefliesClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.fireflies.ai/graphql';
  }

  async graphqlRequest(query, variables = {}) {
    logger.debug('Fireflies GraphQL request', variables);
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fireflies API error: ${response.status} ${response.statusText} - ${error}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  async getTranscripts(limit = 20, startDate = null, endDate = null) {
    // If date filtering is needed, we need to fetch more and filter locally
    // since Fireflies API doesn't support date filtering in the query
    // API has a max limit of 50 per request - always fetch max when filtering by date
    const fetchLimit = startDate || endDate ? 50 : Math.min(limit, 50);
    
    const query = `
      query GetTranscripts($limit: Int) {
        transcripts(limit: $limit) {
          id
          title
          transcript_url
          duration
          date
          participants
        }
      }
    `;
    
    const data = await this.graphqlRequest(query, { limit: fetchLimit });
    let transcripts = data.transcripts || [];
    
    // Filter by date range if specified
    if (startDate || endDate) {
      transcripts = transcripts.filter(transcript => {
        const transcriptDate = new Date(transcript.date);
        
        if (startDate && transcriptDate < startDate) {
          return false;
        }
        
        if (endDate && transcriptDate > endDate) {
          return false;
        }
        
        return true;
      });
      
      // Sort by date descending and limit
      transcripts.sort((a, b) => new Date(b.date) - new Date(a.date));
      transcripts = transcripts.slice(0, limit);
    }
    
    return transcripts;
  }

  async getTranscriptById(id) {
    const query = `
      query GetTranscriptContent($id: String!) {
        transcript(id: $id) {
          id
          title
          transcript_url
          duration
          date
          participants
          sentences {
            text
            speaker_id
            speaker_name
            start_time
          }
          speakers {
            id
            name
          }
          summary {
            keywords
            action_items
            outline
            shorthand_bullet
            overview
            bullet_gist
            gist
            short_summary
            short_overview
            meeting_type
            topics_discussed
            transcript_chapters
          }
        }
      }
    `;
    
    const data = await this.graphqlRequest(query, { id });
    return data.transcript;
  }

  formatTranscriptAsMarkdown(transcript) {
    let md = `# ${transcript.title}\n\n`;
    md += `**Date:** ${new Date(transcript.date).toLocaleString()}\n`;
    md += `**Duration:** ${Math.floor((transcript.duration || 0) / 60)} minutes\n`;
    md += `**Participants:** ${(transcript.participants || []).join(', ')}\n`;
    
    // Add meeting type if available
    if (transcript.summary?.meeting_type) {
      md += `**Meeting Type:** ${transcript.summary.meeting_type}\n`;
    }
    md += '\n';
    
    // Overview section
    if (transcript.summary?.overview) {
      md += `## Overview\n${transcript.summary.overview}\n\n`;
    }
    
    // Short Summary
    if (transcript.summary?.short_summary) {
      md += `## Short Summary\n${transcript.summary.short_summary}\n\n`;
    }
    
    // Gist
    if (transcript.summary?.gist) {
      md += `## Meeting Gist\n${transcript.summary.gist}\n\n`;
    }
    
    // Short Overview (if different from overview)
    if (transcript.summary?.short_overview && transcript.summary?.short_overview !== transcript.summary?.overview) {
      md += `## Short Overview\n${transcript.summary.short_overview}\n\n`;
    }
    
    // Topics Discussed
    if (transcript.summary?.topics_discussed) {
      md += `## Topics Discussed\n`;
      if (Array.isArray(transcript.summary.topics_discussed)) {
        md += transcript.summary.topics_discussed.map(topic => `- ${topic}`).join('\n');
      } else {
        md += transcript.summary.topics_discussed;
      }
      md += '\n\n';
    }
    
    // Outline
    if (transcript.summary?.outline) {
      md += `## Meeting Outline\n`;
      if (Array.isArray(transcript.summary.outline)) {
        md += transcript.summary.outline.map(item => `- ${item}`).join('\n');
      } else {
        md += transcript.summary.outline;
      }
      md += '\n\n';
    }
    
    // Shorthand Bullets
    if (transcript.summary?.shorthand_bullet) {
      md += `## Key Points (Shorthand)\n`;
      if (Array.isArray(transcript.summary.shorthand_bullet)) {
        md += transcript.summary.shorthand_bullet.map(bullet => `- ${bullet}`).join('\n');
      } else {
        md += transcript.summary.shorthand_bullet;
      }
      md += '\n\n';
    }
    
    // Bullet Gist
    if (transcript.summary?.bullet_gist) {
      md += `## Bullet Points Summary\n`;
      if (Array.isArray(transcript.summary.bullet_gist)) {
        md += transcript.summary.bullet_gist.map(bullet => `- ${bullet}`).join('\n');
      } else {
        md += transcript.summary.bullet_gist;
      }
      md += '\n\n';
    }
    
    // Keywords
    if (transcript.summary?.keywords?.length) {
      md += `## Keywords\n${transcript.summary.keywords.join(', ')}\n\n`;
    }
    
    // Action Items
    if (transcript.summary?.action_items) {
      md += `## Action Items\n`;
      if (Array.isArray(transcript.summary.action_items)) {
        md += transcript.summary.action_items.map(item => `- ${item}`).join('\n');
      } else if (typeof transcript.summary.action_items === 'string') {
        md += `- ${transcript.summary.action_items}`;
      }
      md += '\n\n';
    }
    
    // Transcript Chapters - only include if there's actual content
    if (transcript.summary?.transcript_chapters && transcript.summary.transcript_chapters.length > 0) {
      md += `## Meeting Chapters\n`;
      if (Array.isArray(transcript.summary.transcript_chapters)) {
        md += transcript.summary.transcript_chapters.map((chapter, idx) => {
          if (typeof chapter === 'object' && chapter.title) {
            return `### ${idx + 1}. ${chapter.title}\n${chapter.description || ''}`;
          }
          return `${idx + 1}. ${chapter}`;
        }).join('\n\n');
      } else {
        md += transcript.summary.transcript_chapters;
      }
      md += '\n\n';
    }
    
    if (transcript.sentences?.length) {
      md += `## Transcript\n\n`;
      let currentSpeaker = '';
      let speakerMap = {};
      
      // Use speakers data if available
      if (transcript.speakers && transcript.speakers.length > 0) {
        transcript.speakers.forEach(speaker => {
          speakerMap[speaker.id] = speaker.name || `Speaker ${speaker.id}`;
        });
      }
      
      // Fallback to participants if speakers not available
      if (Object.keys(speakerMap).length === 0 && transcript.participants && transcript.participants.length > 0) {
        transcript.participants.forEach((participant, index) => {
          let name = participant;
          if (participant.includes('@')) {
            name = participant.split('@')[0].replace(/[._-]/g, ' ');
            name = name.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }
          speakerMap[index.toString()] = name;
        });
      }
      
      for (const sentence of transcript.sentences) {
        if (sentence.speaker_id !== currentSpeaker) {
          // Add paragraph break between speakers (except for the first speaker)
          if (currentSpeaker !== '') {
            md += '\n\n';
          }
          currentSpeaker = sentence.speaker_id;
          // Use speaker_name if available, then mapped name, then fallback to ID
          const speakerName = sentence.speaker_name || speakerMap[currentSpeaker] || `Speaker ${currentSpeaker}`;
          md += `**${speakerName}:**\n`;
        }
        md += `${sentence.text} `;
      }
    }
    
    return md;
  }
}

// Main export function
async function exportFirefliesTranscripts(options = {}) {
  const { 
    limit = 20, 
    saveToSupabase = true, 
    saveToLocal = true,
    outputDir = './fireflies-exports',
    startDate = null,
    endDate = null
  } = options;

  let infoMessage = `🚀 Starting Fireflies transcript export`;
  if (startDate || endDate) {
    infoMessage += ` (`;
    if (startDate) infoMessage += `from ${startDate.toLocaleDateString()}`;
    if (startDate && endDate) infoMessage += ` `;
    if (endDate) infoMessage += `to ${endDate.toLocaleDateString()}`;
    infoMessage += `, max ${limit} transcripts)`;
  } else {
    infoMessage += ` (last ${limit} transcripts)`;
  }
  logger.info(infoMessage);
  
  const client = new FirefliesClient(FIREFLIES_API_KEY);
  
  try {
    // Step 1: Get list of transcripts
    logger.info('📋 Fetching transcript list from Fireflies...');
    const transcripts = await client.getTranscripts(limit, startDate, endDate);
    
    if (!transcripts.length) {
      logger.info('No transcripts found');
      return;
    }
    
    logger.success(`Found ${transcripts.length} transcripts`);
    
    // Create output directory if saving locally
    if (saveToLocal) {
      const fs = require('fs');
      const path = require('path');
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    }
    
    const results = [];
    
    // Step 2: Process each transcript
    for (let i = 0; i < transcripts.length; i++) {
      const transcript = transcripts[i];
      logger.info(`\n📝 Processing [${i + 1}/${transcripts.length}]: ${transcript.title}`);
      
      try {
        // Get full transcript content
        const fullTranscript = await client.getTranscriptById(transcript.id);
        
        // Format as markdown
        const markdown = client.formatTranscriptAsMarkdown(fullTranscript);
        
        // Save to Supabase if enabled
        if (saveToSupabase) {
          logger.info('  💾 Saving to Supabase...');
          
          // Upload to storage
          const fileName = `transcripts/${transcript.id}.md`;
          const { error: uploadError } = await supabase.storage
            .from('meetings')
            .upload(fileName, markdown, {
              contentType: 'text/markdown',
              upsert: true
            });
            
          if (uploadError) {
            logger.error('  Failed to upload to storage:', uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from('meetings')
              .getPublicUrl(fileName);
              
            // Save metadata to database
            // Parse date properly - check if it's a timestamp or date string
            let meetingDate = transcript.date;
            if (typeof meetingDate === 'number' || /^\d+$/.test(meetingDate)) {
              // It's a timestamp, convert to ISO string
              const timestamp = Number(meetingDate);
              // Check if it's in milliseconds or seconds
              const dateObj = timestamp > 10000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
              meetingDate = dateObj.toISOString();
            }
            
            const meetingData = {
              id: transcript.id,
              transcript_id: transcript.id,
              title: transcript.title,
              date: meetingDate,
              duration_minutes: Math.round((transcript.duration || 0) / 60),
              participants: transcript.participants || [],
              speaker_count: new Set(fullTranscript.sentences?.map(s => s.speaker_id) || []).size,
              category: 'general',
              tags: fullTranscript.summary?.keywords || [],
              summary: JSON.stringify({
                keywords: fullTranscript.summary?.keywords || [],
                action_items: Array.isArray(fullTranscript.summary?.action_items) ? fullTranscript.summary.action_items : []
              }),
              transcript_url: urlData.publicUrl,
              storage_bucket_path: fileName,
              processing_status: 'completed',
              raw_metadata: {
                fireflies_id: transcript.id,
                source: 'fireflies',
                exported_at: new Date().toISOString()
              }
            };
            
            const { error: dbError } = await supabase
              .from('meetings')
              .upsert(meetingData, { onConflict: 'id' });
              
            if (dbError) {
              logger.error('  Failed to save to database:', dbError);
            } else {
              logger.success('  Saved to Supabase');
            }
          }
        }
        
        // Save to local file if enabled
        if (saveToLocal) {
          const fs = require('fs');
          const path = require('path');
          
          // Format date as YYYY-MM-DD for filename
          const dateObj = new Date(transcript.date);
          const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
          const safeTitle = transcript.title.replace(/[^a-z0-9]/gi, '_');
          const localPath = path.join(outputDir, `${dateStr}_${safeTitle}.md`);
          fs.writeFileSync(localPath, markdown);
          logger.success(`  Saved locally: ${localPath}`);
        }
        
        results.push({
          id: transcript.id,
          title: transcript.title,
          date: transcript.date,
          success: true
        });
        
      } catch (error) {
        logger.error(`  Failed to process transcript: ${error.message}`);
        results.push({
          id: transcript.id,
          title: transcript.title,
          date: transcript.date,
          success: false,
          error: error.message
        });
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 3: Summary
    logger.info('\n' + '='.repeat(80));
    logger.success('📊 Export Summary:\n');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    logger.info(`✅ Successful: ${successful}`);
    if (failed > 0) {
      logger.error(`❌ Failed: ${failed}`);
      logger.error('Failed transcripts:');
      results.filter(r => !r.success).forEach(r => {
        logger.error(`  - ${r.title}: ${r.error}`);
      });
    }
    
    if (saveToSupabase) {
      logger.info(`\n💾 Data saved to Supabase database (meetings table)`);
    }
    
    if (saveToLocal) {
      logger.info(`\n📁 Markdown files saved to: ${outputDir}`);
    }
    
    return results;
    
  } catch (error) {
    logger.error('Export failed:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    limit: 20,
    saveToSupabase: true,
    saveToLocal: true,
    startDate: null,
    endDate: null
  };
  
  // Helper function to parse date strings
  function parseDate(dateStr) {
    // Support various formats: MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      logger.error(`Invalid date format: ${dateStr}`);
      logger.info('Use formats like: MM/DD/YYYY, M/D/YYYY, or YYYY-MM-DD');
      process.exit(1);
    }
    // Set to start of day for start date, end of day for end date
    return date;
  }
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    } else if (arg === '--no-supabase') {
      options.saveToSupabase = false;
    } else if (arg === '--no-local') {
      options.saveToLocal = false;
    } else if (arg.startsWith('--output=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg.startsWith('--start-date=') || arg.startsWith('--start=')) {
      const dateStr = arg.split('=')[1];
      options.startDate = parseDate(dateStr);
      // Set to beginning of day
      options.startDate.setHours(0, 0, 0, 0);
    } else if (arg.startsWith('--end-date=') || arg.startsWith('--end=')) {
      const dateStr = arg.split('=')[1];
      options.endDate = parseDate(dateStr);
      // Set to end of day
      options.endDate.setHours(23, 59, 59, 999);
    } else if (arg === '--help') {
      console.log(`
Fireflies Transcript Exporter

Usage: node export-fireflies-transcripts.js [options]

Options:
  --limit=N         Number of transcripts to export (default: 20)
  --start-date=DATE Start date for filtering (MM/DD/YYYY or YYYY-MM-DD)
  --end-date=DATE   End date for filtering (MM/DD/YYYY or YYYY-MM-DD)
  --start=DATE      Shorthand for --start-date
  --end=DATE        Shorthand for --end-date
  --no-supabase     Don't save to Supabase
  --no-local        Don't save local markdown files
  --output=DIR      Output directory for local files (default: ./fireflies-exports)
  --help            Show this help message

Examples:
  # Export last 20 transcripts
  node export-fireflies-transcripts.js
  
  # Export transcripts from a specific date range
  node export-fireflies-transcripts.js --start-date=6/1/2025 --end-date=7/29/2025
  
  # Export max 50 transcripts from June 2025
  node export-fireflies-transcripts.js --limit=50 --start=2025-06-01 --end=2025-06-30
  
  # Export to local files only, no Supabase
  node export-fireflies-transcripts.js --no-supabase --start=6/1/2025 --end=7/29/2025
      `);
      process.exit(0);
    }
  });
  
  exportFirefliesTranscripts(options)
    .then(() => {
      logger.success('\n✨ Export completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n💥 Export failed:', error);
      process.exit(1);
    });
}

module.exports = { exportFirefliesTranscripts };