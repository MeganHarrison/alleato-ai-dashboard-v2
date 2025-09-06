import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gpt5Service, handleToolCalls } from '@/lib/openai/gpt5-service';
import { z } from 'zod';

// Request schema
const RequestSchema = z.object({
  message: z.string(),
  projectId: z.string().optional(),
  sessionId: z.string().optional(),
  stream: z.boolean().default(false),
});

// Helper to perform vector search
async function performVectorSearch(
  supabase: any,
  query: string,
  limit: number = 10,
  projectId?: string
) {
  try {
    // Generate embedding for the query
    const { data: embedding, error: embedError } = await supabase.functions.invoke(
      'generate-embedding',
      {
        body: { text: query }
      }
    );

    if (embedError || !embedding?.embedding) {
      console.error('Embedding generation failed:', embedError);
      return [];
    }

    // Perform vector similarity search
    let vectorQuery = supabase.rpc('match_documents', {
      query_embedding: embedding.embedding,
      match_count: limit,
      filter: projectId ? { project_id: projectId } : {}
    });

    const { data: documents, error: searchError } = await vectorQuery;

    if (searchError) {
      console.error('Vector search failed:', searchError);
      return [];
    }

    return documents || [];
  } catch (error) {
    console.error('Vector search error:', error);
    return [];
  }
}

