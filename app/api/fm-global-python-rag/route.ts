/**
 * FM Global REAL RAG API Bridge
 * 
 * PURPOSE: Connects to the sophisticated Python Pydantic AI agent
 * 
 * DIFFERENCE FROM OTHER ROUTES:
 * - This calls the REAL RAG system (Python Pydantic AI)
 * - Advanced semantic + hybrid search
 * - Sophisticated prompt engineering
 * - Tool calling and context management
 * 
 * USED BY: /fm-global-advanced page (new dedicated interface)
 * 
 * PYTHON AGENT: monorepo-agents/aisdk-rag-asrs/rag_agent_fm_global/
 */

import { NextRequest } from 'next/server';
import { StreamingTextResponse } from 'ai';

const PYTHON_RAG_URL = process.env.PYTHON_RAG_URL || 'http://localhost:8001';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Invalid message format', { status: 400 });
    }

    console.log('🔥 CALLING REAL RAG AGENT:', lastMessage.content);
    
    // Call the Python RAG agent
    const response = await fetch(`${PYTHON_RAG_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: lastMessage.content,
        session_id: `session_${Date.now()}`,
        user_preferences: {
          search_type: 'hybrid',
          result_count: 10,
          text_weight: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Python RAG agent error: ${response.status} ${response.statusText}`);
    }

    const ragData = await response.json();
    console.log('✅ RAG Agent Response:', ragData.response.substring(0, 100) + '...');
    
    // Create streaming response
    const stream = new ReadableStream({
      start(controller) {
        const content = ragData.response;
        
        // Stream the response in chunks
        const chunks = content.split(' ');
        let i = 0;
        
        const pushChunk = () => {
          if (i < chunks.length) {
            const chunk = (i === 0 ? chunks[i] : ' ' + chunks[i]);
            controller.enqueue(new TextEncoder().encode(chunk));
            i++;
            setTimeout(pushChunk, 15); // Smooth streaming
          } else {
            controller.close();
          }
        };
        
        pushChunk();
      }
    });

    return new StreamingTextResponse(stream);
    
  } catch (error) {
    console.error('🚨 Real RAG API Error:', error);
    
    // Fallback response
    const fallbackContent = `I apologize, but I'm having trouble connecting to the advanced RAG system. The Python agent may not be running.
    
To start the real RAG agent:
1. cd monorepo-agents/aisdk-rag-asrs/rag_agent_fm_global/
2. python api_server.py

Error: ${(error as any)?.message || 'Unknown error'}`;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackContent));
        controller.close();
      }
    });

    return new StreamingTextResponse(stream);
  }
}