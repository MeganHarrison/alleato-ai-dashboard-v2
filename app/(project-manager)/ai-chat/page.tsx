"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Source {
  title?: string;
  document_name?: string;
  relevance_score?: number;
  content?: string;
  url?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function ChatGPTStyleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message.replace(/\\n/g, "\n"),
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Welcome screen when no messages
  if (messages.length === 0) {
    return (
      <div className="flex h-screen flex-col bg-white">
        {/* Header */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-lg font-semibold text-gray-900">ChatGPT</h1>
          </div>
        </div>

        {/* Welcome Content */}
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="mx-auto max-w-2xl text-center">
            {/* ChatGPT Logo */}
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-green-500 p-4">
                <Bot className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Welcome Text */}
            <h2 className="mb-8 text-3xl font-semibold text-gray-900">
              How can I help you today?
            </h2>

            {/* Suggestion Cards */}
            <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                "Show me recent meeting insights",
                "What decisions need to be made?", 
                "Give me the weekly summary",
                "What's happening with our projects?",
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="rounded-xl border border-gray-200 p-4 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 px-4 py-6">
          <div className="mx-auto max-w-3xl">
            <form onSubmit={sendMessage} className="relative">
              <div className="flex items-center rounded-3xl border border-gray-300 bg-white px-4 py-3 shadow-sm">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message ChatGPT"
                  className="flex-1 border-0 bg-transparent px-0 text-base placeholder-gray-500 focus:ring-0 focus-visible:ring-0"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="ml-2 rounded-full bg-gray-200 p-2 text-gray-400 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-300"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <p className="mt-2 text-center text-xs text-gray-500">
              ChatGPT can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Chat interface with messages
  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold text-gray-900">ChatGPT</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="group">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full">
                      {message.role === "user" ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                          <User className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 overflow-hidden">
                      <div className="prose prose-sm max-w-none">
                        <div className="text-gray-900">
                          {message.content.split("\n").map((line, index) => {
                            if (line.trim() === "") {
                              return <br key={index} />;
                            }
                            
                            // Handle headers
                            if (line.match(/^#{1,3}\s+/)) {
                              const level = line.match(/^(#{1,3})/)?.[1].length || 1;
                              const text = line.replace(/^#{1,3}\s+/, "");
                              const HeadingTag = `h${Math.min(level + 1, 6)}` as keyof React.JSX.IntrinsicElements;
                              return (
                                <HeadingTag key={index} className="font-semibold text-gray-900 mt-4 mb-2">
                                  {text}
                                </HeadingTag>
                              );
                            }
                            
                            // Handle bold text
                            if (line.includes("**")) {
                              const parts = line.split(/(\*\*[^*]+\*\*)/);
                              return (
                                <p key={index} className="mb-2">
                                  {parts.map((part, partIndex) =>
                                    part.startsWith("**") && part.endsWith("**") ? (
                                      <strong key={partIndex} className="font-semibold">
                                        {part.replace(/\*\*/g, "")}
                                      </strong>
                                    ) : (
                                      <span key={partIndex}>{part}</span>
                                    )
                                  )}
                                </p>
                              );
                            }
                            
                            // Handle numbered lists
                            if (line.match(/^\d+\.\s/)) {
                              const content = line.replace(/^\d+\.\s/, "");
                              return (
                                <div key={index} className="mb-1 flex gap-2">
                                  <span className="text-gray-500">•</span>
                                  <span>{content}</span>
                                </div>
                              );
                            }
                            
                            // Handle bullet points
                            if (line.match(/^-\s/)) {
                              const content = line.replace(/^-\s/, "");
                              return (
                                <div key={index} className="mb-1 ml-4 flex gap-2">
                                  <span className="text-gray-500">•</span>
                                  <span>{content}</span>
                                </div>
                              );
                            }
                            
                            // Regular paragraphs
                            return (
                              <p key={index} className="mb-2">
                                {line}
                              </p>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <h4 className="mb-2 text-sm font-medium text-gray-900">Sources</h4>
                          <div className="space-y-1">
                            {message.sources.map((source, index) => (
                              <div key={index} className="text-sm text-gray-600">
                                {source.title || source.document_name || `Source ${index + 1}`}
                                {source.relevance_score && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({Math.round(source.relevance_score * 100)}% relevant)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="group">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
                        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: "0.1s" }}></div>
                        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={sendMessage} className="relative">
            <div className="flex items-center rounded-3xl border border-gray-300 bg-white px-4 py-3 shadow-sm">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message ChatGPT"
                className="flex-1 border-0 bg-transparent px-0 text-base placeholder-gray-500 focus:ring-0 focus-visible:ring-0"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="sm"
                className="ml-2 rounded-full bg-gray-200 p-2 text-gray-400 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-300"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </form>
          <p className="mt-2 text-center text-xs text-gray-500">
            ChatGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}