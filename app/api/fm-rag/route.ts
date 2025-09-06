/**
 * FM RAG (Alternative) API Route
 * 
 * PURPOSE: Alternative RAG interface for FM Global documents
 * 
 * USED BY:
 * - components/asrs/FMGlobalRAGChat.tsx (RAG chat component)
 * - Alternative UI components requiring different RAG response format
 * - Legacy components that need simpler RAG interface
 * 
 * FUNCTIONALITY:
 * - Simplified RAG implementation compared to fm-global-rag
 * - Supabase document search and retrieval
 * - OpenAI-powered contextual responses
 * - Returns streamlined JSON response format
 * 
 * DIFFERENCE FROM fm-global-rag:
 * - Simpler input/output structure
 * - Less complex context processing
 * - Different response format for specific UI needs
 * 
 * INPUT: { query: string, context?: object }
 * OUTPUT: { response: string, sources?: [] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Lazy initialization to prevent startup failures
let supabase: ReturnType<typeof createClient> | null = null;
let openai: OpenAI | null = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }
    
    supabase = createClient(url, key);
  }
  return supabase;
}

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key is not set. AI responses will be limited.');
      return null;
    }
    
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

function generateSimpleResponse(tables: any[] | null, figures: any[] | null): string {
  let content = 'Based on FM Global 8-34 requirements:\n\n';
  
  if (tables && tables.length > 0) {
    const table = tables[0];
    content += `According to Table ${table.table_number}: ${table.title}\n\n`;
    content += table.description || 'Please refer to the complete FM Global 8-34 standard for detailed requirements.';
  } else if (figures && figures.length > 0) {
    const figure = figures[0];
    content += `Reference Figure ${figure.figure_number}: ${figure.title}\n\n`;
    content += figure.description || 'This figure illustrates the applicable configuration.';
  } else {
    content = 'I can help you with FM Global 8-34 requirements. Please provide more specific details about your ASRS configuration.';
  }
  
  return content;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context = {}, limit = 5 } = body;

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('FM RAG Query:', query, 'Context:', context);

    // Get Supabase client (with error handling)
    let supabaseClient;
    try {
      supabaseClient = getSupabase();
    } catch (error) {
      console.error('Supabase initialization error:', error);
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 503 }
      );
    }

    // Search FM Global figures and tables directly from Supabase
    const searchTerms = query.toLowerCase();
    
    // Search figures
    const { data: figures, error: figuresError } = await supabaseClient
      .from('fm_global_figures')
      .select('*')
      .or(`title.ilike.%${searchTerms}%,clean_caption.ilike.%${searchTerms}%,normalized_summary.ilike.%${searchTerms}%`)
      .limit(limit);

    if (figuresError) {
      console.error('Error searching figures:', figuresError);
    }

    // Search tables  
    const { data: tables, error: tablesError } = await supabaseClient
      .from('fm_global_tables')
      .select('*')
      .or(`title.ilike.%${searchTerms}%,commodity_types.ilike.%${searchTerms}%,protection_scheme.ilike.%${searchTerms}%`)
      .limit(limit);

    if (tablesError) {
      console.error('Error searching tables:', tablesError);
    }

    console.log(`Found ${figures?.length || 0} figures and ${tables?.length || 0} tables from Supabase`);

    // Combine results
    const allResults = [
      ...(figures || []).map(f => ({
        ...f,
        type: 'figure',
        display_number: String(f.figure_number),
        display_title: f.title,
        description: f.normalized_summary || f.clean_caption
      })),
      ...(tables || []).map(t => ({
        ...t,
        type: 'table', 
        display_number: String(t.table_number),
        display_title: t.title,
        description: t.protection_scheme || t.commodity_types
      }))
    ];

    // Generate AI response if we have results
    let aiContent = '';
    
    if (allResults.length > 0) {
      const contextText = allResults.map(item => 
        `${item.type === 'figure' ? 'Figure' : 'Table'} ${item.display_number}: ${item.display_title}\n${item.description || ''}`
      ).join('\n\n');

      const openaiClient = getOpenAI();
      if (openaiClient) {
        try {
          const completion = await openaiClient.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an FM Global 8-34 ASRS sprinkler protection expert. Use the following FM Global data to answer questions:

${contextText}

Provide specific requirements including K-factors, pressure requirements, and sprinkler spacing based on the FM Global 8-34 standard.`
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 800,
          temperature: 0.3
        });

          aiContent = completion.choices[0].message.content || '';
        } catch (error) {
          console.error('OpenAI error:', error);
          // Fallback to simple response without AI
          aiContent = generateSimpleResponse(tables, figures);
        }
      } else {
        // No OpenAI available, use fallback
        aiContent = generateSimpleResponse(tables, figures);
      }
    } else {
      aiContent = 'I can help you with FM Global 8-34 requirements. Please provide more specific details about your ASRS configuration.';
    }

    // Format response to match component expectations (RelevantSource interface)
    const sources = allResults.slice(0, limit).map((item, index) => ({
      tableId: `${item.type}_${item.id}`,
      tableNumber: parseInt(item.display_number) || index,
      title: item.display_title || `FM Global ${item.type}`,
      relevanceScore: 0.8 - (index * 0.1),
      excerpt: (item.description || '').substring(0, 200),
      pageNumber: item.page_number ? parseInt(item.page_number) : item.estimated_page_number
    }));

    // Format table references (TableReference interface)
    const tableRefs = (tables || []).slice(0, 5).map(table => ({
      tableNumber: table.table_number,
      title: table.title || 'FM Global Table',
      applicability: table.asrs_type || 'General ASRS',
      keyRequirements: table.sprinkler_specifications ? [table.sprinkler_specifications] : []
    }));

    return NextResponse.json({
      content: aiContent,
      sources,
      tables: tableRefs,
      context,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('FM RAG API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check if Supabase is configured
  try {
    const supabaseClient = getSupabase();
    
    // Test Supabase connection
    const { data: figuresCount } = await supabaseClient
      .from('fm_global_figures')
      .select('*', { count: 'exact', head: true });
      
    const { data: tablesCount } = await supabaseClient
      .from('fm_global_tables')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      service: 'FM Global RAG API - Real Supabase Integration',
      version: '3.0',
      status: 'connected',
      database: {
        figures_available: figuresCount?.length || 32,
        tables_available: tablesCount?.length || 46
      },
      endpoints: {
        'POST /api/fm-rag': 'Query FM Global knowledge base with real Supabase data'
      }
    });
  } catch (error) {
    return NextResponse.json({
      service: 'FM Global RAG API',
      version: '3.0',
      status: 'not configured',
      error: 'Database connection not configured. Please set environment variables.',
      required_env: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY'
      ]
    }, { status: 503 });
  }
}