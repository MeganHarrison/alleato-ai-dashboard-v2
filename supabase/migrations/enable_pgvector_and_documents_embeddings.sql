-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store document embeddings
CREATE TABLE IF NOT EXISTS documents_embeddings (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to perform similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count integer DEFAULT 5
)
RETURNS TABLE(id bigint, content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id,
         content,
         1 - (embedding <=> query_embedding) AS similarity
  FROM documents_embeddings
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
