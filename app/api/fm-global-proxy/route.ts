import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the FM Global Render endpoint
    // Using AbortController with 60 second timeout to handle Render free tier cold starts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch('https://rag-agent-asrs.onrender.com/api/fm-global/chat', {
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
      console.error('Render service error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText.substring(0, 500) + (errorText.length > 500 ? '...' : '')
      });

      // Check if it's HTML (502/503 error page)
      const isHtml = errorText.trim().startsWith('<!DOCTYPE html>') || errorText.trim().startsWith('<html');
      
      if (isHtml) {
        return NextResponse.json(
          { 
            error: `Render service is currently unavailable (HTTP ${response.status})`,
            details: 'The service may be starting up from a cold state or experiencing issues. Please wait a moment and try again.',
            renderStatus: response.status,
            isHtmlError: true
          },
          { status: 503 } // Service Unavailable
        );
      }

      return NextResponse.json(
        { 
          error: `Remote server error: ${response.status} - ${errorText.substring(0, 200)}`,
          renderStatus: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('FM Global proxy error:', error);
    
    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Request timed out. The FM Global service might be starting up from a cold state. Please try again in a moment.',
          details: 'Render free tier instances spin down after inactivity and may take 50+ seconds to restart.'
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