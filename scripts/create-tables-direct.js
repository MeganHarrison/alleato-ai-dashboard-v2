#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

async function createAiSdk5Tables() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to PostgreSQL database...');
        await client.connect();
        
        console.log('Connected successfully!');

        // Read and execute the SQL file
        const sqlPath = path.join(__dirname, 'create-ai-sdk5-tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing AI SDK 5 tables migration...');
        
        try {
            const result = await client.query(sql);
            console.log('✓ Migration executed successfully');
        } catch (error) {
            console.error('Error executing full migration, trying individual statements...');
            
            // Split and execute statements individually
            const statements = sql
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                console.log(`Executing statement ${i + 1}/${statements.length}`);
                
                try {
                    await client.query(statement);
                    console.log(`✓ Statement ${i + 1} executed successfully`);
                    successCount++;
                } catch (stmtError) {
                    console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
                    console.error('Statement:', statement.substring(0, 100) + '...');
                    errorCount++;
                }
            }

            console.log(`\nExecution summary: ${successCount} successful, ${errorCount} failed`);
        }

        // Verify tables were created
        console.log('\nVerifying table creation...');
        
        const tables = ['ai_sdk5_chats', 'ai_sdk5_messages', 'ai_sdk5_parts'];
        
        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
                console.log(`✓ Table ${table} is accessible`);
            } catch (tableError) {
                console.error(`❌ Error accessing ${table}:`, tableError.message);
            }
        }

        console.log('\n✅ AI SDK 5 tables migration completed!');
        
    } catch (error) {
        console.error('Connection error:', error);
    } finally {
        await client.end();
    }
}

// Run the migration
if (require.main === module) {
    createAiSdk5Tables().catch(console.error);
}

module.exports = { createAiSdk5Tables };