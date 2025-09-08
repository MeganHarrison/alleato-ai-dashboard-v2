// Test script to verify ai_insights data is accessible
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsightsQuery() {
  console.log('Testing ai_insights query...\n');
  
  // Test 1: Count total insights
  const { count, error: countError } = await supabase
    .from('ai_insights')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error('Error counting insights:', countError);
  } else {
    console.log(`Total insights in database: ${count}`);
  }
  
  // Test 2: Fetch sample insights
  const { data: insights, error } = await supabase
    .from('ai_insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('Error fetching insights:', error);
  } else {
    console.log(`\nFetched ${insights?.length || 0} sample insights`);
    
    if (insights && insights.length > 0) {
      console.log('\nFirst insight:');
      console.log('- ID:', insights[0].id);
      console.log('- Type:', insights[0].insight_type);
      console.log('- Title:', insights[0].title);
      console.log('- Description:', insights[0].description?.substring(0, 100) + '...');
      console.log('- Meeting ID:', insights[0].meeting_id);
      console.log('- Document ID:', insights[0].document_id);
      console.log('- Created:', insights[0].created_at);
      
      console.log('\nAvailable columns:');
      console.log(Object.keys(insights[0]));
    }
  }
  
  // Test 3: Check insight types distribution
  const { data: types, error: typesError } = await supabase
    .from('ai_insights')
    .select('insight_type');
    
  if (!typesError && types) {
    const typeCounts = types.reduce((acc, curr) => {
      acc[curr.insight_type] = (acc[curr.insight_type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nInsight types distribution:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });
  }
}

testInsightsQuery().catch(console.error);