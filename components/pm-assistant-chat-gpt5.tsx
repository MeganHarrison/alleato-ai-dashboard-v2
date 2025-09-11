'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  Sparkles,
  Mic,
  Paperclip,
  Download,
  Copy,
  RefreshCw,
  Maximize2,
  Minimize2,
  Settings,
  Search,
  FileText,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Building,
  ChevronDown,
  Loader2,
  Check,
  X,
  Bot,
  User,
  MessageSquare,
  Zap,
  Brain,
  Target,
  Shield,
  Activity,
  BarChart3,
  ClipboardList,
  BookOpen,
  Lightbulb,
  ArrowUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tools?: ToolCall[];
  context?: MessageContext;
  feedback?: 'positive' | 'negative';
}

interface ToolCall {
  name: string;
  status: 'calling' | 'completed' | 'failed';
  result?: unknown;
}

interface MessageContext {
  documents_searched?: number;
  project?: string;
  meetings_referenced?: number;
  confidence?: number;
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  prompt: string;
  category: 'analysis' | 'report' | 'search' | 'action';
}

const quickActions: QuickAction[] = [
  {
    label: 'Weekly Summary',
    icon: BarChart3,
    prompt: 'Generate a weekly summary of all project activities and key decisions',
    category: 'report',
  },
  {
    label: 'Find Risks',
    icon: AlertTriangle,
    prompt: 'Identify all current risks across active projects and suggest mitigations',
    category: 'analysis',
  },
  {
    label: 'Action Items',
    icon: ClipboardList,
    prompt: 'List all pending action items grouped by project with assignees and due dates',
    category: 'action',
  },
  {
    label: 'Meeting Insights',
    icon: Lightbulb,
    prompt: 'Extract key insights from recent meetings and link them to relevant projects',
    category: 'analysis',
  },
  {
    label: 'Project Health',
    icon: Activity,
    prompt: 'Analyze the health of all active projects and highlight areas needing attention',
    category: 'analysis',
  },
  {
    label: 'Search Documents',
    icon: Search,
    prompt: 'Search for specific information in our document repository',
    category: 'search',
  },
];

export default function PMAssistantChatGPT5({
  projectId,
  className,
}: {
  projectId?: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input] = useState(false);
  const [isLoading] = useState(false);
  const [isListening] = useState(false);
  const [isExpanded] = useState(false);
  const [showQuickActions] = useState(false);
  const [selectedTab] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input?.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      const response = await fetch('/api/pm-rag-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          projectId,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        tools: [],
        context: {},
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

          for (const line of lines) {
            const data = line.replace('data: ', '');
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.text) {
                assistantMessage.content += parsed.text;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: assistantMessage.content }
                      : msg
                  )
                );
              }

              if (parsed.tool) {
                const toolCall: ToolCall = {
                  name: parsed.tool,
                  status: parsed.status || 'calling',
                };
                assistantMessage.tools = [...(assistantMessage.tools || []), toolCall];
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, tools: assistantMessage.tools }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.prompt);
    setShowQuickActions(false);
    textareaRef.current?.focus();
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Implement voice input logic here
  };

  const handleCopyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessageId(message.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );
    // Send feedback to backend
  };

  const handleExport = () => {
    const content = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pm-chat-${Date.now()}.txt`;
    a.click();
  };

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'flex flex-col transition-all duration-300',
          isExpanded ? 'fixed inset-4 z-50' : 'h-[600px]',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="font-semibold">PM Assistant</h3>
              <p className="text-xs text-muted-foreground">Powered by GPT-4o-mini</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Activity className="w-3 h-3" />
              Online
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Chat
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-3">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-2">
              <Zap className="w-4 h-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(messages?.length || 0) === 0 && showQuickActions && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">
                      Hello! I'm your PM Assistant
                    </h4>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      I can help you analyze meetings, track action items, identify risks,
                      and generate insights across all your projects.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Quick Actions
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleQuickAction(action)}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent text-left transition-colors"
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            action.category === 'analysis' && 'bg-blue-100 text-blue-600 dark:bg-blue-950',
                            action.category === 'report' && 'bg-purple-100 text-purple-600 dark:bg-purple-950',
                            action.category === 'search' && 'bg-green-100 text-green-600 dark:bg-green-950',
                            action.category === 'action' && 'bg-orange-100 text-orange-600 dark:bg-orange-950'
                          )}>
                            <action.icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">{action.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' && 'justify-end'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        'max-w-[80%] space-y-2',
                        message.role === 'user' && 'items-end'
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-lg px-4 py-3',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {message.tools && message.tools.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {message.tools.map((tool, idx) => (
                              <Badge
                                key={idx}
                                variant={
                                  tool.status === 'completed'
                                    ? 'default'
                                    : tool.status === 'failed'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {tool.status === 'calling' && (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                )}
                                {tool.status === 'completed' && (
                                  <Check className="w-3 h-3 mr-1" />
                                )}
                                {tool.status === 'failed' && (
                                  <X className="w-3 h-3 mr-1" />
                                )}
                                {tool.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2">
                          {message.context && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {message.context.documents_searched && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {message.context.documents_searched} docs
                                </span>
                              )}
                              {message.context.meetings_referenced && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {message.context.meetings_referenced} meetings
                                </span>
                              )}
                              {message.context.confidence && (
                                <span className="flex items-center gap-1">
                                  <Shield className="w-3 h-3" />
                                  {Math.round(message.context.confidence * 100)}%
                                </span>
                              )}
                            </div>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyMessage(message)}
                              >
                                {copiedMessageId === message.id ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy</TooltipContent>
                          </Tooltip>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-6 w-6',
                              message.feedback === 'positive' && 'text-green-600'
                            )}
                            onClick={() => handleFeedback(message.id, 'positive')}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-6 w-6',
                              message.feedback === 'negative' && 'text-red-600'
                            )}
                            onClick={() => handleFeedback(message.id, 'negative')}
                          >
                            <ArrowUp className="w-3 h-3 rotate-180" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask me anything about your projects..."
                    className="resize-none pr-12"
                    rows={3}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleVoiceInput}
                        >
                          <Mic className={cn(
                            'w-4 h-4',
                            isListening && 'text-red-500'
                          )} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Voice Input</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach File</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                <Button
                  onClick={handleSend}
                  disabled={!input?.trim() || isLoading}
                  className="h-auto"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>{input?.length || 0}/4000</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="flex-1 p-4">
            <div className="space-y-4">
              <h4 className="font-semibold">Recent Insights</h4>
              <p className="text-sm text-muted-foreground">
                AI-generated insights from your projects and meetings
              </p>
              {/* Add insights content here */}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="flex-1 p-4">
            <div className="space-y-4">
              <h4 className="font-semibold">Pending Actions</h4>
              <p className="text-sm text-muted-foreground">
                Action items tracked from meetings and conversations
              </p>
              {/* Add actions content here */}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </TooltipProvider>
  );
}