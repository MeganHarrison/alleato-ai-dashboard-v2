import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Railway API endpoint
const RAILWAY_API_URL = process.env.RAILWAY_PM_RAG;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!RAILWAY_API_URL) {
  console.error('❌ RAILWAY_PM_RAG environment variable not set');
}

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

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

async function generateFallbackResponse(message: string, conversationHistory: unknown[] = []) {
  if (!openai) {
    throw new Error('OpenAI not configured for fallback');
  }

  const systemPrompt = `You are an AI assistant helping with project management and meeting analysis. 
The user's Railway RAG system is temporarily unavailable, so provide helpful general guidance about:
- Project management best practices
- Meeting analysis and action items
- Risk assessment strategies  
- Team collaboration insights

Be conversational and helpful, but acknowledge that you don't have access to their specific meeting data right now.`;

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4).map((msg: any) => ({
      role: msg.role || 'user',
      content: msg.content || msg.message || String(msg)
    })),
    { role: 'user', content: message }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: 500,
    temperature: 0.7
  });

  return completion.choices[0]?.message?.content || 'I apologize, but I cannot generate a response at the moment.';
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
      let sources = [];
      
      if (railwayResponse) {
        // Handle AgentRunResult format
        let rawResponse = railwayResponse.response || railwayResponse.answer || railwayResponse.message || '';
        
        // Parse AgentRunResult if present - improved regex to handle various formats
        if (typeof rawResponse === 'string' && rawResponse.includes('AgentRunResult')) {
          // Try multiple patterns to extract the output
          const patterns = [
            /AgentRunResult\(output='([^']*)'\)/,
            /AgentRunResult\(output="([^"]*)"\)/,
            /AgentRunResult\(output=([^,)]*)\)/,
            /output='([^']*)'/,
            /output="([^"]*)"/
          ];
          
          for (const pattern of patterns) {
            const match = rawResponse.match(pattern);
            if (match && match[1]) {
              rawResponse = match[1];
              break;
            }
          }
          
          // If no pattern matched but still contains AgentRunResult, try to extract manually
          if (rawResponse.includes('AgentRunResult') && !patterns.some(p => p.test(rawResponse))) {
            console.log('🔧 Fallback parsing for AgentRunResult:', rawResponse);
            // Remove AgentRunResult wrapper and common prefixes/suffixes
            rawResponse = rawResponse
              .replace(/^AgentRunResult\([^'"]*(["'])/, '$1')
              .replace(/(["'])\)$/, '$1')
              .replace(/^["']/, '')
              .replace(/["']$/, '');
          }
        }
        
        responseText = rawResponse || 'No response generated';
        
        // Extract sources separately
        sources = railwayResponse.sources || railwayResponse.documents || [];
      }

      return NextResponse.json({ 
        message: responseText,
        sources: sources || []
      });

    } catch (railwayError) {
      console.warn('⚠️ Railway API failed, attempting fallback...', railwayError);
      
      // Enhanced fallback with basic AI response using OpenAI
      try {
        const fallbackResponse = await generateFallbackResponse(lastMessage.content, messages);
        return NextResponse.json({ 
          message: fallbackResponse,
          sources: [],
          fallback: true
        });
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        
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
    }

  } catch (error) {
    console.error('❌ Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}