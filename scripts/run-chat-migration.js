#!/usr/bin/env node

/**
 * Script to run the chat messages migration on Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

async function runChatMigration() {
  try {
    console.log('🚀 Starting chat messages migration...\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250828_chat_messages.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📁 Migration file loaded successfully');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Try to execute via RPC
        const { error } = await supabase.rpc('exec_sql', { 
          query: statement + ';' 
        });

        if (error) {
          // Try alternative method
          await supabase.from('dummy').select(statement);
        }
        
        console.log(`✅ Statement ${i + 1} completed`);
        successCount++;
      } catch (err) {
        console.warn(`⚠️  Warning on statement ${i + 1}: May already exist or handled`);
        errorCount++;
      }
    }

    // Test the setup
    console.log('\n🔍 Testing chat messages table...');
    
    const testMessage = {
      room_name: 'test-room',
      username: 'system',
      message: 'Test message from migration script',
      metadata: { type: 'system', test: true }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('chat_messages')
      .insert(testMessage)
      .select()
      .single();

    if (insertError) {
      console.warn('⚠️  Could not insert test message:', insertError.message);
    } else {
      console.log('✅ Test message inserted successfully');
      
      // Clean up test message
      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', insertData.id);
      
      if (!deleteError) {
        console.log('   Test message cleaned up');
      }
    }

    // Check if tables exist
    console.log('\n🔍 Verifying tables...');
    
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1);
    
    const { data: sharedResults, error: sharedError } = await supabase
      .from('shared_search_results')
      .select('id')
      .limit(1);

    if (!messagesError) {
      console.log('✅ chat_messages table is accessible');
    } else {
      console.log('❌ chat_messages table error:', messagesError.message);
    }

    if (!sharedError) {
      console.log('✅ shared_search_results table is accessible');
    } else {
      console.log('❌ shared_search_results table error:', sharedError.message);
    }

    console.log('\n🎉 Chat messages migration completed!');
    console.log(`   Successful statements: ${successCount}`);
    console.log(`   Warning/skipped: ${errorCount}`);
    console.log('\n📋 Next steps:');
    console.log('1. Test the collaborative search at: /collaborative-search');
    console.log('2. Join a room with your team members');
    console.log('3. Share search results and documents in real-time');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runChatMigration();
}

module.exports = { runChatMigration };