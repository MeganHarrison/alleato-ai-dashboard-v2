import { NextRequest, NextResponse } from 'next/server';

// Support multiple deployment options through environment variables
const RAG_API_URL = process.env.RAG_API_URL || 
                    process.env.RAILWAY_RAG_API_URL ||
                    process.env.NEXT_PUBLIC_RAG_API_URL ||
                    'https://rag-agent-pm.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the configured endpoint
    // Using AbortController with 60 second timeout to handle cold starts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const apiUrl = `${RAG_API_URL}/chat`;
    console.log(`Forwarding RAG request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Remote server error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Request timed out. The service might be starting up from a cold state. Please try again in a moment.',
          details: 'The RAG service may be spinning up. This can take 30-60 seconds on free tier hosting.'
        },
        { status: 504 } // Gateway Timeout
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy request failed' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const healthUrl = `${RAG_API_URL}/health`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { status: 'unhealthy', endpoint: RAG_API_URL, error: `HTTP ${response.status}` },
        { status: 503 }
      );
    }
    
    const data = await response.json();
    return NextResponse.json({
      status: 'healthy',
      endpoint: RAG_API_URL,
      service: data
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        endpoint: RAG_API_URL,
        error: error instanceof Error ? error.message : 'Health check failed' 
      },
      { status: 503 }
    );
  }
}