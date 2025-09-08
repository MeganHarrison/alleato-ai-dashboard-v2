const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executeSQLMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  // Read the migration SQL file
  const sqlPath = path.join(__dirname, '../supabase/migrations/20250826_ai_sdk5_persistent_chat.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Split into individual statements (simple approach)
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    .map(stmt => stmt + ';');

  console.log(`Executing ${statements.length} SQL statements...`);

  // Execute each statement using Supabase's query endpoint directly
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (!statement.trim() || statement.startsWith('--')) {
      continue;
    }

    console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);

    try {
      // Use the direct query endpoint with service key
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: statement
        })
      });

      if (!response.ok) {
        // Try alternative approach - direct SQL execution
        console.log(`Trying alternative approach for statement ${i + 1}...`);
        
        // Use postgres.js to execute directly
        const postgres = require('postgres');
        
        // Convert pooler URL to direct connection for migrations
        const dbUrl = process.env.DATABASE_URL
          .replace('aws-0-us-east-1.pooler.supabase.com:6543', 'db.lgveqfnpkxvzbnnwuled.supabase.co:5432')
          .replace('?pgbouncer=true', '');

        const sql = postgres(dbUrl, {
          ssl: 'require',
          transform: undefined,
          onnotice: () => {} // Suppress notices
        });

        try {
          await sql.unsafe(statement);
          console.log(`✓ Statement ${i + 1} executed successfully`);
        } catch (dbError) {
          if (dbError.message.includes('already exists')) {
            console.log(`✓ Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`✗ Statement ${i + 1} failed:`, dbError.message);
          }
        } finally {
          await sql.end();
        }
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`);
      }
    } catch (error) {
      console.error(`✗ Statement ${i + 1} failed:`, error.message);
    }
  }

  console.log('\n🎉 Migration execution completed!');
  console.log('Running verification...');

  // Run verification
  try {
    const verifyScript = path.join(__dirname, 'verify-ai-sdk5-tables.js');
    const { exec } = require('child_process');
    
    exec(`node ${verifyScript}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Verification error:', error);
      } else {
        console.log(stdout);
      }
    });
  } catch (error) {
    console.error('Could not run verification:', error.message);
  }
}

executeSQLMigration().catch(console.error);