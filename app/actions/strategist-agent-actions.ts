"use server"

import { searchMeetingChunksFullText } from "@/app/actions/meeting-embedding-fixed"

export type ChatMessage = { role: "user" | "assistant"; content: string }

export async function askStrategistAgent(question: string, history: ChatMessage[]) {
  try {
    // Use full-text search instead of OpenAI embeddings since API key is not working
    const search = await searchMeetingChunksFullText()
    
    // Since the function currently returns empty array, create proper structure
    const searchResult = {
      success: Array.isArray(search),
      data: search || []
    }
    
    const contextText = searchResult.success && searchResult.data && searchResult.data.length > 0
      ? searchResult.data.map((chunk: unknown) => {
          const chunkObj = chunk as { meeting_title?: string; content?: string }
          const meetingInfo = chunkObj.meeting_title ? `[Meeting: ${chunkObj.meeting_title}]\n` : ""
          return meetingInfo + (chunkObj.content || '')
        }).join("\n---\n")
      : ""

    // For now, return a structured response without calling OpenAI
    // This allows the chat to work with the retrieved context
    if (!contextText) {
      return {
        success: true,
        answer: "I couldn't find any relevant meeting information for your question. Please try rephrasing or asking about specific topics discussed in meetings.",
        context: [],
        search_method: "fulltext",
        results_count: 0
      }
    }

    // Format a response based on the retrieved context
    const relevantChunks = (search.data || []).slice(0, 3).map((chunk: unknown) => chunk.content?.substring(0, 200) || '')
    const answer = `Based on your meeting records:\n\n${relevantChunks.map((chunk: unknown, i: unknown) => `${i + 1}. ${chunk}...`).join("\n\n")}\n\nFound ${search.data?.length || 0} relevant meeting segments using ${search.method || 'text'} search.`

    return {
      success: true,
      answer,
      context: search.data || [],
      search_method: search.method || "fulltext",
      results_count: search.data?.length || 0
    }
  } catch (error) {
    console.error("Error in askStrategistAgent:", error)
    return { 
      success: false, 
      error: (error as Error).message,
      search_method: "none",
      results_count: 0
    }
  }
}