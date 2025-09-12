import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const text = formData.get("text") as string | null
    const title = formData.get("title") as string || "Manual Upload"
    const date = formData.get("date") as string || new Date().toISOString()
    const metadataStr = formData.get("metadata") as string | null
    
    if (!file && !text) {
      return NextResponse.json(
        { error: "Please provide either a file or text content" },
        { status: 400 }
      )
    }
    
    let content = ""
    let fileName = ""
    
    if (file) {
      // Read file content
      content = await file.text()
      fileName = file.name
      // Use the file name as title if not provided
      if (title === "Manual Upload") {
        title = file.name
      }
    } else if (text) {
      content = text
      fileName = `manual-upload-${Date.now()}.txt`
    }
    
    // Parse metadata if provided
    let parsedMetadata = {}
    if (metadataStr) {
      try {
        parsedMetadata = JSON.parse(metadataStr)
      } catch (e) {
        console.warn("Failed to parse metadata:", e)
      }
    }
    
    // Generate document ID
    const documentId = crypto.randomUUID()
    
    // Upload to Supabase Storage
    const storagePath = `documents/${documentId}/${fileName}`
    
    // Upload file bytes directly for binary files, or text content for text files
    const uploadContent = file ? new Blob([await file.arrayBuffer()]) : content
    
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, uploadContent, {
        contentType: file?.type || "text/plain",
        upsert: true
      })
    
    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload document to storage" },
        { status: 500 }
      )
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(storagePath)
    
    // Prepare metadata with source field
    const fullMetadata = {
      ...parsedMetadata,
      original_filename: fileName,
      upload_type: "manual",
      uploaded_at: new Date().toISOString(),
      storage_path: storagePath,
      public_url: publicUrl,
      source: "document", // Set source field in metadata
      file_type: file?.type || "text/plain",
      file_size: file?.size || content.length
    }
    
    // Save to documents table
    const { data: savedDoc, error: dbError } = await supabase
      .from("documents")
      .insert({
        content: content,
        document_type: "document", // Set as "document" type
        metadata: fullMetadata
      })
      .select()
      .single()
    
    if (dbError) {
      console.error("Database insert error:", dbError)
      // Try to clean up storage
      await supabase.storage.from("documents").remove([storagePath])
      
      return NextResponse.json(
        { error: { message: "Failed to save document to database" } },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        id: savedDoc.id,
        content: savedDoc.content,
        document_type: savedDoc.document_type,
        metadata: savedDoc.metadata
      }
    })
    
  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload document" },
      { status: 500 }
    )
  }
}