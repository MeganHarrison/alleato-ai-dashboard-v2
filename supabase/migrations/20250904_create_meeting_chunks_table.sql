-- Migration: Create meeting_chunks table for PM RAG Worker
-- Purpose: Enable chunked storage and vector search for meeting transcripts
-- Date: 2025-09-04
-- Required by: pm-rag-sep-1.megan-d14.workers.dev

-- Ensure vector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create meeting_chunks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.meeting_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    chunk_type TEXT DEFAULT 'transcript',
    speaker_info JSONB,
    start_timestamp FLOAT,
    end_timestamp FLOAT,
    embedding vector(1536), -- For text-embedding-3-small
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique chunks per meeting
    UNIQUE(meeting_id, chunk_index)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_chunks_meeting_id 
ON public.meeting_chunks(meeting_id);

CREATE INDEX IF NOT EXISTS idx_meeting_chunks_chunk_index 
ON public.meeting_chunks(chunk_index);

CREATE INDEX IF NOT EXISTS idx_meeting_chunks_created_at 
ON public.meeting_chunks(created_at DESC);

-- Create vector similarity search index (IVFFlat for performance)
CREATE INDEX IF NOT EXISTS idx_meeting_chunks_embedding 
ON public.meeting_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE public.meeting_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Enable read access for authenticated users" 
ON public.meeting_chunks FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for service role" 
ON public.meeting_chunks FOR INSERT 
TO service_role 
WITH CHECK (true);

CREATE POLICY "Enable update for service role" 
ON public.meeting_chunks FOR UPDATE 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete for service role" 
ON public.meeting_chunks FOR DELETE 
TO service_role 
USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.meeting_chunks TO authenticated;
GRANT ALL ON public.meeting_chunks TO service_role;

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_meeting_chunks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_meeting_chunks_updated_at
BEFORE UPDATE ON public.meeting_chunks
FOR EACH ROW
EXECUTE FUNCTION public.update_meeting_chunks_updated_at();

-- Create helper function for semantic search on meeting chunks
CREATE OR REPLACE FUNCTION public.search_meeting_chunks_semantic(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 10,
    filter_meeting_id uuid DEFAULT NULL,
    filter_project_id bigint DEFAULT NULL
)
RETURNS TABLE (
    chunk_id uuid,
    meeting_id uuid,
    meeting_title text,
    chunk_content text,
    chunk_index int,
    speaker_info jsonb,
    similarity float,
    project_id bigint,
    meeting_date timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mc.id AS chunk_id,
        mc.meeting_id,
        m.title AS meeting_title,
        mc.content AS chunk_content,
        mc.chunk_index,
        mc.speaker_info,
        1 - (mc.embedding <=> query_embedding) AS similarity,
        m.project_id,
        m.meeting_date
    FROM 
        public.meeting_chunks mc
        INNER JOIN public.meetings m ON mc.meeting_id = m.id
    WHERE 
        mc.embedding IS NOT NULL
        AND (1 - (mc.embedding <=> query_embedding)) > match_threshold
        AND (filter_meeting_id IS NULL OR mc.meeting_id = filter_meeting_id)
        AND (filter_project_id IS NULL OR m.project_id = filter_project_id)
    ORDER BY 
        mc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- Grant execute permission on search function
GRANT EXECUTE ON FUNCTION public.search_meeting_chunks_semantic TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_meeting_chunks_semantic TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.meeting_chunks IS 'Stores chunked meeting transcript segments with embeddings for vector search';
COMMENT ON COLUMN public.meeting_chunks.embedding IS 'Vector embedding using OpenAI text-embedding-3-small (1536 dimensions)';
COMMENT ON COLUMN public.meeting_chunks.chunk_type IS 'Type of chunk: transcript, summary, action_item, etc.';
COMMENT ON COLUMN public.meeting_chunks.speaker_info IS 'JSON object containing speaker name and metadata';
COMMENT ON FUNCTION public.search_meeting_chunks_semantic IS 'Performs semantic similarity search on meeting chunks with optional filters';

-- Verification query to ensure table was created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_chunks') THEN
        RAISE NOTICE 'Table meeting_chunks created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create meeting_chunks table';
    END IF;
END $$;