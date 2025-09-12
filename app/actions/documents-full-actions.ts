/**
 * DOCUMENTS ACTIONS - Complete document management system
 * 
 * PURPOSE: Full CRUD operations for documents
 * FUNCTIONALITY:
 *   - Document listing
 *   - Document creation and updates
 *   - Document deletion
 * DEPENDENCIES:
 *   - Supabase client (service client for RLS bypass)
 *   - Next.js cache revalidation
 *   - Database types for TypeScript safety
 * USAGE: Core document management throughout the application
 */

"use server"

import { createServiceClient } from "@/utils/supabase/service"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/database.types"

type Document = Database["public"]["Tables"]["documents"]["Row"]
type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"]
type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"]

export async function getDocuments(filterBySource?: string) {
  // Use service client to bypass RLS for development
  const supabase = createServiceClient()
  
  let query = supabase.from("documents").select("*")
  
  // If filterBySource is provided, filter documents where metadata contains the source
  if (filterBySource) {
    // We need to filter by metadata->source = filterBySource
    // Note: This requires proper indexing in the database for performance
    query = query.filter('metadata->>source', 'eq', filterBySource)
  }
  
  const { data: documents, error } = await query

  if (error) {
    console.error("Error fetching documents:", error)
    return { documents: [], error: error.message }
  }

  // Sort documents by date (extracted from metadata) in descending order
  const sortedDocuments = (documents || []).sort((a, b) => {
    // Extract dates from metadata with proper type checking
    const metadataA = a.metadata && typeof a.metadata === 'object' && !Array.isArray(a.metadata) ? a.metadata as any : {}
    const metadataB = b.metadata && typeof b.metadata === 'object' && !Array.isArray(b.metadata) ? b.metadata as any : {}
    
    const dateA = metadataA.date || metadataA.created_at || metadataA.updated_at || null
    const dateB = metadataB.date || metadataB.created_at || metadataB.updated_at || null
    
    // If both have dates, sort by date (most recent first)
    if (dateA && dateB) {
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    }
    
    // If only one has a date, prioritize the one with a date
    if (dateA && !dateB) return -1
    if (!dateA && dateB) return 1
    
    // If neither has a date, fallback to sorting by ID (most recent first)
    return b.id - a.id
  })

  return { documents: sortedDocuments, error: null }
}

export async function getDocumentById(id: number) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching document:", error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createDocument(document: DocumentInsert) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("documents")
    .insert(document)
    .select()
    .single()

  if (error) {
    console.error("Error creating document:", error)
    return { data: null, error: error.message }
  }

  revalidatePath("/documents")
  return { data, error: null }
}

export async function updateDocument(id: number, updates: DocumentUpdate) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating document:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No document found with id:", id)
    return { data: null, error: "Document not found" }
  }

  revalidatePath("/documents")
  return { data: data[0], error: null }
}

export async function deleteDocument(id: number) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting document:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/documents")
  return { success: true, error: null }
}