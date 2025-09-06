-- Create the vector_search function for PM RAG system
-- This function is required by the PM RAG chat API

-- First ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the vector_search function that the API expects
CREATE OR REPLACE FUNCTION vector_search(
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
  SELECT 
    me.meeting_id,
    1 - (me.embedding <=> query_embedding) as similarity
  FROM meeting_embeddings me
  WHERE 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Also create an alternative function that works with 384-dimensional vectors
-- (the PM RAG system uses 384-dimensional embeddings from text-embedding-3-small)
CREATE OR REPLACE FUNCTION search_meeting_embeddings(
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
END;
$$;

-- Add the embedding_vector column if it doesn't exist (384 dimensions)
ALTER TABLE meeting_embeddings 
ADD COLUMN IF NOT EXISTS embedding_vector vector(384);

-- Create index for the 384-dimensional embeddings
CREATE INDEX IF NOT EXISTS idx_meeting_embeddings_vector_384 
ON meeting_embeddings 
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);

-- Create ai_insights table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_insights (
  id SERIAL PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  project_id INTEGER,
  meeting_name TEXT,
  project_name TEXT,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('risk', 'opportunity', 'decision', 'action_item', 'strategic', 'technical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  source_meetings TEXT,
  resolved INTEGER DEFAULT 0 CHECK (resolved IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ai_insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_meeting_id ON ai_insights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_project_id ON ai_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_meeting_name ON ai_insights(meeting_name);
CREATE INDEX IF NOT EXISTS idx_ai_insights_project_name ON ai_insights(project_name);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_resolved ON ai_insights(resolved);

-- Create triggers to auto-populate meeting_name and project_name
CREATE OR REPLACE FUNCTION populate_insight_names()
RETURNS TRIGGER AS $$
BEGIN
  -- Populate meeting_name if meeting_id is provided
  IF NEW.meeting_id IS NOT NULL THEN
    SELECT title INTO NEW.meeting_name 
    FROM meetings 
    WHERE id = NEW.meeting_id;
  END IF;
  
  -- Populate project_name if project_id is provided
  IF NEW.project_id IS NOT NULL THEN
    SELECT name INTO NEW.project_name 
    FROM projects 
    WHERE id = NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for populating names
DROP TRIGGER IF EXISTS populate_insight_names_trigger ON ai_insights;
CREATE TRIGGER populate_insight_names_trigger
BEFORE INSERT ON ai_insights
FOR EACH ROW
EXECUTE FUNCTION populate_insight_names();

-- Create trigger for updating names on update
DROP TRIGGER IF EXISTS update_insight_names_trigger ON ai_insights;
CREATE TRIGGER update_insight_names_trigger
BEFORE UPDATE ON ai_insights
FOR EACH ROW
WHEN (OLD.meeting_id IS DISTINCT FROM NEW.meeting_id OR OLD.project_id IS DISTINCT FROM NEW.project_id)
EXECUTE FUNCTION populate_insight_names();

-- Update meetings table to include PM RAG specific fields if they don't exist
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS topics TEXT[],
ADD COLUMN IF NOT EXISTS action_items TEXT[],
ADD COLUMN IF NOT EXISTS decisions TEXT[],
ADD COLUMN IF NOT EXISTS risks TEXT[],
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS raw_metadata JSONB DEFAULT '{}';

-- Grant permissions
GRANT ALL ON ai_insights TO authenticated;
GRANT ALL ON ai_insights_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION vector_search TO authenticated;
GRANT EXECUTE ON FUNCTION search_meeting_embeddings TO authenticated;

-- Enable RLS on ai_insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_insights
CREATE POLICY "Users can view all ai_insights" ON ai_insights
  FOR SELECT USING (true);

CREATE POLICY "Users can create ai_insights" ON ai_insights
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update ai_insights" ON ai_insights
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete ai_insights" ON ai_insights
  FOR DELETE USING (true);