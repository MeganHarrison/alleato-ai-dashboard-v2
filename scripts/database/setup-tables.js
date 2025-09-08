const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTables() {
  console.log('Setting up AI SDK 5 tables...');

  // Create tables one by one using Supabase's query builder
  try {
    // First, let's check if tables already exist
    const { data: existingTables } = await supabase
      .from('ai_sdk5_chats')
      .select('id')
      .limit(1);

    if (!existingTables) {
      console.log('Tables do not exist yet. Creating them...');
      
      // Since we can't create tables via the JS client, let's create a migration approach
      // We'll use the Database URL directly with a PostgreSQL client
      const { Client } = require('pg');
      
      // Parse DATABASE_URL and convert pooler to direct connection
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not found');
      }

      // Convert pooler URL to direct connection
      // aws-0-us-east-1.pooler.supabase.com -> db.lgveqfnpkxvzbnnwuled.supabase.co
      const directUrl = databaseUrl
        .replace('aws-0-us-east-1.pooler.supabase.com:6543', 'db.lgveqfnpkxvzbnnwuled.supabase.co:5432')
        .replace('?pgbouncer=true', '');

      const client = new Client({
        connectionString: directUrl,
        ssl: {
          rejectUnauthorized: false
        }
      });

      await client.connect();

      // Create chats table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_sdk5_chats (
          id TEXT PRIMARY KEY
        )
      `);
      console.log('✓ Created ai_sdk5_chats table');

      // Create messages table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_sdk5_messages (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL REFERENCES ai_sdk5_chats(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system'))
        )
      `);
      console.log('✓ Created ai_sdk5_messages table');

      // Create messages indexes
      await client.query('CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON ai_sdk5_messages(chat_id)');
      await client.query('CREATE INDEX IF NOT EXISTS messages_chat_id_created_at_idx ON ai_sdk5_messages(chat_id, created_at)');

      // Create parts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_sdk5_parts (
          id TEXT PRIMARY KEY,
          message_id TEXT NOT NULL REFERENCES ai_sdk5_messages(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
          provider_metadata TEXT
        )
      `);
      console.log('✓ Created ai_sdk5_parts table');

      // Create parts indexes
      await client.query('CREATE INDEX IF NOT EXISTS parts_message_id_idx ON ai_sdk5_parts(message_id)');
      await client.query('CREATE INDEX IF NOT EXISTS parts_message_id_order_idx ON ai_sdk5_parts(message_id, "order")');

      // Enable RLS
      await client.query('ALTER TABLE ai_sdk5_chats ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE ai_sdk5_messages ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE ai_sdk5_parts ENABLE ROW LEVEL SECURITY');

      // Create policies
      await client.query(`CREATE POLICY "Users can insert their own chats" ON ai_sdk5_chats FOR INSERT WITH CHECK (true)`);
      await client.query(`CREATE POLICY "Users can view their own chats" ON ai_sdk5_chats FOR SELECT USING (true)`);
      await client.query(`CREATE POLICY "Users can insert messages" ON ai_sdk5_messages FOR INSERT WITH CHECK (true)`);
      await client.query(`CREATE POLICY "Users can view messages" ON ai_sdk5_messages FOR SELECT USING (true)`);
      await client.query(`CREATE POLICY "Users can insert parts" ON ai_sdk5_parts FOR INSERT WITH CHECK (true)`);
      await client.query(`CREATE POLICY "Users can view parts" ON ai_sdk5_parts FOR SELECT USING (true)`);

      await client.end();
      console.log('✅ All tables created successfully!');
    } else {
      console.log('✅ Tables already exist');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupTables();