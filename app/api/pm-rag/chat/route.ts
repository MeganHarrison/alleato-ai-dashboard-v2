import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      return NextResponse.json(
        { error: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query' },
        { status: 400 }
      );
    }

    try {
      // Generate embedding for the query
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
        dimensions: 384,
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Try vector search first
      const { data: searchResults, error: searchError } = await supabase.rpc(
        'vector_search',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 5,
        }
      );

      if (searchError) {
        console.error('Vector search error:', searchError);
        throw searchError;
      }
    } catch (vectorError) {
      console.log('Vector search not available, using keyword search');
      // Fallback to keyword search
      const { data: keywordResults } = await supabase
        .from('meetings')
        .select('id, title, date, summary, action_items, decisions, risks')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
        .limit(5);

      const sources = keywordResults?.map(m => ({
        meeting_id: m.id,
        title: m.title,
        date: m.date,
      })) || [];

      return NextResponse.json({
        answer: generateFallbackAnswer(query, keywordResults || []),
        sources,
      });
    }

    // Get full meeting details for the search results
    const meetingIds = searchResults?.map((r: any) => r.meeting_id) || [];
    
    let meetings = [];
    if (meetingIds.length > 0) {
      const { data: meetingData } = await supabase
        .from('meetings')
        .select('*')
        .in('id', meetingIds);
      
      meetings = meetingData || [];
    }

    // Also get related insights
    const { data: insights } = await supabase
      .from('ai_insights')
      .select('*')
      .in('meeting_id', meetingIds)
      .eq('resolved', 0)
      .limit(10);

    // Generate response using GPT-4
    const context = buildContext(meetings, insights || []);
    const answer = await generateAnswer(query, context);

    // Prepare sources with similarity scores
    const sources = meetings.map((meeting: any) => {
      const searchResult = searchResults?.find((r: any) => r.meeting_id === meeting.id);
      return {
        meeting_id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        similarity_score: searchResult?.similarity || 0,
      };
    });

    return NextResponse.json({
      answer,
      sources,
      insights: insights || [],
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildContext(meetings: any[], insights: any[]): string {
  let context = 'Meeting Information:\n\n';
  
  meetings.forEach((meeting, index) => {
    context += `Meeting ${index + 1}: ${meeting.title}\n`;
    context += `Date: ${new Date(meeting.date).toLocaleDateString()}\n`;
    if (meeting.summary) {
      context += `Summary: ${meeting.summary}\n`;
    }
    if (meeting.action_items?.length > 0) {
      context += `Action Items: ${meeting.action_items.join(', ')}\n`;
    }
    if (meeting.decisions?.length > 0) {
      context += `Decisions: ${meeting.decisions.join(', ')}\n`;
    }
    if (meeting.risks?.length > 0) {
      context += `Risks: ${meeting.risks.join(', ')}\n`;
    }
    context += '\n';
  });

  if (insights.length > 0) {
    context += '\nRelated Insights:\n';
    insights.forEach((insight) => {
      context += `- [${insight.insight_type}] ${insight.title}: ${insight.description}\n`;
    });
  }

  return context;
}

async function generateAnswer(query: string, context: string): Promise<string> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return 'AI service not configured. Using basic search results.';
    }
    
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful meeting intelligence assistant. Answer questions based on the provided meeting context. 
          Be concise but comprehensive. If the context doesn't contain relevant information, say so.
          Format your response in a clear, readable way using bullet points where appropriate.`,
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${query}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || 'I couldn\'t generate a response.';
  } catch (error: any) {
    console.error('Error generating answer:', error);
    if (error.code === 'invalid_api_key') {
      return 'The AI service is not properly configured. Please check the API key.';
    }
    return `Based on the available data: ${context.substring(0, 500)}...`;
  }
}

function generateFallbackAnswer(query: string, meetings: any[]): string {
  if (meetings.length === 0) {
    return `I couldn't find any meetings related to "${query}". Try searching with different keywords or asking about specific projects, dates, or participants.`;
  }

  let answer = `Found ${meetings.length} meeting(s) related to your query:\n\n`;
  
  meetings.forEach((meeting, index) => {
    answer += `${index + 1}. **${meeting.title}** (${new Date(meeting.date).toLocaleDateString()})\n`;
    if (meeting.summary) {
      answer += `   Summary: ${meeting.summary.substring(0, 150)}...\n`;
    }
    answer += '\n';
  });

  return answer;
}