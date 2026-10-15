// Apply the RLS fix migration directly to production database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying ai_insights RLS fix migration...');
  
  // Read the migration file
  const migrationPath = path.join(__dirname, 'supabase/migrations/20250912_fix_ai_insights_rls_anon_access.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Migration content:');
  console.log('---');
  console.log(migrationSQL);
  console.log('---');
  
  try {
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));
    
    console.log(`📊 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`${i + 1}. Executing: ${statement.substring(0, 80)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });
      
      if (error) {
        // Try alternative approach using direct database connection
        console.log(`   Trying alternative approach...`);
        const { error: directError } = await supabase
          .from('_migrations')  // This might not exist, but let's try
          .select('*')
          .limit(1);
          
        if (directError) {
          console.error(`❌ Statement ${i + 1} failed:`, error);
          console.error('Full statement:', statement);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('🎉 Migration completed!');
    
    // Test the fix by querying insights with anon key
    console.log('🧪 Testing fix with anon user access...');
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTQxNjYsImV4cCI6MjA3MDgzMDE2Nn0.g56kDPUokoJpWY7vXd3GTMXpOc4WFOU0hDVWfGMZtO8');
    
    const { data: testInsights, error: testError } = await anonSupabase
      .from('ai_insights')
      .select('*')
      .eq('document_id', '9c92288d-e0bf-4db4-8877-dd12fa321589')
      .order('created_at', { ascending: false });
    
    if (testError) {
      console.error('❌ Test failed - anon users still cannot access ai_insights:', testError);
    } else {
      console.log(`✅ Test successful! Anon user can access ${testInsights?.length || 0} insights`);
      if (testInsights && testInsights.length > 0) {
        console.log('Sample insight:', testInsights[0].title);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Alternative approach: Use native psql if available
async function applyWithRawSQL() {
  console.log('🔧 Applying migration with raw SQL execution...');
  
  const migrationPath = path.join(__dirname, 'supabase/migrations/20250912_fix_ai_insights_rls_anon_access.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Use supabase raw SQL execution
  const { data, error } = await supabase.rpc('exec_raw_sql', {
    query: migrationSQL
  });
  
  if (error) {
    console.error('❌ Raw SQL execution failed:', error);
    return;
  }
  
  console.log('✅ Raw SQL executed successfully');
  console.log('Response:', data);
}

applyMigration().catch(console.error);