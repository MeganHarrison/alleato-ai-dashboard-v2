"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import type { Message } from "ai";
import { Send, MessageSquare, FileText, Table2 } from "lucide-react";

// Import the form component logic
import ASRSRequirementsForm from "../../(active)/fm-global-form/page";
// Import the tables component logic
import FMGlobalTablesPage from "../../(active)/fm-global-tables/page";

type ViewMode = 'chat' | 'form' | 'tables';

export default function UnifiedFMGlobalPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('chat');

  // Chat state
  const { messages, input, handleInputChange, handleSubmit, isLoading: chatLoading } = useChat({
    api: "/api/fm-global-chat",
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">
            FM Global Documentation
          </h1>
          <p className="text-gray-500 mt-2 font-light">
            ASRS Sprinkler Requirements & Protection Guidelines
          </p>
        </div>
      </header>

      {/* Simple Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setViewMode('chat')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              AI Assistant
            </button>
            <button
              onClick={() => setViewMode('form')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'form'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Requirements Form
            </button>
            <button
              onClick={() => setViewMode('tables')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'tables'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Table2 className="h-4 w-4 inline mr-2" />
              Tables & Figures
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {viewMode === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 p-8 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="h-12 w-12 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-xl font-light text-gray-900 mb-3">
                      Ask about FM Global 8-34
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                      Get instant answers about ASRS sprinkler requirements, protection schemes, and compliance guidelines.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message: Message) => (
                      <div key={message.id} className="flex items-start space-x-4">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            message.role === "user"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
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
                                  <h2 className="text-lg font-medium text-gray-900 mb-3 mt-6 first:mt-0">
                                    {children}
                                  </h2>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700">
                                    {children}
                                  </ul>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-medium text-gray-900">
                                    {children}
                                  </strong>
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                      AI
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
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
                    placeholder="Ask about ASRS requirements..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !input?.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'form' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
              <ASRSRequirementsForm />
            </div>
          </div>
        )}

        {viewMode === 'tables' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
              <FMGlobalTablesPage />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}