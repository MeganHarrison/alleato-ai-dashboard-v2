// Temporarily disabled - documents_embeddings table does not exist
export {};

/*
"use server"

import { createClient } from "@/utils/supabase/server"

export async function insertDocumentEmbedding(content: string, embedding: number[]) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("documents_embeddings").insert({
      content,
      embedding,
    })
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error inserting document embedding:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function queryDocumentEmbeddings(queryEmbedding: number[], matchCount = 5) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
    })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error querying document embeddings:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}
*/
