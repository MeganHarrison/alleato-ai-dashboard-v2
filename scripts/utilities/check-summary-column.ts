#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSummaryColumn() {
  // Check documents with and without summaries
  const { data: withSummary, error: e1 } = await supabase
    .from('documents')
    .select('id, title, summary')
    .not('summary', 'is', null)
    .limit(5);
  
  const { data: withoutSummary, error: e2 } = await supabase
    .from('documents')
    .select('id, title, summary')
    .is('summary', null)
    .limit(5);
  
  const { count: totalDocs } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true });
  
  const { count: docsWithSummary } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .not('summary', 'is', null);
  
  console.log('📊 Summary Column Analysis\n' + '='.repeat(50));
  console.log(`Total documents: ${totalDocs}`);
  console.log(`Documents with summaries: ${docsWithSummary || 0}`);
  console.log(`Documents without summaries: ${(totalDocs || 0) - (docsWithSummary || 0)}`);
  
  console.log('\n📝 Sample documents WITH summaries:');
  withSummary?.forEach(doc => {
    console.log(`  • ${doc.title?.substring(0, 40)}...`);
    if (doc.summary) {
      console.log(`    Summary: ${doc.summary.substring(0, 100)}...`);
    }
  });
  
  console.log('\n❌ Sample documents WITHOUT summaries:');
  withoutSummary?.forEach(doc => {
    console.log(`  • ${doc.title?.substring(0, 40)}...`);
  });
}

checkSummaryColumn();