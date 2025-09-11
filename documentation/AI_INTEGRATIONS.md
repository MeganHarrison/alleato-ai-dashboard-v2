# AI Integrations Guide

## Table of Contents
- [Overview](#overview)
- [AI Providers Configuration](#ai-providers-configuration)
- [RAG System Architecture](#rag-system-architecture)
- [AI Chat Implementation](#ai-chat-implementation)
- [Meeting Intelligence](#meeting-intelligence)
- [Project Management AI](#project-management-ai)
- [FM Global ASRS Expert](#fm-global-asrs-expert)
- [AI Tools & Functions](#ai-tools--functions)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Analytics](#monitoring--analytics)

## Overview

The Alleato AI Dashboard integrates multiple AI services and capabilities to provide comprehensive business intelligence, meeting analysis, project management assistance, and specialized domain expertise.

**Core AI Capabilities:**
- **Multi-Provider Chat** - OpenAI, Anthropic, Groq integration
- **RAG Systems** - Document retrieval and context-aware responses
- **Meeting Intelligence** - Transcript analysis and insights generation
- **Project Management AI** - Strategic business guidance with meeting context
- **Domain Expertise** - FM Global ASRS specialized knowledge system
- **Real-time Streaming** - Fast, responsive AI interactions

## AI Providers Configuration

### OpenAI Integration (Primary Provider)
```typescript
// lib/ai/providers/openai.ts
import { OpenAI } from 'openai';

export class OpenAIProvider {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID, // Optional
      project: process.env.OPENAI_PROJECT_ID, // Optional
    });
  }
  
  // Chat completions with streaming
  async createChatCompletion(params: {
    messages: OpenAI.ChatCompletionMessageParam[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }) {
    const {
      messages,
      model = 'gpt-4o',
      temperature = 0.7,
      maxTokens = 4000,
      stream = true
    } = params;
    
    return await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
      response_format: { type: "text" },
    });
  }
  
  // Generate embeddings for RAG
  async createEmbeddings(texts: string[], model = 'text-embedding-3-small') {
    const response = await this.client.embeddings.create({
      model,
      input: texts,
      encoding_format: 'float',
    });
    
    return response.data.map(item => item.embedding);
  }
  
  // Function calling capability
  async createFunctionCall(params: {
    messages: OpenAI.ChatCompletionMessageParam[];
    functions: OpenAI.ChatCompletionCreateParams.Function[];
  }) {
    return await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: params.messages,
      functions: params.functions,
      function_call: 'auto',
    });
  }
}
```

### Anthropic Integration (Secondary Provider)
```typescript
// lib/ai/providers/anthropic.ts
import { Anthropic } from '@anthropic-ai/sdk';

export class AnthropicProvider {
  private client: Anthropic;
  
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  async createMessage(params: {
    messages: Anthropic.MessageParam[];
    model?: string;
    maxTokens?: number;
    temperature?: number;
    system?: string;
  }) {
    const {
      messages,
      model = 'claude-3-5-sonnet-20241022',
      maxTokens = 4000,
      temperature = 0.7,
      system
    } = params;
    
    return await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
      stream: true,
    });
  }
}
```

### Multi-Provider Router
```typescript
// lib/ai/router.ts
export class AIRouter {
  private providers = {
    openai: new OpenAIProvider(),
    anthropic: new AnthropicProvider(),
    groq: new GroqProvider(),
  };
  
  async createCompletion(params: {
    messages: any[];
    provider?: 'openai' | 'anthropic' | 'groq';
    model?: string;
    fallback?: boolean;
  }) {
    const { provider = 'openai', fallback = true } = params;
    
    try {
      return await this.providers[provider].createCompletion(params);
    } catch (error) {
      if (fallback && provider !== 'openai') {
        console.warn(`Provider ${provider} failed, falling back to OpenAI:`, error);
        return await this.providers.openai.createCompletion(params);
      }
      throw error;
    }
  }
}
```

## RAG System Architecture

### Vector Database Configuration
```typescript
// lib/rag/vector-store.ts
import { createClient } from '@supabase/supabase-js';

export class VectorStore {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Store document embeddings
  async storeEmbeddings(chunks: {
    id: string;
    content: string;
    embedding: number[];
    metadata: Record<string, any>;
  }[]) {
    const { error } = await this.supabase
      .from('document_chunks')
      .insert(
        chunks.map(chunk => ({
          id: chunk.id,
          content: chunk.content,
          embedding: chunk.embedding,
          metadata: chunk.metadata,
          created_at: new Date().toISOString(),
        }))
      );
    
    if (error) throw error;
  }
  
  // Semantic search with similarity threshold
  async similaritySearch(params: {
    query: string;
    embedding: number[];
    limit?: number;
    threshold?: number;
    filter?: Record<string, any>;
  }) {
    const { embedding, limit = 5, threshold = 0.7, filter } = params;
    
    let query = this.supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
    });
    
    // Apply metadata filters
    if (filter) {
      query = query.filter('metadata', 'cs', JSON.stringify(filter));
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
  
  // Hybrid search (vector + text)
  async hybridSearch(params: {
    query: string;
    embedding: number[];
    textSearch: string;
    limit?: number;
  }) {
    const { embedding, textSearch, limit = 10 } = params;
    
    // Vector similarity search
    const vectorResults = await this.similaritySearch({
      query: params.query,
      embedding,
      limit: Math.ceil(limit * 0.7), // 70% from vector search
    });
    
    // Text search
    const { data: textResults } = await this.supabase
      .from('document_chunks')
      .select('*')
      .textSearch('content', textSearch)
      .limit(Math.ceil(limit * 0.3)); // 30% from text search
    
    // Combine and deduplicate results
    const combined = [...vectorResults, ...(textResults || [])];
    const unique = combined.filter((item, index, arr) => 
      arr.findIndex(i => i.id === item.id) === index
    );
    
    return unique.slice(0, limit);
  }
}
```

### RAG Service Implementation
```typescript
// lib/rag/rag-service.ts
export class RAGService {
  private vectorStore = new VectorStore();
  private openai = new OpenAIProvider();
  
  async processQuery(params: {
    query: string;
    context?: string;
    filters?: Record<string, any>;
    model?: string;
  }): Promise<RAGResponse> {
    const { query, context, filters, model = 'gpt-4o' } = params;
    
    // Generate query embedding
    const [queryEmbedding] = await this.openai.createEmbeddings([query]);
    
    // Retrieve relevant documents
    const relevantDocs = await this.vectorStore.similaritySearch({
      query,
      embedding: queryEmbedding,
      limit: 5,
      threshold: 0.7,
      filter: filters,
    });
    
    // Build context from retrieved documents
    const ragContext = this.buildContext(relevantDocs);
    
    // Generate response with context
    const response = await this.generateResponse({
      query,
      context: ragContext,
      userContext: context,
      model,
    });
    
    return {
      response,
      sources: relevantDocs,
      confidence: this.calculateConfidence(relevantDocs),
    };
  }
  
  private buildContext(documents: any[]): string {
    return documents
      .map((doc, index) => `[${index + 1}] ${doc.content}`)
      .join('\n\n');
  }
  
  private async generateResponse(params: {
    query: string;
    context: string;
    userContext?: string;
    model: string;
  }) {
    const { query, context, userContext, model } = params;
    
    const systemPrompt = `You are an AI assistant with access to relevant documents. Use the provided context to answer questions accurately and cite your sources using [1], [2], etc.
    
Context from documents:
${context}

${userContext ? `Additional context: ${userContext}` : ''}

Guidelines:
- Provide accurate, contextual answers based on the provided documents
- Always cite sources using the format [1], [2], etc.
- If information is not in the provided context, clearly state this
- Be concise but comprehensive in your responses`;

    const response = await this.openai.createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      model,
      temperature: 0.3, // Lower temperature for factual responses
      stream: true,
    });
    
    return response;
  }
  
  private calculateConfidence(documents: any[]): number {
    if (documents.length === 0) return 0;
    
    // Calculate confidence based on similarity scores and document count
    const avgSimilarity = documents.reduce((sum, doc) => sum + doc.similarity, 0) / documents.length;
    const documentFactor = Math.min(documents.length / 3, 1); // Normalize by expected doc count
    
    return Math.min(avgSimilarity * documentFactor, 1);
  }
}
```

## AI Chat Implementation

### Streaming Chat API
```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { RAGService } from '@/lib/rag/rag-service';

export async function POST(req: Request) {
  try {
    const { messages, ragEnabled = false } = await req.json();
    
    let context = '';
    let sources = [];
    
    // RAG integration if enabled
    if (ragEnabled) {
      const ragService = new RAGService();
      const lastMessage = messages[messages.length - 1];
      
      const ragResult = await ragService.processQuery({
        query: lastMessage.content,
        filters: { type: 'general' },
      });
      
      context = ragResult.context;
      sources = ragResult.sources;
    }
    
    // Enhanced system prompt
    const systemPrompt = `You are Alleato AI, an expert business intelligence assistant specializing in project management, meeting analysis, and strategic planning.

${context ? `Relevant context from documents:\n${context}\n` : ''}

Guidelines:
- Provide actionable business insights and recommendations
- Use data-driven analysis when possible
- Cite sources when using provided context
- Maintain a professional, consultative tone
- Focus on practical solutions and next steps`;

    const result = await streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: convertToCoreMessages(messages),
      temperature: 0.7,
      maxTokens: 4000,
      onFinish: async (result) => {
        // Store conversation in database
        await storeConversation({
          messages,
          response: result.text,
          sources,
          timestamp: new Date(),
        });
      },
    });
    
    return result.toAIStreamResponse({
      headers: {
        'X-RAG-Enabled': ragEnabled.toString(),
        'X-Sources-Count': sources.length.toString(),
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### AI Chat Component
```typescript
// components/ai-chat.tsx
import { useChat } from 'ai/react';
import { useState } from 'react';

export function AIChat() {
  const [ragEnabled, setRAGEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { ragEnabled },
    onError: (error) => {
      toast.error('Failed to send message: ' + error.message);
    },
  });
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        // Floating chat button
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(true)}
          className="h-14 w-14 bg-[#DB802D] text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <MessageSquare className="h-6 w-6" />
          {messages.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {messages.filter(m => m.role === 'assistant').length}
            </span>
          )}
        </motion.button>
      ) : (
        // Expanded chat interface
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-xl border w-96 h-[600px] flex flex-col"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-[#DB802D] rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Alleato AI</h3>
                <p className="text-xs text-gray-500">Business Intelligence Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* RAG Toggle */}
              <Switch
                checked={ragEnabled}
                onCheckedChange={setRAGEnabled}
                className="data-[state=checked]:bg-[#DB802D]"
              />
              <Label className="text-xs">RAG</Label>
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Start a conversation with Alleato AI</p>
                <div className="mt-4 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start"
                    onClick={() => handleSubmit({ preventDefault: () => {} } as any, {
                      data: { message: "What are my current project priorities?" }
                    })}
                  >
                    What are my current project priorities?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start"
                    onClick={() => handleSubmit({ preventDefault: () => {} } as any, {
                      data: { message: "Analyze recent meeting insights" }
                    })}
                  >
                    Analyze recent meeting insights
                  </Button>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
          </div>
          
          {/* Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="bg-[#DB802D] hover:bg-[#C07025]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}
```

## Meeting Intelligence

### Meeting Analysis Service
```typescript
// lib/meeting-intelligence/analyzer.ts
export class MeetingAnalyzer {
  private openai = new OpenAIProvider();
  private ragService = new RAGService();
  
  async analyzeTranscript(transcript: string, metadata: {
    participants: string[];
    duration: number;
    meetingType: string;
    date: string;
  }): Promise<MeetingAnalysis> {
    
    // Generate insights using AI
    const insights = await this.generateInsights(transcript, metadata);
    
    // Extract action items
    const actionItems = await this.extractActionItems(transcript);
    
    // Identify key decisions
    const decisions = await this.identifyDecisions(transcript);
    
    // Generate summary
    const summary = await this.generateSummary(transcript, metadata);
    
    // Calculate engagement metrics
    const engagement = this.analyzeEngagement(transcript, metadata.participants);
    
    return {
      summary,
      insights,
      actionItems,
      decisions,
      engagement,
      sentiment: await this.analyzeSentiment(transcript),
      topics: await this.extractTopics(transcript),
    };
  }
  
  private async generateInsights(transcript: string, metadata: any) {
    const prompt = `Analyze this meeting transcript and provide strategic business insights:

Transcript: ${transcript}

Meeting Context:
- Participants: ${metadata.participants.join(', ')}
- Duration: ${metadata.duration} minutes
- Type: ${metadata.meetingType}
- Date: ${metadata.date}

Provide insights in the following format:
1. Key Themes
2. Strategic Implications
3. Risk Factors
4. Opportunities
5. Next Steps Recommendations

Focus on actionable business intelligence.`;

    const response = await this.openai.createChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
      temperature: 0.3,
    });
    
    return response;
  }
  
  private async extractActionItems(transcript: string) {
    const prompt = `Extract action items from this meeting transcript. Return as JSON array with format:
    [{
      "task": "Description of the task",
      "assignee": "Person responsible",
      "deadline": "Due date if mentioned",
      "priority": "high/medium/low"
    }]

    Transcript: ${transcript}`;

    const response = await this.openai.createChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
      temperature: 0.1,
    });
    
    try {
      return JSON.parse(response.choices[0].message.content);
    } catch {
      return [];
    }
  }
  
  private analyzeEngagement(transcript: string, participants: string[]) {
    const words = transcript.split(' ');
    const totalWords = words.length;
    
    const engagement = participants.map(participant => {
      // Simple engagement calculation based on speaking time
      const participantRegex = new RegExp(`${participant}:`, 'gi');
      const matches = transcript.match(participantRegex) || [];
      
      return {
        participant,
        engagementScore: matches.length / participants.length,
        estimatedSpeakingTime: (matches.length / participants.length) * 100,
      };
    });
    
    return engagement;
  }
}
```

### Meeting Intelligence API
```typescript
// app/api/meeting-intelligence/analyze/route.ts
import { MeetingAnalyzer } from '@/lib/meeting-intelligence/analyzer';

export async function POST(req: Request) {
  try {
    const { transcript, metadata } = await req.json();
    
    const analyzer = new MeetingAnalyzer();
    const analysis = await analyzer.analyzeTranscript(transcript, metadata);
    
    // Store analysis in database
    await storeMeetingAnalysis({
      meetingId: metadata.meetingId,
      analysis,
      timestamp: new Date(),
    });
    
    return Response.json(analysis);
  } catch (error) {
    console.error('Meeting analysis error:', error);
    return new Response('Analysis failed', { status: 500 });
  }
}
```

## Project Management AI

### PM Assistant Implementation
```typescript
// app/api/pm-assistant/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, projectContext } = await req.json();
  
  // Get relevant meeting data for context
  const meetingContext = await getMeetingContext(projectContext?.projectId);
  
  const systemPrompt = `You are an expert Project Manager and Business Strategist. You have access to meeting data and project information to provide strategic insights and recommendations.

${meetingContext ? `Recent Meeting Context:\n${meetingContext}\n` : ''}

${projectContext ? `Project Context:\n${JSON.stringify(projectContext, null, 2)}\n` : ''}

Your expertise includes:
- Strategic business planning
- Risk assessment and mitigation
- Resource optimization
- Stakeholder management
- Timeline and milestone planning
- Team productivity optimization

Provide actionable, data-driven recommendations based on the available context.`;

  const result = await streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages,
    temperature: 0.7,
    maxTokens: 4000,
    tools: {
      analyzeProjectRisks: {
        description: 'Analyze potential project risks based on meeting discussions',
        parameters: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            timeframe: { type: 'string' }
          }
        }
      },
      generateActionPlan: {
        description: 'Generate an action plan based on meeting insights',
        parameters: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' }
          }
        }
      }
    },
  });
  
  return result.toAIStreamResponse();
}

async function getMeetingContext(projectId?: string) {
  if (!projectId) return null;
  
  // Query recent meetings related to the project
  const { data: meetings } = await supabase
    .from('meetings')
    .select('id, title, summary, insights, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(3);
  
  return meetings?.map(meeting => 
    `Meeting: ${meeting.title}\nSummary: ${meeting.summary}\nInsights: ${meeting.insights}`
  ).join('\n\n');
}
```

## FM Global ASRS Expert

### Domain-Specific RAG System
```typescript
// app/api/fm-global-rag/route.ts
import { FMGlobalRAGService } from '@/lib/fm-global/rag-service';

export async function POST(req: Request) {
  try {
    const { query, systemType, dimensions } = await req.json();
    
    const ragService = new FMGlobalRAGService();
    
    // Process FM Global specific query
    const result = await ragService.processASRSQuery({
      query,
      systemType, // shuttle, mini-load, etc.
      dimensions,
      includeOptimizations: true,
    });
    
    return Response.json({
      response: result.response,
      sources: result.sources,
      figures: result.relevantFigures,
      tables: result.relevantTables,
      optimizations: result.costOptimizations,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error('FM Global RAG error:', error);
    return new Response('Query failed', { status: 500 });
  }
}
```

### FM Global Service Implementation
```typescript
// lib/fm-global/rag-service.ts
export class FMGlobalRAGService extends RAGService {
  async processASRSQuery(params: {
    query: string;
    systemType?: string;
    dimensions?: any;
    includeOptimizations?: boolean;
  }) {
    const { query, systemType, dimensions, includeOptimizations } = params;
    
    // Build FM Global specific filters
    const filters = {
      domain: 'fm-global',
      ...(systemType && { systemType }),
      ...(dimensions && { dimensions }),
    };
    
    // Process with domain-specific context
    const baseResult = await this.processQuery({
      query,
      filters,
      model: 'gpt-4o',
    });
    
    // Add FM Global specific enhancements
    const enhancedResult = await this.enhanceWithFMGlobalContext(baseResult, params);
    
    // Generate cost optimizations if requested
    if (includeOptimizations) {
      enhancedResult.costOptimizations = await this.generateOptimizations(query, systemType);
    }
    
    return enhancedResult;
  }
  
  private async enhanceWithFMGlobalContext(baseResult: any, params: any) {
    // Get relevant figures and tables
    const figures = await this.getRelevantFigures(params.query, params.systemType);
    const tables = await this.getRelevantTables(params.query, params.systemType);
    
    return {
      ...baseResult,
      relevantFigures: figures,
      relevantTables: tables,
    };
  }
  
  private async generateOptimizations(query: string, systemType?: string) {
    const prompt = `Based on FM Global 8-34 standards, suggest cost optimization strategies for this ASRS query:

Query: ${query}
System Type: ${systemType || 'General'}

Provide specific recommendations for:
1. Sprinkler spacing optimization
2. Protection scheme alternatives
3. Equipment cost reductions
4. Installation simplifications

Format as actionable recommendations with estimated cost impact.`;

    const response = await this.openai.createChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
      temperature: 0.3,
    });
    
    return response;
  }
}
```

## AI Tools & Functions

### Function Definitions
```typescript
// lib/ai/tools/index.ts
export const aiTools = {
  searchMeetings: {
    description: 'Search through meeting transcripts and summaries',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        timeframe: { type: 'string' },
        participants: { type: 'array', items: { type: 'string' } }
      }
    },
    execute: async (params: any) => {
      // Implementation for meeting search
      return await searchMeetingsFunction(params);
    }
  },
  
  analyzeProjectHealth: {
    description: 'Analyze the health and status of a project',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        includeRisks: { type: 'boolean' }
      }
    },
    execute: async (params: any) => {
      return await analyzeProjectHealthFunction(params);
    }
  },
  
  generateInsights: {
    description: 'Generate business insights from available data',
    parameters: {
      type: 'object',
      properties: {
        dataSource: { type: 'string' },
        timeframe: { type: 'string' },
        focus: { type: 'string' }
      }
    },
    execute: async (params: any) => {
      return await generateInsightsFunction(params);
    }
  },
  
  optimizeASRS: {
    description: 'Optimize ASRS sprinkler design based on FM Global standards',
    parameters: {
      type: 'object',
      properties: {
        systemType: { type: 'string' },
        dimensions: { type: 'object' },
        commodityType: { type: 'string' }
      }
    },
    execute: async (params: any) => {
      return await optimizeASRSFunction(params);
    }
  },
};
```

### Tool Execution Engine
```typescript
// lib/ai/tool-executor.ts
export class ToolExecutor {
  async executeTool(toolName: string, parameters: any) {
    const tool = aiTools[toolName];
    
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    
    try {
      // Validate parameters
      this.validateParameters(tool.parameters, parameters);
      
      // Execute tool function
      const result = await tool.execute(parameters);
      
      // Log tool usage for analytics
      await this.logToolUsage(toolName, parameters, result);
      
      return result;
    } catch (error) {
      console.error(`Tool execution error for ${toolName}:`, error);
      throw error;
    }
  }
  
  private validateParameters(schema: any, parameters: any) {
    // Parameter validation logic
    // Could use a library like Ajv for JSON schema validation
  }
  
  private async logToolUsage(toolName: string, parameters: any, result: any) {
    // Log to analytics service or database
    console.log(`Tool used: ${toolName}`, { parameters, resultSize: JSON.stringify(result).length });
  }
}
```

## Performance Optimization

### Caching Strategy
```typescript
// lib/ai/cache.ts
export class AICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  async get(key: string): Promise<any | null> {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  async set(key: string, data: any, ttl: number = 3600000): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  // Cache embeddings for reuse
  async getCachedEmbedding(text: string): Promise<number[] | null> {
    const key = `embedding:${this.hashText(text)}`;
    return await this.get(key);
  }
  
  async setCachedEmbedding(text: string, embedding: number[]): Promise<void> {
    const key = `embedding:${this.hashText(text)}`;
    await this.set(key, embedding, 24 * 60 * 60 * 1000); // 24 hours
  }
  
  private hashText(text: string): string {
    // Simple hash function for caching keys
    return btoa(text).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }
}
```

### Rate Limiting
```typescript
// lib/ai/rate-limiter.ts
export class RateLimiter {
  private requests = new Map<string, number[]>();
  
  async checkLimit(
    userId: string, 
    limit: number = 50, 
    windowMs: number = 60000
  ): Promise<boolean> {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < windowMs
    );
    
    if (validRequests.length >= limit) {
      return false; // Rate limit exceeded
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    
    return true;
  }
  
  getRemainingRequests(userId: string, limit: number = 50): number {
    const userRequests = this.requests.get(userId) || [];
    return Math.max(0, limit - userRequests.length);
  }
}
```

## Monitoring & Analytics

### AI Usage Analytics
```typescript
// lib/ai/analytics.ts
export class AIAnalytics {
  async trackRequest(params: {
    userId?: string;
    model: string;
    provider: string;
    tokens: number;
    responseTime: number;
    success: boolean;
    error?: string;
  }) {
    const record = {
      ...params,
      timestamp: new Date(),
      costEstimate: this.calculateCost(params.model, params.tokens),
    };
    
    // Store in database
    await this.storeUsageRecord(record);
    
    // Update real-time metrics
    await this.updateMetrics(record);
  }
  
  private calculateCost(model: string, tokens: number): number {
    const pricing = {
      'gpt-4o': { input: 0.01, output: 0.03 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
    };
    
    const modelPricing = pricing[model as keyof typeof pricing];
    if (!modelPricing) return 0;
    
    // Simplified cost calculation (assumes even split input/output)
    return (tokens / 1000) * (modelPricing.input + modelPricing.output) / 2;
  }
  
  async getUsageStats(timeframe: string = '7d'): Promise<UsageStats> {
    // Query usage statistics from database
    const stats = await this.queryUsageStats(timeframe);
    
    return {
      totalRequests: stats.count,
      totalTokens: stats.totalTokens,
      totalCost: stats.totalCost,
      averageResponseTime: stats.avgResponseTime,
      successRate: stats.successRate,
      topModels: stats.modelBreakdown,
      errorBreakdown: stats.errorBreakdown,
    };
  }
}
```

### Error Tracking
```typescript
// lib/ai/error-tracking.ts
export class AIErrorTracker {
  async trackError(error: {
    type: string;
    message: string;
    stack?: string;
    context: any;
    userId?: string;
  }) {
    const errorRecord = {
      ...error,
      timestamp: new Date(),
      id: this.generateErrorId(),
    };
    
    // Store error
    await this.storeError(errorRecord);
    
    // Alert if critical
    if (this.isCriticalError(error)) {
      await this.sendAlert(errorRecord);
    }
    
    return errorRecord.id;
  }
  
  private isCriticalError(error: any): boolean {
    return error.type === 'API_LIMIT_EXCEEDED' || 
           error.type === 'AUTHENTICATION_FAILED' ||
           error.message.includes('quota');
  }
  
  async getErrorStats(timeframe: string = '24h') {
    return await this.queryErrorStats(timeframe);
  }
}
```

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Next Review**: March 2025