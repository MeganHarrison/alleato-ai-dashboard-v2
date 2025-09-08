'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Sparkles, FileText, Users, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MeetingIntelligenceChat() {
  const [selectedContext, setSelectedContext] = useState<'all' | 'recent' | 'project'>('all')
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setInput } = useChat({
    api: '/api/meeting-intelligence/chat',
    body: {
      context: selectedContext
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 I'm your Meeting Intelligence Assistant! I can help you:

• **Search meetings** - Find discussions about specific topics
• **Track action items** - See what needs to be done and by whom  
• **Identify risks** - Spot potential project blockers early
• **Generate summaries** - Get quick overviews of meeting outcomes
• **Analyze trends** - Understand patterns across meetings
• **Answer questions** - Query your entire meeting history

Try asking me:
- "What were the main decisions from last week's meetings?"
- "Show me all action items assigned to me"
- "What risks were identified in project X?"
- "Summarize the product roadmap discussions"

How can I help you today?`
      }
    ]
  })

  const suggestedQuestions = [
    "What action items are pending from this week?",
    "Show me the key decisions from recent meetings",
    "What risks have been identified across all projects?",
    "Who has been assigned the most action items?",
    "Summarize meetings about product development"
  ]

  return (
    <div className="flex flex-col h-[600px]">
      {/* Context Selector */}
      <div className="flex gap-2 mb-4">
        <Badge 
          variant={selectedContext === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedContext('all')}
        >
          All Meetings
        </Badge>
        <Badge 
          variant={selectedContext === 'recent' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedContext('recent')}
        >
          Last 30 Days
        </Badge>
        <Badge 
          variant={selectedContext === 'project' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedContext('project')}
        >
          By Project
        </Badge>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'rounded-lg px-4 py-3 max-w-[80%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">AI Assistant</span>
                  </div>
                )}
                
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>

                {/* Render insights if present in metadata */}
                {message.role === 'assistant' && message.metadata?.insights && (
                  <div className="mt-4 space-y-2">
                    {message.metadata.insights.map((insight: any, idx: number) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start gap-2">
                          {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />}
                          {insight.type === 'action_item' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                          {insight.type === 'decision' && <FileText className="h-4 w-4 text-blue-500 mt-0.5" />}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {insight.type.replace('_', ' ')}
                              </Badge>
                              {insight.priority && (
                                <Badge 
                                  variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {insight.priority}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{insight.content}</p>
                            {insight.assigned_to && (
                              <div className="flex items-center gap-1 mt-1">
                                <Users className="h-3 w-3" />
                                <span className="text-xs text-muted-foreground">
                                  {insight.assigned_to}
                                </span>
                              </div>
                            )}
                            {insight.meeting_title && (
                              <div className="flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                <span className="text-xs text-muted-foreground">
                                  {insight.meeting_title}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3">
              Error: {error.message}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="py-4">
          <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (setInput) {
                    setInput(question)
                  } else if (typeof handleInputChange === 'function') {
                    // Fallback to creating a synthetic event
                    const syntheticEvent = {
                      target: { value: question },
                      currentTarget: { value: question }
                    } as React.ChangeEvent<HTMLInputElement>
                    handleInputChange(syntheticEvent)
                  }
                }}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your meetings..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input?.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}