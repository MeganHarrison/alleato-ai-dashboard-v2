/**
 * Chat client for PM RAG Agent
 * Integrates with the deployed Cloudflare Worker
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
    reasoning?: string;
    timestamp?: string;
  };
}

export interface ChatOptions {
  project_id?: number;
  reasoning_effort?: 'minimal' | 'medium' | 'high';
  include_insights?: boolean;
  include_meetings?: boolean;
  include_projects?: boolean;
}

export interface ChatResponse {
  response: string;
  sources: string[];
  confidence: number;
  reasoning?: string;
  conversation_id?: string;
  timestamp: string;
}

export interface StreamingChatResponse {
  chunk: string;
  finished: boolean;
  sources?: string[];
  confidence?: number;
}

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://rag-agent-pm.onrender.com';

export class ChatClient {
  private baseUrl: string;

  constructor(workerUrl: string = WORKER_URL) {
    this.baseUrl = workerUrl;
  }

  /**
   * Send a message and get a complete response
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
        options,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `Chat request failed: ${response.statusText}${
          errorData?.details ? ` - ${errorData.details}` : ''
        }`
      );
    }

    return await response.json();
  }

  /**
   * Send a message and get a streaming response
   */
  async streamMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    options: ChatOptions = {},
    onChunk: (chunk: string) => void,
    onComplete: (sources: string[], confidence: number) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `Streaming request failed: ${response.statusText}${
            errorData?.details ? ` - ${errorData.details}` : ''
          }`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream reader available');

      const decoder = new TextDecoder();
      let sources: string[] = [];
      let confidence = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as StreamingChatResponse;
                
                if (data.sources) {
                  sources = data.sources;
                }
                
                if (data.confidence !== undefined) {
                  confidence = data.confidence;
                }
                
                if (data.chunk) {
                  onChunk(data.chunk);
                }
                
                if (data.finished) {
                  onComplete(sources, confidence);
                  return;
                }
              } catch (e) {
                // Skip invalid JSON lines
                console.warn('Failed to parse streaming chunk:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      const chatError = error instanceof Error ? error : new Error('Unknown streaming error');
      if (onError) {
        onError(chatError);
      } else {
        throw chatError;
      }
    }
  }

  /**
   * Test the connection to the worker
   */
  async healthCheck(): Promise<{ status: string; service: string; version: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

// Default export for convenience
export const chatClient = new ChatClient();
