#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

async function createAiSdk5Tables() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY');
        process.exit(1);
    }

    console.log('Creating Supabase client with service key...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // Read the SQL migration file
        const sqlPath = path.join(__dirname, 'create-ai-sdk5-tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing AI SDK 5 tables migration...');
        
        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('Error executing migration:', error);
            
            // Try alternative approach - execute statements one by one
            console.log('Trying alternative approach - executing statements individually...');
            
            const statements = sql
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                console.log(`Executing statement ${i + 1}/${statements.length}`);
                
                try {
                    const { error: stmtError } = await supabase.rpc('exec_sql', { 
                        sql_query: statement + ';' 
                    });
                    
                    if (stmtError) {
                        console.error(`Error in statement ${i + 1}:`, stmtError);
                        console.error('Statement:', statement);
                    } else {
                        console.log(`✓ Statement ${i + 1} executed successfully`);
                    }
                } catch (err) {
                    console.error(`Exception in statement ${i + 1}:`, err);
                }
            }
        } else {
            console.log('✓ Migration executed successfully');
            if (data) {
                console.log('Result:', data);
            }
        }

        // Verify tables were created
        console.log('\nVerifying table creation...');
        
        const tables = ['ai_sdk5_chats', 'ai_sdk5_messages', 'ai_sdk5_parts'];
        
        for (const table of tables) {
            const { data: tableData, error: tableError } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (tableError) {
                console.error(`❌ Error accessing ${table}:`, tableError.message);
            } else {
                console.log(`✓ Table ${table} is accessible`);
            }
        }

        console.log('\n✅ AI SDK 5 tables migration completed!');
        
    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
}

// Run the migration
if (require.main === module) {
    createAiSdk5Tables().catch(console.error);
}

module.exports = { createAiSdk5Tables };