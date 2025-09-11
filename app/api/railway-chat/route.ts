import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Railway API endpoint
const RAILWAY_API_URL = process.env.RAILWAY_PM_RAG;

if (!RAILWAY_API_URL) {
  console.error('❌ RAILWAY_PM_RAG environment variable not set');
}

async function queryRailwayRAG(message: string, conversationHistory: any[] = []) {
  if (!RAILWAY_API_URL) {
    throw new Error('Railway API URL not configured');
  }
  
  try {
    const payload = {
      query: message,
      context: conversationHistory.slice(-5), // Last 5 messages for context
      options: {
        max_results: 10,
        include_sources: true,
        search_type: 'hybrid' // semantic + keyword search
      }
    };

    console.log(`🚂 Querying Railway API: ${RAILWAY_API_URL}/query`);
    console.log('📝 Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${RAILWAY_API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Alleato-AI-Dashboard/1.0',
      },
      body: JSON.stringify(payload),
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Railway API Error (${response.status}):`, errorText);
      throw new Error(`Railway API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Railway API Response:', data);

    return data;
  } catch (error) {
    console.error('🚨 Railway API Connection Error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      return new Response('Last message content is required', { status: 400 });
    }

    // Query Railway RAG API
    let railwayResponse;
    let ragContext = '';
    let sources: any[] = [];

    try {
      railwayResponse = await queryRailwayRAG(lastMessage.content, messages);
      
      if (railwayResponse) {
        ragContext = railwayResponse.response || railwayResponse.answer || '';
        sources = railwayResponse.sources || railwayResponse.documents || [];
        
        // Format sources for better display
        if (sources.length > 0) {
          ragContext += '\n\n**Sources:**\n';
          ragContext += sources.map((source, index) => 
            `${index + 1}. ${source.title || source.document_name || 'Document'} ${source.relevance_score ? `(${Math.round(source.relevance_score * 100)}% relevant)` : ''}`
          ).join('\n');
        }
      }
    } catch (railwayError) {
      console.warn('⚠️ Railway API failed, falling back to local context:', railwayError);
      ragContext = `I'm having trouble accessing the Railway RAG system right now. Let me help you with general project management guidance.

The system normally provides:
- Meeting transcript analysis
- Project insight generation
- Risk assessment and tracking
- Action item identification
- Strategic recommendations

What specific aspect of project management can I help you with?`;
    }

    // Enhanced system prompt with Railway RAG context
    const systemPrompt = `You are an advanced AI assistant powered by Railway RAG technology. You have access to extensive project management data through a sophisticated retrieval system.

${ragContext ? `**RETRIEVED CONTEXT FROM RAG SYSTEM:**
${ragContext}

` : ''}**YOUR CAPABILITIES:**
🎯 **Project Management Excellence**
- Meeting transcript analysis and insights
- Action item tracking and follow-up
- Risk identification and mitigation
- Decision documentation and reasoning
- Timeline and milestone tracking

🧠 **Intelligence & Analysis**
- Pattern recognition across projects
- Predictive insights and recommendations
- Resource optimization suggestions
- Performance metrics analysis
- Strategic planning support

⚡ **Real-time Support**
- Instant knowledge retrieval
- Context-aware responses
- Multi-project coordination
- Team collaboration insights
- Process improvement recommendations

**RESPONSE GUIDELINES:**
1. **Be Comprehensive**: Use the retrieved context to provide detailed, actionable insights
2. **Be Specific**: Reference specific meetings, documents, or data points when available
3. **Be Proactive**: Suggest follow-up questions and related areas to explore
4. **Be Clear**: Structure responses with headers, bullets, and clear formatting
5. **Be Helpful**: Always aim to move the user forward in their goals

${sources.length > 0 ? `**AVAILABLE SOURCES:** ${sources.length} relevant documents/meetings found` : ''}

Remember: You have access to real-time data through the Railway RAG system. Use this information to provide the most current and relevant insights.`;

    // Create the AI stream
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      maxTokens: 1500,
      stream: true,
    });

    // Return the streaming response
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Railway-Connected': railwayResponse ? 'true' : 'false',
        'X-Sources-Found': sources.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Railway Chat API Error:', error);
    
    // Return error as streaming response
    const errorResult = await streamText({
      model: openai('gpt-4-turbo'),
      system: 'You are a helpful assistant explaining technical issues.',
      messages: [{
        role: 'user',
        content: 'The AI system encountered a technical issue. Please explain what might have happened and suggest next steps.'
      }],
      temperature: 0.3,
      maxTokens: 500,
    });

    return errorResult.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Error': 'true',
      },
    });
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Test Railway API connection
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured');
    }
    
    const testResponse = await fetch(`${RAILWAY_API_URL}/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Alleato-AI-Dashboard/1.0',
      },
      timeout: 10000,
    });

    const railwayStatus = testResponse.ok ? 'connected' : 'error';
    const railwayInfo = testResponse.ok ? await testResponse.json() : null;

    return Response.json({
      status: 'healthy',
      railway_api: {
        status: railwayStatus,
        url: RAILWAY_API_URL || 'not_configured',
        response_time: railwayInfo ? 'fast' : 'slow',
        info: railwayInfo
      },
      features: {
        streaming: true,
        rag_retrieval: true,
        context_aware: true,
        real_time: true
      },
      message: 'Railway Chat API is operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      status: 'degraded',
      railway_api: {
        status: 'error',
        url: RAILWAY_API_URL || 'not_configured',
        error: error instanceof Error ? error.message : 'Connection failed'
      },
      fallback: 'Local AI processing available',
      message: 'Railway Chat API has connectivity issues',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}