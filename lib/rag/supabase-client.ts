// Supabase client utilities for RAG system

import { createClient } from '@supabase/supabase-js';
import {
  RagDocument,
  RagChunk,
  RagChatMessage,
  ProcessingJob,
  SearchResult,
  SystemStats,
} from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Document operations
 */
export const documentOperations = {
  async create(document: Partial<RagDocument>): Promise<RagDocument> {
    const { data, error } = await supabase
      .from('rag_documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<RagDocument>): Promise<RagDocument> {
    const { data, error } = await supabase
      .from('rag_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('rag_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getById(id: string): Promise<RagDocument | null> {
    const { data, error } = await supabase
      .from('rag_documents')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    user_id?: string;
  }): Promise<{ documents: RagDocument[]; total: number }> {
    const { page = 1, limit = 20, status, search, user_id } = params;
    const offset = (page - 1) * limit;

    const query = supabase.from('rag_documents').select(`
      *,
      project:projects(id, name)
    `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (user_id) query = query.eq('user_id', user_id);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { documents: data || [], total: count || 0 };
  },
};

/**
 * Chunk operations
 */
export const chunkOperations = {
  async createMany(chunks: Partial<RagChunk>[]): Promise<RagChunk[]> {
    const { data, error } = await supabase
      .from('document_chunks')
      .insert(chunks)
      .select();

    if (error) throw error;
    return data;
  },

  async getByDocumentId(documentId: string): Promise<RagChunk[]> {
    const { data, error } = await supabase
      .from('document_chunks')
      .select()
      .eq('document_id', documentId)
      .order('chunk_index');

    if (error) throw error;
    return data || [];
  },

  async deleteByDocumentId(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (error) throw error;
  },

  async searchSimilar(
    embedding: number[],
    limit: number = 10,
    threshold: number = 0.7,
    documentIds?: string[]
  ): Promise<SearchResult[]> {
    const query = supabase.rpc('match_document_chunks', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_document_ids: documentIds || null,
    });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },
};

/**
 * Chat history operations
 */
export const chatOperations = {
  async createMessage(message: Partial<RagChatMessage>): Promise<RagChatMessage> {
    const { data, error } = await supabase
      .from('chat_history')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSessionHistory(sessionId: string): Promise<RagChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_history')
      .select()
      .eq('session_id', sessionId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  async getUserSessions(userId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat_history')
      .select('session_id, max(created_at) as last_message_at')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

/**
 * Processing queue operations
 */
export const queueOperations = {
  async createJob(job: Partial<ProcessingJob>): Promise<ProcessingJob> {
    const { data, error } = await supabase
      .from('processing_queue')
      .insert(job)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getNextJob(): Promise<ProcessingJob | null> {
    const { data, error } = await supabase
      .from('processing_queue')
      .select()
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .order('created_at')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async updateJobStatus(
    id: string,
    status: ProcessingJob['status'],
    error_message?: string
  ): Promise<void> {
    const updates: unknown = { status };
    if (status === 'processing') updates.started_at = new Date().toISOString();
    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
      if (error_message) updates.error_message = error_message;
    }

    const { error } = await supabase
      .from('processing_queue')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async getJobsByDocument(documentId: string): Promise<ProcessingJob[]> {
    const { data, error } = await supabase
      .from('processing_queue')
      .select()
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

/**
 * Storage operations
 */
export const storageOperations = {
  async uploadDocument(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('rag_documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data.path;
  },

  async downloadDocument(path: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('rag_documents')
      .download(path);

    if (error) throw error;
    return data;
  },

  async deleteDocument(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('rag_documents')
      .remove([path]);

    if (error) throw error;
  },

  async getPublicUrl(path: string): Promise<string> {
    const { data } = supabase.storage
      .from('rag_documents')
      .getPublicUrl(path);

    return data.publicUrl;
  },
};

/**
 * Statistics operations
 */
export const statsOperations = {
  async getSystemStats(): Promise<SystemStats> {
    // Get document stats
    const { data: docStats, error: docError } = await supabase
      .from('rag_documents')
      .select('status')
      .then(({ data }) => {
        const stats = {
          total: data?.length || 0,
          processing: data?.filter(d => d.status === 'processing').length || 0,
          completed: data?.filter(d => d.status === 'completed').length || 0,
          failed: data?.filter(d => d.status === 'failed').length || 0,
        };
        return { data: stats, error: null };
      });

    // Get chunk stats
    const { count: chunkCount, error: chunkError } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true });

    // Get last processed document
    const { data: lastProcessed } = await supabase
      .from('rag_documents')
      .select('processed_at')
      .eq('status', 'completed')
      .order('processed_at', { ascending: false })
      .limit(1)
      .single();

    // Get usage stats (simplified for now)
    const { count: todayQueries } = await supabase
      .from('chat_history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]);

    const { count: monthQueries } = await supabase
      .from('chat_history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    return {
      documents: docStats || {
        total: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      },
      vectors: {
        total_chunks: chunkCount || 0,
        total_embeddings: chunkCount || 0,
        embedding_dimension: 1536,
        last_processed: lastProcessed?.processed_at,
      },
      storage: {
        documents_size_mb: 0, // Would need to calculate from storage
        vectors_size_mb: (chunkCount || 0) * 1536 * 4 / (1024 * 1024), // Rough estimate
        total_size_mb: 0,
      },
      usage: {
        queries_today: todayQueries || 0,
        queries_this_month: monthQueries || 0,
        avg_response_time_ms: 320, // Placeholder
      },
    };
  },
};

/**
 * Create vector similarity search function in database
 */
export async function createVectorSearchFunction() {
  const functionSQL = `
    CREATE OR REPLACE FUNCTION match_rag_chunks(
      query_embedding vector(1536),
      match_threshold float,
      match_count int,
      filter_document_ids uuid[] DEFAULT NULL
    )
    RETURNS TABLE(
      chunk_id uuid,
      document_id uuid,
      document_title text,
      content text,
      relevance_score float,
      metadata jsonb
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        c.id as chunk_id,
        c.document_id,
        d.title as document_title,
        c.content,
        1 - (c.embedding <=> query_embedding) as relevance_score,
        c.metadata
      FROM rag_chunks c
      JOIN rag_documents d ON c.document_id = d.id
      WHERE 
        (filter_document_ids IS NULL OR c.document_id = ANY(filter_document_ids))
        AND 1 - (c.embedding <=> query_embedding) > match_threshold
      ORDER BY c.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: functionSQL });
  if (error) console.error('Error creating vector search function:', error);
}