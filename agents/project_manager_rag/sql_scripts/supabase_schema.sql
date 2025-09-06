-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning',
    keywords TEXT[] DEFAULT '{}',
    aliases TEXT[] DEFAULT '{}',
    stakeholders TEXT[] DEFAULT '{}',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT,
    department TEXT,
    projects TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Meetings table with vector embeddings
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fireflies_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    participants TEXT[] DEFAULT '{}',
    participant_ids UUID[] DEFAULT '{}',
    project_id UUID REFERENCES projects(id),
    project_confidence FLOAT DEFAULT 0.0,
    summary TEXT,
    action_items TEXT[] DEFAULT '{}',
    decisions TEXT[] DEFAULT '{}',
    risks TEXT[] DEFAULT '{}',
    topics TEXT[] DEFAULT '{}',
    sentiment_score FLOAT DEFAULT 0.0,
    file_path TEXT,
    transcript_url TEXT,
    recording_url TEXT,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_meetings_date ON meetings(date DESC);
CREATE INDEX idx_meetings_project ON meetings(project_id);
CREATE INDEX idx_meetings_embedding ON meetings USING ivfflat (embedding vector_cosine_ops);

-- Vector search function
CREATE OR REPLACE FUNCTION search_meetings(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    fireflies_id TEXT,
    title TEXT,
    date TIMESTAMP,
    duration_minutes INTEGER,
    participants TEXT[],
    participant_ids UUID[],
    project_id UUID,
    project_confidence FLOAT,
    summary TEXT,
    action_items TEXT[],
    decisions TEXT[],
    risks TEXT[],
    topics TEXT[],
    sentiment_score FLOAT,
    file_path TEXT,
    transcript_url TEXT,
    recording_url TEXT,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.*,
        1 - (m.embedding <=> query_embedding) AS similarity
    FROM meetings m
    WHERE 
        (project_id IS NULL OR m.project_id = search_meetings.project_id)
        AND (1 - (m.embedding <=> query_embedding)) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;