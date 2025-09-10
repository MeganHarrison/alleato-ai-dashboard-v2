import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { traceable } from 'langsmith/traceable';
import { wrapOpenAI } from 'langsmith/wrappers';
import { getTraceMetadata, isTracingEnabled } from '@/lib/langsmith';
import OpenAI from 'openai';

// Wrap OpenAI client with LangSmith tracing if enabled
const openaiClient = isTracingEnabled ? wrapOpenAI(new OpenAI()) : new OpenAI();

// FM Global ASRS Expert Railway endpoint
const FM_GLOBAL_API_URL = process.env.RAILWAY_ASRS_RAG ? 
                           `https://${process.env.RAILWAY_ASRS_RAG}` :
                           process.env.FM_GLOBAL_RAILWAY_API_URL || 
                           process.env.FM_GLOBAL_API_URL ||
                           'https://fm-global-asrs-expert-production-afb0.up.railway.app';

// Trace the Railway API call
const callRailwayEndpoint = traceable(
  async function railwayFMGlobalCall(apiUrl: string, requestBody: any) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
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
        if (data && (data.response || data.message || data.content)) {
          return {
            success: true,
            data: {
              ...data,
              _source: 'railway',
              _endpoint: FM_GLOBAL_API_URL
            }
          };
        }
      }
      
      return { success: false, error: `HTTP ${response.status}` };
    } catch (error) {
      clearTimeout(timeoutId);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  {
    name: 'railway-fm-global-api',
    run_type: 'llm',
    metadata: getTraceMetadata({ endpoint: 'railway' }),
  }
);

// Trace the OpenAI fallback
const callOpenAIFallback = traceable(
  async function openAIFMGlobalFallback(messages: any[]) {
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

    if (isTracingEnabled) {
      // Use wrapped OpenAI client for tracing
      const completion = await openaiClient.chat.completions.create({
        messages: [systemMessage, ...messages],
        model: 'gpt-4-turbo',
        temperature: 0.3,
        max_tokens: 4000,
      });
      
      return {
        response: completion.choices[0]?.message?.content || 'No response generated',
        _source: 'openai-fallback',
        usage: completion.usage,
      };
    } else {
      // Use AI SDK for streaming without tracing
      const result = await streamText({
        model: openai('gpt-4-turbo'),
        messages: [systemMessage, ...messages],
        temperature: 0.3,
        maxTokens: 4000,
      });

      const response = result.toTextStreamResponse();
      response.headers.set('X-FM-Source', 'openai-fallback');
      response.headers.set('X-FM-Railway-Status', 'unavailable');
      return response;
    }
  },
  {
    name: 'openai-fm-global-fallback',
    run_type: 'llm',
    metadata: getTraceMetadata({ 
      model: 'gpt-4-turbo',
      fallback: true 
    }),
  }
);

// Main traced handler
const handleFMGlobalRequest = traceable(
  async function fmGlobalHandler(body: any) {
    const { messages, sessionId, userId } = body;
    const runId = crypto.randomUUID();
    
    // Add metadata for this request
    const requestMetadata = getTraceMetadata({
      session_id: sessionId,
      user_id: userId,
      run_id: runId,
      message_count: messages?.length || 0,
    });
    
    // Check if we should use Railway endpoint or fallback to OpenAI
    const useRailway = process.env.RAILWAY_ASRS_RAG && process.env.USE_RAILWAY_FM_GLOBAL !== 'false';
    
    if (useRailway) {
      // Convert messages format to query format for FM Global RAG
      let requestBody;
      if (messages && Array.isArray(messages)) {
        const lastUserMessage = messages
          .filter((msg: any) => msg.role === 'user')
          .pop();
        
        requestBody = {
          query: lastUserMessage?.content || messages[messages.length - 1]?.content || '',
          stream: body.stream || false
        };
      } else if (body.query) {
        requestBody = body;
      } else {
        requestBody = body;
      }
      
      const apiUrl = `${FM_GLOBAL_API_URL}/chat`;
      console.log(`Attempting FM Global Railway endpoint: ${apiUrl}`);
      
      const railwayResult = await callRailwayEndpoint(apiUrl, requestBody);
      
      if (railwayResult.success) {
        return { ...railwayResult.data, runId };
      }
      
      console.log('FM Global Railway endpoint failed, falling back to OpenAI');
    }
    
    // Fallback to OpenAI
    const fallbackResult = await callOpenAIFallback(messages);
    
    // If it's a streaming response, return it directly
    if (fallbackResult instanceof Response) {
      return fallbackResult;
    }
    
    return { ...fallbackResult, runId };
  },
  {
    name: 'fm-global-request-handler',
    run_type: 'chain',
    metadata: getTraceMetadata({ 
      application: 'fm-global-expert',
      api_version: '2.0' 
    }),
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (isTracingEnabled) {
      // Use traced handler
      const result = await handleFMGlobalRequest(body);
      
      // If it's a streaming response, return it directly
      if (result instanceof Response) {
        return result;
      }
      
      return NextResponse.json(result);
    } else {
      // Non-traced path for production performance
      return handleNonTracedRequest(body);
    }
  } catch (error) {
    console.error('FM Global API error:', error);
    return new Response('Error processing FM Global request', { status: 500 });
  }
}

// Non-traced handler for when tracing is disabled
async function handleNonTracedRequest(body: any) {
  const { messages } = body;
  
  // Check if we should use Railway endpoint or fallback to OpenAI
  const useRailway = process.env.RAILWAY_ASRS_RAG && process.env.USE_RAILWAY_FM_GLOBAL !== 'false';
  
  if (useRailway) {
    try {
      let requestBody;
      if (messages && Array.isArray(messages)) {
        const lastUserMessage = messages
          .filter((msg: any) => msg.role === 'user')
          .pop();
        
        requestBody = {
          query: lastUserMessage?.content || messages[messages.length - 1]?.content || '',
          stream: body.stream || false
        };
      } else if (body.query) {
        requestBody = body;
      } else {
        requestBody = body;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const apiUrl = `${FM_GLOBAL_API_URL}/chat`;
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
        if (data && (data.response || data.message || data.content)) {
          return NextResponse.json({
            ...data,
            _source: 'railway',
            _endpoint: FM_GLOBAL_API_URL
          });
        }
      }
    } catch (error) {
      console.log('FM Global Railway error, falling back to OpenAI:', error);
    }
  }
  
  // Fallback to direct OpenAI implementation
  const systemMessage = {
    role: 'system',
    content: `You are an expert assistant specialized in FM Global standards for sprinkler systems...`
  };

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [systemMessage, ...messages],
    temperature: 0.3,
    maxTokens: 4000,
  });

  const response = result.toTextStreamResponse();
  response.headers.set('X-FM-Source', 'openai-fallback');
  return response;
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
    
    const status = response.ok ? 'healthy' : 'unhealthy';
    const tracingStatus = isTracingEnabled ? 'enabled' : 'disabled';
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          endpoint: FM_GLOBAL_API_URL, 
          error: `HTTP ${response.status}`,
          tracing: tracingStatus
        },
        { status: 503 }
      );
    }
    
    const data = await response.json();
    return NextResponse.json({
      status: 'healthy',
      endpoint: FM_GLOBAL_API_URL,
      service: data,
      tracing: tracingStatus,
      project: process.env.LANGSMITH_PROJECT || 'not-configured'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        endpoint: FM_GLOBAL_API_URL,
        error: error instanceof Error ? error.message : 'Health check failed',
        tracing: isTracingEnabled ? 'enabled' : 'disabled'
      },
      { status: 503 }
    );
  }
}