// Helper to get project context
async function getProjectContext(supabase: any, projectId: string) {
  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      clients(name),
      meetings(
        id,
        title,
        date,
        summary,
        action_items
      )
    `)
    .eq('id', projectId)
    .single();

  return project;
}

// Helper to get recent meetings
async function getRecentMeetings(supabase: any, limit: number = 5) {
  const { data: meetings } = await supabase
    .from('meetings')
    .select(`
      id,
      title,
      date,
      summary,
      action_items,
      participants,
      project_id
    `)
    .order('date', { ascending: false })
    .limit(limit);

  return meetings || [];
}

// Tool execution functions
const toolExecutors = {
  search_documents: async (args: any, supabase: any) => {
    const documents = await performVectorSearch(
      supabase,
      args.query,
      args.limit || 10,
      args.filter?.project_id
    );
    
    return {
      success: true,
      documents: documents.map((doc: any) => ({
        id: doc.id,
        title: doc.title || doc.name,
        content: doc.content.substring(0, 500) + '...',
        similarity: doc.similarity,
        metadata: doc.metadata
      }))
    };
  },

  analyze_meeting: async (args: any, supabase: any) => {
    const { data: meeting } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', args.meeting_id)
      .single();

    if (!meeting) {
      return { success: false, error: 'Meeting not found' };
    }

    // Analyze the meeting content
    const analysis = await gpt5Service.analyzeMeeting(
      meeting.transcript || meeting.content || meeting.summary
    );

    return {
      success: true,
      meeting_id: args.meeting_id,
      analysis: analysis.choices[0].message.content
    };
  },

  generate_report: async (args: any, supabase: any) => {
    let query = supabase.from('projects').select('*');
    
    if (args.project_ids?.length > 0) {
      query = query.in('id', args.project_ids);
    }

    const { data: projects } = await query;

    const report = await gpt5Service.generateExecutiveReport(
      projects || [],
      {
        start: new Date(args.date_range?.start || Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(args.date_range?.end || Date.now())
      }
    );

    return {
      success: true,
      report: report.choices[0].message.content
    };
  },

  track_action_items: async (args: any, supabase: any) => {
    if (args.action === 'list') {
      let query = supabase.from('action_items').select('*');
      
      if (args.project_id) {
        query = query.eq('project_id', args.project_id);
      }
      if (args.assignee) {
        query = query.eq('assignee', args.assignee);
      }
      if (args.status) {
        query = query.eq('status', args.status);
      }

      const { data: items } = await query;
      return {
        success: true,
        action_items: items || []
      };
    }

    return {
      success: false,
      error: 'Action not implemented'
    };
  },

  predict_risks: async (args: any, supabase: any) => {
    const project = await getProjectContext(supabase, args.project_id);
    
    // Get similar historical projects
    const { data: historicalProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('phase', 'Complete')
      .eq('category', project.category)
      .limit(5);

    const risks = await gpt5Service.predictRisks(project, historicalProjects || []);

    return {
      success: true,
      project_id: args.project_id,
      risks: risks.choices[0].message.content
    };
  },

  link_to_project: async (args: any, supabase: any) => {
    const linkTable = `${args.source_type}_project_links`;
    
    const { error } = await supabase
      .from(linkTable)
      .insert({
        [`${args.source_type}_id`]: args.source_id,
        project_id: args.project_id,
        relationship_type: args.relationship_type || 'related'
      });

    return {
      success: !error,
      error: error?.message
    };
  }
};

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { message, projectId, sessionId, stream } = RequestSchema.parse(body);

    // Initialize Supabase client
    const supabase = await createClient();
    
    // Get user authentication - bypass in development mode
    const { data: { user } } = await supabase.auth.getUser();
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!user && !isDevelopment) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use mock user in development mode if no user is authenticated
    const currentUser = user || (isDevelopment ? { email: 'test@alleato.com' } : null);

    // Get relevant context
    const [relevantDocs, projectContext, recentMeetings] = await Promise.all([
      performVectorSearch(supabase, message, 5, projectId),
      projectId ? getProjectContext(supabase, projectId) : null,
      getRecentMeetings(supabase, 3)
    ]);

    // Build context for GPT-5
    const context = {
      user: currentUser?.email || 'anonymous',
      project: projectContext,
      relevant_documents: relevantDocs.map((doc: any) => ({
        content: doc.content.substring(0, 1000),
        metadata: doc.metadata
      })),
      recent_meetings: recentMeetings.map((m: any) => ({
        title: m.title,
        date: m.date,
        summary: m.summary?.substring(0, 500)
      }))
    };

    // Create messages for GPT-5
    const messages = [
      {
        role: 'system' as const,
        content: `You are a PM Assistant for Alleato. Current context:
${JSON.stringify(context, null, 2)}

Use the provided tools to search for information, analyze meetings, generate reports, and provide insights.
Always cite your sources and provide confidence levels for your recommendations.`
      },
      {
        role: 'user' as const,
        content: message
      }
    ];

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const stream = gpt5Service.streamCompletion(messages, {
              stream: true,
              verbosity: 'medium'
            });

            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }

              // Handle tool calls in stream
              if (chunk.choices[0]?.delta?.tool_calls) {
                for (const toolCall of chunk.choices[0].delta.tool_calls) {
                  if (toolCall.function?.name) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ 
                        tool: toolCall.function.name,
                        status: 'calling'
                      })}\n\n`)
                    );
                  }
                }
              }
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Handle non-streaming response
      const completion = await gpt5Service.createCompletion(messages, {
        verbosity: 'medium'
      });

      const assistantMessage = completion.choices[0].message;
      
      // Handle tool calls if present
      if (assistantMessage.tool_calls) {
        const toolResults = [];
        
        for (const toolCall of assistantMessage.tool_calls) {
          const { name, arguments: toolArgs } = toolCall.function;
          const args = JSON.parse(toolArgs);
          
          if (toolExecutors[name as keyof typeof toolExecutors]) {
            const result = await toolExecutors[name as keyof typeof toolExecutors](
              args,
              supabase
            );
            toolResults.push({
              tool: name,
              result
            });
          }
        }

        // Get final response with tool results
        const finalMessages = [
          ...messages,
          assistantMessage,
          {
            role: 'tool' as const,
            content: JSON.stringify(toolResults),
            tool_call_id: assistantMessage.tool_calls[0].id
          }
        ];

        const finalCompletion = await gpt5Service.createCompletion(finalMessages);
        
        return NextResponse.json({
          message: finalCompletion.choices[0].message.content,
          tool_results: toolResults,
          context: {
            documents_searched: relevantDocs.length,
            project: projectContext?.name,
            meetings_referenced: recentMeetings.length
          }
        });
      }

      // Return direct response if no tool calls
      return NextResponse.json({
        message: assistantMessage.content,
        context: {
          documents_searched: relevantDocs.length,
          project: projectContext?.name,
          meetings_referenced: recentMeetings.length
        }
      });
    }
  } catch (error) {
    console.error('PM Assistant GPT-5 Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    model: 'gpt-4o-mini',
    features: [
      'document_search',
      'meeting_analysis',
      'report_generation',
      'risk_prediction',
      'action_tracking',
      'project_linking'
    ]
  });
}