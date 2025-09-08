#!/usr/bin/env node

/**
 * Batch processor for generating insights for all documents
 * Processes documents without existing insights in batches
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { InsightGenerator } from '../monorepo-agents/pm-rag-vectorize/lib/ai/agents/insight-generator';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 10; // Process 10 at a time to avoid rate limits
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds between batches

async function generateAllInsights() {
  try {
    console.log('🚀 Starting batch insight generation for all documents\n');
    
    // Get all documents
    const { data: allDocs, error: docError } = await supabase
      .from('documents')
      .select('id, title')
      .or('processing_status.eq.completed,processing_status.eq.pending')
      .order('created_at', { ascending: false });
    
    if (docError || !allDocs) {
      throw new Error('Failed to fetch documents');
    }
    
    // Get documents that already have insights
    const { data: docsWithInsights } = await supabase
      .from('ai_insights')
      .select('meeting_id')
      .limit(1000);
    
    const processedIds = new Set(docsWithInsights?.map(i => i.meeting_id) || []);
    
    // Filter out already processed documents
    const documentsToProcess = allDocs.filter(doc => !processedIds.has(doc.id));
    
    console.log(`📊 Total documents: ${allDocs.length}`);
    console.log(`✅ Already processed: ${processedIds.size}`);
    console.log(`📋 To process: ${documentsToProcess.length}`);
    console.log(`🔄 Batch size: ${BATCH_SIZE}\n`);
    
    if (documentsToProcess.length === 0) {
      console.log('✨ All documents already have insights!');
      return;
    }
    
    const generator = new InsightGenerator();
    let successCount = 0;
    let errorCount = 0;
    
    // Process in batches
    for (let i = 0; i < documentsToProcess.length; i += BATCH_SIZE) {
      const batch = documentsToProcess.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(documentsToProcess.length / BATCH_SIZE);
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} documents)`);
      console.log('─'.repeat(50));
      
      for (const doc of batch) {
        try {
          console.log(`\n📄 Processing: ${doc.title}`);
          
          // Check if meeting record exists (for foreign key constraint)
          const { data: existingMeeting } = await supabase
            .from('meetings')
            .select('id')
            .eq('id', doc.id)
            .single();
          
          if (!existingMeeting) {
            console.log('  Creating meeting record for foreign key...');
            
            // Get document details for meeting record
            const { data: fullDoc } = await supabase
              .from('documents')
              .select('*')
              .eq('id', doc.id)
              .single();
            
            if (fullDoc) {
              await supabase
                .from('meetings')
                .insert({
                  id: fullDoc.id,
                  title: fullDoc.title,
                  date: fullDoc.date || fullDoc.created_at,
                  summary: fullDoc.metadata?.summary || fullDoc.summary,
                  participants: fullDoc.metadata?.participants || fullDoc.participants || [],
                  transcript_url: fullDoc.transcript_url,
                  category: fullDoc.category,
                  duration_minutes: fullDoc.metadata?.duration_minutes || fullDoc.duration_minutes,
                  project_id: fullDoc.metadata?.project_id || fullDoc.project_id,
                  processing_status: 'completed',
                  raw_metadata: fullDoc.metadata
                });
            }
          }
          
          // Generate insights
          const result = await generator.generateDocumentInsights(doc.id);
          
          if (result.success) {
            console.log(`  ✅ Generated ${result.insightsGenerated} insights`);
            successCount++;
          } else {
            console.log(`  ⚠️  Warning: ${result.error}`);
            errorCount++;
          }
          
          // Small delay between documents
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          errorCount++;
        }
      }
      
      // Progress update
      const processed = Math.min(i + BATCH_SIZE, documentsToProcess.length);
      const percentage = ((processed / documentsToProcess.length) * 100).toFixed(1);
      console.log(`\n📈 Progress: ${processed}/${documentsToProcess.length} (${percentage}%)`);
      console.log(`   Success: ${successCount} | Errors: ${errorCount}`);
      
      // Delay between batches (except for last batch)
      if (i + BATCH_SIZE < documentsToProcess.length) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ Batch processing complete!');
    console.log('='.repeat(50));
    console.log(`📊 Final Results:`);
    console.log(`   Total processed: ${successCount + errorCount}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    // Get final insight count
    const { count: totalInsights } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   💡 Total insights in database: ${totalInsights}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the batch processor
generateAllInsights();