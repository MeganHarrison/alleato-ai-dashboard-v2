/**
 * FM Global Chat Adapter API Route
 * 
 * PURPOSE: Bridges useChat hook format with Railway FM Global Expert API
 * 
 * USED BY:
 * - /fm-global2 page (main clean UI)
 * - /chat-asrs page (with AI Elements UI)
 * - fm-global-chat-interface.tsx component
 * 
 * FUNCTIONALITY:
 * - Converts useChat messages format to Railway endpoint format
 * - Calls Railway endpoint via /api/fm-global-proxy
 * - Returns streaming text responses compatible with useChat
 * - Provides expert FM Global 8-34 answers from Railway-hosted service
 * 
 * INPUT: { messages: [{ role: 'user', content: 'query' }] }
 * OUTPUT: Streaming text response from Railway FM Global Expert
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

    // Try Railway endpoint first, fallback to local RAG if it fails
    let ragData;
    let useRailway = true;
    
    try {
      // Call the Railway endpoint via proxy
      const ragResponse = await fetch(`${req.nextUrl.origin}/api/fm-global-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: lastMessage.content,
          query: lastMessage.content, // Include both for compatibility
          sessionId: `session_${Date.now()}`,
          context: {
            asrsType: 'general',
            storageHeight: 25,
            commodityClass: 'Class II',
            containerType: 'mixed',
            systemType: 'wet'
          }
        })
      });

      if (!ragResponse.ok) {
        const errorData = await ragResponse.json();
        console.error('Railway proxy error:', errorData);
        throw new Error(errorData.error || `Railway API error: ${ragResponse.status}`);
      }

      ragData = await ragResponse.json();
    } catch (railwayError) {
      console.error('Railway endpoint failed, falling back to local RAG:', railwayError);
      useRailway = false;
      
      // Fallback to local Supabase RAG
      const localResponse = await fetch(`${req.nextUrl.origin}/api/fm-global-rag`, {
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
      
      if (!localResponse.ok) {
        throw new Error(`Local RAG API error: ${localResponse.status}`);
      }
      
      ragData = await localResponse.json();
    }
    
    // Create a streaming response
    const stream = new ReadableStream({
      start(controller) {
        // Railway endpoint returns 'response' field
        let content = ragData.response || ragData.content || 'I can help you with FM Global 8-34 requirements.';
        
        // Add a note about which endpoint was used (for debugging)
        if (!useRailway) {
          content = content + '\n\n*[Using local Supabase RAG - Railway endpoint temporarily unavailable]*';
        }
        
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