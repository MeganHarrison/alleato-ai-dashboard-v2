import { NextRequest, NextResponse } from 'next/server';

const WORKER_URL = 'https://rag-agent-pm.onrender.com';
const REQUEST_TIMEOUT = 25000; // 25 seconds timeout

export async function POST(request: NextRequest) {
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty' },
        { status: 400 }
      );
    }
    
    // Forward the request to our Render deployment with timeout
    const response = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: body.message,
        conversation_history: body.conversationHistory || [],
        session_id: body.sessionId
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: error.error || 'Worker request failed', details: error.details },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform the response to match the expected format
    return NextResponse.json({
      message: data.response || 'I understand your question but need more context to provide a specific answer.',
      tools: data.tool_calls || [],
      metadata: {
        session_id: data.session_id,
        sources: data.sources,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    clearTimeout(timeout);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout', details: `Request took longer than ${REQUEST_TIMEOUT/1000} seconds` },
          { status: 504 }
        );
      }
    }
    
    console.error('PM RAG Worker API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${WORKER_URL}/health`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Worker health check failed' },
      { status: 503 }
    );
  }
}