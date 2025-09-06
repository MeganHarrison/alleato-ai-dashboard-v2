/**
 * Enhance FM Global RAG Schema
 * 
 * PURPOSE: Add missing columns and improve existing FM Global tables
 * ADDS: Additional metadata fields for complete RAG functionality
 */

-- Add missing columns to fm_global_figures
ALTER TABLE fm_global_figures 
ADD COLUMN IF NOT EXISTS container_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS max_spacing_ft DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_depth_ft DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_height_ft DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sprinkler_count INTEGER,
ADD COLUMN IF NOT EXISTS requirements TEXT[],
ADD COLUMN IF NOT EXISTS normalized_summary TEXT,
ADD COLUMN IF NOT EXISTS machine_readable_claims JSONB,
ADD COLUMN IF NOT EXISTS search_keywords TEXT[];

-- Add missing columns to fm_global_tables
ALTER TABLE fm_global_tables
ADD COLUMN IF NOT EXISTS data JSONB,
ADD COLUMN IF NOT EXISTS commodity_types TEXT,
ADD COLUMN IF NOT EXISTS protection_scheme VARCHAR(100),
ADD COLUMN IF NOT EXISTS ceiling_height_min_ft DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS ceiling_height_max_ft DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sprinkler_specifications JSONB,
ADD COLUMN IF NOT EXISTS design_parameters JSONB,
ADD COLUMN IF NOT EXISTS special_conditions TEXT,
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_fm_figures_container ON fm_global_figures (container_type);
CREATE INDEX IF NOT EXISTS idx_fm_figures_spacing ON fm_global_figures (max_spacing_ft);
CREATE INDEX IF NOT EXISTS idx_fm_figures_depth ON fm_global_figures (max_depth_ft);
CREATE INDEX IF NOT EXISTS idx_fm_tables_commodity ON fm_global_tables (commodity_types);
CREATE INDEX IF NOT EXISTS idx_fm_tables_protection ON fm_global_tables (protection_scheme);
CREATE INDEX IF NOT EXISTS idx_fm_tables_embedding ON fm_global_tables USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create text search indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fm_figures_text_search ON fm_global_figures USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_fm_tables_text_search ON fm_global_tables USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_fm_figures_asrs_container ON fm_global_figures (asrs_type, container_type);
CREATE INDEX IF NOT EXISTS idx_fm_tables_asrs_protection ON fm_global_tables (asrs_type, protection_scheme);

-- Update the combined search function to include new fields
CREATE OR REPLACE FUNCTION fm_global_search(
    query_text TEXT,
    query_embedding vector(1536) DEFAULT NULL,
    asrs_type_filter VARCHAR(100) DEFAULT NULL,
    container_type_filter VARCHAR(50) DEFAULT NULL,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    source_type TEXT,
    source_id TEXT,
    title TEXT,
    content TEXT,
    similarity float,
    metadata JSONB,
    asrs_type VARCHAR(100),
    container_type VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    -- Search figures with filters
    SELECT 
        'figure'::TEXT AS source_type,
        f.figure_number::TEXT AS source_id,
        f.title,
        COALESCE(f.description, f.title) AS content,
        CASE 
            WHEN query_embedding IS NOT NULL AND f.embedding IS NOT NULL 
            THEN (1 - (f.embedding <=> query_embedding))
            ELSE 0.5
        END AS similarity,
        jsonb_build_object(
            'page_reference', f.page_reference,
            'requirements', f.requirements,
            'max_spacing_ft', f.max_spacing_ft,
            'max_depth_ft', f.max_depth_ft,
            'sprinkler_count', f.sprinkler_count,
            'metadata', f.metadata
        ) AS metadata,
        f.asrs_type,
        f.container_type
    FROM fm_global_figures f
    WHERE 
        (asrs_type_filter IS NULL OR f.asrs_type = asrs_type_filter OR f.asrs_type = 'all')
        AND (container_type_filter IS NULL OR f.container_type = container_type_filter OR f.container_type = 'mixed')
        AND (
            (query_embedding IS NOT NULL AND f.embedding IS NOT NULL AND (1 - (f.embedding <=> query_embedding)) > 0.5)
            OR (query_text IS NOT NULL AND (
                f.title ILIKE '%' || query_text || '%' 
                OR f.description ILIKE '%' || query_text || '%'
            ))
        )
        
    UNION ALL
    
    -- Search tables with filters
    SELECT 
        'table'::TEXT AS source_type,
        t.table_id AS source_id,
        t.title,
        COALESCE(t.description, t.title) AS content,
        CASE
            WHEN query_embedding IS NOT NULL AND t.embedding IS NOT NULL
            THEN (1 - (t.embedding <=> query_embedding))
            WHEN query_text IS NOT NULL
            THEN similarity(COALESCE(t.title, '') || ' ' || COALESCE(t.description, ''), query_text)
            ELSE 0.5
        END AS similarity,
        jsonb_build_object(
            'page_reference', t.page_reference,
            'section', t.section,
            'data', t.data,
            'commodity_types', t.commodity_types,
            'protection_scheme', t.protection_scheme,
            'metadata', t.metadata
        ) AS metadata,
        t.asrs_type,
        NULL::VARCHAR(50) AS container_type
    FROM fm_global_tables t
    WHERE 
        (asrs_type_filter IS NULL OR t.asrs_type = asrs_type_filter OR t.asrs_type = 'all')
        AND (
            (query_embedding IS NOT NULL AND t.embedding IS NOT NULL AND (1 - (t.embedding <=> query_embedding)) > 0.5)
            OR (query_text IS NOT NULL AND (
                t.title ILIKE '%' || query_text || '%' 
                OR t.description ILIKE '%' || query_text || '%'
                OR t.commodity_types ILIKE '%' || query_text || '%'
            ))
        )
    
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- Grant permissions on new function
GRANT EXECUTE ON FUNCTION fm_global_search TO authenticated, service_role, anon;

-- Add helpful comments
COMMENT ON COLUMN fm_global_figures.container_type IS 'Type of container: closed-top, open-top, or mixed';
COMMENT ON COLUMN fm_global_figures.max_spacing_ft IS 'Maximum sprinkler spacing in feet';
COMMENT ON COLUMN fm_global_figures.max_depth_ft IS 'Maximum rack depth in feet';
COMMENT ON COLUMN fm_global_figures.requirements IS 'Array of specific requirements for this configuration';
COMMENT ON COLUMN fm_global_tables.data IS 'JSONB containing the actual table data/requirements';
COMMENT ON COLUMN fm_global_tables.commodity_types IS 'Types of commodities this table applies to';
COMMENT ON COLUMN fm_global_tables.protection_scheme IS 'Type of protection scheme (wet, dry, in-rack, etc.)';