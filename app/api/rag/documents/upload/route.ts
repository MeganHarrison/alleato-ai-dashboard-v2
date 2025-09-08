// Document upload API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { documentOperations, storageOperations, queueOperations } from '@/lib/rag/supabase-client';
import { extractMetadata, normalizeText } from '@/lib/rag/text-processing';
import { RagDocument } from '@/lib/rag/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;
    
    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'No file provided' 
          } 
        },
        { status: 400 }
      );
    }
    
    console.log('Uploading file:', file.name, 'Size:', file.size);

    // Parse metadata if provided
    let metadata = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    }

    // Validate file type
    const allowedTypes = ['pdf', 'txt', 'md', 'markdown', 'docx', 'doc'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: `File type not supported. Allowed types: ${allowedTypes.join(', ')}` 
          } 
        },
        { status: 400 }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `documents/${timestamp}_${sanitizedFileName}`;

    // Upload file to storage (with error handling)
    let storagePath;
    try {
      storagePath = await storageOperations.uploadDocument(file, filePath);
      console.log('File uploaded to storage:', storagePath);
    } catch (storageError: any) {
      console.error('Storage upload error:', storageError);
      // If storage bucket doesn't exist, return a helpful error
      if (storageError.message?.includes('not found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'STORAGE_ERROR', 
              message: 'Storage bucket "rag_documents" not found. Please create it in Supabase.' 
            } 
          },
          { status: 500 }
        );
      }
      throw storageError;
    }

    // Extract text content for initial metadata
    const fileContent = await file.text();
    const extractedMetadata = extractMetadata(fileContent, file.name);

    // Create document record
    const document: Partial<RagDocument> = {
      title: (metadata as any).title || extractedMetadata.title || file.name,
      source: (metadata as any).source || 'upload',
      file_path: storagePath,
      file_type: fileExtension,
      file_size: file.size,
      status: 'pending',
      // content: '', // Empty initially, will be populated during processing
      tags: (metadata as any).tags || extractedMetadata.extracted_tags || [],
      category: (metadata as any).category,
      metadata: {
        ...extractedMetadata,
        ...metadata,
        original_name: file.name,
        upload_timestamp: new Date().toISOString(),
      },
    };

    let createdDocument;
    try {
      createdDocument = await documentOperations.create(document);
      console.log('Document created:', createdDocument.id);
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      // If table doesn't exist, return a helpful error
      if (dbError.message?.includes('rag_documents')) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'DATABASE_ERROR', 
              message: 'Table "rag_documents" not found. Please run the database migrations.' 
            } 
          },
          { status: 500 }
        );
      }
      throw dbError;
    }

    // Create processing jobs (optional - handle error gracefully)
    try {
      await queueOperations.createJob({
        document_id: createdDocument.id,
        job_type: 'chunk',
        status: 'queued',
        priority: 5,
        config: {
          chunk_size: 1000,
          chunk_overlap: 200,
        },
      });
    } catch (queueError) {
      console.warn('Queue creation failed (non-critical):', queueError);
      // Continue even if queue creation fails
    }

    return NextResponse.json({
      success: true,
      document: createdDocument,
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to upload document',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
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