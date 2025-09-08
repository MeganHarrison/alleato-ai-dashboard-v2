const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executeSimpleSQL() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local');
  }

  console.log('🚀 Executing simple ai_sdk5_chats table creation...');
  console.log(`Database URL: ${supabaseUrl}`);

  const sqlStatement = `
    CREATE TABLE IF NOT EXISTS ai_sdk5_chats (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  console.log('SQL Statement to execute:');
  console.log(sqlStatement);

  try {
    // Use postgres.js to execute directly (mimicking MCP executeSql functionality)
    const postgres = require('postgres');
    
    // Get database URL and convert if needed
    let dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
    
    if (!dbUrl) {
      // Construct database URL from Supabase components
      dbUrl = `postgresql://postgres.lgveqfnpkxvzbnnwuled:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
    }

    // Convert pooler URL to direct connection for migrations
    if (dbUrl.includes('pooler.supabase.com')) {
      dbUrl = dbUrl
        .replace('aws-0-us-east-1.pooler.supabase.com:6543', 'db.lgveqfnpkxvzbnnwuled.supabase.co:5432')
        .replace('?pgbouncer=true', '');
    }

    console.log('Connecting to database...');
    
    const sql = postgres(dbUrl, {
      ssl: 'require',
      transform: undefined,
      onnotice: () => {} // Suppress notices
    });

    console.log('✅ Database connection established');
    console.log('📝 Executing SQL statement...');

    await sql.unsafe(sqlStatement);
    
    console.log('✅ SQL statement executed successfully!');
    console.log('🎯 ai_sdk5_chats table created or already exists');

    // Verify the table was created by querying its structure
    console.log('\n🔍 Verifying table creation...');
    
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'ai_sdk5_chats'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    if (tableInfo.length > 0) {
      console.log('✅ Table verification successful!');
      console.log('📋 Table structure:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    } else {
      console.log('⚠️  Could not verify table structure');
    }

    await sql.end();
    console.log('🏁 Operation completed successfully!');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Table already exists - no action needed');
    } else {
      console.error('❌ Error executing SQL:', error.message);
      console.error('Full error:', error);
    }
  }
}

// Execute the function
executeSimpleSQL().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});