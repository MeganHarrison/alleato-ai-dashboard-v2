"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import type { Message } from "ai";
import { Send, MessageSquare, Zap, Cpu, AlertCircle } from "lucide-react";

/**
 * FM Global Advanced RAG Page
 * 
 * PURPOSE: Uses the REAL RAG system (Python Pydantic AI agent)
 * 
 * FEATURES:
 * - Advanced semantic + hybrid search
 * - Sophisticated prompt engineering
 * - Tool calling and context management
 * - Session management
 * 
 * RAG SYSTEM: monorepo-agents/aisdk-rag-asrs/rag_agent_fm_global/
 * API BRIDGE: /api/fm-global-real-rag
 */

export default function FMGlobalAdvancedPage() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Chat state using the REAL RAG API
  const { messages, input, handleInputChange, handleSubmit, isLoading: chatLoading } = useChat({
    api: "/api/fm-global-real-rag",
    onResponse: () => {
      setIsConnected(true);
    },
    onError: (error) => {
      console.error('RAG connection error:', error);
      setIsConnected(false);
    }
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Cpu className="h-8 w-8 text-blue-600" />
                <Zap className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  FM Global Advanced RAG
                </h1>
                <p className="text-sm text-gray-600">
                  Powered by Pydantic AI Agent • Real Vector Search
                </p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="ml-auto flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected === null ? 'bg-gray-400' :
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-gray-600">
                {isConnected === null ? 'Connecting' :
                 isConnected ? 'Python Agent Connected' : 'Agent Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Info Banner */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Advanced RAG System</h3>
                <p className="text-sm text-blue-700 mt-1">
                  This page uses the sophisticated Python Pydantic AI agent with semantic search, 
                  hybrid search, and advanced context management. Make sure the Python agent is running 
                  on port 8001.
                </p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-2 inline-block">
                  cd monorepo-agents/aisdk-rag-asrs/rag_agent_fm_global/ && python api_server.py
                </code>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-lg min-h-[600px] flex flex-col">
            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative inline-block mb-6">
                    <MessageSquare className="h-16 w-16 text-gray-300" />
                    <Zap className="h-6 w-6 text-blue-500 absolute -top-1 -right-1" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    Advanced FM Global 8-34 RAG Assistant
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                    Ask complex questions about ASRS sprinkler requirements. This system uses 
                    advanced semantic search and sophisticated AI reasoning.
                  </p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm text-gray-900">Hybrid Search</div>
                      <div className="text-xs text-gray-600">Vector + keyword matching</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm text-gray-900">Tool Calling</div>
                      <div className="text-xs text-gray-600">Advanced AI capabilities</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message: Message) => (
                    <div key={message.id} className="flex items-start space-x-4">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                        }`}
                      >
                        {message.role === "user" ? "You" : "AI"}
                      </div>
                      <div className="flex-1 min-w-0">
                        {message.role === "user" ? (
                          <p className="text-gray-900 leading-relaxed">{message.content}</p>
                        ) : (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                                  {children}
                                </p>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-lg font-semibold text-gray-900 mb-3 mt-6 first:mt-0">
                                  {children}
                                </h2>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700">
                                  {children}
                                </ul>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-gray-900">
                                  {children}
                                </strong>
                              ),
                              code: ({ children }) => (
                                <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {chatLoading && (
                <div className="flex items-start space-x-4 mt-6">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-medium text-white">
                    AI
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-6">
              <form onSubmit={handleFormSubmit} className="flex space-x-4">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask complex questions about ASRS requirements..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !input?.trim() || isConnected === false}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </form>
              
              {isConnected === false && (
                <p className="text-red-600 text-sm mt-2">
                  ⚠️ Python RAG agent is not running. Start it with: <code>python api_server.py</code>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}