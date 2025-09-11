import { NextRequest, NextResponse } from 'next/server';

// Proxy to PM RAG fallback API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward to pm-rag-fallback
    const response = await fetch(new URL('/api/pm-rag-fallback', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // Map response to expected format for rag-chat page
    return NextResponse.json({
      response: data.message,
      message: data.message,
      sources: data.sources || [],
      metadata: data.metadata || {}
    });
  } catch (error) {
    console.error('RAG Proxy error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Proxy error',
        response: 'Sorry, I encountered an error processing your request.'
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(new URL('/api/pm-rag-fallback', request.url).toString());
    const data = await response.json();
    
    return NextResponse.json({
      ...data,
      endpoint: 'PM RAG Fallback API'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Service unavailable',
        endpoint: 'PM RAG Fallback API'
      },
      { status: 503 }
    );
  }
}