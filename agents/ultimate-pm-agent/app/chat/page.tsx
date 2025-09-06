'use client'

import { useChat } from 'ai/react'
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, User, Bot, FileText } from 'lucide-react'

export default function ChatPage() {
  const [projectId, setProjectId] = useState('')
  const [sources, setSources] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    body: {
      projectId: projectId || undefined,
      options: {
        searchType: 'hybrid',
        maxResults: 10,
        rerank: true,
      }
    },
    onResponse: (response) => {
      // Extract sources from response headers
      const sourcesHeader = response.headers.get('X-Sources')
      if (sourcesHeader) {
        setSources(JSON.parse(sourcesHeader))
      }
    },
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Leadership Chat</h1>
          <p className="text-muted-foreground">
            Ask questions about projects, meetings, and documents
          </p>
          
          {/* Project Filter */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Project ID (optional - leave empty to search all)"
              className="px-3 py-2 border rounded-md w-full max-w-md"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">Welcome to PM Agent Chat</h2>
              <p className="text-muted-foreground">
                Ask me anything about your projects, meetings, or documents.
              </p>
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <p>Try asking:</p>
                <ul className="space-y-1">
                  <li>"What were the key decisions from last week's meetings?"</li>
                  <li>"Summarize the project status for Q4"</li>
                  <li>"What are the pending action items?"</li>
                  <li>"Show me insights about the product roadmap"</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="rounded-lg px-4 py-2 bg-secondary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg">
              Error: {error.message || 'Something went wrong'}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sources Panel */}
      {sources.length > 0 && (
        <div className="border-t px-6 py-2 bg-secondary/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Sources:</span>
              <div className="flex gap-2 flex-wrap">
                {sources.map((source, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-secondary rounded text-xs"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}