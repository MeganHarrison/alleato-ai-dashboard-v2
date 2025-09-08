"use client"

import { useChat } from '@ai-sdk/react'
import { Send, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRef, useEffect } from "react"

export default function ChatPage() {
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Use the Vercel AI SDK useChat hook - connects to /api/chat
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop,
    setMessages,
  } = useChat({
    api: "/api/chat",
    onError: (error: Error) => {
      console.error("Chat error:", error)
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Clear conversation
  const clearChat = () => {
    setMessages([])
    toast({
      title: "Chat Cleared",
      description: "Conversation has been cleared",
    })
  }

  // Custom submit handler to prevent empty submissions
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input?.trim() || isLoading) return
    handleSubmit(e)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] mx-auto max-w-5xl p-4 animate-in fade-in">
      {/* Enhanced Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-border/30 brand-accent">
        <div className="flex-1 pl-5">
          <h1 className="text-3xl font-bold tracking-tight text-brand mb-2">
            Business Expert Chat
          </h1>
          <p className="text-muted-foreground text-lg">
            Powered by GPT-4o with advanced tool calling capabilities
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          disabled={messages.length === 0}
          className="hover-lift"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      {/* Enhanced Messages Container */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-6 rounded-xl border border-border/50 bg-background p-6 glass-morphism">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 animate-in fade-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Welcome to Business Expert Chat</h3>
            <p className="text-base max-w-md mx-auto leading-relaxed">Ask me anything about business strategy, market analysis, financial planning, or operations management.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } animate-in slide-in-from-bottom`}
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-4 ${
                  message.role === "user"
                    ? "bg-brand text-white shadow-brand hover-glow"
                    : "bg-card border border-border/50 hover-lift"
                }`}
              >
                <div className={`text-xs font-medium mb-2 flex items-center gap-2 ${
                  message.role === "user" ? "text-white/80" : "text-brand"
                }`}>
                  {message.role === "user" ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-xs font-bold">U</span>
                      </div>
                      You
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-brand">AI</span>
                      </div>
                      Business Expert
                    </>
                  )}
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                {/* Enhanced tool invocations display */}
                {message.toolInvocations && message.toolInvocations.length > 0 && (
                  <div className={`mt-3 pt-3 border-t text-xs ${
                    message.role === "user" ? "border-white/20" : "border-border"
                  }`}>
                    {message.toolInvocations.map((tool, toolIndex) => (
                      <div key={toolIndex} className={`flex items-center gap-2 ${
                        message.role === "user" ? "text-white/70" : "text-brand/80"
                      }`}>
                        <div className="w-1 h-1 rounded-full bg-current"></div>
                        Using tool: <span className="font-medium">{tool.toolName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Form */}
      <div className="border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm p-4">
        <form onSubmit={onSubmit} className="flex gap-4">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything about business strategy, analysis, or planning..."
              className="min-h-[60px] resize-none border-brand/20 focus:border-brand/50 focus:ring-brand/20 bg-background/80 rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onSubmit(e as any)
                }
              }}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              disabled={isLoading || !input?.trim()}
              size="lg"
              className="h-[60px] px-6 hover-lift"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send
                </>
              )}
            </Button>
            {isLoading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={stop}
                className="text-xs"
              >
                Stop
              </Button>
            )}
          </div>
        </form>
        {/* Input helper text */}
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className={`transition-colors ${
            input?.length > 0 ? "text-brand" : ""
          }`}>
            {input?.length || 0} characters
          </span>
        </div>
      </div>
    </div>
  )
}