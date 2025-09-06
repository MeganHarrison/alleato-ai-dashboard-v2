-- Meeting Intelligence Tables Migration
-- Creates all necessary tables for the meeting intelligence system

-- Create meetings table if not exists
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path TEXT,
    title TEXT NOT NULL,
    meeting_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- alias for compatibility
    duration_minutes INTEGER DEFAULT 60,
    participants TEXT[],
    fireflies_id TEXT,
    fireflies_link TEXT,
    raw_transcript TEXT,
    summary TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    topics TEXT[],
    action_items JSONB,
    decisions JSONB,
    risks JSONB,
    vectorized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on meetings
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_fireflies_id ON meetings(fireflies_id);

-- Create meeting_embeddings table for vector search
CREATE TABLE IF NOT EXISTS meeting_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384), -- 384 dimensions for text-embedding-3-small
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for meeting_embeddings
CREATE INDEX IF NOT EXISTS idx_meeting_embeddings_meeting_id ON meeting_embeddings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_embeddings_chunk_index ON meeting_embeddings(chunk_index);

-- Create meeting_insights table
CREATE TABLE IF NOT EXISTS meeting_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    insight_type TEXT CHECK (insight_type IN ('risk', 'action_item', 'decision', 'question', 'highlight', 'opportunity', 'strategic', 'technical')),
    content TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'deferred')),
    assigned_to TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for meeting_insights
CREATE INDEX IF NOT EXISTS idx_meeting_insights_meeting_id ON meeting_insights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_type ON meeting_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_status ON meeting_insights(status);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_assigned_to ON meeting_insights(assigned_to);

-- Create ai_insights table for AI-generated insights
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    meeting_name TEXT,
    project_name TEXT,
    insight_type TEXT CHECK (insight_type IN ('risk', 'opportunity', 'decision', 'action_item', 'strategic', 'technical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    source_meetings TEXT,
    resolved INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ai_insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_meeting_id ON ai_insights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_project_id ON ai_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_resolved ON ai_insights(resolved);

-- Create meeting_vectorization_queue table
CREATE TABLE IF NOT EXISTS meeting_vectorization_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    fireflies_metadata JSONB,
    attempt_count INTEGER DEFAULT 0,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vectorization queue
CREATE INDEX IF NOT EXISTS idx_vectorization_queue_status ON meeting_vectorization_queue(status);
CREATE INDEX IF NOT EXISTS idx_vectorization_queue_created_at ON meeting_vectorization_queue(created_at);

-- Create project_meeting_associations table
CREATE TABLE IF NOT EXISTS project_meeting_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    association_confidence FLOAT CHECK (association_confidence >= 0 AND association_confidence <= 1),
    association_reasoning TEXT,
    is_manual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, meeting_id)
);

-- Create function for vector similarity search with proper dimensions
CREATE OR REPLACE FUNCTION search_meeting_embeddings(
    query_embedding vector(384),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    meeting_id UUID,
    chunk_index INTEGER,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        me.meeting_id,
        me.chunk_index,
        me.content,
        me.metadata,
        1 - (me.embedding <=> query_embedding) AS similarity
    FROM meeting_embeddings me
    WHERE 1 - (me.embedding <=> query_embedding) > match_threshold
    ORDER BY me.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create RLS policies
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_vectorization_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_meeting_associations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access all meeting data
CREATE POLICY "Allow authenticated users to view meetings"
    ON meetings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert meetings"
    ON meetings FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update meetings"
    ON meetings FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to delete meetings"
    ON meetings FOR DELETE
    TO authenticated
    USING (true);

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users full access to meeting_embeddings"
    ON meeting_embeddings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to meeting_insights"
    ON meeting_insights FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to ai_insights"
    ON ai_insights FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to meeting_vectorization_queue"
    ON meeting_vectorization_queue FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to project_meeting_associations"
    ON project_meeting_associations FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_insights_updated_at BEFORE UPDATE ON meeting_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vectorization_queue_updated_at BEFORE UPDATE ON meeting_vectorization_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_meeting_associations_updated_at BEFORE UPDATE ON project_meeting_associations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();