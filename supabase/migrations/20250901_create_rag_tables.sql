-- Create RAG Documents table
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source TEXT,
    file_path TEXT,
    file_type TEXT,
    file_size BIGINT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    tags TEXT[],
    category TEXT,
    chunks_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create RAG Chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS rag_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    metadata JSONB DEFAULT '{}',
    tokens INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, chunk_index)
);

-- Create RAG Chat History table
CREATE TABLE IF NOT EXISTS rag_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]', -- Array of document references
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RAG Processing Queue table
CREATE TABLE IF NOT EXISTS rag_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('chunk', 'embed', 'index')),
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    priority INTEGER DEFAULT 5,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    config JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rag_documents_status ON rag_documents(status);
CREATE INDEX IF NOT EXISTS idx_rag_documents_user_id ON rag_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_created_at ON rag_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id ON rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chat_history_session_id ON rag_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_rag_chat_history_user_id ON rag_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_processing_queue_status ON rag_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_rag_processing_queue_document_id ON rag_processing_queue(document_id);

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector index for similarity search
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding ON rag_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_rag_documents_updated_at
    BEFORE UPDATE ON rag_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rag_processing_queue_updated_at
    BEFORE UPDATE ON rag_processing_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_processing_queue ENABLE ROW LEVEL SECURITY;

-- Policies for rag_documents
CREATE POLICY "Users can view their own documents" ON rag_documents
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own documents" ON rag_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own documents" ON rag_documents
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own documents" ON rag_documents
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Policies for rag_chunks (inherit document permissions)
CREATE POLICY "Users can view chunks of their documents" ON rag_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rag_documents 
            WHERE rag_documents.id = rag_chunks.document_id 
            AND (rag_documents.user_id = auth.uid() OR rag_documents.user_id IS NULL)
        )
    );

-- Policies for rag_chat_history
CREATE POLICY "Users can view their own chat history" ON rag_chat_history
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own chat history" ON rag_chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policies for rag_processing_queue (inherit document permissions)
CREATE POLICY "Users can view processing queue for their documents" ON rag_processing_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rag_documents 
            WHERE rag_documents.id = rag_processing_queue.document_id 
            AND (rag_documents.user_id = auth.uid() OR rag_documents.user_id IS NULL)
        )
    );