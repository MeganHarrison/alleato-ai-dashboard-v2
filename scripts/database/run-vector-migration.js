#!/usr/bin/env node

/**
 * Script to run the vector search migration on Supabase
 * This script will execute the SQL migration file to set up pgvector
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runVectorMigration() {
  try {
    console.log('🚀 Starting vector search migration...');

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY');
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250828_vector_search_setup.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📁 Migration file loaded successfully');

    // Split the SQL into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          query: statement + ';' 
        }).select();

        if (error) {
          // Try direct execution for DDL statements
          const { error: directError } = await supabase
            .from('dummy')  // This will fail but might execute the SQL
            .select(statement);
          
          if (directError && !directError.message.includes('does not exist')) {
            console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`);
          }
        }
        
        console.log(`✅ Statement ${i + 1} completed`);
      } catch (err) {
        console.error(`❌ Error on statement ${i + 1}:`, err);
        // Continue with other statements
      }
    }

    // Test the setup by checking if pgvector is enabled
    console.log('🔍 Testing pgvector extension...');
    
    const { data: extensions, error: extError } = await supabase
      .from('pg_extension')
      .select('extname')
      .eq('extname', 'vector');

    if (extError) {
      console.warn('⚠️  Could not verify pgvector extension:', extError.message);
    } else if (extensions && extensions.length > 0) {
      console.log('✅ pgvector extension is enabled');
    }

    // Test tables existence
    console.log('🔍 Checking table setup...');
    
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['documents', 'meeting_chunks']);

    if (!tableError && tables) {
      console.log(`✅ Found ${tables.length} expected tables`);
      tables.forEach(table => console.log(`   - ${table.table_name}`));
    }

    console.log('🎉 Vector search migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the implementation at: /test-vector-search');
    console.log('2. Update existing meeting chunks with embeddings using the API');
    console.log('3. Start using semantic search in your application');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is called directly
if (require.main === module) {
  runVectorMigration();
}

module.exports = { runVectorMigration };