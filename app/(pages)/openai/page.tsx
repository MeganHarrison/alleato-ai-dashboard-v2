'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  MessageSquare,
  Zap,
  Brain
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ModernChatPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload
  } = useChat({
    api: '/api/railway-chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your AI assistant powered by advanced RAG technology. I can help you with:

✨ **Project Management** - Meeting insights, task tracking, risk analysis
🔍 **Research & Analysis** - Deep document analysis and knowledge retrieval  
💡 **Strategic Planning** - Recommendations and decision support
🚀 **Process Optimization** - Workflow improvements and best practices

What would you like to explore today?`,
      },
    ],
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedPrompts = [
    "What were the key decisions from our recent meetings?",
    "Analyze the current project health and risks",
    "Show me outstanding action items",
    "What are the latest project insights?",
  ];

  const handleSuggestedPrompt = (prompt: string) => {
    handleInputChange({ target: { value: prompt } } as any);
    inputRef.current?.focus();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input?.trim() || isLoading) return;
    handleSubmit(e);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 p-4 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Assistant
          </h1>
        </div>

        <div className="space-y-2 flex-1">
          <div className="text-sm font-medium text-slate-600 mb-2">Capabilities</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-2 rounded-lg text-sm text-slate-600">
              <MessageSquare className="w-4 h-4" />
              Meeting Analysis
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg text-sm text-slate-600">
              <Brain className="w-4 h-4" />
              Knowledge Retrieval
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg text-sm text-slate-600">
              <Zap className="w-4 h-4" />
              Instant Insights
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <Badge variant="secondary" className="w-full justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Railway API Connected
          </Badge>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-slate-900">AI Chat Assistant</h2>
                <p className="text-xs text-slate-500">Railway RAG • Real-time responses</p>
              </div>
            </div>
            {isLoading && (
              <Badge variant="secondary" className="animate-pulse">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Processing...
              </Badge>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <Card className={`max-w-[80%] p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </Card>

                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="bg-slate-600 text-white">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-white border-slate-200 shadow-sm p-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing and generating response...</span>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Prompts (show only when no messages except welcome) */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 border-t border-slate-200 bg-slate-50/50">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs text-slate-600 mb-2">Suggested prompts:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="text-xs h-7 bg-white hover:bg-slate-50 border-slate-200"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-red-600">
                Error: {error.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reload()}
                className="mt-2 text-xs"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
          <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask anything about your projects, meetings, or data..."
                  disabled={isLoading}
                  className="pr-12 h-12 text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-0.5 text-xs text-slate-400 bg-slate-100 rounded border">
                    ⏎
                  </kbd>
                </div>
              </div>
              <Button
                type="submit"
                disabled={!input?.trim() || isLoading}
                className="h-12 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}