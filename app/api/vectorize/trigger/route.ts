import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { OpenAI } from "openai"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

interface DocumentChunk {
  document_id: string
  chunk_index: number
  content: string
  embedding?: number[]
  metadata?: Record<string, any>
}

async function chunkDocument(content: string, maxChunkSize: number = 1500): Promise<string[]> {
  const chunks: string[] = []
  const sentences = content.split(/(?<=[.!?])\s+/)
  let currentChunk = ""
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentIds } = body
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      // If no specific IDs provided, get all pending documents
      const { data: pendingDocs } = await supabase
        .from("documents")
        .select("id, content")
        .eq("processing_status", "pending")
        .limit(10)
      
      if (!pendingDocs || pendingDocs.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No pending documents to process",
          documentsQueued: 0
        })
      }
      
      const docsToProcess = pendingDocs
      let processedCount = 0
      const errors: string[] = []
      
      for (const doc of docsToProcess) {
        try {
          // Update status to processing
          await supabase
            .from("documents")
            .update({ 
              processing_status: "processing",
              updated_at: new Date().toISOString()
            })
            .eq("id", doc.id)
          
          // Chunk the document
          const chunks = await chunkDocument(doc.content || "")
          
          // Generate embeddings and save chunks
          for (let i = 0; i < chunks.length; i++) {
            const embedding = await generateEmbedding(chunks[i])
            
            // Save chunk with embedding
            const { error: chunkError } = await supabase
              .from("document_chunks")
              .insert({
                document_id: doc.id,
                chunk_index: i,
                content: chunks[i],
                embedding: embedding,
                metadata: {
                  chunk_number: i + 1,
                  total_chunks: chunks.length
                },
                created_at: new Date().toISOString()
              })
            
            if (chunkError) {
              console.error(`Error saving chunk ${i} for document ${doc.id}:`, chunkError)
              throw chunkError
            }
          }
          
          // Update document status to completed
          await supabase
            .from("documents")
            .update({ 
              processing_status: "completed",
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: supabase.sql`
                COALESCE(metadata, '{}'::jsonb) || 
                jsonb_build_object('chunks_count', ${chunks.length})
              `
            })
            .eq("id", doc.id)
          
          processedCount++
        } catch (error) {
          console.error(`Error processing document ${doc.id}:`, error)
          errors.push(`${doc.id}: ${error instanceof Error ? error.message : "Unknown error"}`)
          
          // Update document status to failed
          await supabase
            .from("documents")
            .update({ 
              processing_status: "failed",
              processing_error: error instanceof Error ? error.message : "Processing failed",
              updated_at: new Date().toISOString()
            })
            .eq("id", doc.id)
        }
      }
      
      return NextResponse.json({
        success: true,
        message: "Vectorization process started",
        documentsQueued: docsToProcess.length,
        documentsProcessed: processedCount,
        errors: errors.length > 0 ? errors : undefined
      })
    }
    
    // Process specific document IDs
    let processedCount = 0
    const errors: string[] = []
    
    for (const docId of documentIds) {
      try {
        // Get document content
        const { data: doc, error: fetchError } = await supabase
          .from("documents")
          .select("id, content")
          .eq("id", docId)
          .single()
        
        if (fetchError || !doc) {
          errors.push(`${docId}: Document not found`)
          continue
        }
        
        // Update status to processing
        await supabase
          .from("documents")
          .update({ 
            processing_status: "processing",
            updated_at: new Date().toISOString()
          })
          .eq("id", docId)
        
        // Chunk the document
        const chunks = await chunkDocument(doc.content || "")
        
        // Generate embeddings and save chunks
        for (let i = 0; i < chunks.length; i++) {
          const embedding = await generateEmbedding(chunks[i])
          
          // Save chunk with embedding
          await supabase
            .from("document_chunks")
            .insert({
              document_id: docId,
              chunk_index: i,
              content: chunks[i],
              embedding: embedding,
              metadata: {
                chunk_number: i + 1,
                total_chunks: chunks.length
              },
              created_at: new Date().toISOString()
            })
        }
        
        // Update document status to completed
        await supabase
          .from("documents")
          .update({ 
            processing_status: "completed",
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", docId)
        
        processedCount++
      } catch (error) {
        console.error(`Error processing document ${docId}:`, error)
        errors.push(`${docId}: ${error instanceof Error ? error.message : "Unknown error"}`)
        
        // Update document status to failed
        await supabase
          .from("documents")
          .update({ 
            processing_status: "failed",
            processing_error: error instanceof Error ? error.message : "Processing failed",
            updated_at: new Date().toISOString()
          })
          .eq("id", docId)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Vectorization process completed",
      documentsQueued: documentIds.length,
      documentsProcessed: processedCount,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error("Vectorization trigger error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger vectorization" },
      { status: 500 }
    )
  }
}