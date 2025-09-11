import { processVectorizationQueue } from "@/lib/rag/meeting-vectorization";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Supabase Cron or authenticated
    const authHeader = request.headers.get("authorization");

    // Check if request is from Supabase (you should set up a secret token)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process the vectorization queue
    await processVectorizationQueue();

    return NextResponse.json({
      success: true,
      message: "Vectorization queue processed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process vectorization queue" },
      { status: 500 },
    );
  }
}

// Manual trigger endpoint for testing
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated (for manual triggers)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Scan storage for files
    const { data: files } = await supabase
      .storage
      .from("meetings")
      .list("", { limit: 1000 });

    if (!files || files.length === 0) {
      return NextResponse.json({ message: "No files found in storage" });
    }

    // Process files directly (since queue table doesn't exist)
    // For now, just return the count
    // In production, you'd process these files here

    return NextResponse.json({
      success: true,
      message:
        `Found ${files.length} files in storage bucket ready for vectorization.`,
      totalFiles: files.length,
      sampleFiles: files.slice(0, 5).map((f) => f.name),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process vectorization queue" },
      { status: 500 },
    );
  }
}
