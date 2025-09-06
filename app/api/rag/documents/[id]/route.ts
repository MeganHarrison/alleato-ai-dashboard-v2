// Individual document API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { documentOperations, chunkOperations, storageOperations } from '@/lib/rag/supabase-client';

// GET - Get document by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await documentOperations.getById(params.id);
    
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

    return NextResponse.json({ document });

  } catch (error) {
    console.error('Error getting document:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to get document',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await documentOperations.getById(params.id);
    
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

    // Delete from storage if file exists
    if (document.file_path) {
      try {
        await storageOperations.deleteDocument(document.file_path);
      } catch (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }
    }

    // Delete chunks (cascaded by foreign key)
    // Delete document
    await documentOperations.delete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to delete document',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// PATCH - Update document
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const document = await documentOperations.getById(params.id);
    
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

    // Update document
    const updatedDocument = await documentOperations.update(params.id, body);

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });

  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to update document',
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
      'Access-Control-Allow-Methods': 'GET, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}