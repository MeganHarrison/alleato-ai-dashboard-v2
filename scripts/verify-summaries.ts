#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifySummaries() {
  console.log('📊 Document Summary Verification\n' + '='.repeat(50));
  
  // Get statistics
  const { count: totalDocs } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true });
  
  const { count: docsWithSummaries } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .not('summary', 'is', null)
    .neq('summary', '');
  
  const { count: docsWithoutSummaries } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .or('summary.is.null,summary.eq.');
  
  console.log(`Total documents: ${totalDocs}`);
  console.log(`Documents with summaries: ${docsWithSummaries}`);
  console.log(`Documents without summaries: ${docsWithoutSummaries}`);
  console.log(`Coverage: ${((docsWithSummaries! / totalDocs!) * 100).toFixed(1)}%`);
  
  // Get sample summaries
  const { data: samples } = await supabase
    .from('documents')
    .select('id, title, summary')
    .not('summary', 'is', null)
    .neq('summary', '')
    .order('updated_at', { ascending: false })
    .limit(3);
  
  console.log('\n📝 Recent Summaries:');
  console.log('─'.repeat(50));
  
  samples?.forEach((doc, i) => {
    console.log(`\n${i + 1}. ${doc.title}`);
    console.log(`   Length: ${doc.summary?.length} characters`);
    console.log(`   Preview: ${doc.summary?.substring(0, 150)}...`);
  });
  
  // Check summary quality metrics
  const { data: allSummaries } = await supabase
    .from('documents')
    .select('summary')
    .not('summary', 'is', null)
    .neq('summary', '');
  
  if (allSummaries && allSummaries.length > 0) {
    const lengths = allSummaries.map(d => d.summary?.length || 0);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const minLength = Math.min(...lengths);
    const maxLength = Math.max(...lengths);
    
    console.log('\n📈 Summary Quality Metrics:');
    console.log('─'.repeat(50));
    console.log(`Average length: ${avgLength.toFixed(0)} characters`);
    console.log(`Shortest summary: ${minLength} characters`);
    console.log(`Longest summary: ${maxLength} characters`);
  }
}

verifySummaries().catch(console.error);