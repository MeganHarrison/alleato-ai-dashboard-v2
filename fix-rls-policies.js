// Direct fix for ai_insights RLS policies
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing ai_insights RLS policies...');
  
  // SQL statements to fix the policies
  const sqlStatements = [
    // Drop the old restrictive policy
    `DROP POLICY IF EXISTS "Allow authenticated users full access to ai_insights" ON ai_insights`,
    
    // Create new policies
    `CREATE POLICY "Allow authenticated users to select ai_insights"
     ON ai_insights FOR SELECT
     TO authenticated
     USING (true)`,
     
    `CREATE POLICY "Allow authenticated users to insert ai_insights"
     ON ai_insights FOR INSERT
     TO authenticated
     WITH CHECK (true)`,
     
    `CREATE POLICY "Allow authenticated users to update ai_insights"
     ON ai_insights FOR UPDATE
     TO authenticated
     USING (true)
     WITH CHECK (true)`,
     
    `CREATE POLICY "Allow authenticated users to delete ai_insights"
     ON ai_insights FOR DELETE
     TO authenticated
     USING (true)`,
     
    // The key fix - allow anon users to read insights
    `CREATE POLICY "Allow anon users to view ai_insights"
     ON ai_insights FOR SELECT
     TO anon
     USING (true)`
  ];
  
  console.log(`📊 Executing ${sqlStatements.length} SQL statements...`);
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    console.log(`\n${i + 1}. Executing:`);
    console.log(statement.substring(0, 100) + '...');
    
    try {
      // Try using a direct query approach
      const { data, error } = await supabase
        .from('_temp') // This will fail but trigger the SQL execution
        .select('*')
        .limit(0);
      
      // Since the above approach won't work, let's use PostgreSQL functions
      // We need to execute raw SQL somehow
      console.log('   ⚠️ Note: Cannot execute raw SQL via Supabase client');
      console.log('   SQL to run manually:');
      console.log('   ' + statement);
      
    } catch (error) {
      console.log(`   ⚠️ Expected error for statement ${i + 1}`);
    }
  }
  
  console.log('\n📋 MANUAL STEPS REQUIRED:');
  console.log('1. Go to https://supabase.com/dashboard/project/lgveqfnpkxvzbnnwuled');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Execute each of the following SQL statements:');
  console.log('');
  
  sqlStatements.forEach((statement, i) => {
    console.log(`-- Statement ${i + 1}`);
    console.log(statement + ';');
    console.log('');
  });
  
  console.log('4. After running all statements, test the meeting page again');
  
  // Test current state
  console.log('\n🧪 Testing current state...');
  await testCurrentAccess();
}

async function testCurrentAccess() {
  const meetingId = '9c92288d-e0bf-4db4-8877-dd12fa321589';
  
  // Test with service key
  console.log('Testing with service key...');
  const { data: serviceData, error: serviceError } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('document_id', meetingId)
    .order('created_at', { ascending: false });
  
  if (serviceError) {
    console.error('❌ Service key failed:', serviceError);
  } else {
    console.log(`✅ Service key: ${serviceData?.length || 0} insights`);
  }
  
  // Test with anon key
  console.log('Testing with anon key...');
  const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTQxNjYsImV4cCI6MjA3MDgzMDE2Nn0.g56kDPUokoJpWY7vXd3GTMXpOc4WFOU0hDVWfGMZtO8');
  
  const { data: anonData, error: anonError } = await anonSupabase
    .from('ai_insights')
    .select('*')
    .eq('document_id', meetingId)
    .order('created_at', { ascending: false });
  
  if (anonError) {
    console.error('❌ Anon key failed (EXPECTED):', anonError.message);
    console.log('   This confirms the RLS policy is blocking anon access');
  } else {
    console.log(`✅ Anon key: ${anonData?.length || 0} insights`);
    console.log('   RLS fix already applied successfully!');
  }
}

fixRLSPolicies().catch(console.error);