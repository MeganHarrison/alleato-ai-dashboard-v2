import { supabaseAdmin } from '@/lib/db/supabase'
import { EmbeddedChunk } from './embeddings'

export interface StoredDocument {
  id: string
  title: string
  content: string
  metadata: Record<string, any>
  embedding: number[]
  chunk_metadata: Record<string, any>
  created_at: string
  project_id?: string
}

export class VectorStorage {
  private supabase: ReturnType<typeof supabaseAdmin>

  constructor() {
    this.supabase = supabaseAdmin()
  }

  /**
   * Store document chunks with embeddings
   */
  async storeDocumentChunks(
    chunks: EmbeddedChunk[],
    documentMetadata: {
      title: string
      source: string
      project_id?: string
      file_type?: string
      [key: string]: any
    }
  ): Promise<{ success: boolean; stored: number; errors: string[] }> {
    const errors: string[] = []
    let stored = 0

    // Batch insert for better performance
    const batchSize = 50
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length))
      
      const documents = batch.map((chunk, index) => ({
        title: `${documentMetadata.title} - Chunk ${i + index + 1}`,
        content: chunk.content,
        metadata: {
          ...documentMetadata,
          chunk_index: i + index,
          total_chunks: chunks.length,
        },
        embedding: chunk.embedding,
        chunk_metadata: chunk.metadata,
        project_id: documentMetadata.project_id,
      }))

      try {
        const { data, error } = await this.supabase
          .from('documents')
          .insert(documents)
          .select()

        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        } else {
          stored += data?.length || 0
        }
      } catch (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      stored,
      errors,
    }
  }

  /**
   * Store meeting chunks with embeddings
   */
  async storeMeetingChunks(
    chunks: EmbeddedChunk[],
    meetingId: string,
    additionalMetadata?: Record<string, any>
  ): Promise<{ success: boolean; stored: number; errors: string[] }> {
    const errors: string[] = []
    let stored = 0

    const meetingChunks = chunks.map((chunk, index) => ({
      meeting_id: meetingId,
      content: chunk.content,
      metadata: {
        ...additionalMetadata,
        ...chunk.metadata,
        chunk_index: index,
        total_chunks: chunks.length,
      },
      embedding: chunk.embedding,
    }))

    try {
      const { data, error } = await this.supabase
        .from('meeting_chunks')
        .insert(meetingChunks)
        .select()

      if (error) {
        errors.push(`Meeting chunks: ${error.message}`)
      } else {
        stored = data?.length || 0
      }
    } catch (error) {
      errors.push(`Meeting chunks: ${error}`)
    }

    return {
      success: errors.length === 0,
      stored,
      errors,
    }
  }

  /**
   * Search for similar documents
   */
  async searchDocuments(
    queryEmbedding: number[],
    options: {
      matchThreshold?: number
      matchCount?: number
      projectId?: string
      filter?: Record<string, any>
    } = {}
  ): Promise<StoredDocument[]> {
    const {
      matchThreshold = 0.7,
      matchCount = 10,
      projectId,
      filter = {},
    } = options

    try {
      const { data, error } = await this.supabase
        .rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount,
        })

      if (error) {
        console.error('Search error:', error)
        return []
      }

      // Apply additional filters
      let results = data || []
      
      if (projectId) {
        results = results.filter((doc: any) => doc.project_id === projectId)
      }

      if (Object.keys(filter).length > 0) {
        results = results.filter((doc: any) => {
          return Object.entries(filter).every(([key, value]) => {
            return doc.metadata?.[key] === value
          })
        })
      }

      return results
    } catch (error) {
      console.error('Search failed:', error)
      return []
    }
  }

  /**
   * Search meeting chunks
   */
  async searchMeetingChunks(
    queryEmbedding: number[],
    options: {
      matchThreshold?: number
      matchCount?: number
      meetingId?: string
    } = {}
  ): Promise<any[]> {
    const {
      matchThreshold = 0.7,
      matchCount = 10,
      meetingId,
    } = options

    try {
      const { data, error } = await this.supabase
        .rpc('match_meeting_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount,
          meeting_id: meetingId,
        })

      if (error) {
        console.error('Meeting search error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Meeting search failed:', error)
      return []
    }
  }

  /**
   * Update document embedding
   */
  async updateDocumentEmbedding(
    documentId: string,
    embedding: number[]
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('documents')
        .update({ embedding })
        .eq('id', documentId)

      if (error) {
        console.error('Update error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Update failed:', error)
      return false
    }
  }

  /**
   * Delete document and its embedding
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        console.error('Delete error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Delete failed:', error)
      return false
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<StoredDocument | null> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) {
        console.error('Get document error:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Get document failed:', error)
      return null
    }
  }

  /**
   * List documents with pagination
   */
  async listDocuments(
    options: {
      projectId?: string
      limit?: number
      offset?: number
      orderBy?: string
      ascending?: boolean
    } = {}
  ): Promise<{ documents: StoredDocument[]; total: number }> {
    const {
      projectId,
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      ascending = false,
    } = options

    try {
      let query = this.supabase
        .from('documents')
        .select('*', { count: 'exact' })
        
      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      query = query
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('List documents error:', error)
        return { documents: [], total: 0 }
      }

      return {
        documents: data || [],
        total: count || 0,
      }
    } catch (error) {
      console.error('List documents failed:', error)
      return { documents: [], total: 0 }
    }
  }

  /**
   * Clean up orphaned embeddings
   */
  async cleanupOrphanedEmbeddings(): Promise<number> {
    try {
      // Find documents with null content but non-null embeddings
      const { data, error } = await this.supabase
        .from('documents')
        .select('id')
        .is('content', null)
        .not('embedding', 'is', null)

      if (error) {
        console.error('Cleanup query error:', error)
        return 0
      }

      if (!data || data.length === 0) {
        return 0
      }

      // Delete orphaned records
      const { error: deleteError } = await this.supabase
        .from('documents')
        .delete()
        .in('id', data.map(d => d.id))

      if (deleteError) {
        console.error('Cleanup delete error:', deleteError)
        return 0
      }

      return data.length
    } catch (error) {
      console.error('Cleanup failed:', error)
      return 0
    }
  }
}