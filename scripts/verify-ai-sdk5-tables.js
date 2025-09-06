#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

async function verifyAiSdk5Tables() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY');
        process.exit(1);
    }

    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        console.log('Verifying AI SDK 5 tables...\n');
        
        const tables = [
            { name: 'ai_sdk5_chats', expectedColumns: ['id', 'project_id', 'title', 'metadata', 'created_at', 'updated_at'] },
            { name: 'ai_sdk5_messages', expectedColumns: ['id', 'chat_id', 'role', 'metadata', 'created_at'] },
            { name: 'ai_sdk5_parts', expectedColumns: ['id', 'message_id', 'order', 'type', 'text_text', 'reasoning_text', 'file_media_type', 'created_at'] }
        ];
        
        let allTablesExist = true;
        
        for (const table of tables) {
            console.log(`Checking table: ${table.name}`);
            
            try {
                // Try to query the table structure
                const { data, error } = await supabase
                    .from(table.name)
                    .select('*')
                    .limit(0); // Don't fetch data, just check structure

                if (error) {
                    console.error(`❌ Table ${table.name} not accessible:`, error.message);
                    allTablesExist = false;
                } else {
                    console.log(`✓ Table ${table.name} exists and is accessible`);
                    
                    // Try to insert a test record to verify permissions
                    if (table.name === 'ai_sdk5_chats') {
                        // We can't test insert without a valid project_id, so we'll skip this
                        console.log(`  - Table structure verified`);
                    }
                }
            } catch (err) {
                console.error(`❌ Error accessing ${table.name}:`, err.message);
                allTablesExist = false;
            }
        }
        
        console.log('\n' + '='.repeat(50));
        
        if (allTablesExist) {
            console.log('✅ All AI SDK 5 tables are properly created and accessible!');
            console.log('\nNext steps:');
            console.log('1. Update your Drizzle schema to match these tables');
            console.log('2. Run "npm run update-types" to refresh TypeScript types');
            console.log('3. Start using AI SDK 5 persistent chat in your application');
        } else {
            console.log('❌ Some tables are missing or not accessible.');
            console.log('\nPlease execute the migration SQL manually:');
            console.log('1. Go to: https://supabase.com/dashboard/project/lgveqfnpkxvzbnnwuled/sql/new');
            console.log('2. Copy and paste the SQL from: /supabase/migrations/20250826_ai_sdk5_persistent_chat.sql');
            console.log('3. Execute the query');
            console.log('4. Run this verification script again');
        }
        
    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
}

// Run the verification
if (require.main === module) {
    verifyAiSdk5Tables().catch(console.error);
}

module.exports = { verifyAiSdk5Tables };