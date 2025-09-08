import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { InsightGenerator } from '@/monorepo-agents/pm-rag-vectorize/lib/ai/agents/insight-generator';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, documentIds, source = 'manual' } = body;

    if (!documentId && !documentIds) {
      return NextResponse.json(
        { error: 'Either documentId or documentIds must be provided' },
        { status: 400 }
      );
    }

    // Initialize the insight generator
    const insightGenerator = new InsightGenerator();
    
    // Process single document or batch
    let result;
    if (documentIds && Array.isArray(documentIds)) {
      // Batch processing
      result = await insightGenerator.batchGenerateInsights(documentIds);
    } else {
      // Single document processing
      result = await insightGenerator.generateDocumentInsights(documentId);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Insights generated successfully for ${documentIds ? documentIds.length + ' documents' : 'document'}`
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate insights' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check insight generation status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let query = supabase
      .from('ai_insights')
      .select(`
        *,
        documents(title, source, created_at),
        projects(name, phase)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch insights' 
      },
      { status: 500 }
    );
  }
}