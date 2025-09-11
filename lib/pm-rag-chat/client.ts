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
  timestamp: string;
}

export interface StreamChunk {
  chunk: string;
  finished: boolean;
  sources?: string[];
  confidence?: number;
}

export class PMRAGChatClient {
  private baseUrl: string;

  constructor(workerUrl: string) {
    this.baseUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
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
      const errorText = await response.text();
      throw new Error(`Chat request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return {
      response: data.response || '',
      sources: data.sources || [],
      confidence: data.confidence || 0,
      reasoning: data.reasoning,
      timestamp: data.timestamp || new Date().toISOString(),
    };
  }

  /**
   * Send a message with streaming response
   */
  async streamMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    options: ChatOptions = {},
    callbacks: {
      onChunk?: (chunk: string) => void;
      onComplete?: (sources: string[], confidence: number, reasoning?: string) => void;
      onError?: (error: Error) => void;
    } = {}
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
        const errorText = await response.text();
        throw new Error(`Streaming request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream reader available');

      const decoder = new TextDecoder();
      let sources: string[] = [];
      const confidence = 0;
      let reasoning: string | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: StreamChunk = JSON.parse(line.slice(6));
                
                // Update metadata when available
                if (data.sources) {
                  sources = data.sources;
                }
                if (typeof data.confidence === 'number') {
                  confidence = data.confidence;
                }

                // Handle content chunks
                if (data.chunk && callbacks.onChunk) {
                  callbacks.onChunk(data.chunk);
                }
                
                // Handle completion
                if (data.finished && callbacks.onComplete) {
                  callbacks.onComplete(sources, confidence, reasoning);
                  return;
                }
              } catch (e) {
                // Skip invalid JSON lines
                console.warn('Failed to parse SSE data:', line, e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown streaming error');
      if (callbacks.onError) {
        callbacks.onError(err);
      } else {
        throw err;
      }
    }
  }

  /**
   * Check if the worker is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance for easy access
let chatClientInstance: PMRAGChatClient | null = null;

export function getPMRAGChatClient(workerUrl?: string): PMRAGChatClient {
  if (!chatClientInstance) {
    const url = workerUrl || process.env.NEXT_PUBLIC_PM_RAG_WORKER_URL;
    if (!url) {
      throw new Error('PM RAG Worker URL not found. Set NEXT_PUBLIC_PM_RAG_WORKER_URL in your environment variables.');
    }
    chatClientInstance = new PMRAGChatClient(url);
  }
  return chatClientInstance;
}
