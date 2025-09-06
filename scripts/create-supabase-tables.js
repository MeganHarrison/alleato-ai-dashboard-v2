const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Use service key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTablesViaSQL() {
  console.log('Creating tables via Supabase SQL function...');
  
  // Create the tables using SQL via Supabase's query interface
  const tables = [
    {
      name: 'ai_sdk5_chats',
      sql: `CREATE TABLE IF NOT EXISTS ai_sdk5_chats (
        id TEXT PRIMARY KEY
      )`
    },
    {
      name: 'ai_sdk5_messages', 
      sql: `CREATE TABLE IF NOT EXISTS ai_sdk5_messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system'))
      )`
    },
    {
      name: 'ai_sdk5_parts',
      sql: `CREATE TABLE IF NOT EXISTS ai_sdk5_parts (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
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
      )`
    }
  ];

  // First try to insert a test record to see if tables exist
  try {
    const { data, error } = await supabase
      .from('ai_sdk5_chats')
      .insert({ id: 'test' })
      .select();
      
    if (!error) {
      console.log('✅ Tables already exist!');
      // Clean up test record
      await supabase.from('ai_sdk5_chats').delete().eq('id', 'test');
      return;
    }
  } catch (e) {
    console.log('Tables do not exist yet, creating them...');
  }

  // If we get here, tables don't exist. Let's create them
  // Try using the REST API directly to execute SQL
  
  for (const table of tables) {
    console.log(`Creating ${table.name}...`);
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ 
          sql: table.sql
        })
      });

      if (response.ok) {
        console.log(`✓ Created ${table.name}`);
      } else {
        const errorText = await response.text();
        console.error(`Error creating ${table.name}:`, errorText);
      }
    } catch (error) {
      console.error(`Failed to create ${table.name}:`, error.message);
    }
  }

  // Add foreign key constraints
  console.log('Adding foreign key constraints...');
  const constraints = [
    'ALTER TABLE ai_sdk5_messages ADD CONSTRAINT fk_chat FOREIGN KEY (chat_id) REFERENCES ai_sdk5_chats(id) ON DELETE CASCADE',
    'ALTER TABLE ai_sdk5_parts ADD CONSTRAINT fk_message FOREIGN KEY (message_id) REFERENCES ai_sdk5_messages(id) ON DELETE CASCADE'
  ];

  for (const constraint of constraints) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql: constraint })
      });

      if (response.ok) {
        console.log('✓ Added constraint');
      }
    } catch (error) {
      console.log('Note: Constraint may already exist');
    }
  }

  console.log('✅ Table creation completed!');
}

createTablesViaSQL().catch(console.error);