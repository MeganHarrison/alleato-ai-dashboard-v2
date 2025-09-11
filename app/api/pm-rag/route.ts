import { NextRequest, NextResponse } from 'next/server';

// Enhanced PM RAG API route that works with or without Railway
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

    // Try Railway API first, then fallback
    const railwayResult = await tryRailwayAPI(message, conversationHistory);
    
    if (railwayResult.success && railwayResult.data) {
      return NextResponse.json({
        message: railwayResult.data.response,
        response: railwayResult.data.response,
        sources: railwayResult.data.sources || [],
        metadata: {
          ...railwayResult.data.metadata,
          service: 'railway',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Fallback to local PM RAG processing
    console.log('🔄 Railway unavailable, using enhanced local processing...');
    return await enhancedLocalProcessing(message, conversationHistory);

  } catch (error) {
    console.error('❌ PM RAG API Error:', error);
    
    return NextResponse.json({
      message: 'I encountered an error processing your request. Please try again.',
      error: 'Internal server error',
      metadata: {
        service: 'error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * Try to connect to Railway API
 */
async function tryRailwayAPI(message: string, conversationHistory: any[]) {
  const RAILWAY_RAG_API = process.env.RAILWAY_PM_RAG;
  
  if (!RAILWAY_RAG_API) {
    console.warn('⚠️ RAILWAY_PM_RAG environment variable not set');
    return { success: false, error: 'Railway API URL not configured' };
  }
  
  try {
    const payload = {
      message,
      conversation_history: conversationHistory.slice(-5),
      session_id: `session_${Date.now()}`
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`${RAILWAY_RAG_API}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Alleato-AI-Dashboard/1.0'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Railway API responded successfully');
      
      return {
        success: true,
        data: {
          response: data.response,
          sources: data.tool_calls || [],
          metadata: { 
            railway_session: data.session_id,
            tool_calls: data.tool_calls?.length || 0
          }
        }
      };
    } else {
      console.warn(`⚠️ Railway API returned ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⏰ Railway API timeout');
    } else if (error instanceof Error) {
      console.warn('🚨 Railway API connection error:', error.message);
    } else {
      console.warn('🚨 Railway API unknown error:', String(error));
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Enhanced local processing with better project management context
 */
async function enhancedLocalProcessing(message: string, conversationHistory: any[]) {
  try {
    // Import required modules
    const { generateText } = await import('ai');
    const { openai } = await import('@ai-sdk/openai');
    const { createClient } = await import('@supabase/supabase-js');

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
    );

    // Enhanced search with multiple data sources
    const [meetings, documents, insights, projects, tasks] = await Promise.all([
      searchMeetings(supabase, message),
      searchDocuments(supabase, message),
      getRecentInsights(supabase),
      getActiveProjects(supabase),
      getActionItems(supabase)
    ]);

    // Build comprehensive context
    const context = buildEnhancedContext({
      message,
      meetings,
      documents, 
      insights,
      projects,
      tasks,
      conversationHistory
    });

    // Generate AI response with enhanced context
    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      system: `You are an advanced PM Assistant with comprehensive access to organizational data.

Your capabilities include:
🎯 **Project Management Excellence**
- Meeting analysis and insight extraction
- Action item tracking and follow-up
- Risk identification and mitigation strategies
- Decision documentation and context
- Timeline and milestone management

🔍 **Data Analysis & Intelligence**
- Pattern recognition across projects
- Predictive insights and recommendations
- Resource optimization analysis
- Performance metrics evaluation
- Strategic planning support

⚡ **Real-time Assistance**
- Instant knowledge retrieval from meetings, documents, and insights
- Context-aware responses based on project history
- Multi-project coordination and oversight
- Team collaboration insights
- Process improvement recommendations

**Response Guidelines:**
1. **Be Comprehensive**: Use all available context to provide detailed, actionable insights
2. **Be Specific**: Reference specific meetings, documents, decisions, and data points
3. **Be Proactive**: Suggest follow-up actions, identify risks, and recommend improvements
4. **Be Clear**: Structure responses with headers, bullets, and clear formatting
5. **Be Strategic**: Connect current questions to broader project goals and objectives

**Available Data Sources:**
- ${meetings.length} meeting records with transcripts and summaries
- ${documents.length} project documents and files
- ${insights.length} AI-generated insights and analyses
- ${projects.length} active projects with status tracking
- ${tasks.length} action items and deliverables

Focus on delivering maximum value by connecting current queries to broader project context and strategic objectives.`,
      prompt: `${context}

**User Question:** ${message}

**Previous Conversation Context:**
${conversationHistory.slice(-3).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

Please provide a comprehensive, strategic response that leverages all available data sources and connects the user's question to broader project management insights and recommendations.`,
      temperature: 0.7,
    });

    // Extract sources for metadata
    const sources = [
      ...meetings.slice(0, 3).map((m: any) => ({ type: 'meeting', title: m.title, date: m.date })),
      ...documents.slice(0, 2).map((d: any) => ({ type: 'document', title: d.title, date: d.date })),
      ...insights.slice(0, 2).map((i: any) => ({ type: 'insight', title: i.title, severity: i.severity }))
    ];

    return NextResponse.json({
      message: text,
      response: text,
      sources,
      metadata: {
        service: 'enhanced_local',
        data_sources: {
          meetings_analyzed: meetings.length,
          documents_reviewed: documents.length,
          insights_considered: insights.length,
          projects_tracked: projects.length,
          action_items: tasks.length
        },
        search_strategy: 'comprehensive_multi_source',
        processing_mode: 'enhanced_local_fallback',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Enhanced local processing error:', error);
    
    // Final fallback - basic response
    return NextResponse.json({
      message: `I'm having trouble accessing your project data right now, but I'm here to help with project management tasks.

I can normally assist with:
- 📊 **Meeting Analysis** - Extract insights and action items from transcripts
- 🎯 **Project Tracking** - Monitor progress, risks, and deliverables  
- 📈 **Strategic Planning** - Identify trends and optimization opportunities
- 👥 **Team Coordination** - Facilitate collaboration and communication
- ⚡ **Decision Support** - Provide data-driven recommendations

**What would you like help with?**
- Project status updates and summaries
- Risk assessment and mitigation strategies
- Resource allocation and optimization
- Timeline and milestone planning
- Team performance insights

Please try your question again, or let me know how I can assist with your project management needs.`,
      error: 'Local processing unavailable',
      metadata: {
        service: 'basic_fallback',
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * Enhanced search functions
 */
async function searchMeetings(supabase: any, query: string, limit = 8) {
  try {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('*')
      .or(searchTerms.map(term => `title.ilike.%${term}%,summary.ilike.%${term}%,content.ilike.%${term}%`).join(','))
      .order('date', { ascending: false })
      .limit(limit);

    if (error) console.error('Meeting search error:', error);
    return meetings || [];
  } catch (error) {
    console.error('Meeting search error:', error);
    return [];
  }
}

async function searchDocuments(supabase: any, query: string, limit = 6) {
  try {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .or(searchTerms.map(term => `title.ilike.%${term}%,content.ilike.%${term}%,tags.ilike.%${term}%`).join(','))
      .order('date', { ascending: false })
      .limit(limit);

    if (error) console.error('Document search error:', error);
    return documents || [];
  } catch (error) {
    console.error('Document search error:', error);
    return [];
  }
}

async function getRecentInsights(supabase: any, limit = 10) {
  try {
    const { data: insights, error } = await supabase
      .from('ai_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) console.error('Insights fetch error:', error);
    return insights || [];
  } catch (error) {
    console.error('Insights error:', error);
    return [];
  }
}

async function getActiveProjects(supabase: any, limit = 8) {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, phase, client, description, status, priority, deadline')
      .in('status', ['active', 'in_progress', 'planning'])
      .order('priority', { ascending: false })
      .limit(limit);
    
    if (error) console.error('Projects fetch error:', error);
    return projects || [];
  } catch (error) {
    console.error('Projects error:', error);
    return [];
  }
}

async function getActionItems(supabase: any, limit = 12) {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })
      .limit(limit);
    
    if (error) console.error('Tasks fetch error:', error);
    return tasks || [];
  } catch (error) {
    console.error('Tasks error:', error);
    return [];
  }
}

/**
 * Build enhanced context for AI processing
 */
function buildEnhancedContext({ message, meetings, documents, insights, projects, tasks, conversationHistory }: any) {
  return `
**COMPREHENSIVE PROJECT MANAGEMENT CONTEXT**

**ACTIVE PROJECTS (${projects.length} total):**
${projects.length > 0 
  ? projects.map((p: any) => `• ${p.name} [${p.phase || p.status}] - ${p.client || 'Internal'}: ${p.description || 'No description'}`).join('\n')
  : 'No active projects found.'}

**RECENT MEETINGS (${meetings.length} analyzed):**
${meetings.length > 0
  ? meetings.map((m: any) => {
      const date = m.date ? new Date(m.date).toLocaleDateString() : 'No date';
      const participants = m.participants?.length ? ` (${m.participants.length} participants)` : '';
      return `• "${m.title}" - ${date}${participants}\n  ${m.summary || 'No summary available'}`;
    }).join('\n')
  : 'No relevant meetings found.'}

**PROJECT DOCUMENTS (${documents.length} reviewed):**
${documents.length > 0
  ? documents.map((d: any) => {
      const date = d.date ? new Date(d.date).toLocaleDateString() : 'No date';
      return `• "${d.title}" (${date}): ${d.content ? d.content.substring(0, 150) + '...' : 'No content preview'}`;
    }).join('\n')
  : 'No relevant documents found.'}

**AI INSIGHTS & ANALYSIS (${insights.length} recent):**
${insights.length > 0
  ? insights.slice(0, 6).map((i: any) => {
      const severity = i.severity ? ` [${i.severity.toUpperCase()}]` : '';
      const type = i.insight_type || 'general';
      return `• [${type}]${severity}: ${i.title} - ${i.description}`;
    }).join('\n')
  : 'No insights available.'}

**ACTION ITEMS & TASKS (${tasks.length} pending):**
${tasks.length > 0
  ? tasks.slice(0, 8).map((t: any) => {
      const priority = t.priority ? ` [${t.priority}]` : '';
      const assignee = t.assignee ? ` → ${t.assignee}` : '';
      return `• ${t.title}${priority}${assignee}: ${t.description || 'No details'}`;
    }).join('\n')
  : 'No pending tasks found.'}

**SYSTEM CAPABILITIES:**
✅ Meeting transcript analysis and summarization
✅ Project risk assessment and tracking  
✅ Action item extraction and follow-up
✅ Strategic insight generation
✅ Resource allocation analysis
✅ Timeline and milestone management
✅ Cross-project pattern recognition
✅ Performance metrics tracking

**QUERY ANALYSIS:**
User is asking about: "${message}"
Context indicates focus on: ${detectQueryFocus(message)}
Recommended response approach: ${getResponseStrategy(message)}
`;
}

function detectQueryFocus(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('status') || lower.includes('update') || lower.includes('progress')) {
    return 'Project status and progress tracking';
  } else if (lower.includes('risk') || lower.includes('issue') || lower.includes('problem')) {
    return 'Risk assessment and issue management';
  } else if (lower.includes('action') || lower.includes('task') || lower.includes('todo')) {
    return 'Action items and task management';
  } else if (lower.includes('meeting') || lower.includes('discuss') || lower.includes('decision')) {
    return 'Meeting analysis and decision tracking';
  } else if (lower.includes('team') || lower.includes('people') || lower.includes('resource')) {
    return 'Team coordination and resource management';
  } else if (lower.includes('timeline') || lower.includes('schedule') || lower.includes('deadline')) {
    return 'Timeline and scheduling management';
  } else {
    return 'General project management inquiry';
  }
}

function getResponseStrategy(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('summary') || lower.includes('overview')) {
    return 'Comprehensive summary with key highlights and recommendations';
  } else if (lower.includes('help') || lower.includes('how')) {
    return 'Step-by-step guidance with actionable recommendations';
  } else if (lower.includes('what') || lower.includes('which')) {
    return 'Detailed analysis with specific examples and data points';
  } else {
    return 'Balanced response with context, analysis, and next steps';
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  try {
    // Test Railway connection
    const railwayStatus = await testRailwayConnection();
    
    // Test local database
    const localStatus = await testLocalDatabase();
    
    return NextResponse.json({
      status: railwayStatus.healthy || localStatus.healthy ? 'healthy' : 'degraded',
      services: {
        railway_api: railwayStatus,
        local_database: localStatus,
        enhanced_fallback: true
      },
      capabilities: {
        meeting_analysis: true,
        document_search: true,
        insight_generation: true,
        project_tracking: true,
        action_item_management: true,
        strategic_planning: true
      },
      configuration: {
        railway_url: process.env.RAILWAY_PM_RAG || 'not_configured',
        fallback_mode: 'enhanced_local_processing',
        data_sources: ['meetings', 'documents', 'insights', 'projects', 'tasks']
      },
      message: 'PM RAG API with enhanced local fallback is operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'PM RAG API health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function testRailwayConnection() {
  try {
    const RAILWAY_RAG_API = process.env.RAILWAY_PM_RAG;
    
    if (!RAILWAY_RAG_API) {
      return {
        healthy: false,
        error: 'Railway API URL not configured',
        url: 'not_configured'
      };
    }
    
    const response = await fetch(`${RAILWAY_RAG_API}/health`, {
      method: 'GET',
      headers: { 'User-Agent': 'Alleato-Health-Check/1.0' },
      signal: AbortSignal.timeout(8000)
    });
    
    return {
      healthy: response.ok,
      status: response.status,
      url: RAILWAY_RAG_API,
      response_time: 'fast'
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Connection failed',
      url: process.env.RAILWAY_PM_RAG || 'not_configured'
    };
  }
}

async function testLocalDatabase() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
    );
    
    const { count } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true });
    
    return {
      healthy: true,
      database: 'connected',
      data_available: count && count > 0
    };
  } catch (error) {
    return {
      healthy: false,
      database: 'error',
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}
