/**
 * FM Global RAG (Retrieval-Augmented Generation) API Route
 * 
 * PURPOSE: Core RAG engine for FM Global 8-34 document queries
 * 
 * USED BY:
 * - /api/fm-global-chat (internal calls)
 * - Direct API calls for advanced RAG features
 * - Backend processes requiring structured RAG responses
 * 
 * FUNCTIONALITY:
 * - Vector similarity search through Supabase fm_global_figures & fm_global_tables
 * - OpenAI embeddings (text-embedding-3-small) for semantic search
 * - Context-aware responses using retrieved FM Global documents
 * - Cost optimization recommendations based on project context
 * - Structured output with sources, recommendations, and table references
 * 
 * DATABASE TABLES:
 * - fm_global_figures (vector search with embeddings)
 * - fm_global_tables (contextual search)
 * 
 * INPUT: { query: string, context: ProjectContext, includeOptimizations?: boolean }
 * OUTPUT: { content: string, sources: [], recommendations: [], tables: [] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Types
interface RAGRequest {
  query: string;
  context: ProjectContext;
  includeOptimizations?: boolean;
  limit?: number;
}

interface ProjectContext {
  asrsType?: string;
  storageHeight?: number;
  commodityClass?: string;
  containerType?: string;
  systemType?: string;
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

// Generate embeddings for search query
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// Search FM Global figures using vector similarity
async function searchFMGlobalFigures(query: string, context: ProjectContext, limit: number = 5) {
  try {
    // Generate embedding for the query
    const embedding = await generateEmbedding(query);
    
    // Search fm_global_figures table
    const { data: figures, error } = await supabase
      .rpc('fm_figures_search', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit
      });

    if (error) {
      console.error('Error searching FM figures:', error);
      // Fallback to direct search without vectors
      const { data: directFigures } = await supabase
        .from('fm_global_figures')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);
      
      return directFigures || [];
    }

    return figures || [];
  } catch (error) {
    console.error('Error in searchFMGlobalFigures:', error);
    // Fallback to basic search
    const { data } = await supabase
      .from('fm_global_figures')
      .select('*')
      .limit(limit);
    return data || [];
  }
}

// Search FM Global tables
async function searchFMGlobalTables(query: string, context: ProjectContext, limit: number = 5) {
  try {
    // Build search query based on context
    let searchQuery = supabase
      .from('fm_global_tables')
      .select('*');

    // Apply context filters
    if (context.asrsType) {
      searchQuery = searchQuery.or(`title.ilike.%${context.asrsType}%,description.ilike.%${context.asrsType}%`);
    }
    
    // Search by query terms
    searchQuery = searchQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    
    const { data, error } = await searchQuery.limit(limit);

    if (error) {
      console.error('Error searching FM tables:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchFMGlobalTables:', error);
    return [];
  }
}

// Generate AI response using OpenAI
async function generateAIResponse(
  query: string, 
  context: ProjectContext, 
  figures: any[], 
  tables: any[]
): Promise<string> {
  // Build context from real data
  const figureContext = figures.map(f => 
    `Figure ${f.figure_number}: ${f.title}\n${f.description || ''}`
  ).join('\n\n');

  const tableContext = tables.map(t => 
    `Table ${t.table_number}: ${t.title}\n${t.description || ''}`
  ).join('\n\n');

  const systemPrompt = `You are an expert FM Global 8-34 ASRS sprinkler protection consultant.
Use the following FM Global figures and tables to provide accurate, specific guidance:

FIGURES:
${figureContext || 'No specific figures found'}

TABLES:
${tableContext || 'No specific tables found'}

Provide specific sprinkler requirements, K-factors, pressure requirements, and spacing guidelines based on the FM Global 8-34 standard.
If the data doesn't contain specific information, provide general FM Global 8-34 best practices.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Context: ${JSON.stringify(context)}\nQuestion: ${query}` 
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    return completion.choices[0].message.content || 'I can help you with FM Global 8-34 requirements. Based on the available data...';
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback response based on available data
    if (figures.length > 0 || tables.length > 0) {
      const relevantFigure = figures[0];
      const relevantTable = tables[0];
      
      return `Based on FM Global 8-34 requirements:

${relevantTable ? `According to Table ${relevantTable.table_number}: ${relevantTable.title}

${relevantTable.description || 'This table provides protection requirements for your ASRS configuration.'}` : ''}

${relevantFigure ? `Reference Figure ${relevantFigure.figure_number}: ${relevantFigure.title}

${relevantFigure.description || 'This figure illustrates the applicable configuration.'}` : ''}

For specific requirements, please review the complete FM Global 8-34 standard or consult with a fire protection engineer.`;
    }
    
    return 'I can help you with FM Global 8-34 requirements. Please provide more specific details about your ASRS configuration.';
  }
}

// Generate recommendations based on query and context
function generateRecommendations(query: string, context: ProjectContext, figures: any[], tables: any[]): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const queryLower = query.toLowerCase();

  // Height optimization
  if (context.storageHeight && context.storageHeight > 20) {
    recommendations.push({
      id: 'height-opt',
      type: 'optimization',
      title: 'Storage Height Optimization',
      description: `Reducing storage height from ${context.storageHeight}ft to 20ft eliminates enhanced protection requirements`,
      impact: 'high',
      costSavings: Math.floor((context.storageHeight - 20) * 12500)
    });
  }

  // System type optimization
  if (context.systemType === 'dry' && !queryLower.includes('freezer') && !queryLower.includes('cold')) {
    recommendations.push({
      id: 'system-opt',
      type: 'optimization',
      title: 'Consider Wet System Implementation',
      description: 'Wet systems typically require 25-40% fewer sprinklers than dry systems if building temperature permits',
      impact: 'medium',
      costSavings: 45000
    });
  }

  // Container type optimization
  if (queryLower.includes('open') || queryLower.includes('combustible') || context.containerType === 'open-top') {
    recommendations.push({
      id: 'container-opt',
      type: 'optimization',
      title: 'Container Type Evaluation',
      description: 'Closed-top containers eliminate the need for in-rack sprinklers, significantly reducing system cost',
      impact: 'high',
      costSavings: 180000
    });
  }

  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    const body: RAGRequest = await request.json();
    const { query, context, includeOptimizations = true, limit = 5 } = body;

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Search both figures and tables from Supabase
    const [figures, tables] = await Promise.all([
      searchFMGlobalFigures(query, context, limit),
      searchFMGlobalTables(query, context, limit)
    ]);

    // Generate AI response using real data
    const aiResponse = await generateAIResponse(query, context, figures, tables);

    // Generate recommendations if requested
    const recommendations = includeOptimizations 
      ? generateRecommendations(query, context, figures, tables)
      : [];

    // Format sources from real data
    const sources: RelevantSource[] = [
      ...figures.map((figure: any) => ({
        tableId: `figure_${figure.id}`,
        tableNumber: parseInt(figure.figure_number) || 0,
        title: figure.title || 'FM Global Figure',
        relevanceScore: figure.similarity || 0.8,
        excerpt: (figure.description || '').substring(0, 200) + '...',
        pageNumber: figure.page_reference ? parseInt(figure.page_reference) : undefined
      })),
      ...tables.map((table: any) => ({
        tableId: `table_${table.id}`,
        tableNumber: parseInt(table.table_number) || 0,
        title: table.title || 'FM Global Table',
        relevanceScore: 0.75,
        excerpt: (table.description || '').substring(0, 200) + '...',
        pageNumber: table.page_reference ? parseInt(table.page_reference) : undefined
      }))
    ].slice(0, limit);

    // Format table references from real data
    const tableReferences: TableReference[] = tables.slice(0, 3).map((table: any) => ({
      tableNumber: parseInt(table.table_number) || 0,
      title: table.title || 'FM Global Table',
      applicability: table.section || 'General ASRS Protection',
      keyRequirements: table.columns || []
    }));

    return NextResponse.json({
      content: aiResponse,
      sources,
      recommendations,
      tables: tableReferences,
      context,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('FM Global RAG API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Test Supabase connection
  const { data: figuresTest, error: figuresError } = await supabase
    .from('fm_global_figures')
    .select('count')
    .single();
    
  const { data: tablesTest, error: tablesError } = await supabase
    .from('fm_global_tables')
    .select('count')
    .single();

  return NextResponse.json({
    service: 'FM Global 8-34 RAG API',
    version: '2.0',
    description: 'Real-time RAG API using Supabase FM Global data',
    status: {
      supabase: figuresError || tablesError ? 'error' : 'connected',
      figures_count: figuresTest?.count || 0,
      tables_count: tablesTest?.count || 0
    },
    endpoints: {
      'POST /api/fm-global-rag': 'Query the FM Global knowledge base with real Supabase data'
    },
    features: [
      'Real-time search across FM Global 8-34 figures and tables',
      'Context-aware responses using actual Supabase data',
      'Cost optimization recommendations',
      'Table reference extraction',
      'OpenAI-powered intelligent responses'
    ]
  });
}