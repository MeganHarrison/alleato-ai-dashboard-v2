-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table with vectors
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS chunk_metadata jsonb DEFAULT '{}';

-- Create index for similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Meeting chunks with multi-dimensional embeddings
ALTER TABLE meeting_chunks
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS temporal_embedding vector(768),
ADD COLUMN IF NOT EXISTS relational_embedding vector(768);

-- Create indexes for meeting chunks
CREATE INDEX IF NOT EXISTS meeting_chunks_embedding_idx 
ON meeting_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enhanced insights table
ALTER TABLE ai_insights
ADD COLUMN IF NOT EXISTS vector_sources jsonb[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reasoning_trace text,
ADD COLUMN IF NOT EXISTS auto_assigned boolean DEFAULT false;

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function for meeting chunk search
CREATE OR REPLACE FUNCTION match_meeting_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  meeting_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  meeting_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.meeting_id,
    mc.content,
    mc.metadata,
    1 - (mc.embedding <=> query_embedding) AS similarity
  FROM meeting_chunks mc
  WHERE 
    1 - (mc.embedding <=> query_embedding) > match_threshold
    AND (match_meeting_chunks.meeting_id IS NULL OR mc.meeting_id = match_meeting_chunks.meeting_id)
  ORDER BY mc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;