-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table with proper vector column
CREATE TABLE IF NOT EXISTS documents (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast vector searches using HNSW algorithm
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING hnsw (embedding vector_ip_ops);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth requirements)
CREATE POLICY "Allow authenticated users to read documents" ON documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service role to manage documents" ON documents
  FOR ALL TO service_role USING (true);

-- Create optimized semantic search function using inner product
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
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
    1 - (documents.embedding <#> query_embedding) as similarity
  FROM documents
  WHERE 1 - (documents.embedding <#> query_embedding) > match_threshold
  ORDER BY documents.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

-- Update meeting_chunks table to ensure it has proper vector column
ALTER TABLE meeting_chunks 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index on meeting_chunks embedding
CREATE INDEX IF NOT EXISTS meeting_chunks_embedding_idx ON meeting_chunks 
USING hnsw (embedding vector_ip_ops)
WHERE embedding IS NOT NULL;

-- Create improved search function for meeting chunks
CREATE OR REPLACE FUNCTION search_meeting_chunks (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  chunk_id uuid,
  content text,
  chunk_type text,
  speaker_info jsonb,
  metadata jsonb,
  meeting_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id as chunk_id,
    mc.content,
    mc.chunk_type,
    mc.speaker_info,
    mc.metadata,
    mc.meeting_id,
    1 - (mc.embedding <#> query_embedding) as similarity
  FROM meeting_chunks mc
  WHERE mc.embedding IS NOT NULL
    AND 1 - (mc.embedding <#> query_embedding) > match_threshold
  ORDER BY mc.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for documents table
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();