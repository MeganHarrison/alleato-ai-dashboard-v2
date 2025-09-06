const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'Not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createConfirmedTestUser() {
  const testEmail = 'test.user@testcompany.com';
  const testPassword = 'TestPassword123!';

  try {
    // First delete the user if it exists
    console.log('Checking for existing user...');
    
    // Try to get user by email using admin API
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
    } else {
      const existingUser = users?.users?.find(u => u.email === testEmail);
      if (existingUser) {
        console.log('Found existing user, deleting...');
        const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
        if (deleteError) {
          console.error('Error deleting existing user:', deleteError);
        } else {
          console.log('Existing user deleted successfully');
        }
      }
    }

    // Create user with email confirmation bypassed using admin API
    console.log('Creating confirmed test user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // This bypasses email confirmation
      user_metadata: {
        full_name: 'Test User'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    console.log('Test user created and confirmed successfully!');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('User ID:', data.user?.id);
    console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');

    return { email: testEmail, password: testPassword };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

createConfirmedTestUser();