const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function exploreEmployeeTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  console.log('🔍 Exploring employee-related tables...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Explore employees table
    console.log('\n📋 EMPLOYEES TABLE:');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(5);

    if (empError) {
      console.error('❌ Error querying employees table:', empError.message);
    } else {
      console.log(`Found ${employees?.length || 0} employee records (showing first 5):`);
      if (employees && employees.length > 0) {
        console.log('Sample employee record structure:');
        console.log(JSON.stringify(employees[0], null, 2));
        
        console.log('\nAll column names in employees table:');
        const columns = Object.keys(employees[0]);
        columns.forEach(col => console.log(`  - ${col}`));
      } else {
        console.log('No employee records found.');
      }
    }

    // Explore users table
    console.log('\n👥 USERS TABLE:');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(3);

    if (userError) {
      console.error('❌ Error querying users table:', userError.message);
    } else {
      console.log(`Found ${users?.length || 0} user records (showing first 3):`);
      if (users && users.length > 0) {
        console.log('Sample user record structure:');
        console.log(JSON.stringify(users[0], null, 2));
      }
    }

    // Explore profiles table
    console.log('\n👤 PROFILES TABLE:');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);

    if (profileError) {
      console.error('❌ Error querying profiles table:', profileError.message);
    } else {
      console.log(`Found ${profiles?.length || 0} profile records (showing first 3):`);
      if (profiles && profiles.length > 0) {
        console.log('Sample profile record structure:');
        console.log(JSON.stringify(profiles[0], null, 2));
      }
    }

    // Check for any employee-related data in other tables
    console.log('\n🔍 CHECKING OTHER TABLES FOR EMPLOYEE DATA:');
    
    const tablesToCheck = ['companies', 'contacts', 'projects'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data && data.length > 0) {
          console.log(`\n📋 ${tableName.toUpperCase()} TABLE (sample):`);
          console.log(JSON.stringify(data[0], null, 2));
        }
      } catch (e) {
        console.log(`❌ Could not access ${tableName} table`);
      }
    }

  } catch (error) {
    console.error('❌ Error exploring tables:', error.message);
  }
}

exploreEmployeeTable();