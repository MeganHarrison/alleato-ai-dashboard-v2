-- AI SDK 5 Tables Migration
-- Run this in Supabase SQL Editor

-- Create chats table
CREATE TABLE IF NOT EXISTS ai_sdk5_chats (
  id TEXT PRIMARY KEY
);

-- Create messages table  
CREATE TABLE IF NOT EXISTS ai_sdk5_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES ai_sdk5_chats(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system'))
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON ai_sdk5_messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_chat_id_created_at_idx ON ai_sdk5_messages(chat_id, created_at);

-- Create parts table
CREATE TABLE IF NOT EXISTS ai_sdk5_parts (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES ai_sdk5_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "order" INTEGER NOT NULL,
  type TEXT NOT NULL,
  -- Text fields
  text_text TEXT,
  -- Reasoning fields  
  reasoning_text TEXT,
  -- File fields
  file_media_type TEXT,
  file_filename TEXT,
  file_url TEXT,
  -- Source URL fields
  source_url_source_id TEXT,
  source_url_url TEXT, 
  source_url_title TEXT,
  -- Source document fields
  source_document_source_id TEXT,
  source_document_media_type TEXT,
  source_document_title TEXT,
  source_document_filename TEXT,
  -- Tool fields
  tool_tool_call_id TEXT,
  tool_state TEXT,
  tool_error_text TEXT,
  tool_get_weather_information_input TEXT,
  tool_get_weather_information_output TEXT,
  tool_get_location_input TEXT,
  tool_get_location_output TEXT,
  -- Weather data fields
  data_weather_id TEXT,
  data_weather_location TEXT,
  data_weather_weather TEXT,
  data_weather_temperature INTEGER,
  -- Provider metadata
  provider_metadata TEXT
);

-- Create indexes for parts
CREATE INDEX IF NOT EXISTS parts_message_id_idx ON ai_sdk5_parts(message_id);
CREATE INDEX IF NOT EXISTS parts_message_id_order_idx ON ai_sdk5_parts(message_id, "order");

-- Enable RLS for all tables
ALTER TABLE ai_sdk5_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sdk5_messages ENABLE ROW LEVEL SECURITY;  
ALTER TABLE ai_sdk5_parts ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (adjust based on your auth needs)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow all operations on chats" ON ai_sdk5_chats;
  DROP POLICY IF EXISTS "Allow all operations on messages" ON ai_sdk5_messages;
  DROP POLICY IF EXISTS "Allow all operations on parts" ON ai_sdk5_parts;
  
  -- Create new policies
  CREATE POLICY "Allow all operations on chats" ON ai_sdk5_chats FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all operations on messages" ON ai_sdk5_messages FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all operations on parts" ON ai_sdk5_parts FOR ALL USING (true) WITH CHECK (true);
END
$$;