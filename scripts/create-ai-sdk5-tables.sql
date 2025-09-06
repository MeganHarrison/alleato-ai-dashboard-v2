-- AI SDK 5 Persistent Chat Tables Migration
-- This migration creates the necessary tables for AI SDK 5 persistent chat functionality

-- Create ai_sdk5_chats table
CREATE TABLE IF NOT EXISTS ai_sdk5_chats (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_sdk5_messages table
CREATE TABLE IF NOT EXISTS ai_sdk5_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    chat_id TEXT REFERENCES ai_sdk5_chats(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_sdk5_parts table with comprehensive part type support
CREATE TABLE IF NOT EXISTS ai_sdk5_parts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message_id TEXT REFERENCES ai_sdk5_messages(id) ON DELETE CASCADE NOT NULL,
    "order" INTEGER NOT NULL,
    type TEXT NOT NULL,
    
    -- Text part fields
    text_text TEXT,
    
    -- Reasoning part fields
    reasoning_text TEXT,
    
    -- File part fields
    file_media_type TEXT,
    file_filename TEXT,
    file_url TEXT,
    file_base64 TEXT,
    file_size INTEGER,
    
    -- Source URL part fields
    source_url_source_id TEXT,
    source_url_url TEXT,
    source_url_title TEXT,
    
    -- Source document part fields
    source_document_media_type TEXT,
    source_document_title TEXT,
    source_document_filename TEXT,
    source_document_data TEXT,
    
    -- Tool call part fields
    tool_call_name TEXT,
    tool_call_input JSONB,
    tool_call_output JSONB,
    
    -- Data part fields
    data_content JSONB,
    
    -- Provider metadata
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Check constraints to ensure proper data based on type
    CONSTRAINT check_text_part CHECK (
        CASE WHEN type = 'text' THEN text_text IS NOT NULL ELSE TRUE END
    ),
    CONSTRAINT check_reasoning_part CHECK (
        CASE WHEN type = 'reasoning' THEN reasoning_text IS NOT NULL ELSE TRUE END
    ),
    CONSTRAINT check_file_part CHECK (
        CASE WHEN type = 'file' THEN 
            file_media_type IS NOT NULL AND 
            (file_url IS NOT NULL OR file_base64 IS NOT NULL)
        ELSE TRUE END
    ),
    CONSTRAINT check_source_url_part CHECK (
        CASE WHEN type = 'source-url' THEN 
            source_url_source_id IS NOT NULL AND source_url_url IS NOT NULL
        ELSE TRUE END
    ),
    CONSTRAINT check_source_document_part CHECK (
        CASE WHEN type = 'source-document' THEN 
            source_document_media_type IS NOT NULL AND source_document_data IS NOT NULL
        ELSE TRUE END
    ),
    CONSTRAINT check_tool_call_part CHECK (
        CASE WHEN type = 'tool-call' THEN 
            tool_call_name IS NOT NULL
        ELSE TRUE END
    ),
    CONSTRAINT check_data_part CHECK (
        CASE WHEN type = 'data' THEN data_content IS NOT NULL ELSE TRUE END
    )
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ai_sdk5_chats_project_id ON ai_sdk5_chats(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_sdk5_chats_created_at ON ai_sdk5_chats(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_sdk5_messages_chat_id ON ai_sdk5_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_sdk5_messages_chat_id_created_at ON ai_sdk5_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_sdk5_messages_role ON ai_sdk5_messages(role);

CREATE INDEX IF NOT EXISTS idx_ai_sdk5_parts_message_id ON ai_sdk5_parts(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_sdk5_parts_message_id_order ON ai_sdk5_parts(message_id, "order");
CREATE INDEX IF NOT EXISTS idx_ai_sdk5_parts_type ON ai_sdk5_parts(type);

-- Create updated_at trigger for chats table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_sdk5_chats_updated_at 
    BEFORE UPDATE ON ai_sdk5_chats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE ai_sdk5_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sdk5_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sdk5_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_sdk5_chats
CREATE POLICY "Users can view chats from their projects" ON ai_sdk5_chats
    FOR SELECT USING (
        project_id IN (
            SELECT upr.project_id 
            FROM user_project_roles upr 
            WHERE upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert chats in their projects" ON ai_sdk5_chats
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT upr.project_id 
            FROM user_project_roles upr 
            WHERE upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update chats in their projects" ON ai_sdk5_chats
    FOR UPDATE USING (
        project_id IN (
            SELECT upr.project_id 
            FROM user_project_roles upr 
            WHERE upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete chats from their projects" ON ai_sdk5_chats
    FOR DELETE USING (
        project_id IN (
            SELECT upr.project_id 
            FROM user_project_roles upr 
            WHERE upr.user_id = auth.uid()
        )
    );

-- RLS Policies for ai_sdk5_messages
CREATE POLICY "Users can view messages from accessible chats" ON ai_sdk5_messages
    FOR SELECT USING (
        chat_id IN (
            SELECT c.id 
            FROM ai_sdk5_chats c
            JOIN user_project_roles upr ON c.project_id = upr.project_id
            WHERE upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in accessible chats" ON ai_sdk5_messages
    FOR INSERT WITH CHECK (
        chat_id IN (
            SELECT c.id 
            FROM ai_sdk5_chats c
            JOIN user_project_roles upr ON c.project_id = upr.project_id
            WHERE upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages in accessible chats" ON ai_sdk5_messages
    FOR UPDATE USING (
        chat_id IN (
            SELECT c.id 
            FROM ai_sdk5_chats c
            JOIN user_project_roles upr ON c.project_id = upr.project_id
            WHERE upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages from accessible chats" ON ai_sdk5_messages
    FOR DELETE USING (
        chat_id IN (
            SELECT c.id 
            FROM ai_sdk5_chats c
            JOIN user_project_roles upr ON c.project_id = upr.project_id
            WHERE upr.user_id = auth.uid()
        )
    );

-- RLS Policies for ai_sdk5_parts
CREATE POLICY "Users can view parts from accessible messages" ON ai_sdk5_parts
    FOR SELECT USING (
        message_id IN (
            SELECT m.id 
            FROM ai_sdk5_messages m
            JOIN ai_sdk5_chats c ON m.chat_id = c.id
            JOIN user_project_roles upr ON c.project_id = upr.project_id
            WHERE upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert parts in accessible messages" ON ai_sdk5_parts
    FOR INSERT WITH CHECK (
        message_id IN (
            SELECT m.id 
            FROM ai_sdk5_messages m
            JOIN ai_sdk5_chats c ON m.chat_id = c.id
            JOIN user_project_roles upr ON c.project_id = upr.project_id
            WHERE upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update parts in accessible messages" ON ai_sdk5_parts
    FOR UPDATE USING (
        message_id IN (
            SELECT m.id 
            FROM ai_sdk5_messages m
            JOIN ai_sdk5_chats c ON m.chat_id = c.id
            JOIN user_project_roles upr ON c.project_id = upr.project_id
            WHERE upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete parts from accessible messages" ON ai_sdk5_parts
    FOR DELETE USING (
        message_id IN (
            SELECT m.id 
            FROM ai_sdk5_messages m
            JOIN ai_sdk5_chats c ON m.chat_id = c.id
            JOIN user_project_roles upr ON c.project_id = upr.project_id
            WHERE upr.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ai_sdk5_chats TO anon, authenticated;
GRANT ALL ON ai_sdk5_messages TO anon, authenticated;
GRANT ALL ON ai_sdk5_parts TO anon, authenticated;