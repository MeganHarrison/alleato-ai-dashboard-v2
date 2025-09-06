-- First, check what tables already exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name IN ('documents', 'document_chunks', 'chat_history', 'processing_queue')
    OR table_name LIKE 'rag_%'
)
ORDER BY table_name;

-- Check columns in documents table if it exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'documents'
ORDER BY ordinal_position;

-- Check if vector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check for any existing RAG-related tables
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%document%' 
    OR table_name LIKE '%rag%'
    OR table_name LIKE '%chunk%'
    OR table_name LIKE '%embed%'
)
ORDER BY table_name;