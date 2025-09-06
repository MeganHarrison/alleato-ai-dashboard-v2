// Chat API endpoint with RAG retrieval and streaming

import { NextRequest, NextResponse } from 'next/server';
import { streamText, convertToCoreMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { generateEmbedding } from '@/lib/rag/embeddings';
import { chatOperations } from '@/lib/rag/supabase-client';
import { ChatRequest, SearchResult } from '@/lib/rag/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, context, stream = true } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Messages are required' 
          } 
        },
        { status: 400 }
      );
    }

    // Get the last user message for context retrieval
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'No user message found' 
          } 
        },
        { status: 400 }
      );
    }

    // Retrieve relevant context
    const relevantChunks = await retrieveContext(
      lastUserMessage.content,
      context?.max_chunks || 10,
      context?.document_ids
    );

    // Build enhanced prompt with context
    const enhancedPrompt = buildEnhancedPrompt(
      lastUserMessage.content,
      relevantChunks
    );

    // Replace last user message with enhanced version
    const enhancedMessages = [
      ...messages.slice(0, -1),
      { ...lastUserMessage, content: enhancedPrompt }
    ];

    // Generate session ID if not provided
    const sessionId = messages[0].session_id || generateSessionId();

    // Save user message to history
    await chatOperations.createMessage({
      session_id: sessionId,
      role: 'user',
      content: lastUserMessage.content,
      metadata: { context_used: relevantChunks.length > 0 },
    });

    if (stream) {
      // Stream the response
      const result = await streamText({
        model: openai('gpt-4-turbo-preview'),
        messages: convertToCoreMessages(enhancedMessages),
        temperature: context?.temperature || 0.7,
        onFinish: async ({ text }) => {
          // Save assistant message to history
          await chatOperations.createMessage({
            session_id: sessionId,
            role: 'assistant',
            content: text,
            sources: relevantChunks.map(chunk => ({
              document_id: chunk.document_id,
              document_title: chunk.document_title,
              chunk_id: chunk.chunk_id,
              content: chunk.content.substring(0, 200) + '...',
              relevance_score: chunk.relevance_score,
            })),
          });
        },
      });

      // Return streaming response with sources
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          // Send sources first
          if (relevantChunks.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'sources',
                  sources: relevantChunks.map(chunk => ({
                    document_id: chunk.document_id,
                    document_title: chunk.document_title,
                    chunk_id: chunk.chunk_id,
                    relevance: chunk.relevance_score,
                  })),
                })}\n\n`
              )
            );
          }

          // Stream the text
          for await (const chunk of result.textStream) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'chunk',
                  content: chunk,
                })}\n\n`
              )
            );
          }

          // Send completion signal
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                message_id: sessionId,
              })}\n\n`
            )
          );

          controller.close();
        },
      });

      return new NextResponse(customStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });

    } else {
      // Non-streaming response
      const result = await streamText({
        model: openai('gpt-4-turbo-preview'),
        messages: convertToCoreMessages(enhancedMessages),
        temperature: context?.temperature || 0.7,
      });

      const response = await result.text;

      // Save assistant message to history
      await chatOperations.createMessage({
        session_id: sessionId,
        role: 'assistant',
        content: response,
        sources: relevantChunks.map(chunk => ({
          document_id: chunk.document_id,
          document_title: chunk.document_title,
          chunk_id: chunk.chunk_id,
          content: chunk.content.substring(0, 200) + '...',
          relevance_score: chunk.relevance_score,
        })),
      });

      return NextResponse.json({
        message: response,
        sources: relevantChunks,
        session_id: sessionId,
      });
    }

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to process chat request',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

async function retrieveContext(
  query: string,
  maxChunks: number,
  documentIds?: string[]
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search for relevant chunks
    const { supabase } = await import('@/lib/rag/supabase-client');
    
    const vectorString = `[${queryEmbedding.join(',')}]`;
    
    const { data, error } = await supabase
      .rpc('match_rag_chunks', {
        query_embedding: vectorString,
        match_threshold: 0.7,
        match_count: maxChunks,
        filter_document_ids: documentIds || null,
      });

    if (error) {
      console.error('Error retrieving context:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in context retrieval:', error);
    return [];
  }
}

function buildEnhancedPrompt(
  userQuery: string,
  relevantChunks: SearchResult[]
): string {
  if (relevantChunks.length === 0) {
    return userQuery;
  }

  const contextText = relevantChunks
    .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
    .join('\n\n');

  return `Based on the following context, please answer the user's question. If the context doesn't contain relevant information, you can use your general knowledge but mention that the information is not from the provided documents.

Context:
${contextText}

User Question: ${userQuery}

Please provide a comprehensive answer and cite the context numbers [1], [2], etc. when referencing specific information from the context.`;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}