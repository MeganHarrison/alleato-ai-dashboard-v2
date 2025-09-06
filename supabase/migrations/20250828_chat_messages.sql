-- Create chat messages table for realtime collaboration
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_name ON chat_messages(room_name);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_name, created_at DESC);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages (permissive for testing)
CREATE POLICY "Allow all users to read messages" ON chat_messages
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow all users to insert messages" ON chat_messages
  FOR INSERT TO public
  WITH CHECK (true);

-- Create a table for shared search results
CREATE TABLE IF NOT EXISTS shared_search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT NOT NULL,
  username TEXT NOT NULL,
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  result_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for shared search results
CREATE INDEX IF NOT EXISTS idx_shared_results_room ON shared_search_results(room_name);
CREATE INDEX IF NOT EXISTS idx_shared_results_created ON shared_search_results(created_at DESC);

-- Enable RLS for shared search results
ALTER TABLE shared_search_results ENABLE ROW LEVEL SECURITY;

-- Policies for shared search results
CREATE POLICY "Allow all users to read shared results" ON shared_search_results
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow all users to insert shared results" ON shared_search_results
  FOR INSERT TO public
  WITH CHECK (true);

-- Function to clean old messages (optional, for maintenance)
CREATE OR REPLACE FUNCTION clean_old_chat_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_messages 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  DELETE FROM shared_search_results
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();