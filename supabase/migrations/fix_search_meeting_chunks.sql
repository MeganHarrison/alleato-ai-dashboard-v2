-- Fix the ambiguous rank_score column reference in search_meeting_chunks function
-- This creates a properly working vector search function

-- Drop the existing broken functions
DROP FUNCTION IF EXISTS public.search_meeting_chunks(public.vector, double precision, integer, uuid);
DROP FUNCTION IF EXISTS public.search_meeting_chunks(public.vector, double precision, integer, bigint, timestamp with time zone, timestamp with time zone, text[]);

-- Create a single, working version of the search function
CREATE OR REPLACE FUNCTION public.search_meeting_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  project_filter bigint DEFAULT NULL
)
RETURNS TABLE (
  chunk_id uuid,
  chunk_index int,
  chunk_text text,
  chunk_type text,
  meeting_date timestamp,
  meeting_id uuid,
  meeting_title text,
  metadata jsonb,
  project_id bigint,
  similarity float,
  speakers jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id AS chunk_id,
    mc.chunk_index,
    mc.content AS chunk_text,
    mc.chunk_type,
    m.meeting_date,
    mc.meeting_id,
    m.title AS meeting_title,
    mc.metadata,
    m.project_id,
    1 - (mc.embedding <=> query_embedding) AS similarity,
    mc.speaker_info AS speakers
  FROM 
    meeting_chunks mc
    LEFT JOIN meetings m ON mc.meeting_id = m.id
  WHERE 
    1 - (mc.embedding <=> query_embedding) > match_threshold
    AND (project_filter IS NULL OR m.project_id = project_filter)
  ORDER BY 
    mc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_meeting_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_meeting_chunks TO service_role;

-- Create an index on embeddings if it doesn't exist for faster vector searches
CREATE INDEX IF NOT EXISTS idx_meeting_chunks_embedding ON meeting_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add a comment explaining the function
COMMENT ON FUNCTION public.search_meeting_chunks IS 'Search meeting chunks using vector similarity with optional project filtering';