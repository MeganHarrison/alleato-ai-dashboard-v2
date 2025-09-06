// Statistics API endpoint for RAG system

import { NextRequest, NextResponse } from 'next/server';
import { statsOperations } from '@/lib/rag/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const stats = await statsOperations.getSystemStats();

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error getting statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to get statistics',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}