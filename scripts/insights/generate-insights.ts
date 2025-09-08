#!/usr/bin/env node

/**
 * Script to generate insights for documents
 * 
 * Usage:
 *   npm run generate-insights -- --document-id <id>
 *   npm run generate-insights -- --all
 *   npm run generate-insights -- --recent 10
 */

import { createClient } from '@supabase/supabase-js';
import { InsightGenerator } from '../monorepo-agents/pm-rag-vectorize/lib/ai/agents/insight-generator';
import { config } from 'dotenv';
import { parseArgs } from 'util';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'document-id': { type: 'string' },
      'all': { type: 'boolean' },
      'recent': { type: 'string' },
      'force': { type: 'boolean' },
      'help': { type: 'boolean' }
    }
  });

  if (values.help) {
    console.log(`
Usage: npm run generate-insights -- [options]

Options:
  --document-id <id>  Generate insights for a specific document
  --all               Generate insights for all documents without insights
  --recent <n>        Generate insights for n most recent documents
  --force             Force regeneration even if insights exist
  --help              Show this help message
    `);
    process.exit(0);
  }

  const insightGenerator = new InsightGenerator();

  if (values['document-id']) {
    // Generate for specific document
    console.log(`Generating insights for document: ${values['document-id']}`);
    const result = await insightGenerator.generateDocumentInsights(values['document-id']);
    
    if (result.success) {
      console.log(`✅ Successfully generated ${result.insightsGenerated} insights`);
    } else {
      console.error(`❌ Failed: ${result.error}`);
      process.exit(1);
    }
    
  } else if (values.all) {
    // Generate for all documents without insights
    console.log('Finding documents without insights...');
    
    const { data: documents } = await supabase
      .from('documents')
      .select('id, title')
      .is('processing_status', 'completed')
      .order('created_at', { ascending: false });

    if (!documents || documents.length === 0) {
      console.log('No documents found');
      process.exit(0);
    }

    // Check which documents already have insights
    const { data: existingInsights } = await supabase
      .from('ai_insights')
      .select('document_id')
      .in('document_id', documents.map(d => d.id));

    const existingDocIds = new Set(existingInsights?.map(i => i.document_id) || []);
    const documentsToProcess = values.force 
      ? documents 
      : documents.filter(d => !existingDocIds.has(d.id));

    console.log(`Found ${documentsToProcess.length} documents to process`);

    for (const doc of documentsToProcess) {
      console.log(`\nProcessing: ${doc.title || doc.id}`);
      const result = await insightGenerator.generateDocumentInsights(doc.id);
      
      if (result.success) {
        console.log(`  ✅ Generated ${result.insightsGenerated} insights`);
      } else {
        console.error(`  ❌ Failed: ${result.error}`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } else if (values.recent) {
    // Generate for recent documents
    const limit = parseInt(values.recent);
    console.log(`Processing ${limit} most recent documents...`);
    
    const { data: documents } = await supabase
      .from('documents')
      .select('id, title')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!documents || documents.length === 0) {
      console.log('No documents found');
      process.exit(0);
    }

    for (const doc of documents) {
      console.log(`\nProcessing: ${doc.title || doc.id}`);
      const result = await insightGenerator.generateDocumentInsights(doc.id);
      
      if (result.success) {
        console.log(`  ✅ Generated ${result.insightsGenerated} insights`);
      } else {
        console.error(`  ❌ Failed: ${result.error}`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } else {
    console.error('Please specify --document-id, --all, or --recent');
    console.log('Use --help for more information');
    process.exit(1);
  }

  console.log('\n✨ Insight generation complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});