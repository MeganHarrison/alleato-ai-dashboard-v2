"use server"

import { createServiceClient } from "@/utils/supabase/service"

export async function queryMeetingChunks(
  queryEmbedding: number[],
  matchCount: number = 5,
  matchThreshold: number = 0.7,
  projectFilter?: number | null
) {
  try {
    // Use service client to bypass RLS and access all meeting chunks
    const supabase = createServiceClient()
    
    // Convert embedding array to string format expected by the database function
    const embeddingString = `[${queryEmbedding.join(",")}]`
    
    // Call the function with the 4 parameters defined in the migration
    const { data, error } = await supabase.rpc("search_meeting_chunks", {
      query_embedding: embeddingString,
      match_threshold: matchThreshold,
      match_count: matchCount,
      project_filter: projectFilter || undefined
    })

    if (error) {
      console.error("Error searching meeting chunks:", error)
      return { success: false, error: error.message }
    }

    // Format the results for use in chat context
    const formattedData = data?.map((chunk: any) => ({
      content: chunk.chunk_text,
      meeting_title: chunk.meeting_title,
      meeting_date: chunk.meeting_date,
      chunk_type: chunk.chunk_type,
      similarity: chunk.similarity,
      metadata: chunk.metadata,
      speakers: chunk.speakers,
    }))

    return { success: true, data: formattedData || [] }
  } catch (error) {
    console.error("Error in queryMeetingChunks:", error)
    return { success: false, error: (error as Error).message }
  }
}