import { useState, useCallback, useRef } from 'react';
import { 
  getPMRAGChatClient, 
  ChatMessage, 
  ChatOptions, 
  ChatResponse 
} from '@/lib/pm-rag-chat/client';

export interface UseChatOptions {
  workerUrl?: string;
  defaultOptions?: ChatOptions;
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, options?: ChatOptions) => Promise<ChatResponse | null>;
  streamMessage: (message: string, options?: ChatOptions) => Promise<void>;
  clearMessages: () => void;
  retry: () => Promise<void>;
  currentStreamingMessage: string;
  isStreaming: boolean;
  sources: string[];
  confidence: number;
}

export function usePMRAGChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0);
  
  const lastMessageRef = useRef<string>('');
  const lastOptionsRef = useRef<ChatOptions>({});

  const chatClient = getPMRAGChatClient(options.workerUrl);

  const sendMessage = useCallback(async (
    message: string,
    messageOptions: ChatOptions = {}
  ): Promise<ChatResponse | null> => {
    if (isLoading || isStreaming) return null;
    
    setIsLoading(true);
    setError(null);
    lastMessageRef.current = message;
    lastOptionsRef.current = { ...options.defaultOptions, ...messageOptions };

    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Send to worker with conversation history
      const response = await chatClient.sendMessage(
        message, 
        messages, 
        lastOptionsRef.current
      );

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        metadata: {
          sources: response.sources,
          confidence: response.confidence,
          reasoning: response.reasoning,
          timestamp: response.timestamp,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSources(response.sources);
      setConfidence(response.confidence);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      if (options.onError) {
        options.onError(err instanceof Error ? err : new Error(errorMessage));
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isStreaming, options, chatClient]);

  const streamMessage = useCallback(async (
    message: string,
    messageOptions: ChatOptions = {}
  ): Promise<void> => {
    if (isLoading || isStreaming) return;
    
    setIsStreaming(true);
    setError(null);
    setCurrentStreamingMessage('');
    setSources([]);
    setConfidence(0);
    lastMessageRef.current = message;
    lastOptionsRef.current = { ...options.defaultOptions, ...messageOptions };

    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Create placeholder for assistant message
      let assistantContent = '';

      await chatClient.streamMessage(
        message,
        messages,
        lastOptionsRef.current,
        {
          onChunk: (chunk: string) => {
            assistantContent += chunk;
            setCurrentStreamingMessage(assistantContent);
          },
          onComplete: (streamSources: string[], streamConfidence: number, reasoning?: string) => {
            // Add final assistant message
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              content: assistantContent,
              metadata: {
                sources: streamSources,
                confidence: streamConfidence,
                reasoning,
                timestamp: new Date().toISOString(),
              },
            };

            setMessages(prev => [...prev, assistantMessage]);
            setSources(streamSources);
            setConfidence(streamConfidence);
            setCurrentStreamingMessage('');
          },
          onError: (err: Error) => {
            setError(err.message);
            if (options.onError) {
              options.onError(err);
            }
          }
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stream message';
      setError(errorMessage);
      if (options.onError) {
        options.onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isLoading, isStreaming, options, chatClient]);

  const retry = useCallback(async (): Promise<void> => {
    if (lastMessageRef.current) {
      await sendMessage(lastMessageRef.current, lastOptionsRef.current);
    }
  }, [sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setCurrentStreamingMessage('');
    setSources([]);
    setConfidence(0);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    streamMessage,
    clearMessages,
    retry,
    currentStreamingMessage,
    isStreaming,
    sources,
    confidence,
  };
}
