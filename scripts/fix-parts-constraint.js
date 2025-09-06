const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixPartsConstraint() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  console.log('Fixing parts table constraint to support AI SDK 5 types...');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Use raw query to modify the constraint
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        -- Drop the existing restrictive constraint
        ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_type_check;
        
        -- Add new constraint supporting AI SDK 5 types
        ALTER TABLE parts ADD CONSTRAINT parts_type_check 
        CHECK (type IN (
          'text', 
          'file', 
          'image',
          'reasoning',
          'tool-call',
          'tool-result', 
          'data',
          'source-url',
          'source-document',
          'step-start',
          'tool-getWeatherInformation',
          'tool-getLocation',
          'data-weather'
        ));
      `
    });

    if (error) {
      // Try alternative approach - use postgres directly
      console.log('RPC failed, trying direct postgres connection...');
      const postgres = require('postgres');
      
      const dbUrl = process.env.DATABASE_URL
        .replace('aws-0-us-east-1.pooler.supabase.com:6543', 'db.lgveqfnpkxvzbnnwuled.supabase.co:5432')
        .replace('?pgbouncer=true', '');

      const sql = postgres(dbUrl, {
        ssl: 'require',
        transform: undefined,
        onnotice: () => {}
      });

      try {
        await sql`
          ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_type_check;
        `;
        console.log('✓ Dropped old constraint');

        await sql`
          ALTER TABLE parts ADD CONSTRAINT parts_type_check 
          CHECK (type IN (
            'text', 
            'file', 
            'image',
            'reasoning',
            'tool-call',
            'tool-result', 
            'data',
            'source-url',
            'source-document',
            'step-start',
            'tool-getWeatherInformation',
            'tool-getLocation',
            'data-weather'
          ));
        `;
        console.log('✓ Added new constraint with AI SDK 5 types');

        await sql.end();
        console.log('🎉 Parts table constraint updated successfully!');
        console.log('✅ Now supports: text, file, image, reasoning, tool-call, tool-result, data, etc.');

      } catch (dbError) {
        console.error('❌ Direct database connection failed:', dbError.message);
        throw dbError;
      }
    } else {
      console.log('✓ Constraint updated via RPC');
    }

    // Test the new constraint
    console.log('\nTesting new constraint...');
    const testPartId = require('crypto').randomUUID();
    const testMessageId = require('crypto').randomUUID();

    // Create a test message first (we need a valid message_id)
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUserId = users.users[0]?.id;
    
    if (testUserId) {
      const testChatId = require('crypto').randomUUID();
      
      await supabase.from('chats').insert({
        id: testChatId,
        user_id: testUserId,
        title: 'Test Chat for Constraint'
      });

      await supabase.from('messages').insert({
        id: testMessageId,
        chat_id: testChatId,
        role: 'user',
        content: 'Test message'
      });

      // Test reasoning type
      const { error: testError } = await supabase
        .from('parts')
        .insert({
          id: testPartId,
          message_id: testMessageId,
          type: 'reasoning',
          content: 'Test reasoning content'
        });

      if (testError) {
        console.error('❌ Test failed:', testError.message);
      } else {
        console.log('✓ Test successful - reasoning type accepted!');
        
        // Cleanup
        await supabase.from('chats').delete().eq('id', testChatId);
      }
    }

  } catch (error) {
    console.error('❌ Failed to update constraint:', error.message);
    
    console.log('\n📋 Manual fix required:');
    console.log('Go to: https://lgveqfnpkxvzbnnwuled.supabase.co/dashboard/project/lgveqfnpkxvzbnnwuled/sql/new');
    console.log('\nRun this SQL:');
    console.log(`
ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_type_check;

ALTER TABLE parts ADD CONSTRAINT parts_type_check 
CHECK (type IN (
  'text', 'file', 'image', 'reasoning', 'tool-call', 
  'tool-result', 'data', 'source-url', 'source-document'
));
    `);
  }
}

fixPartsConstraint();