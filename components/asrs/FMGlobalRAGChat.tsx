'use client';

import { PageHeader } from "@/components/page-header";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: RelevantSource[];
  recommendations?: Recommendation[];
  tables?: TableReference[];
  isTyping?: boolean;
}

interface RelevantSource {
  tableId: string;
  tableNumber: number;
  title: string;
  relevanceScore: number;
  excerpt: string;
  pageNumber?: number;
}

interface Recommendation {
  id: string;
  type: 'optimization' | 'warning' | 'alternative';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  costSavings?: number;
}

interface TableReference {
  tableNumber: number;
  title: string;
  applicability: string;
  keyRequirements: string[];
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  context: ProjectContext;
}

interface ProjectContext {
  asrsType?: string;
  storageHeight?: number;
  commodityClass?: string;
  containerType?: string;
  systemType?: string;
}

const FMGlobalRAGChat: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your FM Global 8-34 ASRS expert. I can help you with sprinkler protection requirements, code compliance, cost optimization, and design recommendations. What would you like to know about your ASRS project?',
        timestamp: new Date()
      }
    ],
    isLoading: false,
    context: {}
  });

  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedQuestions = [
    "What sprinkler requirements do I need for a 25ft mini-load system with Class 2 commodities?",
    "How can I optimize costs for my shuttle ASRS with combustible containers?",
    "What's the difference between wet and dry system requirements?",
    "Which FM Global tables apply to my top-loading ASRS configuration?",
    "How do I determine if I need in-rack sprinklers?",
    "What are the key factors that affect sprinkler count and pressure requirements?"
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, scrollToBottom]);

  const extractProjectContext = useCallback((message: string): Partial<ProjectContext> => {
    const context: Partial<ProjectContext> = {};
    const lowerMessage = message.toLowerCase();

    // Extract ASRS type
    if (lowerMessage.includes('mini-load') || lowerMessage.includes('miniload')) {
      context.asrsType = 'mini-load';
    } else if (lowerMessage.includes('shuttle')) {
      context.asrsType = 'shuttle';
    } else if (lowerMessage.includes('top-loading') || lowerMessage.includes('top loading')) {
      context.asrsType = 'top-loading';
    }

    // Extract height information
    const heightMatch = message.match(/(\d+)\s*(?:ft|feet|foot)/i);
    if (heightMatch) {
      context.storageHeight = parseInt(heightMatch[1]);
    }

    // Extract commodity class
    if (lowerMessage.includes('class 1')) context.commodityClass = 'class-1';
    if (lowerMessage.includes('class 2')) context.commodityClass = 'class-2';
    if (lowerMessage.includes('class 3')) context.commodityClass = 'class-3';
    if (lowerMessage.includes('class 4')) context.commodityClass = 'class-4';
    if (lowerMessage.includes('plastic')) context.commodityClass = 'plastic';

    // Extract system type
    if (lowerMessage.includes('wet system')) context.systemType = 'wet';
    if (lowerMessage.includes('dry system')) context.systemType = 'dry';

    // Extract container type
    if (lowerMessage.includes('combustible')) context.containerType = 'combustible';
    if (lowerMessage.includes('noncombustible') || lowerMessage.includes('non-combustible')) {
      context.containerType = 'noncombustible';
    }

    return context;
  }, []);

  const queryRAGSystem = useCallback(async (query: string, context: ProjectContext): Promise<{
    content: string;
    sources: RelevantSource[];
    recommendations: Recommendation[];
    tables: TableReference[];
  }> => {
    try {
      const response = await fetch('/api/fm-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          context,
          limit: 5  // Changed from maxSources to match API expectations
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('FM RAG API error:', errorData);
        throw new Error(errorData.error || 'Failed to query knowledge base');
      }

      const data = await response.json();
      
      // Transform API response to component format
      return {
        content: data.content || 'No response generated',
        sources: data.sources?.map((s: unknown) => ({
          tableId: s.table_id,
          tableNumber: s.metadata?.table_number || 0,
          title: s.metadata?.table_title || 'FM Global Table',
          relevanceScore: s.similarity || 0,
          excerpt: s.content?.substring(0, 200) || '',
          pageNumber: s.metadata?.page_number
        })) || [],
        recommendations: [],  // API doesn't provide recommendations yet
        tables: data.sources?.map((s: unknown) => ({
          tableNumber: s.metadata?.table_number || 0,
          title: s.metadata?.table_title || 'FM Global Table',
          applicability: s.metadata?.applicability || 'General ASRS',
          keyRequirements: s.metadata?.key_requirements || []
        })) || []
      };
    } catch (error) {
      console.error('RAG query error:', error);
      // Fallback to mock response for demo
      return generateMockResponse(query, context);
    }
  }, []);

  const generateMockResponse = useCallback((query: string, context: ProjectContext): {
    content: string;
    sources: RelevantSource[];
    recommendations: Recommendation[];
    tables: TableReference[];
  } => {
    const lowerQuery = query.toLowerCase();

    // Generate contextual response based on query content
    const content = "Based on FM Global 8-34 requirements";
    let sources: RelevantSource[] = [];
    let recommendations: Recommendation[] = [];
    let tables: TableReference[] = [];

    if (lowerQuery.includes('mini-load')) {
      content = `For mini-load ASRS systems, the primary protection requirements depend on your storage height and commodity class. Based on your configuration, you'll typically need ceiling-level protection with specific sprinkler spacing and pressure requirements.

Key considerations for your mini-load system:
- Storage height determines applicable protection tables
- Commodity classification affects sprinkler density
- Container type (open vs. closed) impacts in-rack requirements
- System type (wet vs. dry) affects sprinkler count

For a ${context.storageHeight || '25'}ft system with ${context.commodityClass || 'Class 2'} commodities, you would typically reference Table 27 for wet systems or Table 28 for dry systems.`;

      sources = [
        {
          tableId: 'Table_27',
          tableNumber: 27,
          title: 'Ceiling-Level Protection Guidelines on Wet System for Mini-Load ASRS',
          relevanceScore: 0.95,
          excerpt: 'Ceiling-level protection for Class 1-4 and Cartoned Plastic commodities in mini-load systems...',
          pageNumber: 56
        },
        {
          tableId: 'Table_31',
          tableNumber: 31,
          title: 'Recommended Horizontal In-Rack Sprinkler Arrangements',
          relevanceScore: 0.78,
          excerpt: 'In-rack sprinkler arrangements for enhanced protection scenarios...',
          pageNumber: 64
        }
      ];

      recommendations = [
        {
          id: '1',
          type: 'optimization',
          title: 'Consider Wet System Implementation',
          description: 'Wet systems typically require 25-30% fewer sprinklers than dry systems for the same protection level',
          impact: 'high',
          costSavings: 45000
        },
        {
          id: '2',
          type: 'warning',
          title: 'Verify Container Configuration',
          description: 'Open-top containers will require in-rack sprinklers, significantly increasing system cost',
          impact: 'high'
        }
      ];

      tables = [
        {
          tableNumber: 27,
          title: 'Mini-Load Wet System Protection',
          applicability: 'Primary table for your configuration',
          keyRequirements: ['K25.2 sprinklers at 15 psi', '16 sprinklers minimum', '160 sq ft per sprinkler']
        }
      ];
    } else if (lowerQuery.includes('shuttle')) {
      content = `Shuttle ASRS systems typically offer more flexibility in protection design compared to mini-load systems. The key factor is whether commodities are stored directly on supporting rails without vertical guides.

For shuttle systems:
- Tables 4-25 provide the primary protection requirements
- Class 1-3 commodities generally require ceiling-only protection
- Class 4 and plastic commodities may need enhanced protection
- Storage height thresholds are critical for protection level determination`;

      sources = [
        {
          tableId: 'Table_4',
          tableNumber: 4,
          title: 'Ceiling-Level Protection Guidelines on Wet System for Class 1-2-3 Commodities',
          relevanceScore: 0.92,
          excerpt: 'Protection requirements for Class 1, 2, and 3 commodities stored directly on supporting rails...',
          pageNumber: 18
        }
      ];
    } else if (lowerQuery.includes('cost') || lowerQuery.includes('optimize')) {
      content = `Here are the top cost optimization strategies for ASRS sprinkler systems:

**Primary Cost Drivers:**
1. **System Type**: Wet systems require ~30% fewer sprinklers than dry systems
2. **Storage Height**: Keeping storage under 20ft avoids enhanced protection requirements
3. **Container Type**: Closed-top containers eliminate in-rack sprinkler needs
4. **Commodity Class**: Class 1-3 commodities typically need only ceiling protection

**Optimization Opportunities:**
- Design review for height optimization
- Container specification changes
- System type evaluation for building conditions
- Sprinkler spacing optimization within code limits`;

      recommendations = [
        {
          id: '1',
          type: 'optimization',
          title: 'Storage Height Optimization',
          description: 'Reducing storage height from 25ft to 20ft eliminates enhanced protection requirements',
          impact: 'high',
          costSavings: 125000
        },
        {
          id: '2',
          type: 'optimization',
          title: 'Container Type Upgrade',
          description: 'Switching to closed-top containers eliminates in-rack sprinklers',
          impact: 'high',
          costSavings: 180000
        },
        {
          id: '3',
          type: 'alternative',
          title: 'Wet System Implementation',
          description: 'If building temperature allows, wet systems reduce sprinkler count by 25-40%',
          impact: 'medium',
          costSavings: 65000
        }
      ];
    } else {
      content = `I can help you with FM Global 8-34 requirements for your ASRS project. Based on your question, here are some relevant considerations:

- **System Configuration**: The type of ASRS (mini-load, shuttle, or top-loading) determines applicable protection tables
- **Storage Parameters**: Height, commodity class, and container types are key factors
- **Protection Options**: Ceiling-only vs. combined ceiling and in-rack protection
- **System Design**: Wet vs. dry system implications for sprinkler requirements

Could you provide more specific details about your ASRS configuration? This will help me give you more targeted guidance from the FM Global 8-34 standard.`;

      sources = [
        {
          tableId: 'Table_3',
          tableNumber: 3,
          title: 'Decision Matrix for Protection Table Selection',
          relevanceScore: 0.85,
          excerpt: 'Decision tree for determining applicable protection requirements based on ASRS configuration...',
          pageNumber: 17
        }
      ];
    }

    return { content, sources, recommendations, tables };
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || chatState.isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // Extract context from user message
    const newContext = extractProjectContext(inputValue);
    const updatedContext = { ...chatState.context, ...newContext };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      context: updatedContext
    }));

    setInputValue('');
    setShowSuggestions(false);

    try {
      // Add typing indicator
      const typingMessage: Message = {
        id: 'typing',
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, typingMessage]
      }));

      // Query RAG system
      const ragResponse = await queryRAGSystem(inputValue, updatedContext);

      // Remove typing indicator and add real response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: ragResponse.content,
        timestamp: new Date(),
        sources: ragResponse.sources,
        recommendations: ragResponse.recommendations,
        tables: ragResponse.tables
      };

      setChatState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== 'typing').concat([assistantMessage]),
        isLoading: false
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.',
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== 'typing').concat([errorMessage]),
        isLoading: false
      }));
    }
  }, [inputValue, chatState, extractProjectContext, queryRAGSystem]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  const formatTimestamp = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-50">
        <div>
          <PageHeader title="FM Global Expert" description="Find answers fast" />
        </div>

        {/* Context Display */}
        {Object.keys(chatState.context).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chatState.context.asrsType && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                {chatState.context.asrsType.replace('-', ' ')}
              </span>
            )}
            {chatState.context.storageHeight && (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full border border-emerald-200">
                {chatState.context.storageHeight}ft height
              </span>
            )}
            {chatState.context.commodityClass && (
              <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-full border border-purple-200">
                {chatState.context.commodityClass.replace('-', ' ')}
              </span>
            )}
            {chatState.context.systemType && (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-full border border-amber-200">
                {chatState.context.systemType} system
              </span>
            )}
          </div>
        )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">
        {chatState.messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-4xl ${message.role === 'user' ? 'order-2' : ''}`}>
              
              {/* Message Bubble */}
              <div className={`rounded-2xl px-5 py-4 shadow-sm ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white ml-12' 
                  : 'bg-white text-gray-900 border border-gray-100 mr-12'
              }`}>
                {message.isTyping ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Analyzing FM Global requirements...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                )}
              </div>

              {/* Timestamp */}
              <div className={`mt-2 text-xs text-gray-400 ${message.role === 'user' ? 'text-right mr-12' : 'text-left ml-2'}`}>
                {formatTimestamp(message.timestamp)}
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-4 mr-12 space-y-3">
                  <div className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-500" />
                    Relevant FM Global Tables
                  </div>
                  {message.sources.map((source, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm">Table {source.tableNumber}</div>
                          <div className="text-sm text-gray-600 mt-1 font-medium">{source.title}</div>
                          <div className="text-sm text-gray-500 mt-2 leading-relaxed">{source.excerpt}</div>
                        </div>
                        <div className="ml-4 flex items-center">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full font-medium border border-blue-200">
                            {Math.round(source.relevanceScore * 100)}% match
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Table References */}
              {message.tables && message.tables.length > 0 && (
                <div className="mt-4 mr-12 space-y-3">
                  <div className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <MagnifyingGlassIcon className="w-4 h-4 mr-2 text-gray-500" />
                    Applicable Tables
                  </div>
                  {message.tables.map((table, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="font-semibold text-blue-900 text-sm">Table {table.tableNumber}: {table.title}</div>
                      <div className="text-sm text-blue-700 mt-2 font-medium">{table.applicability}</div>
                      <div className="mt-3 space-y-2">
                        {table.keyRequirements.map((req, reqIndex) => (
                          <div key={reqIndex} className="text-sm text-gray-700 flex items-start">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {message.recommendations && message.recommendations.length > 0 && (
                <div className="mt-4 mr-12 space-y-3">
                  <div className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <LightBulbIcon className="w-4 h-4 mr-2 text-gray-500" />
                    Optimization Recommendations
                  </div>
                  {message.recommendations.map((rec) => (
                    <div key={rec.id} className={`border rounded-xl p-4 shadow-sm ${
                      rec.type === 'optimization' 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : rec.type === 'warning'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {rec.type === 'optimization' && <LightBulbIcon className="w-4 h-4 text-emerald-600 mr-2" />}
                            {rec.type === 'warning' && <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 mr-2" />}
                            {rec.type === 'alternative' && <ClockIcon className="w-4 h-4 text-blue-600 mr-2" />}
                            <div className={`font-semibold text-sm ${
                              rec.type === 'optimization' ? 'text-emerald-900' :
                              rec.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                            }`}>
                              {rec.title}
                            </div>
                          </div>
                          <div className={`text-sm leading-relaxed ${
                            rec.type === 'optimization' ? 'text-emerald-700' :
                            rec.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
                          }`}>
                            {rec.description}
                          </div>
                        </div>
                        {rec.costSavings && (
                          <div className="ml-4 text-right">
                            <div className="text-sm font-bold text-emerald-600">
                              ${rec.costSavings.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">potential savings</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && chatState.messages.length <= 1 && (
        <div className="px-6 py-4 bg-white flex-shrink-0">
          <div className="mb-4 text-sm font-semibold text-gray-700">Try asking:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(question)}
                className="text-left p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-sm hover:border-gray-300"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 bg-white shadow-lg flex-shrink-0">
        <div className="flex items-center space-x-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about FM Global 8-34 requirements, optimization strategies, or specific ASRS configurations..."
              className="w-full px-5 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm placeholder:text-gray-400"
              disabled={chatState.isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || chatState.isLoading}
            className={`p-4 rounded-2xl transition-all duration-200 shadow-sm ${
              inputValue.trim() && !chatState.isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 hover:shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 text-xs text-gray-400 text-center">
          Powered by FM Global 8-34 knowledge base with semantic search and AI optimization
        </div>
      </div>
    </div>
  );
};

export default FMGlobalRAGChat;