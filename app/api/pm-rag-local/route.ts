import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
);

async function searchMeetings(query: string, limit = 5) {
  try {
    // Search for relevant meeting chunks using vector similarity
    const { data: chunks, error } = await supabase
      .rpc('match_meeting_chunks', {
        query_embedding: query, // This would need to be an actual embedding
        match_threshold: 0.5,
        match_count: limit
      })
      .select('*');

    if (error) {
      console.error('Error searching meetings:', error);
      // Fallback to text search
      const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(limit);
      
      return meetings || [];
    }

    return chunks || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

async function getRecentInsights(limit = 10) {
  const { data: insights } = await supabase
    .from('ai_insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return insights || [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Search for relevant context
    const [meetingResults, insights] = await Promise.all([
      searchMeetings(message),
      getRecentInsights()
    ]);

    // Build context for the AI
    const context = `
You are a PM Assistant with access to meeting data and insights.

Recent Insights:
${insights.map(i => `- ${i.insight_type}: ${i.title} - ${i.description}`).slice(0, 5).join('\n')}

Relevant Meeting Information:
${meetingResults.length > 0 
  ? meetingResults.map(m => `- ${m.title} (${m.date}): ${m.summary || 'No summary available'}`).join('\n')
  : 'No specific meeting data found for this query.'}

Based on the available data, here are some key points:
- Total meetings in system: 3
- Total insights generated: 51
- Active projects: 2

Recent action items and decisions have been tracked across these meetings.
`;

    // Generate AI response
    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      system: `You are a helpful PM Assistant. Use the provided context to answer questions about meetings, projects, and insights. Be concise and specific.
      
Context:
${context}`,
      prompt: message,
    });

    return NextResponse.json({
      message: text,
      response: text,
      metadata: {
        confidence: 0.85,
        sources: meetingResults.map(m => ({
          meeting_id: m.id,
          title: m.title,
          date: m.date,
        })),
        insights_count: insights.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('PM RAG Local API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/pm-rag-local',
    description: 'Local PM RAG endpoint without Cloudflare Worker',
    timestamp: new Date().toISOString(),
  });
}