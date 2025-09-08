#!/usr/bin/env node

/**
 * Inspect document metadata to see what fields are available
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectMetadata() {
  console.log('🔍 Inspecting Document Metadata Structure\n');
  
  // Get a few sample documents
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, summary, action_items, bullet_points, metadata, source')
    .not('metadata', 'is', null)
    .limit(3);

  if (error) {
    console.error('Error fetching documents:', error);
    return;
  }

  if (!documents || documents.length === 0) {
    console.log('No documents found with metadata');
    return;
  }

  documents.forEach((doc, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Document ${index + 1}: ${doc.title}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`ID: ${doc.id}`);
    console.log(`Source: ${doc.source}`);
    console.log(`\nCurrent column values:`);
    console.log(`- summary: ${doc.summary ? doc.summary.substring(0, 100) + '...' : 'null'}`);
    console.log(`- action_items: ${doc.action_items ? `[${doc.action_items.length} items]` : 'null'}`);
    console.log(`- bullet_points: ${doc.bullet_points ? `[${doc.bullet_points.length} points]` : 'null'}`);
    
    console.log(`\nMetadata structure:`);
    if (doc.metadata) {
      // Pretty print the metadata structure
      console.log(JSON.stringify(doc.metadata, null, 2));
      
      // Check for specific fields
      console.log(`\n🔍 Field availability:`);
      console.log(`- metadata.summary: ${doc.metadata.summary ? '✓' : '✗'}`);
      console.log(`- metadata.full_summary: ${doc.metadata.full_summary ? '✓' : '✗'}`);
      console.log(`- metadata.overview: ${doc.metadata.overview ? '✓' : '✗'}`);
      console.log(`- metadata.action_items: ${doc.metadata.action_items ? '✓' : '✗'}`);
      console.log(`- metadata.bullet_gist: ${doc.metadata.bullet_gist ? '✓' : '✗'}`);
      console.log(`- metadata.keywords: ${doc.metadata.keywords ? '✓' : '✗'}`);
      console.log(`- metadata.fireflies_id: ${doc.metadata.fireflies_id ? '✓' : '✗'}`);
    }
  });

  // Get statistics
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 Statistics');
  console.log(`${'='.repeat(60)}`);
  
  // Count documents by source
  const { data: sourceStats } = await supabase
    .from('documents')
    .select('source')
    .not('source', 'is', null);
  
  if (sourceStats) {
    const sourceCounts: Record<string, number> = {};
    sourceStats.forEach(doc => {
      sourceCounts[doc.source] = (sourceCounts[doc.source] || 0) + 1;
    });
    
    console.log('\nDocuments by source:');
    Object.entries(sourceCounts).forEach(([source, count]) => {
      console.log(`  - ${source}: ${count}`);
    });
  }

  // Check how many have summaries
  const { count: withSummary } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .not('summary', 'is', null);
  
  const { count: total } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nSummary coverage:`);
  console.log(`  - Documents with summary: ${withSummary}/${total}`);
  
  // Check how many have action_items
  const { count: withActionItems } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .not('action_items', 'is', null);
  
  console.log(`  - Documents with action_items: ${withActionItems}/${total}`);
  
  // Check how many have bullet_points
  const { count: withBulletPoints } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .not('bullet_points', 'is', null);
  
  console.log(`  - Documents with bullet_points: ${withBulletPoints}/${total}`);
}

// Run inspection
inspectMetadata().catch(console.error);