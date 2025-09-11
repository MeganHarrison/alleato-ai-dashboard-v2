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
    
    if (!file && !text) {
      return NextResponse.json(
        { error: "Please provide either a file or text content" },
        { status: 400 }
      )
    }
    
    const content = ""
    const fileName = ""
    
    if (file) {
      // Read file content
      content = await file.text()
      fileName = file.name
    } else if (text) {
      content = text
      fileName = `manual-upload-${Date.now()}.txt`
    }
    
    // Generate document ID
    const documentId = crypto.randomUUID()
    
    // Upload to Supabase Storage
    const storagePath = `manual-uploads/${documentId}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, content, {
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
    
    // Save to documents table
    const { data: savedDoc, error: dbError } = await supabase
      .from("documents")
      .insert({
        id: documentId,
        title: title,
        source: publicUrl,
        content: content,
        document_type: "manual",
        processing_status: "pending",
        summary: null,  // Will be populated during processing
        action_items: [],  // Will be populated during processing
        bullet_points: [],  // Will be populated during processing
        metadata: {
          original_filename: fileName,
          upload_type: "manual",
          uploaded_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (dbError) {
      console.error("Database insert error:", dbError)
      // Try to clean up storage
      await supabase.storage.from("documents").remove([storagePath])
      
      return NextResponse.json(
        { error: "Failed to save document to database" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      documentId: savedDoc.id,
      title: savedDoc.title,
      status: savedDoc.processing_status
    })
    
  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload document" },
      { status: 500 }
    )
  }
}