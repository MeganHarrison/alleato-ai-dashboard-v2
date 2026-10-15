// Debug script to replicate the exact frontend query
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lgveqfnpkxvzbnnwuled.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTQxNjYsImV4cCI6MjA3MDgzMDE2Nn0.g56kDPUokoJpWY7vXd3GTMXpOc4WFOU0hDVWfGMZtO8';

const meetingId = '9c92288d-e0bf-4db4-8877-dd12fa321589';

async function testFrontendQuery() {
  console.log('🔍 Testing Frontend Query (like createClient from utils/supabase/client)');
  console.log('Meeting ID:', meetingId);
  console.log('Using ANON key (like frontend):', supabaseAnonKey.slice(0, 20) + '...');
  console.log('---');

  // Create client like the frontend does
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Test the exact query from the meeting page component (line 123-127)
  console.log('1. Testing exact frontend query...');
  const { data: insightsData, error: insightsError } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('document_id', meetingId)
    .order('created_at', { ascending: false });

  if (insightsError) {
    console.error('❌ Error loading insights (frontend query):', insightsError);
    console.log('Error details:', JSON.stringify(insightsError, null, 2));
  } else {
    console.log(`📊 Frontend query returned: ${insightsData?.length || 0} insights`);
    
    if (insightsData && insightsData.length > 0) {
      insightsData.forEach((insight, i) => {
        console.log(`  ${i + 1}. ${insight.title} (${insight.insight_type}, ${insight.severity})`);
      });
    } else {
      console.log('📝 No insights returned - likely RLS policy issue');
    }
  }
  console.log('---');

  // Test with service key (like our debug script)
  console.log('2. Testing with service key for comparison...');
  const supabaseService = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA');
  
  const { data: serviceInsights, error: serviceError } = await supabaseService
    .from('ai_insights')
    .select('*')
    .eq('document_id', meetingId)
    .order('created_at', { ascending: false });

  if (serviceError) {
    console.error('❌ Error loading insights (service query):', serviceError);
  } else {
    console.log(`📊 Service query returned: ${serviceInsights?.length || 0} insights`);
  }
  console.log('---');

  // Check if there are RLS policies on ai_insights table
  console.log('3. Checking table policies...');
  try {
    const { data: policies, error: policyError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'ai_insights');
      
    if (policyError) {
      console.log('⚠️ Could not check policies:', policyError.message);
    } else {
      console.log(`📋 Found ${policies?.length || 0} RLS policies on ai_insights table`);
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.roles})`);
          if (policy.qual) {
            console.log(`    Condition: ${policy.qual}`);
          }
        });
      }
    }
  } catch (error) {
    console.log('⚠️ Could not check policies:', error.message);
  }
  console.log('---');

  // Try to check RLS status
  console.log('4. Checking RLS status...');
  try {
    const { data: tableRls } = await supabaseService
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'ai_insights')
      .single();
      
    if (tableRls) {
      console.log(`📋 RLS enabled on ai_insights: ${tableRls.relrowsecurity}`);
    }
  } catch (error) {
    console.log('⚠️ Could not check RLS status');
  }
  
  console.log('💡 CONCLUSION:');
  if (insightsError) {
    console.log('❌ Frontend query failed - likely authentication or RLS policy issue');
    console.log('🔧 ACTION: Check Supabase RLS policies for ai_insights table');
    console.log('   The frontend needs proper permissions to read ai_insights');
  } else if ((insightsData?.length || 0) === 0 && (serviceInsights?.length || 0) > 0) {
    console.log('❌ RLS policy is blocking anon users from reading ai_insights');
    console.log('🔧 ACTION: Add RLS policy to allow reading ai_insights or disable RLS');
  } else if ((insightsData?.length || 0) > 0) {
    console.log('✅ Query works! Issue might be in the React component state/rendering');
    console.log('🔧 ACTION: Check React component state management and error handling');
  }
}

testFrontendQuery().catch(console.error);