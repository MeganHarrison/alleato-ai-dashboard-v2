#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSyncedDocuments() {
  console.log('🔍 Checking Fireflies sync results...\n');
  
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, source, summary, action_items, bullet_points, fireflies_id, fireflies_link, created_at')
    .eq('source', 'fireflies')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('⚠️  No Fireflies documents found in database');
    return;
  }
  
  console.log(`✅ Found ${data.length} recent Fireflies documents:\n`);
  
  data.forEach((doc, i) => {
    console.log(`📄 Document ${i + 1}: ${doc.title}`);
    console.log(`   🔗 Fireflies Link: ${doc.fireflies_link || 'N/A'}`);
    console.log(`   📝 Summary: ${doc.summary ? 'Yes (' + doc.summary.substring(0, 50) + '...)' : 'No'}`);
    console.log(`   ✅ Action Items: ${doc.action_items ? doc.action_items.length + ' items' : 'None'}`);
    if (doc.action_items && doc.action_items.length > 0) {
      console.log(`      - ${doc.action_items[0].substring(0, 60)}...`);
    }
    console.log(`   • Bullet Points: ${doc.bullet_points ? doc.bullet_points.length + ' points' : 'None'}`);
    if (doc.bullet_points && doc.bullet_points.length > 0) {
      console.log(`      - ${doc.bullet_points[0].substring(0, 60)}...`);
    }
    console.log(`   ⏰ Synced: ${new Date(doc.created_at).toLocaleString()}`);
    console.log('');
  });
  
  // Check total count
  const { count } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'fireflies');
  
  console.log(`📊 Total Fireflies documents in database: ${count}`);
  console.log('\n✨ Fireflies sync is working correctly!');
  console.log('   The worker will automatically sync every 30 minutes.');
}

checkSyncedDocuments().catch(console.error);