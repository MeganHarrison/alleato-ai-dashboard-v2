import { NextRequest, NextResponse } from 'next/server';

// Railway API endpoints
const RAILWAY_RAG_API = process.env.RAILWAY_PM_RAG || 'https://rag-agent-api-production.up.railway.app';
const RAILWAY_VECTOR_API = process.env.RAILWAY_PM_VECTORS || 'https://rag-vectorization-api-production.up.railway.app';

/**
 * Direct proxy to Railway PM RAG API
 * This route connects directly to the deployed Railway services
 */
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

    // Prepare payload for Railway API
    const payload = {
      query: message,
      context: conversationHistory.slice(-5), // Last 5 messages for context
      options: {
        max_results: 10,
        include_sources: true,
        search_type: 'hybrid' // semantic + keyword search
      }
    };

    console.log(`🚂 Querying Railway PM RAG API: ${RAILWAY_RAG_API}/query`);

    // Query Railway RAG API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${RAILWAY_RAG_API}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Alleato-AI-Dashboard/1.0',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Railway API Error (${response.status}):`, errorText);
        
        // Fallback to pm-rag-fallback if Railway fails
        console.log('🔄 Falling back to local PM RAG...');
        return await fallbackToLocal(request);
      }

      const data = await response.json();
      console.log('✅ Railway API Response received');

      // Format response for frontend
      return NextResponse.json({
        message: data.response || data.answer || data.message,
        response: data.response || data.answer || data.message,
        sources: data.sources || data.documents || [],
        metadata: {
          ...data.metadata,
          service: 'railway',
          endpoint: RAILWAY_RAG_API,
          timestamp: new Date().toISOString()
        }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.warn('⏰ Railway API timeout, falling back...');
      } else {
        console.warn('🚨 Railway API connection error:', fetchError.message);
      }
      
      // Fallback to local API
      return await fallbackToLocal(request);
    }

  } catch (error) {
    console.error('❌ PM RAG API Error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'I encountered an error processing your request. Please try again.',
      metadata: {
        service: 'error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * Fallback to local pm-rag-fallback API
 */
async function fallbackToLocal(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(new URL('/api/pm-rag-fallback', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      message: data.message,
      response: data.message,
      sources: data.sources || [],
      metadata: {
        ...data.metadata,
        service: 'fallback',
        note: 'Railway API unavailable, using local data'
      }
    });
  } catch (fallbackError) {
    console.error('❌ Fallback API also failed:', fallbackError);
    
    return NextResponse.json({
      message: 'I\'m having trouble connecting to the RAG services. Please try again in a moment.',
      error: 'Both Railway and fallback APIs unavailable',
      metadata: {
        service: 'error',
        timestamp: new Date().toISOString()
      }
    }, { status: 503 });
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  const healthChecks = [];
  
  // Check Railway RAG API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const ragResponse = await fetch(`${RAILWAY_RAG_API}/health`, {
      method: 'GET',
      headers: { 'User-Agent': 'Alleato-Health-Check/1.0' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    healthChecks.push({
      service: 'Railway RAG API',
      url: RAILWAY_RAG_API,
      status: ragResponse.ok ? 'healthy' : 'unhealthy',
      response_code: ragResponse.status
    });
  } catch (error) {
    healthChecks.push({
      service: 'Railway RAG API',
      url: RAILWAY_RAG_API,
      status: 'error',
      error: error.message
    });
  }
  
  // Check Railway Vector API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const vectorResponse = await fetch(`${RAILWAY_VECTOR_API}/health`, {
      method: 'GET',
      headers: { 'User-Agent': 'Alleato-Health-Check/1.0' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    healthChecks.push({
      service: 'Railway Vector API',
      url: RAILWAY_VECTOR_API,
      status: vectorResponse.ok ? 'healthy' : 'unhealthy',
      response_code: vectorResponse.status
    });
  } catch (error) {
    healthChecks.push({
      service: 'Railway Vector API',
      url: RAILWAY_VECTOR_API,
      status: 'error',
      error: error.message
    });
  }
  
  // Check fallback API
  try {
    const fallbackResponse = await fetch(new URL('/api/pm-rag-fallback', `${process.env.VERCEL_URL || 'http://localhost:3000'}`).toString());
    
    healthChecks.push({
      service: 'Fallback API',
      url: 'Local pm-rag-fallback',
      status: fallbackResponse.ok ? 'healthy' : 'unhealthy',
      response_code: fallbackResponse.status
    });
  } catch (error) {
    healthChecks.push({
      service: 'Fallback API',
      url: 'Local pm-rag-fallback',
      status: 'error',
      error: error.message
    });
  }
  
  const allHealthy = healthChecks.every(check => check.status === 'healthy');
  const anyHealthy = healthChecks.some(check => check.status === 'healthy');
  
  return NextResponse.json({
    status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
    services: healthChecks,
    configuration: {
      railway_rag_api: RAILWAY_RAG_API,
      railway_vector_api: RAILWAY_VECTOR_API,
      fallback_available: true
    },
    message: allHealthy 
      ? 'All PM RAG services are operational'
      : anyHealthy 
        ? 'Some services available with fallback'
        : 'All services unavailable',
    timestamp: new Date().toISOString()
  }, { 
    status: allHealthy ? 200 : anyHealthy ? 206 : 503 
  });
}
