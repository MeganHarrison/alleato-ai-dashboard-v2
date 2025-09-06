/**
 * Unified FM Global RAG Setup
 * 
 * PURPOSE: Single migration to set up complete FM Global RAG system
 * REPLACES: All scattered FM Global schema files
 * CREATES: Clean, efficient RAG database with all required functions
 */

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Clean up any existing FM Global tables/functions
DROP TABLE IF EXISTS fm_table_vectors CASCADE;
DROP TABLE IF EXISTS fm_global_figures CASCADE; 
DROP TABLE IF EXISTS fm_global_tables CASCADE;
DROP FUNCTION IF EXISTS fm_figures_search(vector, float, int);
DROP FUNCTION IF EXISTS match_fm_tables(vector, int, float);
DROP FUNCTION IF EXISTS search_fm_semantic(vector, int);

-- ====================
-- CORE TABLES
-- ====================

-- FM Global Figures (diagrams, charts, decision trees)
CREATE TABLE fm_global_figures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    figure_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    figure_type VARCHAR(100),
    asrs_type VARCHAR(100),
    page_reference INTEGER,
    embedding vector(1536), -- OpenAI text-embedding-3-small
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FM Global Tables (protection requirements, specifications)  
CREATE TABLE fm_global_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number INTEGER NOT NULL,
    table_id VARCHAR(50) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    section VARCHAR(100),
    asrs_type VARCHAR(100),
    system_type VARCHAR(50),
    columns TEXT[],
    page_reference INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- INDEXES FOR PERFORMANCE
-- ====================

-- Figures indexes
CREATE INDEX idx_fm_figures_number ON fm_global_figures (figure_number);
CREATE INDEX idx_fm_figures_type ON fm_global_figures (asrs_type);
CREATE INDEX idx_fm_figures_embedding ON fm_global_figures USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Tables indexes  
CREATE INDEX idx_fm_tables_number ON fm_global_tables (table_number);
CREATE INDEX idx_fm_tables_type ON fm_global_tables (asrs_type);
CREATE INDEX idx_fm_tables_id ON fm_global_tables (table_id);

-- ====================
-- RAG SEARCH FUNCTIONS
-- ====================

-- Vector search for FM Global figures
CREATE OR REPLACE FUNCTION fm_figures_search(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    figure_number INTEGER,
    title TEXT,
    description TEXT,
    similarity float,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.figure_number,
        f.title,
        f.description,
        1 - (f.embedding <=> query_embedding) AS similarity,
        f.metadata
    FROM fm_global_figures f
    WHERE f.embedding IS NOT NULL
        AND (1 - (f.embedding <=> query_embedding)) >= match_threshold
    ORDER BY f.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Search FM Global tables by text similarity
CREATE OR REPLACE FUNCTION fm_tables_search(
    search_text TEXT,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    table_number INTEGER,
    table_id VARCHAR,
    title TEXT,
    description TEXT,
    similarity float
)
LANGUAGE plpgsql  
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.table_number,
        t.table_id,
        t.title,
        t.description,
        similarity(COALESCE(t.title, '') || ' ' || COALESCE(t.description, ''), search_text) AS similarity
    FROM fm_global_tables t
    WHERE similarity(COALESCE(t.title, '') || ' ' || COALESCE(t.description, ''), search_text) > 0.1
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- Combined search function (what the RAG API should use)
CREATE OR REPLACE FUNCTION fm_global_search(
    query_text TEXT,
    query_embedding vector(1536) DEFAULT NULL,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    source_type TEXT,
    source_id TEXT,
    title TEXT,
    content TEXT,
    similarity float,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    -- Search figures if embedding provided
    SELECT 
        'figure'::TEXT AS source_type,
        f.figure_number::TEXT AS source_id,
        f.title,
        COALESCE(f.description, f.title) AS content,
        (1 - (f.embedding <=> query_embedding)) AS similarity,
        f.metadata
    FROM fm_global_figures f
    WHERE query_embedding IS NOT NULL 
        AND f.embedding IS NOT NULL
        AND (1 - (f.embedding <=> query_embedding)) > 0.7
        
    UNION ALL
    
    -- Search tables by text
    SELECT 
        'table'::TEXT AS source_type,
        t.table_id AS source_id,
        t.title,
        COALESCE(t.description, t.title) AS content,
        similarity(COALESCE(t.title, '') || ' ' || COALESCE(t.description, ''), query_text) AS similarity,
        t.metadata
    FROM fm_global_tables t
    WHERE similarity(COALESCE(t.title, '') || ' ' || COALESCE(t.description, ''), query_text) > 0.1
    
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- ====================
-- PERMISSIONS & POLICIES
-- ====================

-- Enable RLS
ALTER TABLE fm_global_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_global_tables ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read fm_figures" ON fm_global_figures FOR SELECT USING (true);
CREATE POLICY "Public read fm_tables" ON fm_global_tables FOR SELECT USING (true);

-- Grant function permissions
GRANT EXECUTE ON FUNCTION fm_figures_search TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION fm_tables_search TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION fm_global_search TO authenticated, service_role, anon;

-- ====================
-- SAMPLE DATA INSERT
-- ====================

-- Insert sample figure for testing
INSERT INTO fm_global_figures (figure_number, title, description, asrs_type) 
VALUES (1, 'ASRS Shuttle System Configuration', 'Basic shuttle ASRS protection scheme', 'shuttle')
ON CONFLICT DO NOTHING;

-- Insert sample table for testing  
INSERT INTO fm_global_tables (table_number, table_id, title, description, asrs_type)
VALUES (1, 'table-1', 'Shuttle ASRS Sprinkler Requirements', 'K-factors and spacing for shuttle systems', 'shuttle')
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE fm_global_figures IS 'FM Global 8-34 figures with vector embeddings for RAG search';
COMMENT ON TABLE fm_global_tables IS 'FM Global 8-34 tables with structured protection requirements';
COMMENT ON FUNCTION fm_figures_search IS 'Vector similarity search for FM Global figures';
COMMENT ON FUNCTION fm_tables_search IS 'Text similarity search for FM Global tables';
COMMENT ON FUNCTION fm_global_search IS 'Combined search function for RAG API';