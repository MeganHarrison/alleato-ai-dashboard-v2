import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// FM Global ASRS Expert Railway endpoint
const FM_GLOBAL_API_URL = process.env.RAILWAY_ASRS_RAG ? 
                           `https://${process.env.RAILWAY_ASRS_RAG}` :
                           process.env.FM_GLOBAL_RAILWAY_API_URL || 
                           process.env.FM_GLOBAL_API_URL ||
                           'https://fm-global-asrs-expert-production-afb0.up.railway.app';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages } = body;
  
  // Check if we should use Railway endpoint or fallback to OpenAI
  const useRailway = process.env.RAILWAY_ASRS_RAG && process.env.USE_RAILWAY_FM_GLOBAL !== 'false';
  
  if (useRailway) {
    try {
      // Convert messages format to query format for FM Global RAG
      let requestBody;
      if (messages && Array.isArray(messages)) {
        // Extract the last user message as the query
        const lastUserMessage = messages
          .filter((msg: any) => msg.role === 'user')
          .pop();
        
        requestBody = {
          query: lastUserMessage?.content || messages[messages.length - 1]?.content || '',
          stream: body.stream || false
        };
      } else if (body.query) {
        // Already in correct format
        requestBody = body;
      } else {
        // Fallback to sending as-is
        requestBody = body;
      }
      
      // Forward the request to the FM Global Railway endpoint
      // Using AbortController with 10 second timeout for faster fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const apiUrl = `${FM_GLOBAL_API_URL}/chat`;
      console.log(`Attempting FM Global Railway endpoint: ${apiUrl}`);
      
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
        // Check if response has valid content
        if (data && (data.response || data.message || data.content)) {
          // Add metadata to indicate Railway is being used
          return NextResponse.json({
            ...data,
            _source: 'railway',
            _endpoint: FM_GLOBAL_API_URL
          });
        }
      }
      
      // If Railway endpoint fails or returns invalid data, fall through to OpenAI
      console.log('FM Global Railway endpoint failed, falling back to OpenAI');
      
    } catch (error) {
      console.log('FM Global Railway error, falling back to OpenAI:', error);
      // Fall through to OpenAI implementation
    }
  }
  
  // Fallback to direct OpenAI implementation
  try {
    const systemMessage = {
      role: 'system',
      content: `You are an expert assistant specialized in FM Global standards for sprinkler systems, particularly FM Global 8-34 for ASRS (Automated Storage and Retrieval Systems). 
      
      Provide detailed, accurate information about:
      - FM Global requirements and standards
      - ASRS sprinkler design specifications
      - Fire protection systems
      - Compliance requirements
      - Installation guidelines
      
      Always cite specific sections or figures from FM Global documentation when applicable.
      Be precise, technical, and helpful.`
    };

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: [systemMessage, ...messages],
      temperature: 0.3,
      maxTokens: 4000,
      onFinish: async () => {
        // Log that we're using OpenAI fallback
        console.log('FM Global: Using OpenAI fallback (Railway unavailable)');
      }
    });

    // Add headers to indicate fallback is being used
    const response = result.toTextStreamResponse();
    response.headers.set('X-FM-Source', 'openai-fallback');
    response.headers.set('X-FM-Railway-Status', 'unavailable');
    return response;
  } catch (error) {
    console.error('FM Global OpenAI error:', error);
    return new Response('Error processing FM Global request', { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    const healthUrl = `${FM_GLOBAL_API_URL}/health`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { status: 'unhealthy', endpoint: FM_GLOBAL_API_URL, error: `HTTP ${response.status}` },
        { status: 503 }
      );
    }
    
    const data = await response.json();
    return NextResponse.json({
      status: 'healthy',
      endpoint: FM_GLOBAL_API_URL,
      service: data
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        endpoint: FM_GLOBAL_API_URL,
        error: error instanceof Error ? error.message : 'Health check failed' 
      },
      { status: 503 }
    );
  }
}