/**
 * Fix FM Global Tables Embedding Column
 * 
 * PURPOSE: Ensure embedding column exists on fm_global_tables
 * FIXES: Missing embedding column error during vector generation
 */

-- Add embedding column if it doesn't exist
ALTER TABLE fm_global_tables
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_fm_tables_embedding 
ON fm_global_tables 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Grant necessary permissions
GRANT ALL ON fm_global_tables TO authenticated;
GRANT ALL ON fm_global_tables TO service_role;

-- Verify the column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fm_global_tables' 
        AND column_name = 'embedding'
    ) THEN
        RAISE EXCEPTION 'Embedding column still missing after migration';
    END IF;
END $$;

-- Update the table comment
COMMENT ON COLUMN fm_global_tables.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';