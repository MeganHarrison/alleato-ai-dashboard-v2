import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
);

async function searchMeetingsTextBased(query: string, limit = 5) {
  try {
    // Simple text-based search without vector embeddings
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    // Search in meetings table
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('*')
      .or(searchTerms.map(term => `title.ilike.%${term}%,summary.ilike.%${term}%`).join(','))
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Meeting search error:', error);
      return [];
    }

    return meetings || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

async function searchDocuments(query: string, limit = 5) {
  try {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    // Search in documents table
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .or(searchTerms.map(term => `title.ilike.%${term}%,content.ilike.%${term}%`).join(','))
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Document search error:', error);
      return [];
    }

    return documents || [];
  } catch (error) {
    console.error('Document search error:', error);
    return [];
  }
}

async function getRecentInsights(limit = 10) {
  try {
    const { data: insights, error } = await supabase
      .from('ai_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Insights fetch error:', error);
      return [];
    }
    
    return insights || [];
  } catch (error) {
    console.error('Insights error:', error);
    return [];
  }
}

async function getProjectInfo() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, phase, client, description')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Projects fetch error:', error);
      return [];
    }
    
    return projects || [];
  } catch (error) {
    console.error('Projects error:', error);
    return [];
  }
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

    // Perform parallel searches for better context
    const [meetingResults, documentResults, insights, projects] = await Promise.all([
      searchMeetingsTextBased(message),
      searchDocuments(message),
      getRecentInsights(),
      getProjectInfo()
    ]);

    // Build comprehensive context
    const context = `
You are an intelligent PM Assistant with access to organizational data.

RECENT PROJECTS:
${projects.length > 0 
  ? projects.map(p => `- ${p.name} (${p.phase || 'Active'}): ${p.description || 'No description'}`).join('\n')
  : 'No project data available.'}

RELEVANT MEETINGS (${meetingResults.length} found):
${meetingResults.length > 0 
  ? meetingResults.map(m => {
      const date = m.date ? new Date(m.date).toLocaleDateString() : 'No date';
      const participants = m.participants ? `Participants: ${m.participants.join(', ')}` : '';
      return `- "${m.title}" (${date}) ${participants}\n  Summary: ${m.summary || 'No summary available'}`;
    }).join('\n')
  : 'No specific meetings found for this query.'}

RELEVANT DOCUMENTS (${documentResults.length} found):
${documentResults.length > 0
  ? documentResults.map(d => {
      const date = d.date ? new Date(d.date).toLocaleDateString() : 'No date';
      return `- "${d.title}" (${date}): ${d.content ? d.content.substring(0, 200) + '...' : 'No content'}`;
    }).join('\n')
  : 'No relevant documents found.'}

RECENT AI INSIGHTS (${insights.length} total):
${insights.length > 0
  ? insights.slice(0, 5).map(i => {
      const type = i.insight_type || 'general';
      const severity = i.severity ? ` [${i.severity}]` : '';
      return `- [${type}]${severity}: ${i.title} - ${i.description}`;
    }).join('\n')
  : 'No insights available.'}

SYSTEM STATISTICS:
- Total meetings tracked: ${meetingResults.length > 0 ? 'Multiple' : 'Limited data'}
- Total insights generated: ${insights.length}
- Active projects: ${projects.length}
- Documents available: ${documentResults.length > 0 ? 'Yes' : 'Limited'}

Note: This is a text-based search system. For more accurate results, consider implementing vector search capabilities.
`;

    // Generate AI response with the context
    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      system: `You are a helpful PM Assistant that helps users understand and navigate their project management data.
      
Your capabilities:
- Search and analyze meeting transcripts and summaries
- Review project documentation
- Identify insights, risks, and action items
- Provide project status updates
- Answer questions about team decisions and discussions

Instructions:
1. Use the provided context to give accurate, specific answers
2. If information is limited, acknowledge this and provide what's available
3. Suggest follow-up questions when appropriate
4. Be concise but thorough
5. If asked about something not in the context, politely explain you don't have that information

Context:
${context}`,
      prompt: `User Question: ${message}

Previous conversation for context:
${conversationHistory.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Please provide a helpful response based on the available data.`,
      temperature: 0.7,
    });

    // Extract key information for metadata
    const sources = [
      ...meetingResults.map(m => ({ type: 'meeting', title: m.title, date: m.date })),
      ...documentResults.map(d => ({ type: 'document', title: d.title, date: d.date }))
    ].slice(0, 5);

    return NextResponse.json({
      message: text,
      sources,
      metadata: {
        meetings_found: meetingResults.length,
        documents_found: documentResults.length,
        insights_available: insights.length,
        projects_tracked: projects.length,
        search_type: 'text-based',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('PM RAG Fallback error:', error);
    
    // Provide a helpful error response
    return NextResponse.json({
      message: `I'm having trouble accessing the data right now. Here's what I can tell you:

The system is designed to help you:
- Search through meeting transcripts and summaries
- Review project documentation and insights
- Track action items and decisions
- Monitor project progress

Please try:
1. Asking about specific meetings or projects by name
2. Requesting summaries of recent activities
3. Inquiring about action items or risks

If the issue persists, please check that the database connection is properly configured.`,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        search_type: 'fallback',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Test database connection
    const { count: meetingCount } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true });
    
    const { count: insightCount } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      stats: {
        meetings: meetingCount || 0,
        insights: insightCount || 0
      },
      message: 'PM RAG Fallback API is operational'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'error',
      error: error instanceof Error ? error.message : 'Database connection failed',
      message: 'PM RAG Fallback API has issues'
    }, { status: 503 });
  }
}