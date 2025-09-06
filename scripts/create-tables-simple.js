const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTablesDirectly() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  console.log('Creating Supabase admin client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Test connection first
  console.log('Testing connection...');
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    console.log('✓ Connection successful');
  } catch (error) {
    console.error('Connection failed:', error.message);
    return;
  }

  // Create tables using raw SQL via rpc
  const createTablesSQL = `
    -- Create ai_sdk5_chats table
    CREATE TABLE IF NOT EXISTS ai_sdk5_chats (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create ai_sdk5_messages table  
    CREATE TABLE IF NOT EXISTS ai_sdk5_messages (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      chat_id TEXT REFERENCES ai_sdk5_chats(id) ON DELETE CASCADE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create ai_sdk5_parts table
    CREATE TABLE IF NOT EXISTS ai_sdk5_parts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      message_id TEXT REFERENCES ai_sdk5_messages(id) ON DELETE CASCADE NOT NULL,
      "order" INTEGER NOT NULL,
      type TEXT NOT NULL,
      text_text TEXT,
      reasoning_text TEXT,
      file_media_type TEXT,
      file_filename TEXT,
      file_url TEXT,
      source_url_source_id TEXT,
      source_url_url TEXT,
      source_url_title TEXT,
      source_document_source_id TEXT,
      source_document_media_type TEXT,
      source_document_title TEXT,
      source_document_filename TEXT,
      tool_tool_call_id TEXT,
      tool_state TEXT,
      tool_error_text TEXT,
      tool_get_weather_information_input TEXT,
      tool_get_weather_information_output TEXT,
      tool_get_location_input TEXT,
      tool_get_location_output TEXT,
      data_weather_id TEXT,
      data_weather_location TEXT,
      data_weather_weather TEXT,
      data_weather_temperature INTEGER,
      provider_metadata TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_ai_sdk5_messages_chat_id ON ai_sdk5_messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_ai_sdk5_parts_message_id ON ai_sdk5_parts(message_id);

    -- Enable RLS
    ALTER TABLE ai_sdk5_chats ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ai_sdk5_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ai_sdk5_parts ENABLE ROW LEVEL SECURITY;

    -- Create permissive policies for development
    CREATE POLICY "Allow all operations on chats" ON ai_sdk5_chats FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all operations on messages" ON ai_sdk5_messages FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all operations on parts" ON ai_sdk5_parts FOR ALL USING (true) WITH CHECK (true);
  `;

  console.log('Creating tables with SQL...');

  try {
    // Try using the admin API to run raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: createTablesSQL });
    
    if (error) {
      console.log('RPC method failed, trying alternative...');
      
      // Alternative: Use HTTP request directly to Supabase's query endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: createTablesSQL })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      console.log('✓ Tables created via HTTP API');
    } else {
      console.log('✓ Tables created via RPC');
    }

    // Test that we can insert into the tables
    console.log('Testing table access...');
    
    const testChatId = 'test-' + Date.now();
    const { data: chatData, error: chatError } = await supabase
      .from('ai_sdk5_chats')
      .insert({ id: testChatId })
      .select();

    if (chatError) throw chatError;
    console.log('✓ Successfully inserted test chat');

    // Clean up test data
    await supabase.from('ai_sdk5_chats').delete().eq('id', testChatId);
    console.log('✓ Test cleanup completed');

    console.log('\n🎉 All AI SDK 5 tables created successfully!');
    console.log('Tables: ai_sdk5_chats, ai_sdk5_messages, ai_sdk5_parts');
    
  } catch (error) {
    console.error('❌ Failed to create tables:', error.message);
    console.log('\nFallback option: Run this SQL manually in Supabase dashboard:');
    console.log(`${supabaseUrl.replace('//supabase', '//supabase.com/dashboard/project')}/sql/new`);
    console.log('\nSQL to execute:');
    console.log(createTablesSQL);
  }
}

createTablesDirectly();