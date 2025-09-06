// Vectorization job status API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { queueOperations } from '@/lib/rag/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { supabase } = await import('@/lib/rag/supabase-client');
    
    // Get job details
    const { data: job, error } = await supabase
      .from('rag_processing_queue')
      .select('*')
      .eq('id', params.jobId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Job not found' 
          } 
        },
        { status: 404 }
      );
    }

    // Get document chunks count for progress
    const { count: totalChunks } = await supabase
      .from('rag_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', job.document_id);

    // Calculate progress
    let progress = 0;
    if (job.status === 'completed') {
      progress = 100;
    } else if (job.status === 'processing' && totalChunks) {
      // Estimate progress based on time elapsed (simplified)
      const startTime = new Date(job.started_at).getTime();
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      progress = Math.min(90, Math.floor((elapsed / 30000) * 90)); // Max 90% until completed
    }

    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      progress,
      chunks_processed: totalChunks || 0,
      total_chunks: totalChunks || 0,
      error: job.error_message,
    });

  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to get job status',
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