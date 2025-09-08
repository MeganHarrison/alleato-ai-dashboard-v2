import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get pending documents
    const { data: documents, error } = await supabase
      .from("documents")
      .select("id, title, document_type, processing_status, created_at, processed_at, processing_error")
      .eq("processing_status", "pending")
      .order("created_at", { ascending: true })
      .limit(50)
    
    if (error) {
      console.error("Error fetching pending documents:", error)
      return NextResponse.json(
        { error: "Failed to fetch pending documents" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      documents: documents || [],
      count: documents?.length || 0
    })
    
  } catch (error) {
    console.error("Error in pending documents API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}