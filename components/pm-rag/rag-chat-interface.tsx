'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Bot, User, Search, FileText, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: MeetingSource[];
}

interface MeetingSource {
  meeting_id: string;
  title: string;
  date: string;
  similarity_score?: number;
}

export default function RAGChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you search and analyze your meeting transcripts. Ask me about specific meetings, projects, decisions, action items, or any other meeting-related information.',
      timestamp: new Date(),
    }
  ]);
  const [input] = useState(false);
  const [loading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Example queries for quick access
  const exampleQueries = [
    'What were the key decisions from last week?',
    'Show me all risks identified in Project Alpha',
    'What action items are pending?',
    'Summarize the latest product meeting',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input?.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Try the fallback endpoint that doesn't require vector functions
      const response = await fetch('/api/pm-rag-fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          conversationHistory: messages.filter(m => m.role !== 'assistant' || !m.content.includes('Hello! I can help')).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          })).slice(-10), // Keep last 10 messages for context
          reasoningEffort: 'medium'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.response || 'I couldn\'t find relevant information for your query.',
        timestamp: new Date(),
        sources: data.metadata?.sources?.map((source: unknown) => ({
          meeting_id: source.meeting_id || source,
          title: source.title || source,
          date: source.date || new Date().toISOString(),
          similarity_score: source.similarity_score || data.metadata?.confidence
        })) || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleExampleClick = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Meeting Intelligence Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Example queries */}
        <div className="px-6 py-3 border-b">
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

        {/* Chat messages */}
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
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
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Show sources if available */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="text-xs font-medium mb-2">Sources:</div>
                      <div className="space-y-1">
                        {message.sources.map((source, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-xs bg-background/50 rounded p-1.5"
                          >
                            <FileText className="h-3 w-3" />
                            <span className="flex-1">{source.title}</span>
                            <Calendar className="h-3 w-3 opacity-50" />
                            <span className="opacity-70">
                              {new Date(source.date).toLocaleDateString()}
                            </span>
                            {source.similarity_score && (
                              <Badge variant="secondary" className="text-xs">
                                {(source.similarity_score * 100).toFixed(0)}% match
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analyzing meetings and generating insights...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about meetings, decisions, action items..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input?.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}