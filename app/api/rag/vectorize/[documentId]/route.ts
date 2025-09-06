// Vectorization API endpoint for documents

import { NextRequest, NextResponse } from 'next/server';
import { 
  documentOperations, 
  chunkOperations, 
  queueOperations,
  storageOperations 
} from '@/lib/rag/supabase-client';
import { 
  chunkText, 
  extractTextFromFile, 
  normalizeText,
  estimateTokens 
} from '@/lib/rag/text-processing';
import { 
  generateEmbeddings, 
  processDocumentForEmbeddings,
  DEFAULT_EMBEDDING_CONFIG 
} from '@/lib/rag/embeddings';
import { ChunkingConfig } from '@/lib/rag/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const body = await request.json();
    const config: ChunkingConfig = {
      chunk_size: body.chunk_size || 1000,
      chunk_overlap: body.chunk_overlap || 200,
      separator: body.separator || '\n\n',
      keep_separator: body.keep_separator || false,
    };

    const embeddingModel = body.embedding_model || DEFAULT_EMBEDDING_CONFIG.model;

    // Get document
    const document = await documentOperations.getById(params.documentId);
    
    if (!document) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Document not found' 
          } 
        },
        { status: 404 }
      );
    }

    // Check if already processing
    if (document.status === 'processing') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'PROCESSING_ERROR', 
            message: 'Document is already being processed' 
          } 
        },
        { status: 400 }
      );
    }

    // Update document status
    await documentOperations.update(params.documentId, {
      status: 'processing',
    });

    // Create processing job
    const job = await queueOperations.createJob({
      document_id: params.documentId,
      job_type: 'embed',
      status: 'processing',
      config: {
        ...config,
        embedding_model: embeddingModel,
      },
    });

    // Start async processing
    processDocumentAsync(params.documentId, config, embeddingModel, job.id);

    return NextResponse.json({
      success: true,
      job_id: job.id,
      status: 'queued',
      estimated_time: 30,
    });

  } catch (error) {
    console.error('Error starting vectorization:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to start vectorization',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// Async processing function
async function processDocumentAsync(
  documentId: string,
  config: ChunkingConfig,
  embeddingModel: string,
  jobId: string
) {
  try {
    // Get document
    const document = await documentOperations.getById(documentId);
    if (!document || !document.file_path) {
      throw new Error('Document or file path not found');
    }

    // Download file from storage
    const fileBlob = await storageOperations.downloadDocument(document.file_path);
    const fileText = await fileBlob.text();

    // Extract and normalize text
    const normalizedText = normalizeText(fileText);

    // Chunk the text
    const chunks = chunkText(normalizedText, config);

    // Delete existing chunks
    await chunkOperations.deleteByDocumentId(documentId);

    // Prepare chunks for database
    const chunkRecords = chunks.map((content, index) => ({
      document_id: documentId,
      chunk_index: index,
      content,
      tokens: estimateTokens(content),
      metadata: {
        chunk_size: content.length,
        chunk_number: index + 1,
        total_chunks: chunks.length,
      },
    }));

    // Save chunks without embeddings first
    const savedChunks = await chunkOperations.createMany(chunkRecords);

    // Generate embeddings
    const chunksForEmbedding = savedChunks.map(chunk => ({
      id: chunk.id,
      content: chunk.content,
    }));

    const embeddedChunks = await processDocumentForEmbeddings(
      chunksForEmbedding,
      {
        model: embeddingModel,
        dimensions: 1536,
        batch_size: 50,
      }
    );

    // Update chunks with embeddings
    for (const embeddedChunk of embeddedChunks) {
      // This would need a custom update function to handle vector type
      // For now, we'll use a raw SQL query through Supabase
      await updateChunkEmbedding(embeddedChunk.id, embeddedChunk.embedding);
    }

    // Update document status
    await documentOperations.update(documentId, {
      status: 'completed',
      chunks_count: chunks.length,
      processed_at: new Date().toISOString(),
    });

    // Update job status
    await queueOperations.updateJobStatus(jobId, 'completed');

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update document status
    await documentOperations.update(documentId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    // Update job status
    await queueOperations.updateJobStatus(
      jobId, 
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Helper function to update chunk embedding using raw SQL
async function updateChunkEmbedding(chunkId: string, embedding: number[]) {
  const { supabase } = await import('@/lib/rag/supabase-client');
  
  // Convert embedding array to PostgreSQL vector format
  const vectorString = `[${embedding.join(',')}]`;
  
  const { error } = await supabase
    .from('rag_chunks')
    .update({ embedding: vectorString })
    .eq('id', chunkId);

  if (error) {
    console.error('Error updating chunk embedding:', error);
    throw error;
  }
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