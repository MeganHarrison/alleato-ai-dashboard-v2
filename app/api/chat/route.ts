import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Render API endpoint
const RENDER_API_URL = process.env.RENDER_PM_RAG_URL || 'https://alleato-rag-chat-fastapi.onrender.com';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log('🔗 Using Render API:', RENDER_API_URL);

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

async function queryRenderRAG(message: string, conversationHistory: unknown[] = []) {
  try {
    const payload = {
      message: message,
      conversation_history: conversationHistory.slice(-5), // Last 5 messages for context
      session_id: `chat_session_${Date.now()}`
    };

    console.log(`🎯 Querying Render API: ${RENDER_API_URL}/chat`);

    const response = await fetch(`${RENDER_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Alleato-AI-Dashboard/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Render API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Render API Response received');

    return data;
  } catch (error) {
    console.error('🚨 Render API Error:', error);
    throw error;
  }
}

async function generateFallbackResponse(message: string, conversationHistory: unknown[] = []) {
  if (!openai) {
    throw new Error('OpenAI not configured for fallback');
  }

  const systemPrompt = `You are an AI assistant helping with project management and meeting analysis. 
The user's Render RAG system is temporarily unavailable, so provide helpful general guidance about:
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

    // Query Render RAG API with your meeting data
    try {
      const renderResponse = await queryRenderRAG(lastMessage.content, messages);
      
      // Extract the response from Render API
      let responseText = '';
      let sources = [];
      
      if (renderResponse) {
        // Handle the standard Render API format
        let rawResponse = renderResponse.response || renderResponse.answer || renderResponse.message || '';
        
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
        sources = renderResponse.tool_calls || renderResponse.sources || renderResponse.documents || [];
      }

      return NextResponse.json({ 
        message: responseText,
        sources: sources || []
      });

    } catch (renderError) {
      console.warn('⚠️ Render API failed, attempting fallback...', renderError);
      
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
          message: `I'm having trouble accessing your meeting data right now. The Render RAG system appears to be unavailable. 

Please check:
1. Is the Render service running?
2. Is the RENDER_PM_RAG_URL environment variable set correctly?
3. Are there any network connectivity issues?

I'd normally be able to help you with:
- Meeting transcript analysis
- Project insights and recommendations
- Action item tracking
- Risk assessment from your meetings

Please try again in a moment or check the Render service status.`
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