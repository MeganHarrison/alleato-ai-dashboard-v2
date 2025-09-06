// Search API endpoint for RAG system

import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/rag/embeddings';
import { SearchConfig, SearchResult } from '@/lib/rag/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, search_type = 'semantic', filters, limit = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Query is required' 
          } 
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    let results: SearchResult[] = [];

    if (search_type === 'semantic' || search_type === 'hybrid') {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(query);

      // Perform vector similarity search
      results = await performVectorSearch(
        queryEmbedding,
        limit,
        0.7, // similarity threshold
        filters?.document_ids
      );
    }

    if (search_type === 'keyword' || search_type === 'hybrid') {
      // Perform keyword search
      const keywordResults = await performKeywordSearch(
        query,
        limit,
        filters
      );

      if (search_type === 'hybrid') {
        // Merge and deduplicate results
        results = mergeSearchResults(results, keywordResults);
      } else {
        results = keywordResults;
      }
    }

    const searchTime = Date.now() - startTime;

    return NextResponse.json({
      results: results.slice(0, limit),
      total_results: results.length,
      search_time_ms: searchTime,
    });

  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to perform search',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

async function performVectorSearch(
  embedding: number[],
  limit: number,
  threshold: number,
  documentIds?: string[]
): Promise<SearchResult[]> {
  const { supabase } = await import('@/lib/rag/supabase-client');
  
  // Convert embedding to PostgreSQL vector format
  const vectorString = `[${embedding.join(',')}]`;
  
  // Build the query
  let query = supabase
    .rpc('match_rag_chunks', {
      query_embedding: vectorString,
      match_threshold: threshold,
      match_count: limit,
      filter_document_ids: documentIds || null,
    });

  const { data, error } = await query;

  if (error) {
    console.error('Vector search error:', error);
    throw error;
  }

  return data || [];
}

async function performKeywordSearch(
  query: string,
  limit: number,
  filters?: any
): Promise<SearchResult[]> {
  const { supabase } = await import('@/lib/rag/supabase-client');
  
  // Build keyword search query
  let searchQuery = supabase
    .from('rag_chunks')
    .select(`
      id,
      document_id,
      content,
      metadata,
      rag_documents!inner(title)
    `)
    .textSearch('content', query, {
      type: 'websearch',
      config: 'english',
    })
    .limit(limit);

  // Apply filters
  if (filters?.document_ids?.length > 0) {
    searchQuery = searchQuery.in('document_id', filters.document_ids);
  }

  const { data, error } = await searchQuery;

  if (error) {
    console.error('Keyword search error:', error);
    throw error;
  }

  // Format results
  return (data || []).map(chunk => ({
    chunk_id: chunk.id,
    document_id: chunk.document_id,
    document_title: (chunk as any).rag_documents.title,
    content: chunk.content,
    relevance_score: 0.5, // Default score for keyword matches
    metadata: chunk.metadata,
  }));
}

function mergeSearchResults(
  semanticResults: SearchResult[],
  keywordResults: SearchResult[]
): SearchResult[] {
  const merged = new Map<string, SearchResult>();

  // Add semantic results with higher weight
  semanticResults.forEach(result => {
    merged.set(result.chunk_id, {
      ...result,
      relevance_score: result.relevance_score * 0.7, // Weight semantic results
    });
  });

  // Add or merge keyword results
  keywordResults.forEach(result => {
    const existing = merged.get(result.chunk_id);
    if (existing) {
      // Combine scores if chunk appears in both
      existing.relevance_score = 
        existing.relevance_score + (result.relevance_score * 0.3);
    } else {
      merged.set(result.chunk_id, {
        ...result,
        relevance_score: result.relevance_score * 0.3, // Weight keyword results
      });
    }
  });

  // Sort by relevance score
  return Array.from(merged.values())
    .sort((a, b) => b.relevance_score - a.relevance_score);
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}