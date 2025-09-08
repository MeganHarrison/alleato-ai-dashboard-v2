const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function listAllTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_KEY:', !!supabaseServiceKey);
    return;
  }

  console.log('🔍 Listing all tables in the database...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Query information_schema to get all tables
    const { data: tables, error } = await supabase
      .rpc('get_all_tables');

    if (error) {
      // If the RPC doesn't exist, try a direct query
      console.log('Trying direct query...');
      const { data: directTables, error: directError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public');

      if (directError) {
        // Try using raw SQL
        const { data: sqlTables, error: sqlError } = await supabase
          .from('pg_tables')
          .select('tablename, schemaname')
          .eq('schemaname', 'public');

        if (sqlError) {
          throw new Error(`Failed to query tables: ${sqlError.message}`);
        }
        console.log('📋 Tables found (via pg_tables):');
        sqlTables?.forEach(table => {
          console.log(`  - ${table.tablename}`);
        });
        return;
      }

      console.log('📋 Tables found (via information_schema):');
      directTables?.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
      return;
    }

    console.log('📋 Tables found (via RPC):');
    tables?.forEach(table => {
      console.log(`  - ${table}`);
    });

  } catch (error) {
    console.error('❌ Error listing tables:', error.message);
    
    // Try a more basic approach - just try to query some common table names
    console.log('\n🔍 Trying to detect tables by testing common names...');
    const commonTableNames = [
      'employees', 'users', 'profiles', 'auth.users',
      'chats', 'messages', 'parts', 'ai_sdk5_chats', 'ai_sdk5_messages', 'ai_sdk5_parts',
      'meetings', 'meeting_chunks', 'documents', 'nods_page_section',
      'projects', 'companies', 'contacts', 'leads',
      'tasks', 'workflows', 'integrations'
    ];

    for (const tableName of commonTableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`  ✓ ${tableName} - exists`);
        }
      } catch (e) {
        // Table doesn't exist or no access
      }
    }
  }
}

listAllTables();