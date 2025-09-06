'use client';

import { ReactElement, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  response?: string;
  error?: string;
  details?: string;
}

export default function FMGlobalRailwayChatPage(): ReactElement {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your FM Global 8-34 ASRS Sprinkler Design expert powered by the Railway cloud service. I can help you with requirements, regulations, design specifications, and compliance questions. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');

  const testRailwayConnection = async (): Promise<void> => {
    try {
      const response = await fetch('/api/fm-global-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'test connection',
          sessionId: 'test-session',
        }),
      });

      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    }
  };

  // Test connection on mount
  useEffect(() => {
    testRailwayConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/fm-global-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          sessionId: `session-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK:', response.status, errorText);
        
        // Try to parse as JSON first, fallback to text
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText.substring(0, 200)}...` };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status} error`);
      }

      const data: ChatResponse = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.error || 'No response received from Railway service',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error while connecting to the Railway service: ${error instanceof Error ? error.message : 'Unknown error'}. 

This could be due to:
- Railway service cold start (can take 30+ seconds)
- Service temporarily down
- Network connectivity issues

Please try again in a moment, or use the Local RAG version instead.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Badge variant="outline" className="text-xs">Testing Connection...</Badge>;
      case 'connected':
        return <Badge variant="default" className="text-xs bg-green-600">Connected to Railway</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs">Railway Service Error</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">FM Global 8-34 ASRS Expert (Railway)</h1>
        <p className="text-muted-foreground mb-4">
          Testing the external Railway cloud service for FM Global 8-34 ASRS sprinkler requirements
        </p>
        
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {connectionStatus === 'connected' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              FM Global 8-34 ASRS Sprinkler Expert (Railway Cloud)
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {getStatusBadge()}
              <a 
                href="https://fm-global-asrs-expert-production-afb0.up.railway.app/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3" />
                Direct Service Link
              </a>
            </CardDescription>
          </CardHeader>
        </Card>

        {connectionStatus === 'error' && (
          <Card className="mb-4 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Railway Service Issues</h4>
                  <p className="text-sm text-red-700 mt-1">
                    The external Railway service appears to be unavailable. This could be due to:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 list-disc ml-5 space-y-1">
                    <li>Cold start delay (Railway services may spin down after inactivity)</li>
                    <li>Service deployment issues</li>
                    <li>502/503 gateway errors</li>
                    <li>Rate limiting or timeouts</li>
                  </ul>
                  <div className="mt-3 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testRailwayConnection}
                    >
                      Retry Connection
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/fm-global-chat', '_blank')}
                    >
                      Use Local RAG Instead
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="flex flex-col h-[600px]">
        <CardContent className="flex-1 p-4 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-shrink-0">
                      {message.role === 'assistant' ? (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'assistant' && (
                          <Bot className="h-3 w-3" />
                        )}
                        <span className={`text-xs ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">Connecting to Railway service...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about FM Global 8-34 ASRS requirements via Railway service..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}