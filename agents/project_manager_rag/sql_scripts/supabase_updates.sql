-- Updates to existing Supabase schema for Project Manager RAG Agent
-- These updates add necessary columns to existing tables

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add columns to meetings table if they don't exist
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS action_items TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS decisions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS risks TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS participant_ids UUID[] DEFAULT '{}';

-- Update meeting_embeddings table to use vector type
-- First, add a new vector column
ALTER TABLE meeting_embeddings
ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Note: You'll need to convert existing embeddings from string to vector
-- This can be done with a migration script after confirming the format

-- Add metadata columns to contacts table if they don't exist
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS projects TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update projects table with additional fields if needed
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stakeholders TEXT[] DEFAULT '{}';

-- Create index on meeting_embeddings for vector search if not exists
CREATE INDEX IF NOT EXISTS idx_meeting_embeddings_vector 
ON meeting_embeddings USING ivfflat (embedding_vector vector_cosine_ops);

-- Create or replace the vector search function to use meeting_embeddings
CREATE OR REPLACE FUNCTION search_meeting_embeddings(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    project_filter INT DEFAULT NULL
)
RETURNS TABLE (
    meeting_id UUID,
    chunk_index INT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        me.meeting_id::UUID,
        me.chunk_index,
        1 - (me.embedding_vector <=> query_embedding) AS similarity,
        me.metadata
    FROM meeting_embeddings me
    JOIN meetings m ON me.meeting_id = m.id::TEXT
    WHERE 
        (project_filter IS NULL OR m.project_id = project_filter)
        AND (1 - (me.embedding_vector <=> query_embedding)) > match_threshold
    ORDER BY me.embedding_vector <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to convert string embeddings to vector (for migration)
CREATE OR REPLACE FUNCTION convert_embeddings_to_vector()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT id, embedding FROM meeting_embeddings WHERE embedding_vector IS NULL
    LOOP
        -- This assumes embeddings are stored as JSON arrays in string format
        -- Adjust based on your actual format
        BEGIN
            UPDATE meeting_embeddings 
            SET embedding_vector = embedding::vector(1536)
            WHERE id = rec.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to convert embedding for id %: %', rec.id, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a view for meetings with full project info
CREATE OR REPLACE VIEW meetings_with_full_info AS
SELECT 
    m.*,
    p.name as project_name,
    p.state as project_status,
    p.keywords as project_keywords,
    p.stakeholders as project_stakeholders
FROM meetings m
LEFT JOIN projects p ON m.project_id = p.id;

-- Add RLS policies if needed
ALTER TABLE meeting_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read meeting embeddings
CREATE POLICY "Users can read meeting embeddings" ON meeting_embeddings
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create policy for service role to manage meeting embeddings
CREATE POLICY "Service role can manage meeting embeddings" ON meeting_embeddings
    FOR ALL
    USING (auth.role() = 'service_role');