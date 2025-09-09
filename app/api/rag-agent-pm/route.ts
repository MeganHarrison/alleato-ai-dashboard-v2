import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Railway PM RAG Agent endpoint
const RAILWAY_PM_RAG_URL = process.env.RAILWAY_PM_RAG ? 
                           `https://${process.env.RAILWAY_PM_RAG}` :
                           process.env.RAILWAY_RAG_API_URL ||
                           'https://rag-agent-api-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convert the request to the format expected by the Railway endpoint
    let requestBody;
    if (body.messages && Array.isArray(body.messages)) {
      // Extract the last user message as the query
      const lastUserMessage = body.messages
        .filter((msg: any) => msg.role === 'user')
        .pop();
      
      requestBody = {
        message: lastUserMessage?.content || body.messages[body.messages.length - 1]?.content || '',
        stream: body.stream || false,
        session_id: body.sessionId
      };
    } else if (body.query) {
      // Convert query to message format
      requestBody = {
        message: body.query,
        stream: body.stream || false,
        session_id: body.sessionId
      };
    } else if (body.message) {
      // Already in correct format
      requestBody = body;
    } else {
      return NextResponse.json(
        { error: 'Invalid request format. Expected message, query, or messages array.' },
        { status: 400 }
      );
    }
    
    // Check if Railway endpoint is configured and enabled
    const useRailway = process.env.RAILWAY_PM_RAG && process.env.USE_RAILWAY_PM !== 'false';
    
    if (useRailway) {
      try {
        // Using AbortController with 15 second timeout for faster fallback
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const apiUrl = `${RAILWAY_PM_RAG_URL}/chat`;
        console.log(`Attempting Railway PM RAG: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          // Validate response has content
          if (data && (data.response || data.message || data.content)) {
            // Add metadata to indicate Railway is being used
            return NextResponse.json({
              ...data,
              _source: 'railway-pm',
              _endpoint: RAILWAY_PM_RAG_URL
            });
          }
        }
        
        console.log(`Railway PM RAG failed with status ${response.status}, using fallback`);
      } catch (error) {
        console.log('Railway PM RAG error, using fallback:', error);
      }
    }
    
    // Fallback to OpenAI with project management context
    console.log('Railway PM RAG unavailable, using OpenAI fallback');
    
    try {
      const systemMessage = {
        role: 'system',
        content: `You are an expert project management assistant with deep knowledge of:
        - Project planning and execution methodologies (Agile, Waterfall, Hybrid)
        - FM Global compliance and safety standards
        - Risk management and mitigation strategies
        - Resource allocation and team management
        - Timeline and budget management
        - Stakeholder communication best practices
        
        Provide detailed, actionable advice based on industry best practices.
        When discussing FM Global compliance, reference specific standards and requirements.`
      };

      const userMessage = {
        role: 'user',
        content: requestBody.message || body.query || body.messages?.[body.messages.length - 1]?.content || ''
      };

      const result = await streamText({
        model: openai('gpt-4-turbo'),
        messages: [systemMessage, userMessage],
        temperature: 0.7,
        maxTokens: 2000,
      });

      // Convert stream to text response
      let fullResponse = '';
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
      }

      return NextResponse.json({
        response: fullResponse || generateProjectManagementResponse(requestBody.message || body.query || ''),
        _source: 'openai-fallback',
        _message: 'Using OpenAI GPT-4 Turbo for project management expertise',
        _railway_status: 'unavailable'
      });
      
    } catch (openaiError) {
      console.error('OpenAI fallback error:', openaiError);
      // Final fallback to static responses
      const fallbackResponse = generateProjectManagementResponse(requestBody.message || body.query || '');
      
      return NextResponse.json({
        response: fallbackResponse,
        _source: 'static-fallback',
        _message: 'Using static fallback response. Both Railway and OpenAI are unavailable.'
      });
    }
    
  } catch (error) {
    console.error('PM RAG API error:', error);
    
    return NextResponse.json({
      response: "I'm experiencing technical difficulties. Please try again in a moment.",
      _source: 'error',
      _error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to generate fallback responses
function generateProjectManagementResponse(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('best practice') || lowerQuery.includes('best practices')) {
    return `Key project management best practices include:

1. **Clear Communication**: Establish regular check-ins and status updates
2. **Scope Management**: Define clear project boundaries and manage changes
3. **Risk Assessment**: Identify and mitigate potential issues early
4. **Stakeholder Engagement**: Keep all parties informed and involved
5. **Documentation**: Maintain comprehensive project records
6. **Timeline Management**: Use realistic scheduling with buffer time
7. **Resource Allocation**: Ensure proper team and budget distribution

For FM Global compliance specifically, focus on documentation, safety protocols, and regular audits.`;
  }
  
  if (lowerQuery.includes('fm global') || lowerQuery.includes('compliance')) {
    return `FM Global compliance in project management requires:

1. **Safety First**: Prioritize fire protection and risk mitigation
2. **Documentation**: Maintain detailed records of all safety measures
3. **Regular Inspections**: Schedule periodic compliance audits
4. **Training**: Ensure team understands FM Global standards
5. **System Design**: Follow FM Global data sheets for specifications
6. **Testing Protocols**: Implement required testing procedures

Please consult specific FM Global data sheets for your project type.`;
  }
  
  if (lowerQuery.includes('timeline') || lowerQuery.includes('schedule')) {
    return `Effective project timeline management involves:

1. **Work Breakdown Structure**: Divide project into manageable tasks
2. **Dependencies**: Identify task relationships and critical path
3. **Milestones**: Set clear achievement markers
4. **Buffer Time**: Include contingency for unexpected delays
5. **Regular Updates**: Track progress and adjust as needed
6. **Resource Loading**: Ensure team availability aligns with schedule

Use tools like Gantt charts or Kanban boards for visualization.`;
  }
  
  // Default response
  return `I understand you're asking about project management. While I'm currently unable to access the full knowledge base, here are some general guidelines:

1. Start with clear project objectives and success criteria
2. Develop a comprehensive project plan with defined phases
3. Establish communication protocols and reporting structures
4. Monitor progress regularly and adjust as needed
5. Document lessons learned for future projects

For more specific guidance, please try again later when the full service is available.`;
}

// Health check endpoint
export async function GET() {
  try {
    const healthUrl = `${RAILWAY_PM_RAG_URL}/health`;
    console.log(`Checking Railway PM RAG health: ${healthUrl}`);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 5 second timeout for health check
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          endpoint: RAILWAY_PM_RAG_URL, 
          error: `HTTP ${response.status}`,
          message: 'Railway PM RAG service is not responding correctly'
        },
        { status: 503 }
      );
    }
    
    const data = await response.json();
    return NextResponse.json({
      status: 'healthy',
      endpoint: RAILWAY_PM_RAG_URL,
      service: 'Railway PM RAG Agent',
      details: data
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        endpoint: RAILWAY_PM_RAG_URL,
        error: error instanceof Error ? error.message : 'Health check failed',
        message: 'Cannot connect to Railway PM RAG service'
      },
      { status: 503 }
    );
  }
}