import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

// Fireflies webhook handler for automatic transcript ingestion
// Receives webhook events when transcriptions are completed

interface FirefliesWebhookPayload {
  meetingId: string;
  eventType: string;
  clientReferenceId?: string;
}

// Verify webhook signature for security
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

// GraphQL client for Fireflies API
async function fetchTranscriptFromFireflies(transcriptId: string) {
  const apiKey = process.env.FIREFLIES_API_KEY;
  
  if (!apiKey) {
    throw new Error('FIREFLIES_API_KEY not configured');
  }

  const query = `
    query GetTranscriptForWebhook($id: String!) {
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
        
        analytics {
          sentiments {
            negative_pct
            neutral_pct
            positive_pct
          }
          categories {
            questions
            tasks
            metrics
          }
          speakers {
            speaker_id
            name
            duration_pct
            word_count
            questions
          }
        }
        
        summary {
          keywords
          action_items
          topics_discussed
          meeting_type
        }
        
        sentences {
          speaker_name
          text
          ai_filters {
            task
            question
            metric
            sentiment
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.fireflies.ai/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      variables: { id: transcriptId }
    }),
  });

  if (!response.ok) {
    throw new Error(`Fireflies API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data.transcript;
}

// Format transcript as markdown with metadata
function formatTranscriptMarkdown(transcript: any): string {
  let markdown = `# ${transcript.title}\n\n`;
  
  // Meeting metadata
  markdown += `## Meeting Information\n`;
  markdown += `- **Date:** ${new Date(transcript.date).toLocaleString()}\n`;
  markdown += `- **Duration:** ${Math.floor(transcript.duration / 60)} minutes\n`;
  markdown += `- **Participants:** ${transcript.participants.join(', ')}\n`;
  markdown += `- **Host:** ${transcript.host_email || 'N/A'}\n\n`;
  
  // Sentiment analysis
  if (transcript.analytics?.sentiments) {
    const sentiments = transcript.analytics.sentiments;
    markdown += `## Sentiment Analysis\n`;
    markdown += `- Positive: ${sentiments.positive_pct}%\n`;
    markdown += `- Neutral: ${sentiments.neutral_pct}%\n`;
    markdown += `- Negative: ${sentiments.negative_pct}%\n\n`;
  }
  
  // Keywords and topics
  if (transcript.summary?.keywords?.length > 0) {
    markdown += `## Keywords\n`;
    markdown += `${transcript.summary.keywords.join(', ')}\n\n`;
  }
  
  // Action items
  if (transcript.summary?.action_items?.length > 0) {
    markdown += `## Action Items\n`;
    transcript.summary.action_items.forEach((item: string) => {
      markdown += `- [ ] ${item}\n`;
    });
    markdown += '\n';
  }
  
  // Topics discussed
  if (transcript.summary?.topics_discussed?.length > 0) {
    markdown += `## Topics Discussed\n`;
    transcript.summary.topics_discussed.forEach((topic: string) => {
      markdown += `- ${topic}\n`;
    });
    markdown += '\n';
  }
  
  // Speaker statistics
  if (transcript.analytics?.speakers?.length > 0) {
    markdown += `## Speaker Participation\n`;
    transcript.analytics.speakers.forEach((speaker: any) => {
      markdown += `- **${speaker.name}**: ${Math.round(speaker.duration_pct)}% talk time, ${speaker.word_count} words, ${speaker.questions} questions\n`;
    });
    markdown += '\n';
  }
  
  // Full transcript
  markdown += `## Transcript\n\n`;
  let currentSpeaker = '';
  
  transcript.sentences.forEach((sentence: any) => {
    if (sentence.speaker_name !== currentSpeaker) {
      currentSpeaker = sentence.speaker_name;
      markdown += `\n**${currentSpeaker}:**\n`;
    }
    
    // Add indicators for special content
    let prefix = '';
    if (sentence.ai_filters?.question) prefix += '❓ ';
    if (sentence.ai_filters?.task) prefix += '✅ ';
    if (sentence.ai_filters?.metric) prefix += '📊 ';
    
    markdown += `${prefix}${sentence.text} `;
  });
  
  // Metadata footer
  markdown += `\n\n---\n`;
  markdown += `_Synced from Fireflies: ${new Date().toISOString()}_\n`;
  markdown += `_Meeting ID: ${transcript.id}_\n`;
  if (transcript.transcript_url) {
    markdown += `_[View in Fireflies](${transcript.transcript_url})_\n`;
  }
  
  return markdown;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload: FirefliesWebhookPayload = JSON.parse(body);
    
    console.log('Fireflies webhook received:', {
      meetingId: payload.meetingId,
      eventType: payload.eventType,
    });

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.FIREFLIES_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-hub-signature') || '';
      if (!verifyWebhookSignature(body, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Only process transcription completed events
    if (payload.eventType !== 'Transcription completed') {
      console.log('Ignoring non-transcription event:', payload.eventType);
      return NextResponse.json({ 
        success: true, 
        message: 'Event ignored' 
      });
    }

    // Fetch the full transcript from Fireflies
    console.log('Fetching transcript:', payload.meetingId);
    const transcript = await fetchTranscriptFromFireflies(payload.meetingId);
    
    if (!transcript) {
      throw new Error('Failed to fetch transcript');
    }

    // Format as markdown
    const markdownContent = formatTranscriptMarkdown(transcript);
    
    // Create file name
    const date = new Date(transcript.date);
    const dateStr = date.toISOString().split('T')[0];
    const safeTitle = transcript.title.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${dateStr}_${safeTitle}.md`;
    const filePath = `meetings/${fileName}`;

    // Initialize Supabase client
    const supabase = await createClient();

    // Upload to storage
    console.log('Uploading to storage:', filePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, markdownContent, {
        contentType: 'text/markdown',
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      // Check if file already exists
      if (uploadError.message?.includes('already exists')) {
        console.log('File already exists, skipping:', filePath);
        return NextResponse.json({ 
          success: true, 
          message: 'Transcript already synced' 
        });
      }
      throw uploadError;
    }

    // Extract metadata for database
    const metadata = {
      fireflies_id: transcript.id,
      title: transcript.title,
      date: transcript.date,
      duration: transcript.duration,
      participants: transcript.participants,
      host_email: transcript.host_email,
      meeting_type: transcript.summary?.meeting_type || 'general',
      keywords: transcript.summary?.keywords || [],
      action_items: transcript.summary?.action_items || [],
      topics: transcript.summary?.topics_discussed || [],
      sentiment_scores: transcript.analytics?.sentiments || {},
      speaker_count: transcript.analytics?.speakers?.length || 0,
      questions_count: transcript.analytics?.categories?.questions || 0,
      tasks_count: transcript.analytics?.categories?.tasks || 0,
      webhook_received: new Date().toISOString(),
      client_reference_id: payload.clientReferenceId,
    };

    // Create document record for vectorization
    console.log('Creating document record');
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: transcript.title,
        source: 'fireflies_webhook',
        file_path: filePath,
        file_type: 'md',
        file_size: markdownContent.length,
        content: '', // Will be populated during vectorization
        status: 'pending',
        category: 'meeting',
        tags: metadata.keywords,
        metadata: metadata,
      })
      .select()
      .single();

    if (docError) {
      throw docError;
    }

    console.log('Successfully processed webhook:', {
      documentId: docData.id,
      title: transcript.title,
    });

    // Optionally trigger immediate vectorization
    // You could call the vectorization endpoint here if needed
    
    return NextResponse.json({
      success: true,
      documentId: docData.id,
      message: 'Transcript successfully ingested',
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Processing failed' 
      },
      { status: 500 }
    );
  }
}

// Handle webhook verification (GET request from Fireflies)
export async function GET(request: NextRequest) {
  // Fireflies may send a GET request to verify the webhook endpoint
  return NextResponse.json({
    status: 'ok',
    message: 'Fireflies webhook endpoint ready',
    timestamp: new Date().toISOString(),
  });
}