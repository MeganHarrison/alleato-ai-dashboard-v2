"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Mic, Paperclip, Send } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Dynamically import ReactMarkdown to avoid SSR issues
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

interface ConnectionStatus {
  status: "checking" | "railway" | "fallback" | "error";
  message?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function FMGlobalChat() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "checking",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Check FM Global Railway status and PM RAG fallback
  const checkConnectionStatus = async () => {
    try {
      // First check FM Global Railway endpoint
      const fmResponse = await fetch("/api/fm-global", { method: "GET" });
      if (fmResponse.ok) {
        const fmData = await fmResponse.json();
        if (fmData.status === "healthy") {
          setConnectionStatus({
            status: "railway",
            message: "Connected to Railway RAG",
          });
          return;
        }
      }

      // Check PM RAG fallback
      const pmResponse = await fetch("/api/pm-rag-fallback", { method: "GET" });
      if (pmResponse.ok) {
        const pmData = await pmResponse.json();
        if (pmData.status === "healthy") {
          setConnectionStatus({
            status: "fallback",
            message: "Using PM RAG (database search)",
          });
        } else {
          setConnectionStatus({
            status: "fallback",
            message: "Using OpenAI fallback",
          });
        }
      } else {
        setConnectionStatus({
          status: "fallback",
          message: "Using OpenAI fallback",
        });
      }
    } catch {
      setConnectionStatus({
        status: "error",
        message: "Connection check failed - using basic AI",
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    checkConnectionStatus();
    // Check status periodically
    const interval = setInterval(checkConnectionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };

    setInput("");
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Try the FM Global API first, then fallback to PM RAG
      let response;
      let data;

      try {
        response = await fetch("/api/fm-global", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: userMessage }],
          }),
        });

        if (response.ok) {
          data = await response.json();

          // Extract the response text from the JSON
          const assistantMessage =
            data.response ||
            data.message ||
            "Sorry, I received an empty response.";

          const newAssistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: assistantMessage,
          };

          setMessages((prev) => [...prev, newAssistantMessage]);
          return;
        }
      } catch {
        console.log("FM Global API failed, trying PM RAG fallback...");
      }

      // Fallback to PM RAG endpoint
      response = await fetch("/api/pm-rag-fallback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Both FM Global and PM RAG endpoints failed");
      }

      data = await response.json();

      // Extract the response from PM RAG format
      const assistantMessage =
        data.message || "Sorry, I received an empty response.";

      const newAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantMessage,
      };

      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (query: string) => {
    setInput(query);
    // Submit the form after a brief delay to ensure state is updated
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }, 50);
  };

  const suggestions = [
    "What are the sprinkler requirements for shuttle ASRS with open-top containers?",
    "How do I calculate water demand for Class 3 commodities?",
    "What K-factor sprinklers are needed for 38ft storage height?",
  ];

  // Don't render until client-side
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading FM Global Expert...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(90vh-4rem)] p-4 pt-0 mx-[5%] sm:ml-6 sm:mr-6">
      {/* Connection Status Alert */}
      {connectionStatus.status !== "checking" && (
        <Alert
          className={`mb-4 ${
            connectionStatus.status === "railway"
              ? "border-green-500 bg-green-50"
              : ""
          }
              ${
                connectionStatus.status === "fallback"
                  ? "border-orange-500 bg-orange-50"
                  : ""
              }
              ${
                connectionStatus.status === "error"
                  ? "border-red-500 bg-red-50"
                  : ""
              }
            `}
        >
          <div className="flex items-center gap-2">
            {connectionStatus.status === "railway" && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {connectionStatus.status === "fallback" && (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
            {connectionStatus.status === "error" && (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={`
                  ${
                    connectionStatus.status === "railway"
                      ? "text-green-700"
                      : ""
                  }
                  ${
                    connectionStatus.status === "fallback"
                      ? "text-orange-700"
                      : ""
                  }
                  ${connectionStatus.status === "error" ? "text-red-700" : ""}
                `}
            >
              <strong>FM Global Expert Status:</strong>{" "}
              {connectionStatus.message}
              {connectionStatus.status === "fallback" && (
                <span className="block text-sm mt-1">
                  {connectionStatus.message?.includes("PM RAG")
                    ? "Using local database search with AI analysis for project management queries."
                    : "Railway endpoint is not responding. Using OpenAI GPT-4 Turbo for FM Global expertise."}
                </span>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex flex-col flex-1 bg-white overflow-hidden rounded-lg border">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full px-8 py-12">
              <h1 className="text-7xl font-bold text-black mb-4 tracking-tight">
                HELLO
              </h1>
              <p className="text-2xl text-orange-500 mb-12">
                How can I help you today?
              </p>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <p className="text-gray-700 text-sm">{suggestion}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-8 py-8">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${
                      message.role === "user"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        message.role === "user"
                          ? "bg-gray-100 rounded-2xl px-5 py-3"
                          : ""
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              AI
                            </span>
                          </div>
                          <div className="flex-1 prose prose-sm max-w-none text-gray-800">
                            <ReactMarkdown
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-lg font-bold mt-3 mb-2 text-gray-900">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-base font-bold mt-2 mb-1 text-gray-900">
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-2 text-gray-800">
                                    {children}
                                  </p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-5 mb-2 text-gray-800">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-5 mb-2 text-gray-800">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="mb-1 text-gray-800">
                                    {children}
                                  </li>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-gray-900">
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic">{children}</em>
                                ),
                                code: ({ children }) => (
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">
                                    {children}
                                  </code>
                                ),
                                pre: ({ children }) => (
                                  <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2 text-sm">
                                    {children}
                                  </pre>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {message.role === "user" && (
                        <p className="text-gray-800">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          AI
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-center">
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
                      <p className="text-sm">Error: {error}</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="rounded-lg m-8 border border-gray-200 bg-white flex-shrink-0">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex items-center gap-1 px-8 py-4"
          >
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Add image"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message"
              className="flex-1 px-4 py-2 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-left"
              disabled={isLoading}
            />

            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Voice input"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              type="submit"
              disabled={isLoading || !input || input.trim() === ""}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
