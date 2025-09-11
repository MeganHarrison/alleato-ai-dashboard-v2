'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function OpenAIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col p-4">
      <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        AI Chat Assistant
      </h1>
      
      <ScrollArea className="flex-1 mb-4 border rounded-lg p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <Card className={`max-w-[80%] p-4 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="flex items-start gap-3">
                  {message.role === 'assistant' ? (
                    <Bot className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
                  ) : (
                    <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="text-sm leading-relaxed">
                    {message.content.split('\n').map((line, index) => {
                      // Handle numbered lists
                      if (line.match(/^\d+\.\s\*\*.*\*\*/)) {
                        return (
                          <div key={index} className="mb-4">
                            <h4 className="font-semibold text-blue-700 mb-2">{line.replace(/^\d+\.\s/, '').replace(/\*\*/g, '')}</h4>
                          </div>
                        );
                      }
                      // Handle sub-bullets with dashes
                      else if (line.match(/^\s*-\s\*\*.*\*\*/)) {
                        return (
                          <div key={index} className="ml-4 mb-1 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="font-medium">{line.replace(/^\s*-\s/, '').replace(/\*\*/g, '')}</span>
                          </div>
                        );
                      }
                      // Handle regular sub-bullets
                      else if (line.match(/^\s*-\s/)) {
                        return (
                          <div key={index} className="ml-4 mb-1 flex items-start gap-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>{line.replace(/^\s*-\s/, '')}</span>
                          </div>
                        );
                      }
                      // Handle markdown links
                      else if (line.includes('[') && line.includes('](')) {
                        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                        const parts = line.split(linkRegex);
                        return (
                          <div key={index} className="mb-2">
                            {parts.map((part, partIndex) => {
                              if (partIndex % 3 === 1) {
                                // This is the link text
                                return (
                                  <a 
                                    key={partIndex} 
                                    href={parts[partIndex + 1]} 
                                    className="text-blue-600 hover:text-blue-800 underline"
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    {part}
                                  </a>
                                );
                              } else if (partIndex % 3 === 2) {
                                // This is the URL, skip it
                                return null;
                              } else {
                                // This is regular text
                                return <span key={partIndex}>{part}</span>;
                              }
                            })}
                          </div>
                        );
                      }
                      // Handle bold text
                      else if (line.includes('**')) {
                        const parts = line.split(/(\*\*[^*]+\*\*)/);
                        return (
                          <div key={index} className="mb-2">
                            {parts.map((part, partIndex) => 
                              part.startsWith('**') && part.endsWith('**') ? (
                                <strong key={partIndex} className="font-semibold text-gray-900">
                                  {part.replace(/\*\*/g, '')}
                                </strong>
                              ) : (
                                <span key={partIndex}>{part}</span>
                              )
                            )}
                          </div>
                        );
                      }
                      // Handle empty lines
                      else if (line.trim() === '') {
                        return <div key={index} className="mb-3" />;
                      }
                      // Regular paragraphs
                      else {
                        return (
                          <p key={index} className="mb-2 text-gray-700">
                            {line}
                          </p>
                        );
                      }
                    })}
                  </div>
                </div>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-4 bg-white border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
          className="flex-1 border-gray-200 focus:border-blue-500"
        />
        <Button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}