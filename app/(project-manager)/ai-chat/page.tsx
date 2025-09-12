"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, FileText, Loader2, Send, Sparkles, User } from "lucide-react";
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

export default function OpenAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "test" }],
          }),
        });
        setApiStatus(response.ok ? "connected" : "disconnected");
      } catch (error) {
        setApiStatus("disconnected");
      }
    };
    checkApiStatus();
  }, []);

  // Check if conversation has started (has user messages)
  const hasConversation = messages.some((msg) => msg.role === "user");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

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

  if (!hasConversation) {
    // Centered input design when no conversation
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex-none p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-violet-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Alleato AI Agent
              </h1>
            </div>
            <p className="text-center text-slate-600 text-lg">
              Your strategic ally - Connecting every project, initiative, and
              insight
            </p>

            {/* API Status Indicator */}
            <div className="flex justify-center mt-4">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  apiStatus === "connected"
                    ? "bg-emerald-100 text-emerald-700"
                    : apiStatus === "disconnected"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    apiStatus === "connected"
                      ? "bg-emerald-500"
                      : apiStatus === "disconnected"
                      ? "bg-red-500"
                      : "bg-yellow-500 animate-pulse"
                  }`}
                />
                {apiStatus === "checking" && "Checking API..."}
                {apiStatus === "connected" && "Railway API Connected"}
                {apiStatus === "disconnected" && "API Disconnected"}
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "Show me recent meeting insights",
            },
            {
              title: "What decisions need to be made?",
            },
            {
              title: "Give me the weekly summary",
            },
            {
              title: "What's happening with our projects?",
            },
          ].map((suggestion, index) => (
            <Card
              key={index}
              className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200/60 hover:border-violet-300 group"
              onClick={() => setInput(suggestion.desc)}
            >
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-violet-600 transition-colors">
                    {suggestion.title}
                  </h3>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Centered input area */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-2xl">
            <div className="relative">
              <form onSubmit={sendMessage} className="relative">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200/50 p-1.5">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Start a conversation..."
                        disabled={isLoading}
                        className="flex-1 border-0 bg-transparent text-lg placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                        autoFocus
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        size="sm"
                        className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 border-0 rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat interface when conversation exists
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Compact header */}
      <div className="flex-none border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-6 h-6 text-violet-600" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
              Alleato AI Agent
            </h1>
            <div
              className={`ml-4 flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
                apiStatus === "connected"
                  ? "bg-emerald-100 text-emerald-700"
                  : apiStatus === "disconnected"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  apiStatus === "connected"
                    ? "bg-emerald-500"
                    : apiStatus === "disconnected"
                    ? "bg-red-500"
                    : "bg-yellow-500 animate-pulse"
                }`}
              />
              {apiStatus === "checking" && "Checking..."}
              {apiStatus === "connected" && "Connected"}
              {apiStatus === "disconnected" && "Disconnected"}
            </div>
          </div>
        </div>
      </div>

      {/* Messages area with auto-scroll */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] ${
                      message.role === "user" ? "order-1" : ""
                    }`}
                  >
                    <Card
                      className={`p-4 shadow-sm border-0 ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white"
                          : "bg-white border border-slate-200/60"
                      }`}
                    >
                      <div className="prose prose-sm max-w-none">
                        {message.content.split("\n").map((line, index) => {
                          const trimmedLine = line.trim();

                          // Handle main headers (## or ### format)
                          if (trimmedLine.match(/^#{2,3}\s+/)) {
                            return (
                              <h3
                                key={index}
                                className={`text-lg font-bold mb-3 mt-4 ${
                                  message.role === "user"
                                    ? "text-white"
                                    : "text-slate-900"
                                }`}
                              >
                                {trimmedLine.replace(/^#{2,3}\s+/, "")}
                              </h3>
                            );
                          }

                          // Handle numbered lists with bold headers
                          if (trimmedLine.match(/^\d+\.\s?\*\*.*\*\*/)) {
                            const number = trimmedLine.match(/^(\d+)\./)?.[1];
                            const content = trimmedLine
                              .replace(/^\d+\.\s?\*\*/, "")
                              .replace(/\*\*$/, "");
                            return (
                              <div key={index} className="mb-4">
                                <div
                                  className={`flex items-start gap-3 font-semibold text-base ${
                                    message.role === "user"
                                      ? "text-white"
                                      : "text-violet-700"
                                  }`}
                                >
                                  <span
                                    className={`flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                                      message.role === "user"
                                        ? "bg-violet-200 text-violet-800"
                                        : "bg-violet-100 text-violet-700"
                                    }`}
                                  >
                                    {number}
                                  </span>
                                  {content}
                                </div>
                              </div>
                            );
                          }

                          // Handle simple numbered lists
                          if (trimmedLine.match(/^\d+\.\s/)) {
                            const number = trimmedLine.match(/^(\d+)\./)?.[1];
                            const content = trimmedLine.replace(/^\d+\.\s/, "");
                            return (
                              <div key={index} className="mb-2">
                                <div
                                  className={`flex items-start gap-3 ${
                                    message.role === "user"
                                      ? "text-white"
                                      : "text-slate-700"
                                  }`}
                                >
                                  <span
                                    className={`flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                                      message.role === "user"
                                        ? "bg-violet-200 text-violet-800"
                                        : "bg-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {number}
                                  </span>
                                  {content}
                                </div>
                              </div>
                            );
                          }

                          // Handle sub-bullets with bold text
                          if (trimmedLine.match(/^-\s?\*\*.*\*\*/)) {
                            const content = trimmedLine
                              .replace(/^-\s?\*\*/, "")
                              .replace(/\*\*$/, "");
                            return (
                              <div
                                key={index}
                                className="ml-6 mb-2 flex items-start gap-2"
                              >
                                <span
                                  className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                    message.role === "user"
                                      ? "bg-violet-200"
                                      : "bg-violet-400"
                                  }`}
                                />
                                <span
                                  className={`font-medium ${
                                    message.role === "user"
                                      ? "text-white"
                                      : "text-slate-800"
                                  }`}
                                >
                                  {content}
                                </span>
                              </div>
                            );
                          }

                          // Handle regular bullets
                          if (trimmedLine.match(/^-\s/)) {
                            const content = trimmedLine.replace(/^-\s/, "");
                            return (
                              <div
                                key={index}
                                className="ml-6 mb-1 flex items-start gap-2"
                              >
                                <span
                                  className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                    message.role === "user"
                                      ? "bg-violet-200"
                                      : "bg-slate-400"
                                  }`}
                                />
                                <span
                                  className={`${
                                    message.role === "user"
                                      ? "text-white"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {content}
                                </span>
                              </div>
                            );
                          }

                          // Handle markdown links
                          if (
                            trimmedLine.includes("[") &&
                            trimmedLine.includes("](")
                          ) {
                            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                            const parts = trimmedLine.split(linkRegex);
                            return (
                              <p
                                key={index}
                                className={`mb-2 leading-relaxed ${
                                  message.role === "user"
                                    ? "text-white"
                                    : "text-slate-700"
                                }`}
                              >
                                {parts.map((part, partIndex) => {
                                  if (partIndex % 3 === 1) {
                                    return (
                                      <a
                                        key={partIndex}
                                        href={parts[partIndex + 1]}
                                        className={`underline hover:no-underline font-medium ${
                                          message.role === "user"
                                            ? "text-violet-100 hover:text-white"
                                            : "text-violet-600 hover:text-violet-800"
                                        }`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {part}
                                      </a>
                                    );
                                  } else if (partIndex % 3 === 2) {
                                    return null;
                                  } else {
                                    return <span key={partIndex}>{part}</span>;
                                  }
                                })}
                              </p>
                            );
                          }

                          // Handle bold text within paragraphs
                          if (trimmedLine.includes("**")) {
                            const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/);
                            return (
                              <p
                                key={index}
                                className={`mb-2 leading-relaxed ${
                                  message.role === "user"
                                    ? "text-white"
                                    : "text-slate-700"
                                }`}
                              >
                                {parts.map((part, partIndex) =>
                                  part.startsWith("**") &&
                                  part.endsWith("**") ? (
                                    <strong
                                      key={partIndex}
                                      className={`font-semibold ${
                                        message.role === "user"
                                          ? "text-white"
                                          : "text-slate-900"
                                      }`}
                                    >
                                      {part.replace(/\*\*/g, "")}
                                    </strong>
                                  ) : (
                                    <span key={partIndex}>{part}</span>
                                  )
                                )}
                              </p>
                            );
                          }

                          // Handle empty lines (create spacing)
                          if (trimmedLine === "") {
                            return <div key={index} className="mb-4" />;
                          }

                          // Handle regular paragraphs
                          if (trimmedLine.length > 0) {
                            return (
                              <p
                                key={index}
                                className={`mb-3 leading-relaxed ${
                                  message.role === "user"
                                    ? "text-white"
                                    : "text-slate-700"
                                }`}
                              >
                                {trimmedLine}
                              </p>
                            );
                          }

                          return null;
                        })}
                      </div>
                    </Card>

                    {/* Sources display for assistant messages */}
                    {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-violet-600" />
                          <span className="text-sm font-medium text-slate-700">Sources</span>
                        </div>
                        <div className="space-y-2">
                          {message.sources.map((source, sourceIndex) => (
                            <div
                              key={sourceIndex}
                              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                            >
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center">
                                {sourceIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-slate-900 truncate">
                                  {source.title || source.document_name || 'Document'}
                                </h4>
                                {source.relevance_score && (
                                  <p className="text-xs text-slate-600 mt-1">
                                    {Math.round(source.relevance_score * 100)}% relevant
                                  </p>
                                )}
                                {source.content && (
                                  <p className="text-xs text-slate-600 mt-2 truncate">
                                    {source.content.substring(0, 150)}...
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg order-2">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <Card className="p-4 bg-white border border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                      <span className="text-sm text-slate-600">
                        AI is thinking...
                      </span>
                    </div>
                  </Card>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Bottom input */}
      <div className="flex-none border-t border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-6">
          <form onSubmit={sendMessage} className="relative">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white rounded-2xl shadow-lg border border-slate-200/50 p-1.5">
                <div className="flex items-center gap-3 px-4 py-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1 border-0 bg-transparent placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 border-0 rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
