-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create meetings metadata table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fireflies_id TEXT UNIQUE NOT NULL,
  fireflies_link TEXT,
  storage_path TEXT NOT NULL, -- Path in Supabase storage bucket
  title TEXT NOT NULL,
  meeting_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  participants TEXT[], -- Array of participant names/emails
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  raw_transcript TEXT, -- Store raw transcript for reference
  summary TEXT, -- AI-generated summary
  vectorized_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', -- Additional metadata from Fireflies
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create meeting embeddings table for vector search
CREATE TABLE IF NOT EXISTS meeting_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embeddings dimension
  metadata JSONB DEFAULT '{}', -- Store section info, speaker, timestamp etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, chunk_index)
);

-- Create meeting insights table for AI-generated insights
CREATE TABLE IF NOT EXISTS meeting_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'risk', 'action_item', 'decision', 'question', 'highlight'
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  assigned_to TEXT,
  due_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project meeting associations with additional context
CREATE TABLE IF NOT EXISTS project_meeting_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  association_confidence DECIMAL(3,2) CHECK (association_confidence >= 0 AND association_confidence <= 1),
  association_reasoning TEXT, -- Why AI thinks this meeting belongs to this project
  is_manual BOOLEAN DEFAULT FALSE, -- Whether association was manually set
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(project_id, meeting_id)
);

-- Create vectorization queue table for tracking processing status
CREATE TABLE IF NOT EXISTS meeting_vectorization_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  fireflies_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_meetings_project_id ON meetings(project_id);
CREATE INDEX idx_meetings_meeting_date ON meetings(meeting_date DESC);
CREATE INDEX idx_meetings_vectorized_at ON meetings(vectorized_at);
CREATE INDEX idx_meeting_embeddings_meeting_id ON meeting_embeddings(meeting_id);
CREATE INDEX idx_meeting_insights_meeting_id ON meeting_insights(meeting_id);
CREATE INDEX idx_meeting_insights_type ON meeting_insights(insight_type);
CREATE INDEX idx_meeting_insights_status ON meeting_insights(status);
CREATE INDEX idx_vectorization_queue_status ON meeting_vectorization_queue(status);

-- Vector similarity search index
CREATE INDEX idx_meeting_embeddings_vector ON meeting_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- RLS policies
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_meeting_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_vectorization_queue ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all meeting data
CREATE POLICY "Users can view all meetings" ON meetings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can view all meeting embeddings" ON meeting_embeddings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can view all meeting insights" ON meeting_insights
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can view all project meeting associations" ON project_meeting_associations
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to create/update meeting data
CREATE POLICY "Users can create meetings" ON meetings
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update meetings" ON meetings
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Users can manage meeting insights" ON meeting_insights
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Users can manage project associations" ON project_meeting_associations
  FOR ALL TO authenticated
  USING (true);

-- Service role can manage vectorization queue
CREATE POLICY "Service role can manage vectorization queue" ON meeting_vectorization_queue
  FOR ALL TO service_role
  USING (true);

-- Function to search meetings by vector similarity
CREATE OR REPLACE FUNCTION search_meetings(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  meeting_id UUID,
  chunk_content TEXT,
  similarity FLOAT,
  meeting_title TEXT,
  meeting_date TIMESTAMPTZ,
  project_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    me.meeting_id,
    me.content as chunk_content,
    1 - (me.embedding <=> query_embedding) as similarity,
    m.title as meeting_title,
    m.meeting_date,
    m.project_id
  FROM meeting_embeddings me
  JOIN meetings m ON m.id = me.meeting_id
  WHERE 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get meeting insights summary for a project
CREATE OR REPLACE FUNCTION get_project_meeting_insights(
  p_project_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  meeting_id UUID,
  meeting_title TEXT,
  meeting_date TIMESTAMPTZ,
  insights JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as meeting_id,
    m.title as meeting_title,
    m.meeting_date,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'type', mi.insight_type,
          'content', mi.content,
          'priority', mi.priority,
          'status', mi.status
        ) ORDER BY mi.created_at DESC
      ) FILTER (WHERE mi.id IS NOT NULL),
      '[]'::jsonb
    ) as insights
  FROM meetings m
  LEFT JOIN meeting_insights mi ON mi.meeting_id = m.id
  WHERE m.project_id = p_project_id
  GROUP BY m.id, m.title, m.meeting_date
  ORDER BY m.meeting_date DESC
  LIMIT p_limit;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_insights_updated_at BEFORE UPDATE ON meeting_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create cron job to process vectorization queue every 30 minutes
-- Note: This requires pg_cron to be enabled in Supabase dashboard
-- The actual processing will be done by an edge function
SELECT cron.schedule(
  'vectorize-meetings',
  '*/30 * * * *', -- Every 30 minutes
  $$
    INSERT INTO meeting_vectorization_queue (storage_path, fireflies_metadata)
    SELECT 
      name as storage_path,
      metadata as fireflies_metadata
    FROM storage.objects 
    WHERE bucket_id = 'meetings' 
      AND name NOT IN (SELECT storage_path FROM meetings)
      AND name NOT IN (SELECT storage_path FROM meeting_vectorization_queue WHERE status IN ('pending', 'processing'))
    ON CONFLICT (storage_path) DO NOTHING;
  $$
);