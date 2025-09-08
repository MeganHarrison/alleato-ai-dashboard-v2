/**
 * PM RAG Chat Interface Component
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Send, MessageCircle, Brain, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChat } from '@/hooks/use-chat';
import { ChatMessage as IChatMessage, ChatOptions } from '@/lib/chat-client';

interface ChatInterfaceProps {
  className?: string;
  defaultProjectId?: number;
  showProjectFilter?: boolean;
  autoFocus?: boolean;
}

export function ChatInterface({ 
  className = '', 
  defaultProjectId,
  showProjectFilter = true,
  autoFocus = true 
}: ChatInterfaceProps) {
  const [input, setInput] = React.useState('');
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | undefined>(defaultProjectId);
  const [reasoningEffort, setReasoningEffort] = React.useState<'minimal' | 'medium' | 'high'>('medium');
  const [isHealthy, setIsHealthy] = React.useState<boolean | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    streamMessage,
    clearMessages,
    retryLastMessage,
    healthCheck,
  } = useChat();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Focus input on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Check worker health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await healthCheck();
      setIsHealthy(healthy);
    };
    checkHealth();
  }, [healthCheck]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input?.trim() || isLoading || isStreaming) {
      return;
    }

    const options: ChatOptions = {
      project_id: selectedProjectId,
      reasoning_effort: reasoningEffort,
      include_insights: true,
      include_meetings: true,
      include_projects: true,
    };

    const message = input.trim();
    setInput('');
    
    try {
      // Use streaming by default for better UX
      await streamMessage(message, options);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className={`flex flex-col h-full max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            PM RAG Assistant
            {isHealthy === false && (
              <Badge variant="destructive" className="ml-2">
                <AlertCircle className="h-3 w-3 mr-1" />
                Connection Issue
              </Badge>
            )}
            {isHealthy === true && (
              <Badge variant="secondary" className="ml-2 text-green-700 bg-green-50">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                Online
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        {showProjectFilter && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Project:</label>
                <Input
                  type="number"
                  placeholder="Project ID (optional)"
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-32"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Reasoning:</label>
                <select
                  value={reasoningEffort}
                  onChange={(e) => setReasoningEffort(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="minimal">Minimal</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              {(messages?.length || 0) > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMessages}
                  className="ml-auto"
                >
                  Clear Chat
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="mb-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={retryLastMessage}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {(messages?.length || 0) === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Welcome to PM RAG Assistant</p>
                  <p className="text-sm">Ask me about your projects, meetings, or any insights from your data.</p>
                  <div className="mt-4 text-xs space-y-1">
                    <p>"What are the key risks in the Vermillion Rise project?"</p>
                    <p>"Summarize recent meetings about GVI Paradise Isle"</p>
                    <p>"What action items are pending across all projects?"</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <ChatMessage key={index} message={message} isStreaming={isStreaming && index === messages.length - 1} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
        
        <Separator />
        
        {/* Input */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your projects, meetings, or insights..."
              disabled={isLoading || isStreaming}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!input?.trim() || isLoading || isStreaming}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          {(isLoading || isStreaming) && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              {isStreaming ? 'Streaming response...' : 'Processing your request...'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

interface ChatMessageProps {
  message: IChatMessage;
  isStreaming?: boolean;
}

function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'bg-blue-500 text-white' : 'bg-muted'} rounded-lg px-4 py-2`}>
        <div className="prose prose-sm max-w-none">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}
        </div>
        
        {message.metadata && !isUser && (
          <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
            {message.metadata.sources && message.metadata.sources.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1 opacity-70">Sources:</p>
                <div className="flex flex-wrap gap-1">
                  {message.metadata.sources.map((source, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs opacity-70">
              {message.metadata.confidence && (
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Confidence: {Math.round(message.metadata.confidence * 100)}%
                </div>
              )}
              
              {message.metadata.timestamp && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(message.metadata.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
            
            {message.metadata.reasoning && (
              <details className="text-xs">
                <summary className="cursor-pointer opacity-70 hover:opacity-100">
                  Reasoning
                </summary>
                <p className="mt-1 opacity-80">{message.metadata.reasoning}</p>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
