"use server"

import { createServiceClient } from "@/utils/supabase/service"

/**
 * Alternative simple query for meeting chunks that bypasses the problematic search function
 */
export async function queryMeetingChunksSimple(
  queryEmbedding: number[],
  matchCount: number = 5,
  matchThreshold: number = 0.7
) {
  try {
    const supabase = createServiceClient()
    
    // First, let's just get the most recent meeting chunks
    // This is a temporary workaround until we fix the vector search
    const { data, error } = await supabase
      .from("meeting_chunks")
      .select(`
        id,
        content,
        chunk_type,
        speaker_info,
        metadata,
        meeting_id,
        created_at,
        meetings!meeting_chunks_meeting_id_fkey (
          id,
          title,
          date,
          summary,
          project_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(matchCount);

    if (error) {
      console.error("Error fetching meeting chunks:", error);
      return { success: false, error: error.message };
    }

    // Format the results to match expected structure
    const formattedData = data?.map((chunk: any) => ({
      content: chunk.content,
      meeting_title: chunk.meetings.title,
      meeting_date: chunk.meetings.date,
      chunk_type: chunk.chunk_type,
      similarity: 0.8, // Fake similarity for now
      metadata: chunk.metadata,
      speakers: chunk.speaker_info?.speakers || [],
    }));

    return { success: true, data: formattedData || [] };
  } catch (error) {
    console.error("Error in queryMeetingChunksSimple:", error);
    return { success: false, error: (error as Error).message };
  }
}