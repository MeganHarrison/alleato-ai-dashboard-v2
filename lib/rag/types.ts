// RAG System Types and Interfaces

export interface RagDocument {
  id: string;
  title: string;
  source?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  tags?: string[];
  category?: string;
  chunks_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  user_id?: string;
}

export interface RagChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  tokens?: number;
  created_at: string;
}

export interface RagChatMessage {
  id: string;
  session_id: string;
  user_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: DocumentSource[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DocumentSource {
  document_id: string;
  document_title: string;
  chunk_id: string;
  content: string;
  relevance_score: number;
}

export interface ProcessingJob {
  id: string;
  document_id: string;
  job_type: 'chunk' | 'embed' | 'index';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  priority: number;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  config?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChunkingConfig {
  chunk_size: number;
  chunk_overlap: number;
  separator?: string;
  keep_separator?: boolean;
}

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  batch_size: number;
}

export interface SearchConfig {
  search_type: 'semantic' | 'hybrid' | 'keyword';
  max_chunks: number;
  similarity_threshold?: number;
  filters?: SearchFilters;
}

export interface SearchFilters {
  document_ids?: string[];
  date_from?: string;
  date_to?: string;
  tags?: string[];
  categories?: string[];
}

export interface SearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  content: string;
  relevance_score: number;
  metadata?: Record<string, any>;
}

export interface ChatRequest {
  messages: RagChatMessage[];
  context?: {
    document_ids?: string[];
    search_type?: 'semantic' | 'hybrid';
    max_chunks?: number;
    temperature?: number;
  };
  stream?: boolean;
}

export interface SystemStats {
  documents: {
    total: number;
    processing: number;
    completed: number;
    failed: number;
  };
  vectors: {
    total_chunks: number;
    total_embeddings: number;
    embedding_dimension: number;
    last_processed?: string;
  };
  storage: {
    documents_size_mb: number;
    vectors_size_mb: number;
    total_size_mb: number;
  };
  usage: {
    queries_today: number;
    queries_this_month: number;
    avg_response_time_ms: number;
  };
}

export interface UploadResponse {
  success: boolean;
  document?: RagDocument;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}