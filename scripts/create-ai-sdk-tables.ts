import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('Creating AI SDK 5 tables in Supabase...');

  try {
    // Read SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '../lib/db/create-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error creating tables:', error);
      // Try executing statements one by one
      console.log('Trying to execute statements individually...');
      
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (stmtError) {
          console.error('Statement error:', stmtError);
          // Try direct REST API
          console.log('Trying direct REST API...');
          
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ sql_query: statement + ';' })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('REST API error:', response.status, errorText);
          }
        }
      }
    } else {
      console.log('Tables created successfully!');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
createTables();