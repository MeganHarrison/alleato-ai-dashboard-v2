-- Create RAG System Tables and Functions
-- This migration sets up the complete RAG system database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text search

-- Create rag_documents table
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    content TEXT,
    file_path TEXT,
    file_size BIGINT,
    file_type TEXT,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    chunks_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rag_chunks table with vector column
CREATE TABLE IF NOT EXISTS rag_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embeddings dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, chunk_index)
);

-- Create rag_chat_history table
CREATE TABLE IF NOT EXISTS rag_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rag_processing_queue table
CREATE TABLE IF NOT EXISTS rag_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    chunks_processed INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0,
    error TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rag_documents_status ON rag_documents(status);
CREATE INDEX IF NOT EXISTS idx_rag_documents_created_at ON rag_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rag_documents_source ON rag_documents(source);
CREATE INDEX IF NOT EXISTS idx_rag_documents_metadata ON rag_documents USING GIN(metadata);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id ON rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_content ON rag_chunks USING GIN(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_rag_chat_history_conversation ON rag_chat_history(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rag_processing_queue_status ON rag_processing_queue(status, created_at);

-- Create function for semantic search using pgvector
CREATE OR REPLACE FUNCTION search_rag_chunks(
    query_embedding vector(1536),
    similarity_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    document_ids UUID[] DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_title TEXT,
    content TEXT,
    similarity FLOAT,
    metadata JSONB,
    chunk_index INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.document_id,
        d.title as document_title,
        c.content,
        1 - (c.embedding <=> query_embedding) as similarity,
        c.metadata,
        c.chunk_index
    FROM rag_chunks c
    INNER JOIN rag_documents d ON d.id = c.document_id
    WHERE 
        1 - (c.embedding <=> query_embedding) > similarity_threshold
        AND (document_ids IS NULL OR c.document_id = ANY(document_ids))
        AND (date_from IS NULL OR d.created_at >= date_from)
        AND (date_to IS NULL OR d.created_at <= date_to)
        AND (tags IS NULL OR d.metadata @> jsonb_build_object('tags', tags))
        AND d.status = 'completed'
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to find similar documents
CREATE OR REPLACE FUNCTION find_similar_documents(
    query_embedding vector(1536),
    similarity_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5,
    exclude_document_id UUID DEFAULT NULL
)
RETURNS TABLE (
    document_id UUID,
    title TEXT,
    similarity FLOAT,
    chunks_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH document_similarities AS (
        SELECT 
            c.document_id,
            AVG(1 - (c.embedding <=> query_embedding)) as avg_similarity
        FROM rag_chunks c
        WHERE 
            c.embedding IS NOT NULL
            AND (exclude_document_id IS NULL OR c.document_id != exclude_document_id)
        GROUP BY c.document_id
        HAVING AVG(1 - (c.embedding <=> query_embedding)) > similarity_threshold
    )
    SELECT 
        ds.document_id,
        d.title,
        ds.avg_similarity as similarity,
        d.chunks_count
    FROM document_similarities ds
    INNER JOIN rag_documents d ON d.id = ds.document_id
    WHERE d.status = 'completed'
    ORDER BY ds.avg_similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rag_documents_updated_at
    BEFORE UPDATE ON rag_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rag_processing_queue_updated_at
    BEFORE UPDATE ON rag_processing_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Create RLS policies (optional, enable if using Supabase Auth)
-- ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rag_chat_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rag_processing_queue ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust based on your needs)
GRANT ALL ON rag_documents TO authenticated;
GRANT ALL ON rag_chunks TO authenticated;
GRANT ALL ON rag_chat_history TO authenticated;
GRANT ALL ON rag_processing_queue TO authenticated;
GRANT ALL ON rag_documents TO service_role;
GRANT ALL ON rag_chunks TO service_role;
GRANT ALL ON rag_chat_history TO service_role;
GRANT ALL ON rag_processing_queue TO service_role;