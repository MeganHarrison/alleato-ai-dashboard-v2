"use server"

import { createServiceClient } from "@/utils/supabase/service"

export async function searchMeetingChunksDirectly(searchTerm: string, limit: number = 10) {
  try {
    const supabase = createServiceClient()
    
    // Direct search using ILIKE for pattern matching
    const { data, error } = await supabase
      .from("meeting_chunks")
      .select("id, content, chunk_type, meeting_id, created_at, metadata")
      .ilike('content', `%${searchTerm}%`)
      .limit(limit)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error("Error searching meeting chunks:", error)
      return { success: false, error: error.message, data: [] }
    }
    
    // Format results
    const formattedResults = data?.map(chunk => ({
      id: chunk.id,
      content: chunk.content,
      chunk_type: chunk.chunk_type,
      meeting_id: chunk.meeting_id,
      metadata: chunk.metadata,
      relevance_score: chunk.content.toLowerCase().includes(searchTerm.toLowerCase()) ? 1.0 : 0.5
    })) || []
    
    return { 
      success: true, 
      data: formattedResults,
      count: formattedResults.length
    }
  } catch (error) {
    console.error("Error in searchMeetingChunksDirectly:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}

export async function getRecentMeetingChunks(limit: number = 10) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from("meeting_chunks")
      .select("id, content, chunk_type, created_at, metadata")
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error("Error fetching recent chunks:", error)
      return { success: false, error: error.message, data: [] }
    }
    
    return { 
      success: true, 
      data: data || [],
      count: data?.length || 0
    }
  } catch (error) {
    console.error("Error in getRecentMeetingChunks:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}

export async function getMeetingChunksByType(chunkType: string, limit: number = 10) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from("meeting_chunks")
      .select("id, content, chunk_type, created_at, metadata")
      .eq('chunk_type', chunkType)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error("Error fetching chunks by type:", error)
      return { success: false, error: error.message, data: [] }
    }
    
    return { 
      success: true, 
      data: data || [],
      count: data?.length || 0
    }
  } catch (error) {
    console.error("Error in getMeetingChunksByType:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}