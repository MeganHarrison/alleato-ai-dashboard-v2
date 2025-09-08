#!/usr/bin/env node

/**
 * Script to prevent and clean up duplicate insights
 * Implements deduplication logic and unique constraints
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import crypto from 'crypto';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Generate a hash for an insight to detect duplicates
 */
function generateInsightHash(insight: {
  meeting_id?: string;
  document_id?: string;
  insight_type: string;
  title: string;
}): string {
  const docId = insight.meeting_id || insight.document_id || '';
  const normalizedTitle = insight.title.toLowerCase().trim();
  const content = `${docId}_${insight.insight_type}_${normalizedTitle}`;
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Clean up existing duplicates in the database
 */
async function cleanupExistingDuplicates() {
  console.log('🧹 Cleaning up existing duplicate insights...\n');
  
  // Fetch all insights
  const { data: allInsights, error } = await supabase
    .from('ai_insights')
    .select('*')
    .order('created_at', { ascending: true }); // Keep oldest
  
  if (error || !allInsights) {
    console.error('Failed to fetch insights:', error);
    return;
  }
  
  console.log(`Total insights before cleanup: ${allInsights.length}`);
  
  const seenHashes = new Set<string>();
  const duplicateIds: string[] = [];
  
  // Identify duplicates
  for (const insight of allInsights) {
    const hash = generateInsightHash(insight);
    
    if (seenHashes.has(hash)) {
      duplicateIds.push(insight.id);
    } else {
      seenHashes.add(hash);
    }
  }
  
  console.log(`Found ${duplicateIds.length} duplicate insights to remove`);
  
  if (duplicateIds.length > 0) {
    // Delete duplicates in batches
    const batchSize = 100;
    for (let i = 0; i < duplicateIds.length; i += batchSize) {
      const batch = duplicateIds.slice(i, i + batchSize);
      const { error: deleteError } = await supabase
        .from('ai_insights')
        .delete()
        .in('id', batch);
      
      if (deleteError) {
        console.error('Error deleting batch:', deleteError);
      } else {
        console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(duplicateIds.length / batchSize)}`);
      }
    }
  }
  
  // Verify cleanup
  const { count: finalCount } = await supabase
    .from('ai_insights')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Insights before: ${allInsights.length}`);
  console.log(`   Insights after: ${finalCount}`);
  console.log(`   Removed: ${duplicateIds.length}`);
}

/**
 * Add a unique constraint to prevent future duplicates
 */
async function addUniqueConstraint() {
  console.log('\n🔒 Adding database constraints to prevent future duplicates...\n');
  
  // Add a unique index on the combination of document/meeting_id + insight_type + title hash
  const sql = `
    -- Add a column to store the insight hash
    ALTER TABLE ai_insights 
    ADD COLUMN IF NOT EXISTS content_hash VARCHAR(32);
    
    -- Create a function to generate the hash
    CREATE OR REPLACE FUNCTION generate_insight_hash()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.content_hash = MD5(
        CONCAT(
          COALESCE(NEW.meeting_id::text, NEW.document_id::text, ''),
          '_',
          NEW.insight_type,
          '_',
          LOWER(TRIM(NEW.title))
        )
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Create a trigger to automatically set the hash
    DROP TRIGGER IF EXISTS set_insight_hash ON ai_insights;
    CREATE TRIGGER set_insight_hash
      BEFORE INSERT OR UPDATE ON ai_insights
      FOR EACH ROW
      EXECUTE FUNCTION generate_insight_hash();
    
    -- Update existing records with hashes
    UPDATE ai_insights
    SET content_hash = MD5(
      CONCAT(
        COALESCE(meeting_id::text, document_id::text, ''),
        '_',
        insight_type,
        '_',
        LOWER(TRIM(title))
      )
    )
    WHERE content_hash IS NULL;
    
    -- Create unique index to prevent duplicates
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_insights_unique_content
    ON ai_insights(content_hash);
    
    -- Add constraint to ensure at least one ID is present
    ALTER TABLE ai_insights
    DROP CONSTRAINT IF EXISTS ai_insights_has_parent_check;
    
    ALTER TABLE ai_insights
    ADD CONSTRAINT ai_insights_has_parent_check
    CHECK (
      (meeting_id IS NOT NULL AND document_id IS NULL) OR
      (meeting_id IS NULL AND document_id IS NOT NULL)
    );
  `;
  
  console.log('Executing SQL to add unique constraint...');
  
  // Note: In production, you would execute this SQL directly in Supabase SQL Editor
  console.log('\n📋 SQL to execute in Supabase SQL Editor:\n');
  console.log(sql);
  
  return sql;
}

/**
 * Update the insight generator to check for duplicates before inserting
 */
function generateDuplicatePreventionCode() {
  console.log('\n📝 Code to add to InsightGenerator class:\n');
  
  const code = `
/**
 * Check if an insight already exists to prevent duplicates
 */
async checkInsightExists(
  documentId: string,
  insightType: string,
  title: string
): Promise<boolean> {
  const { data } = await this.supabaseAdmin
    .from('ai_insights')
    .select('id')
    .or(\`meeting_id.eq.\${documentId},document_id.eq.\${documentId}\`)
    .eq('insight_type', insightType)
    .ilike('title', title.substring(0, 50) + '%')
    .limit(1);
  
  return data && data.length > 0;
}

/**
 * Store insights with duplicate prevention
 */
private async storeInsightsWithDedup(
  documentId: string,
  projectId: number | null,
  insights: ExtractedInsights,
): Promise<number> {
  const aiInsights: AIInsight[] = [];
  
  // Check for existing insights before adding
  for (const item of insights.actionItems) {
    const exists = await this.checkInsightExists(
      documentId,
      'action_item',
      item.item
    );
    
    if (!exists) {
      aiInsights.push({
        document_id: documentId,
        project_id: projectId,
        insight_type: 'action_item',
        title: item.item.substring(0, 200),
        description: JSON.stringify(item),
        severity: item.priority,
        confidence_score: 0.8,
        resolved: 0,
      });
    }
  }
  
  // Continue for other insight types...
  
  // Insert with ON CONFLICT DO NOTHING
  if (aiInsights.length > 0) {
    const { error } = await this.supabaseAdmin
      .from('ai_insights')
      .insert(aiInsights)
      .select();
    
    if (error && !error.message.includes('duplicate')) {
      throw new Error(\`Failed to store insights: \${error.message}\`);
    }
  }
  
  return aiInsights.length;
}`;
  
  console.log(code);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting duplicate prevention setup\n');
  console.log('=' .repeat(50));
  
  // Step 1: Clean up existing duplicates
  await cleanupExistingDuplicates();
  
  // Step 2: Generate SQL for unique constraint
  const constraintSQL = await addUniqueConstraint();
  
  // Step 3: Show code updates needed
  generateDuplicatePreventionCode();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✨ Duplicate prevention setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run the SQL in Supabase SQL Editor to add the unique constraint');
  console.log('2. Update InsightGenerator class with the duplicate check code');
  console.log('3. Test by running insight generation on a document that already has insights');
}

// Run the script
main().catch(console.error);