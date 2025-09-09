'use client';

export const dynamic = 'force-dynamic';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Bot, User, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PMChatWorking() {
  const chatHelpers = useChat({
    api: '/api/pm-chat-direct',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your PM Assistant with access to meeting transcripts and project data. I can help you:\n\n• Search meeting transcripts\n• Track project health and risks\n• Identify action items and decisions\n• Provide strategic recommendations\n\nWhat would you like to know?',
      },
    ],
    onError: (error: any) => {
      console.error('Chat error:', error);
    },
  } as any);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
  } = chatHelpers as any;

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showExamples, setShowExamples] = useState(true);

  const exampleQueries = [
    'What were the key decisions from our last project meeting?',
    'Show me all action items from this week',
    'What risks have been identified in Project Alpha?',
    'Analyze the health of our current projects',
    'Search for discussions about timeline changes',
  ];

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleExampleClick = (query: string) => {
    const event = {
      target: { value: query }
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event);
    setShowExamples(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowExamples(false);
    handleSubmit(e);
  };

  // Parse tool invocations from message content if present
  const parseToolInvocations = (content: string) => {
    if (!content) return [];
    const toolRegex = /\[Tool: (.*?)\]/g;
    const tools = [];
    let match;
    while ((match = toolRegex.exec(content)) !== null) {
      tools.push(match[1]);
    }
    return tools;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">PM Chat Assistant (Working)</h1>
        <p className="text-muted-foreground">
          Direct connection to PM chat with AI SDK v5 streaming
        </p>
        <Badge variant="outline" className="mt-2">
          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
          Using /api/pm-chat-direct
        </Badge>
      </div>

      <Card className="h-[700px] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Project Management Assistant
            {isLoading && (
              <Badge variant="secondary" className="ml-auto">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                AI is thinking...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Example queries */}
          {showExamples && messages.length <= 1 && (
            <div className="px-6 py-3 border-b bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(query)}
                    className="text-xs"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reload()}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message: any) => {
                const content = message.content || '';
                const tools = parseToolInvocations(content);
                const cleanContent = content.replace(/\[Tool: .*?\]/g, '').trim();
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      } rounded-lg p-3`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                        <span className="text-xs opacity-70">
                          {message.role === 'user' ? 'You' : 'PM Assistant'}
                        </span>
                        {tools.length > 0 && (
                          <div className="flex gap-1 ml-auto">
                            {tools.map((tool, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap">{cleanContent}</div>
                      
                      {/* Tool invocations display */}
                      {message.toolInvocations && message.toolInvocations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="text-xs font-medium mb-2">Tools Used:</div>
                          <div className="space-y-1">
                            {message.toolInvocations.map((tool: any, index: number) => (
                              <div
                                key={index}
                                className="text-xs bg-background/50 rounded p-1.5"
                              >
                                <span className="font-medium">{tool.toolName}</span>
                                {tool.result && (
                                  <span className="text-muted-foreground ml-2">
                                    → {typeof tool.result === 'object' 
                                      ? JSON.stringify(tool.result).substring(0, 100) + '...' 
                                      : tool.result}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Searching meetings and analyzing data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input form */}
          <form onSubmit={onSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about meetings, projects, risks, or action items..."
                disabled={isLoading}
                className="flex-1"
              />
              {isLoading ? (
                <Button type="button" onClick={stop} variant="destructive">
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Stop
                </Button>
              ) : (
                <Button type="submit" disabled={!input?.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Debug info */}
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <h3 className="text-sm font-medium mb-2">Debug Info</h3>
        <div className="text-xs space-y-1 font-mono">
          <div>Messages: {messages.length}</div>
          <div>Loading: {isLoading ? 'true' : 'false'}</div>
          <div>Error: {error ? error.message : 'none'}</div>
          <div>API: /api/pm-chat-direct</div>
        </div>
      </div>
    </div>
  );
}