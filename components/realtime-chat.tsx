'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, Wifi, WifiOff, Users } from 'lucide-react';
import { ChatMessage } from '@/components/chat-message';
import { useRealtimeChat } from '@/hooks/use-realtime-chat';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { cn } from '@/lib/utils';

interface RealtimeChatProps {
  roomName: string;
  username: string;
  onMessage?: (messages: ChatMessage[]) => void;
  initialMessages?: ChatMessage[];
  className?: string;
  showHeader?: boolean;
  height?: string;
}

export function RealtimeChat({
  roomName,
  username,
  onMessage,
  initialMessages,
  className,
  showHeader = true,
  height = '600px'
}: RealtimeChatProps) {
  const [inputMessage] = useState(false);
  const [isSending] = useState(false);
  const {
    messages,
    sendMessage,
    shareSearchResults,
    shareDocument,
    isConnected,
    isLoading
  } = useRealtimeChat({
    roomName,
    username,
    onMessage,
    initialMessages
  });

  const scrollRef = useChatScroll(messages);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isSending) return;
    
    setIsSending(true);
    const messageText = inputMessage;
    setInputMessage('');
    
    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setInputMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  // Expose sharing methods via ref if needed
  React.useImperativeHandle(
    React.useRef({
      shareSearchResults,
      shareDocument
    }),
    [shareSearchResults, shareDocument]
  );

  return (
    <Card className={cn('flex flex-col', className)} style={{ height }}>
      {showHeader && (
        <>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Collaboration Chat
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {roomName}
                </Badge>
                <Badge 
                  variant={isConnected ? "default" : "secondary"}
                  className="gap-1"
                >
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3" />
                      Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" />
                      Offline
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <Separator />
        </>
      )}
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea 
          className="h-full p-4" 
          ref={scrollRef}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start the conversation or share search results
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwnMessage={message.username === username}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending || !isConnected}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isSending || !inputMessage.trim() || !isConnected}
            size="icon"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}