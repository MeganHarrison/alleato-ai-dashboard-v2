'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useChat } from '@ai-sdk/react';
import { cn } from '@/lib/utils';

export default function FMGlobalChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/fm-global-chat",
  });
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputFocused, setInputFocused] = useState(false);

  // Example queries for quick access
  const exampleQueries = [
    { icon: '📊', text: 'Key ASRS specifications' },
    { icon: '🌡️', text: 'Temperature requirements' },
    { icon: '🏗️', text: 'Seismic design standards' },
    { icon: '🔥', text: 'Fire protection requirements' },
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
    inputRef.current?.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20 rounded-xl border border-border/50 shadow-xl">
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-8">
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DB802D] to-[#DB802D]/60 flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">FM Global Compliance Assistant</h3>
              <p className="text-muted-foreground text-sm max-w-sm text-center mb-8">
                Get instant answers about ASRS specifications and compliance requirements
              </p>
              
              {/* Example queries */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {exampleQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(query.text)}
                    className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-4 text-left transition-all hover:border-[#DB802D]/50 hover:shadow-md hover:shadow-[#DB802D]/10"
                  >
                    <div className="relative z-10">
                      <span className="text-2xl mb-2 block">{query.icon}</span>
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                        {query.text}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#DB802D]/0 to-[#DB802D]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "group relative",
                    message.role === 'user' ? 'flex justify-end' : 'flex justify-start',
                    index === 0 && 'mt-4'
                  )}
                >
                  <div
                    className={cn(
                      "relative max-w-[80%] rounded-2xl px-5 py-3 shadow-sm",
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[#DB802D] to-[#DB802D]/90 text-white'
                        : 'bg-card border border-border/50'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <div className="my-3 overflow-hidden rounded-lg">
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                      margin: 0,
                                      borderRadius: '0.5rem',
                                      fontSize: '0.875rem',
                                    }}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-3 ml-4 list-disc last:mb-0">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal last:mb-0">{children}</ol>,
                            h3: ({ children }) => <h3 className="font-semibold mb-2 mt-4 first:mt-0">{children}</h3>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed">{message.content}</div>
                    )}
                    
                    {/* Timestamp on hover */}
                    <div className={cn(
                      "absolute -bottom-5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                      message.role === 'user' ? 'right-0' : 'left-0'
                    )}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/50 rounded-2xl px-5 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#DB802D]/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-[#DB802D]/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-[#DB802D]/60 rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-sm text-muted-foreground">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Modern input section */}
      <div className="relative border-t border-border/50 bg-background/50 backdrop-blur-sm p-4">
        <form onSubmit={handleFormSubmit} className="relative">
          <div className={cn(
            "flex items-center gap-3 rounded-2xl border transition-all duration-200",
            inputFocused 
              ? "border-[#DB802D]/50 bg-background shadow-lg shadow-[#DB802D]/5" 
              : "border-border/50 bg-muted/30"
          )}>
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask about specifications, compliance, or requirements..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-5 py-3 text-sm outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50"
            />
            
            <Button 
              type="submit" 
              disabled={isLoading || !input?.trim()}
              className={cn(
                "mr-2 h-9 w-9 rounded-xl p-0 transition-all",
                input?.trim() 
                  ? "bg-gradient-to-r from-[#DB802D] to-[#DB802D]/80 text-white hover:shadow-md hover:shadow-[#DB802D]/20" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className={cn("h-4 w-4 transition-transform", input?.trim() && "translate-x-0.5")} />
              )}
            </Button>
          </div>
          
          {/* Character count and status */}
          <div className="absolute -top-6 right-0 flex items-center gap-2 text-xs text-muted-foreground">
            {input.length > 0 && (
              <span className={cn(
                "transition-colors",
                input.length > 500 ? "text-destructive" : ""
              )}>
                {input.length}/500
              </span>
            )}
            {isLoading && (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Processing
              </span>
            )}
          </div>
        </form>
        
        {/* Keyboard shortcut hint */}
        <div className="mt-2 flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">
            Powered by FM Global Knowledge Base
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            <span>Enter</span>
          </kbd>
        </div>
      </div>
    </div>
  );
}