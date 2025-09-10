-- Complete Vector Search Setup for PM RAG System
-- Run this script in Supabase SQL Editor to set up all required functions

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Ensure meeting_embeddings table exists with proper structure
CREATE TABLE IF NOT EXISTS meeting_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- Standard OpenAI dimension
  embedding_vector vector(384), -- text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, chunk_index)
);

-- 3. Create indexes for vector search
CREATE INDEX IF NOT EXISTS idx_meeting_embeddings_vector_1536 
ON meeting_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100)
WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meeting_embeddings_vector_384 
ON meeting_embeddings 
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100)
WHERE embedding_vector IS NOT NULL;

-- 4. Create the match_meeting_chunks function (expected by the API)
CREATE OR REPLACE FUNCTION match_meeting_chunks(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  meeting_id UUID,
  chunk_index INTEGER,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if we have 384-dimensional embeddings
  IF EXISTS (
    SELECT 1 FROM meeting_embeddings 
    WHERE embedding_vector IS NOT NULL 
    LIMIT 1
  ) THEN
    RETURN QUERY
    SELECT 
      me.meeting_id,
      me.chunk_index,
      me.content,
      1 - (me.embedding_vector <=> query_embedding) as similarity,
      me.metadata
    FROM meeting_embeddings me
    WHERE me.embedding_vector IS NOT NULL
      AND 1 - (me.embedding_vector <=> query_embedding) > match_threshold
    ORDER BY me.embedding_vector <=> query_embedding
    LIMIT match_count;
  ELSE
    -- Return empty result if no embeddings exist
    RETURN;
  END IF;
END;
$$;

-- 5. Create an overloaded version that accepts text (for testing)
CREATE OR REPLACE FUNCTION match_meeting_chunks(
  query_text TEXT,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  meeting_id UUID,
  chunk_index INTEGER,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Text-based search fallback
  RETURN QUERY
  SELECT 
    me.meeting_id,
    me.chunk_index,
    me.content,
    ts_rank(to_tsvector('english', me.content), plainto_tsquery('english', query_text))::FLOAT as similarity,
    me.metadata
  FROM meeting_embeddings me
  WHERE to_tsvector('english', me.content) @@ plainto_tsquery('english', query_text)
  ORDER BY ts_rank(to_tsvector('english', me.content), plainto_tsquery('english', query_text)) DESC
  LIMIT match_count;
END;
$$;

-- 6. Create the vector_search function (also expected by the API)
CREATE OR REPLACE FUNCTION vector_search(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  meeting_id UUID,
  chunk_index INTEGER,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simply delegate to match_meeting_chunks
  RETURN QUERY
  SELECT * FROM match_meeting_chunks(query_embedding, match_threshold, match_count);
END;
$$;

-- 7. Alternative vector_search that returns different structure (for compatibility)
CREATE OR REPLACE FUNCTION vector_search_meetings(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  meeting_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    me.meeting_id,
    MAX(1 - (me.embedding_vector <=> query_embedding)) as similarity
  FROM meeting_embeddings me
  WHERE me.embedding_vector IS NOT NULL
    AND 1 - (me.embedding_vector <=> query_embedding) > match_threshold
  GROUP BY me.meeting_id
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 8. Create a text-based search function for when embeddings aren't available
CREATE OR REPLACE FUNCTION search_meetings_text(
  query_text TEXT,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  meeting_id UUID,
  title TEXT,
  summary TEXT,
  relevance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as meeting_id,
    m.title,
    m.summary,
    (
      CASE 
        WHEN m.title ILIKE '%' || query_text || '%' THEN 1.0
        WHEN m.summary ILIKE '%' || query_text || '%' THEN 0.8
        ELSE 0.5
      END
    ) as relevance
  FROM meetings m
  WHERE 
    m.title ILIKE '%' || query_text || '%'
    OR m.summary ILIKE '%' || query_text || '%'
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(
        COALESCE(m.action_items::jsonb, '[]'::jsonb)
      ) ai WHERE ai ILIKE '%' || query_text || '%'
    )
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(
        COALESCE(m.decisions::jsonb, '[]'::jsonb)
      ) d WHERE d ILIKE '%' || query_text || '%'
    )
  ORDER BY relevance DESC, m.date DESC
  LIMIT match_count;
END;
$$;

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION match_meeting_chunks(vector(384), FLOAT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION match_meeting_chunks(TEXT, FLOAT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION vector_search(vector(384), FLOAT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION vector_search_meetings(vector(384), FLOAT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_meetings_text(TEXT, INT) TO authenticated;

-- 10. Create sample data for testing (only if meetings table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM meetings LIMIT 1) THEN
    -- Insert sample meetings
    INSERT INTO meetings (id, title, date, summary, participants, action_items, decisions, risks)
    VALUES 
    (
      gen_random_uuid(),
      'Project Alpha Kickoff Meeting',
      NOW() - INTERVAL '7 days',
      'Initial planning session for Project Alpha. Discussed timeline, resources, and key deliverables.',
      ARRAY['John Doe', 'Jane Smith', 'Bob Johnson'],
      ARRAY['Create project charter', 'Set up development environment', 'Schedule weekly standups'],
      ARRAY['Use Agile methodology', 'Two-week sprint cycles', 'Jane as project lead'],
      ARRAY['Tight deadline', 'Resource constraints']
    ),
    (
      gen_random_uuid(),
      'Technical Architecture Review',
      NOW() - INTERVAL '5 days',
      'Reviewed proposed architecture for the new microservices platform.',
      ARRAY['Tech Team', 'Architecture Board'],
      ARRAY['Document API specifications', 'Set up CI/CD pipeline', 'Create security guidelines'],
      ARRAY['Adopt Kubernetes for orchestration', 'Use PostgreSQL as primary database'],
      ARRAY['Complexity of microservices', 'Team learning curve']
    ),
    (
      gen_random_uuid(),
      'Q3 Planning Session',
      NOW() - INTERVAL '3 days',
      'Quarterly planning meeting to set goals and priorities for Q3.',
      ARRAY['Leadership Team', 'Department Heads'],
      ARRAY['Finalize Q3 OKRs', 'Budget allocation review', 'Hire 3 new engineers'],
      ARRAY['Focus on customer retention', 'Increase engineering headcount'],
      ARRAY['Market competition', 'Budget constraints']
    );
    
    RAISE NOTICE 'Sample meeting data created';
  END IF;
END $$;

-- 11. Verify setup
DO $$
DECLARE
  func_count INT;
  table_count INT;
BEGIN
  -- Count functions
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname IN ('match_meeting_chunks', 'vector_search', 'search_meetings_text');
  
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('meetings', 'meeting_embeddings', 'ai_insights');
  
  RAISE NOTICE 'Setup complete! Functions created: %, Tables available: %', func_count, table_count;
END $$;

-- 12. Create a helper function to test the setup
CREATE OR REPLACE FUNCTION test_vector_search_setup()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Test 1: Check if pgvector is enabled
  RETURN QUERY
  SELECT 
    'pgvector extension'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') 
      THEN 'PASS'::TEXT ELSE 'FAIL'::TEXT END,
    'Vector extension is required for embeddings'::TEXT;
  
  -- Test 2: Check if meeting_embeddings table exists
  RETURN QUERY
  SELECT 
    'meeting_embeddings table'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'meeting_embeddings'
    ) THEN 'PASS'::TEXT ELSE 'FAIL'::TEXT END,
    'Table for storing embeddings'::TEXT;
  
  -- Test 3: Check if match_meeting_chunks function exists
  RETURN QUERY
  SELECT 
    'match_meeting_chunks function'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'match_meeting_chunks'
    ) THEN 'PASS'::TEXT ELSE 'FAIL'::TEXT END,
    'Main vector search function'::TEXT;
  
  -- Test 4: Check if meetings have data
  RETURN QUERY
  SELECT 
    'meetings data'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM meetings LIMIT 1) 
      THEN 'PASS'::TEXT ELSE 'WARNING'::TEXT END,
    'Sample data available for testing'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION test_vector_search_setup() TO authenticated;

-- Run the test
SELECT * FROM test_vector_search_setup();