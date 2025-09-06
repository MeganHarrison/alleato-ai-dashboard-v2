import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatMessage } from '@/components/chat-message';

interface UseRealtimeChatOptions {
  roomName: string;
  username: string;
  onMessage?: (messages: ChatMessage[]) => void;
  initialMessages?: ChatMessage[];
}

export function useRealtimeChat({
  roomName,
  username,
  onMessage,
  initialMessages = []
}: UseRealtimeChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_name', roomName)
          .order('created_at', { ascending: true })
          .limit(100);

        if (!error && data) {
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            username: msg.username,
            message: msg.message,
            timestamp: new Date(msg.created_at),
            type: msg.metadata?.type || 'text',
            metadata: msg.metadata
          }));
          
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [roomName, supabase]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`room:${roomName}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_name=eq.${roomName}`
      }, (payload) => {
        const newMessage: ChatMessage = {
          id: payload.new.id,
          username: payload.new.username,
          message: payload.new.message,
          timestamp: new Date(payload.new.created_at),
          type: payload.new.metadata?.type || 'text',
          metadata: payload.new.metadata
        };
        
        setMessages(prev => {
          const updated = [...prev, newMessage];
          onMessage?.(updated);
          return updated;
        });
      })
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomName, onMessage, supabase]);

  // Send message function
  const sendMessage = useCallback(async (
    message: string,
    type: 'text' | 'search' | 'document' | 'system' = 'text',
    metadata?: any
  ) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_name: roomName,
          username,
          message,
          metadata: { ...metadata, type }
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [roomName, username, supabase]);

  // Share search results
  const shareSearchResults = useCallback(async (
    query: string,
    results: any[]
  ) => {
    const metadata = {
      type: 'search',
      query,
      results: results.slice(0, 5), // Limit to top 5 results
      resultCount: results.length
    };

    return sendMessage(
      `Shared search results for: "${query}"`,
      'search',
      metadata
    );
  }, [sendMessage]);

  // Share document
  const shareDocument = useCallback(async (document: {
    fileName: string;
    fileType: string;
    wordCount?: number;
    preview?: string;
  }) => {
    const metadata = {
      type: 'document',
      document
    };

    return sendMessage(
      `Shared document: ${document.fileName}`,
      'document',
      metadata
    );
  }, [sendMessage]);

  return {
    messages,
    sendMessage,
    shareSearchResults,
    shareDocument,
    isConnected,
    isLoading
  };
}