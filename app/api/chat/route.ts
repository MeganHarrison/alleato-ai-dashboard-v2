import { NextRequest, NextResponse } from 'next/server';

// Railway API endpoint
const RAILWAY_API_URL = process.env.RAILWAY_PM_RAG;

if (!RAILWAY_API_URL) {
  console.error('❌ RAILWAY_PM_RAG environment variable not set');
}

async function queryRailwayRAG(message: string, conversationHistory: unknown[] = []) {
  if (!RAILWAY_API_URL) {
    throw new Error('Railway API URL not configured');
  }
  
  try {
    const payload = {
      message: message,
      context: conversationHistory.slice(-5), // Last 5 messages for context
      options: {
        max_results: 10,
        include_sources: true,
        search_type: 'hybrid' // semantic + keyword search
      }
    };

    console.log(`🚂 Querying Railway API: ${RAILWAY_API_URL}/chat`);

    const response = await fetch(`${RAILWAY_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Alleato-AI-Dashboard/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Railway API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Railway API Response received');

    return data;
  } catch (error) {
    console.error('🚨 Railway API Error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      return NextResponse.json({ error: 'Last message content is required' }, { status: 400 });
    }

    // Query Railway RAG API with your meeting data
    try {
      const railwayResponse = await queryRailwayRAG(lastMessage.content, messages);
      
      // Extract the response from Railway API
      let responseText = '';
      if (railwayResponse) {
        // Handle AgentRunResult format
        let rawResponse = railwayResponse.response || railwayResponse.answer || railwayResponse.message || '';
        
        // Parse AgentRunResult if present
        if (typeof rawResponse === 'string' && rawResponse.includes('AgentRunResult(output=')) {
          const match = rawResponse.match(/AgentRunResult\(output='(.*)'\)$/);
          if (match) {
            rawResponse = match[1];
          }
        }
        
        responseText = rawResponse || 'No response generated';
        
        // Extract sources separately
        const sources = railwayResponse.sources || railwayResponse.documents || [];
      }

      return NextResponse.json({ 
        message: responseText,
        sources: sources || []
      });

    } catch (railwayError) {
      console.warn('⚠️ Railway API failed, providing helpful message:', railwayError);
      
      return NextResponse.json({ 
        message: `I'm having trouble accessing your meeting data right now. The Railway RAG system appears to be unavailable. 

Please check:
1. Is the Railway service running?
2. Is the RAILWAY_PM_RAG environment variable set correctly?
3. Are there any network connectivity issues?

I'd normally be able to help you with:
- Meeting transcript analysis
- Project insights and recommendations
- Action item tracking
- Risk assessment from your meetings

Please try again in a moment or check the Railway service status.`
      });
    }

  } catch (error) {
    console.error('❌ Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}