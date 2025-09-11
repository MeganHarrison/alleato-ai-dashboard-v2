"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, User, MessageSquare, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import type { ReactElement } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'checking';
  endpoint?: string;
  error?: string;
}

/**
 * RAG Chat Page component for interacting with the deployed RAG AI agent.
 *
 * Provides a chat interface that communicates with the RAG agent endpoint
 * which can be deployed on Railway, Render, or any custom platform.
 *
 * @component
 * @returns {ReactElement} The RAG chat interface
 */
export default function RAGChatPage(): ReactElement {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Project Management RAG assistant. I can help you with project insights, meeting analysis, and answer questions about your project management data. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input] = useState($2);
  const [loading] = useState($2);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({ status: 'checking' });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check RAG API health status
  const checkHealth = async (): Promise<void> => {
    setHealthStatus({ status: 'checking' });
    try {
      const response = await fetch('/api/pm-rag', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setHealthStatus({
          status: 'healthy',
          endpoint: data.endpoint || 'Connected',
        });
      } else {
        const data = await response.json();
        setHealthStatus({
          status: 'unhealthy',
          endpoint: data.endpoint,
          error: data.error || 'Service unavailable',
        });
      }
    } catch (error) {
      setHealthStatus({
        status: 'unhealthy',
        error: 'Failed to check service status',
      });
    }
  };

  // Check health on mount and periodically
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!input?.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Use pm-rag endpoint for Railway integration
      const response = await fetch("/api/pm-rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: input,
          stream: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.message || "I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error while processing your request: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="mx-auto p-6 space-y-6">
      <PageHeader
        title="RAG AI Assistant"
        description="Chat with the deployed RAG AI agent for project management insights and analysis"
      />

      <Card className="h-[700px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Project Management RAG Chat
            </div>
            <div className="flex items-center gap-2">
              {healthStatus.status === 'checking' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking connection...</span>
                </div>
              )}
              {healthStatus.status === 'healthy' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {healthStatus.endpoint?.includes('railway') ? 'Railway' : 
                     healthStatus.endpoint?.includes('render') ? 'Render' : 
                     'Connected'}
                  </span>
                </div>
              )}
              {healthStatus.status === 'unhealthy' && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Offline</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkHealth}
                    className="h-7 px-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Chat messages */}
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    } rounded-lg p-4`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        Processing your request...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="p-6 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about project management, meetings, insights..."
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
    </div>
  );
}