-- Add project_id column to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);

-- Update the documents table comment
COMMENT ON COLUMN documents.project_id IS 'Reference to the associated project';