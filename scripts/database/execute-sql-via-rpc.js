require('dotenv').config();

async function executeSQL() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  console.log('🚀 Executing SQL via Supabase RPC...');
  console.log(`Database URL: ${supabaseUrl}`);
  console.log(`Service Key available: ${supabaseServiceKey ? 'Yes' : 'No'}`);
  console.log(`Anon Key available: ${supabaseAnonKey ? 'Yes' : 'No'}`);

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  const sqlStatement = `
    CREATE TABLE IF NOT EXISTS ai_sdk5_chats (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  console.log('\nSQL Statement to execute:');
  console.log(sqlStatement);

  // Try service key first if available
  const apiKey = supabaseServiceKey || supabaseAnonKey;
  if (!apiKey) {
    throw new Error('No API key available (neither service key nor anon key)');
  }

  try {
    console.log('\n🔧 Attempting to execute SQL...');

    // Method 1: Try using custom SQL execution function if it exists
    const customSqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sql: sqlStatement.trim()
      })
    });

    if (customSqlResponse.ok) {
      console.log('✅ SQL executed successfully via custom RPC function!');
      const result = await customSqlResponse.text();
      console.log('Result:', result);
    } else {
      console.log(`❌ Custom RPC method failed: ${customSqlResponse.status} ${customSqlResponse.statusText}`);
      
      // Method 2: Try creating the table using Supabase client
      console.log('\n🔧 Attempting alternative approach with Supabase client...');
      
      const { createClient } = require('@supabase/supabase-js');
      
      const supabase = createClient(supabaseUrl, apiKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });

      console.log('📡 Supabase client created, executing raw SQL...');

      // Use the sql function if available (newer versions)
      try {
        const { data, error } = await supabase.rpc('exec', {
          sql: sqlStatement.trim()
        });

        if (error) {
          console.log('❌ RPC exec failed:', error);
          
          // Method 3: Try using direct table operations
          console.log('\n🔧 Attempting to check if table exists via information_schema...');
          
          const { data: tableExists, error: checkError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_name', 'ai_sdk5_chats')
            .eq('table_schema', 'public');

          if (checkError) {
            console.log('❌ Could not check table existence:', checkError);
          } else if (tableExists && tableExists.length > 0) {
            console.log('✅ Table ai_sdk5_chats already exists!');
          } else {
            console.log('⚠️  Table does not exist and could not be created via API');
            console.log('💡 You may need to execute this SQL manually in the Supabase dashboard:');
            console.log('   https://supabase.com/dashboard/project/lgveqfnpkxvzbnnwuled/sql/new');
            console.log('\nSQL to execute:');
            console.log(sqlStatement);
          }
        } else {
          console.log('✅ SQL executed successfully via RPC exec!');
          console.log('Result:', data);
        }
      } catch (rpcError) {
        console.log('❌ RPC execution failed:', rpcError.message);
        
        // Final attempt: Show instructions for manual execution
        console.log('\n📋 Manual Execution Required');
        console.log('=' .repeat(50));
        console.log('The SQL could not be executed automatically.');
        console.log('Please execute this SQL manually in your Supabase dashboard:');
        console.log('\n🔗 Dashboard URL:');
        console.log(`   https://supabase.com/dashboard/project/lgveqfnpkxvzbnnwuled/sql/new`);
        console.log('\n📝 SQL to execute:');
        console.log(sqlStatement);
        console.log('=' .repeat(50));
      }
    }

    // Try to verify table existence regardless of creation method
    console.log('\n🔍 Attempting to verify table existence...');
    
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/ai_sdk5_chats?limit=0`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    if (verifyResponse.ok) {
      console.log('✅ Table verification successful - ai_sdk5_chats table exists and is accessible!');
    } else if (verifyResponse.status === 404) {
      console.log('⚠️  Table does not exist or is not accessible');
    } else {
      console.log(`❓ Table verification unclear: ${verifyResponse.status} ${verifyResponse.statusText}`);
    }

  } catch (error) {
    console.error('❌ Error during execution:', error.message);
    console.error('Full error:', error);
  }
}

// Execute the function
executeSQL().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});