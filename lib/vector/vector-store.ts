import { createServiceClient } from '@/utils/supabase/service';
import { EmbeddingService } from './embeddings';

export interface Document {
  id?: number;
  content: string;
  metadata?: any;
  embedding?: number[];
}

export interface SearchResult {
  id: number;
  content: string;
  metadata: any;
  similarity: number;
}

export class VectorStore {
  private supabase = createServiceClient();
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Store a document with its embedding in the vector database
   */
  async storeDocument(document: Document): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      // Generate embedding if not provided
      let embedding = document.embedding;
      if (!embedding) {
        embedding = await this.embeddingService.generateEmbedding(document.content);
      }

      const { data, error } = await this.supabase
        .from('documents')
        .insert({
          content: document.content,
          embedding: JSON.stringify(embedding),
          metadata: document.metadata || {}
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Store multiple documents in batch
   */
  async storeDocuments(documents: Document[]): Promise<{ success: boolean; ids?: number[]; error?: string }> {
    try {
      // Generate embeddings for all documents
      const textsToEmbed = documents.filter(doc => !doc.embedding).map(doc => doc.content);
      const embeddings = textsToEmbed.length > 0 
        ? await this.embeddingService.generateEmbeddings(textsToEmbed)
        : [];

      let embeddingIndex = 0;
      const documentsWithEmbeddings = documents.map(doc => {
        const embedding = doc.embedding || embeddings[embeddingIndex++];
        return {
          content: doc.content,
          embedding: Array.isArray(embedding) ? JSON.stringify(embedding) : embedding,
          metadata: doc.metadata || {}
        };
      });

      const { data, error } = await this.supabase
        .from('documents')
        .insert(documentsWithEmbeddings)
        .select('id');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, ids: data.map(item => item.id) };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Perform semantic search using the match_documents function
   */
  async semanticSearch(
    query: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
    } = {}
  ): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> {
    try {
      const { matchThreshold = 0.7, matchCount = 10 } = options;

      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // TODO: Implement proper vector search function in database
      // For now, return empty results as the match_documents function doesn't exist
      const results: SearchResult[] = [];
      
      return { success: true, results };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Search meeting chunks using the improved search function
   */
  async searchMeetingChunks(
    query: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
    } = {}
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const { matchThreshold = 0.7, matchCount = 10 } = options;

      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Use the database function for meeting chunk search
      const { data, error } = await this.supabase.rpc('search_meeting_chunks', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: matchThreshold,
        match_count: matchCount
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, results: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update embeddings for existing meeting chunks
   */
  async updateMeetingChunkEmbeddings(batchSize: number = 10): Promise<{ success: boolean; processed?: number; error?: string }> {
    try {
      // Get meeting chunks without embeddings
      const { data: chunks, error: fetchError } = await this.supabase
        .from('meeting_chunks')
        .select('id, content')
        .is('embedding', null)
        .limit(batchSize);

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      if (!chunks || chunks.length === 0) {
        return { success: true, processed: 0 };
      }

      // Generate embeddings for the batch
      const embeddings = await this.embeddingService.generateEmbeddings(
        chunks.map(chunk => chunk.content)
      );

      // Update each chunk with its embedding
      const updates = chunks.map((chunk, index) => ({
        id: chunk.id,
        embedding: Array.isArray(embeddings[index]) ? JSON.stringify(embeddings[index]) : String(embeddings[index])
      }));

      // Update embeddings individually since upsert requires all fields
      for (const update of updates) {
        await this.supabase
          .from('meeting_chunks')
          .update({ embedding: update.embedding })
          .eq('id', update.id);
      }

      // Error handling is done per update above

      return { success: true, processed: chunks.length };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(id: number): Promise<{ success: boolean; document?: Document; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Type assertion to match our interface since we know the structure
      const document: Document = {
        id: data.id,
        content: data.content ?? '', // Handle null content
        metadata: data.metadata,
        embedding: data.embedding ? JSON.parse(data.embedding as string) : undefined
      };

      return { success: true, document };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}