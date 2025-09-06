/**
 * FM Global Chat Adapter API Route
 * 
 * PURPOSE: Bridges useChat hook format with FM Global RAG API
 * 
 * USED BY:
 * - /fm-global2 page (main clean UI)
 * - /chat-asrs page
 * - fm-global-chat-interface.tsx component
 * 
 * FUNCTIONALITY:
 * - Converts useChat messages format to RAG query format
 * - Calls /api/fm-global-rag internally
 * - Returns streaming text responses compatible with useChat
 * - Provides real-time RAG-powered answers from FM Global 8-34 documents
 * 
 * INPUT: { messages: [{ role: 'user', content: 'query' }] }
 * OUTPUT: Streaming text response with RAG-retrieved content
 */

import { NextRequest } from 'next/server';
import { StreamingTextResponse } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Invalid message format', { status: 400 });
    }

    // Call the RAG API with the proper format
    const ragResponse = await fetch(`${req.nextUrl.origin}/api/fm-global-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: lastMessage.content,
        context: {
          asrsType: 'general',
          storageHeight: 25,
          commodityClass: 'Class II',
          containerType: 'mixed',
          systemType: 'wet'
        },
        includeOptimizations: true,
        limit: 5
      })
    });

    if (!ragResponse.ok) {
      throw new Error(`RAG API error: ${ragResponse.status}`);
    }

    const ragData = await ragResponse.json();
    
    // Create a streaming response with the RAG content
    const stream = new ReadableStream({
      start(controller) {
        const content = ragData.content || 'I can help you with FM Global 8-34 requirements.';
        
        // Split content into chunks for streaming effect
        const chunks = content.split(' ');
        let i = 0;
        
        const pushChunk = () => {
          if (i < chunks.length) {
            const chunk = (i === 0 ? chunks[i] : ' ' + chunks[i]);
            controller.enqueue(new TextEncoder().encode(chunk));
            i++;
            setTimeout(pushChunk, 20); // Small delay for streaming effect
          } else {
            controller.close();
          }
        };
        
        pushChunk();
      }
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('FM Global Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}