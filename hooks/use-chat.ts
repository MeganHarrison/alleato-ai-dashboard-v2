/**
 * React hook for PM RAG Chat integration
 */

import { useState, useCallback, useRef } from 'react';
import { ChatClient, type ChatMessage, type ChatOptions } from '@/lib/chat-client';

interface UseChatOptions {
  initialMessages?: ChatMessage[];
  workerUrl?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, options?: ChatOptions) => Promise<void>;
  streamMessage: (message: string, options?: ChatOptions) => Promise<void>;
  clearMessages: () => void;
  isStreaming: boolean;
  currentStreamingMessage: string;
  retryLastMessage: () => Promise<void>;
  healthCheck: () => Promise<boolean>;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(options.initialMessages || []);
  const [isLoading] = useState(false);
  const [isStreaming] = useState(false);
  const [currentStreamingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of the last message for retry functionality
  const lastMessageRef = useRef<{ message: string; options?: ChatOptions } | null>(null);
  
  const chatClient = useRef(new ChatClient(options.workerUrl));

  const sendMessage = useCallback(async (
    message: string,
    chatOptions: ChatOptions = {}
  ) => {
    setIsLoading(true);
    setError(null);
    lastMessageRef.current = { message, options: chatOptions };

    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        metadata: { timestamp: new Date().toISOString() },
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Send to worker
      const response = await chatClient.current.sendMessage(message, messages, chatOptions);

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
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Remove the user message if the request failed
      setMessages(prev => prev.slice(0, -1));
      
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const streamMessage = useCallback(async (
    message: string,
    chatOptions: ChatOptions = {}
  ) => {
    setIsStreaming(true);
    setCurrentStreamingMessage('');
    setError(null);
    lastMessageRef.current = { message, options: chatOptions };

    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        metadata: { timestamp: new Date().toISOString() },
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Add placeholder for assistant message
      const assistantMessageId = Date.now();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        metadata: { timestamp: new Date().toISOString() },
      }]);

      const fullResponse = '';

      await chatClient.current.streamMessage(
        message,
        messages,
        chatOptions,
        // onChunk
        (chunk: string) => {
          fullResponse += chunk;
          setCurrentStreamingMessage(fullResponse);
          
          // Update the assistant message in real-time
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex]?.role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: fullResponse,
              };
            }
            return updated;
          });
        },
        // onComplete
        (sources: string[], confidence: number) => {
          // Update final message with metadata
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex]?.role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: fullResponse,
                metadata: {
                  sources,
                  confidence,
                  timestamp: new Date().toISOString(),
                },
              };
            }
            return updated;
          });
        },
        // onError
        (error: Error) => {
          setError(error.message);
          // Remove the incomplete assistant message
          setMessages(prev => prev.slice(0, -1));
        }
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stream message';
      setError(errorMessage);
      
      // Remove both user and incomplete assistant messages
      setMessages(prev => prev.slice(0, -2));
      
      console.error('Streaming error:', err);
    } finally {
      setIsStreaming(false);
      setCurrentStreamingMessage('');
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setCurrentStreamingMessage('');
    lastMessageRef.current = null;
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (!lastMessageRef.current) {
      setError('No message to retry');
      return;
    }

    const { message, options } = lastMessageRef.current;
    
    // Remove the last error and try again
    setError(null);
    
    // If the last messages were error states, remove them
    if (messages.length > 0 && error) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        setMessages(prev => prev.slice(0, -1));
      }
    }
    
    await sendMessage(message, options);
  }, [messages, error, sendMessage]);

  const healthCheck = useCallback(async (): Promise<boolean> => {
    try {
      await chatClient.current.healthCheck();
      return true;
    } catch (err) {
      console.error('Health check failed:', err);
      setError('Worker connection failed. Please check your internet connection.');
      return false;
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    streamMessage,
    clearMessages,
    isStreaming,
    currentStreamingMessage,
    retryLastMessage,
    healthCheck,
  };
}
