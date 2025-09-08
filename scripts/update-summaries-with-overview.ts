#!/usr/bin/env node

/**
 * Update existing documents to replace summary with overview
 * This script checks the metadata field for overview data and updates the summary column
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DocumentToUpdate {
  id: string;
  title: string;
  summary: string | null;
  metadata: any;
  action_items: any;
  bullet_points: any;
}

async function updateDocumentSummaries() {
  console.log('🔄 Starting summary update with overview data...\n');
  
  try {
    // Fetch all documents with metadata
    console.log('📋 Fetching documents with metadata...');
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, title, summary, metadata, action_items, bullet_points')
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching documents:', fetchError);
      return;
    }

    if (!documents || documents.length === 0) {
      console.log('ℹ️  No documents found with metadata');
      return;
    }

    console.log(`✅ Found ${documents.length} documents to check\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of documents as DocumentToUpdate[]) {
      try {
        // Check if metadata contains summary data
        const metadata = doc.metadata;
        let hasUpdates = false;
        const updates: any = {};

        // Check for overview in different possible locations
        let overview = null;
        
        // Check if metadata has a summary object with overview
        if (metadata?.summary?.overview) {
          overview = metadata.summary.overview;
        }
        // Check if metadata has full_summary with overview
        else if (metadata?.full_summary?.overview) {
          overview = metadata.full_summary.overview;
        }
        // Check if metadata itself has overview
        else if (metadata?.overview) {
          overview = metadata.overview;
        }

        // Update summary if overview is found and different from current
        if (overview && overview !== doc.summary) {
          updates.summary = overview;
          hasUpdates = true;
          console.log(`📝 ${doc.title}`);
          console.log(`   Current summary: ${doc.summary ? doc.summary.substring(0, 50) + '...' : 'null'}`);
          console.log(`   New summary: ${overview.substring(0, 50)}...`);
        }

        // Check for action_items
        let actionItems = null;
        if (metadata?.summary?.action_items) {
          actionItems = metadata.summary.action_items;
        } else if (metadata?.full_summary?.action_items) {
          actionItems = metadata.full_summary.action_items;
        } else if (metadata?.action_items) {
          actionItems = metadata.action_items;
        }

        if (actionItems && Array.isArray(actionItems) && actionItems.length > 0) {
          // Check if action_items column is empty or different
          if (!doc.action_items || JSON.stringify(doc.action_items) !== JSON.stringify(actionItems)) {
            updates.action_items = actionItems;
            hasUpdates = true;
            console.log(`   ✓ Updating action items (${actionItems.length} items)`);
          }
        }

        // Check for bullet_points (from bullet_gist)
        let bulletPoints = null;
        if (metadata?.summary?.bullet_gist) {
          bulletPoints = metadata.summary.bullet_gist;
        } else if (metadata?.full_summary?.bullet_gist) {
          bulletPoints = metadata.full_summary.bullet_gist;
        } else if (metadata?.bullet_gist) {
          bulletPoints = metadata.bullet_gist;
        }

        if (bulletPoints && Array.isArray(bulletPoints) && bulletPoints.length > 0) {
          // Check if bullet_points column is empty or different
          if (!doc.bullet_points || JSON.stringify(doc.bullet_points) !== JSON.stringify(bulletPoints)) {
            updates.bullet_points = bulletPoints;
            hasUpdates = true;
            console.log(`   ✓ Updating bullet points (${bulletPoints.length} points)`);
          }
        }

        // Update document if there are changes
        if (hasUpdates) {
          const { error: updateError } = await supabase
            .from('documents')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id);

          if (updateError) {
            console.error(`   ❌ Error updating: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`   ✅ Successfully updated\n`);
            updatedCount++;
          }
        } else {
          skippedCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error);
        errorCount++;
      }
    }

    // Summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 Update Summary Report');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updatedCount} documents`);
    console.log(`⏭️  Skipped: ${skippedCount} documents (no changes needed)`);
    console.log(`❌ Errors: ${errorCount} documents`);
    console.log(`📋 Total processed: ${documents.length} documents`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Also create a function to check what data is available
async function analyzeAvailableData() {
  console.log('\n📊 Analyzing available overview data...\n');
  
  const { data: samples, error } = await supabase
    .from('documents')
    .select('id, title, metadata')
    .not('metadata', 'is', null)
    .limit(5);

  if (samples) {
    console.log('Sample metadata structures found:\n');
    samples.forEach((doc, index) => {
      console.log(`Document ${index + 1}: ${doc.title}`);
      if (doc.metadata?.summary?.overview) {
        console.log('  ✓ Has metadata.summary.overview');
      }
      if (doc.metadata?.full_summary?.overview) {
        console.log('  ✓ Has metadata.full_summary.overview');
      }
      if (doc.metadata?.overview) {
        console.log('  ✓ Has metadata.overview');
      }
      if (doc.metadata?.summary?.action_items) {
        console.log('  ✓ Has metadata.summary.action_items');
      }
      if (doc.metadata?.summary?.bullet_gist) {
        console.log('  ✓ Has metadata.summary.bullet_gist');
      }
      console.log('');
    });
  }
}

// Run the update
async function main() {
  console.log('🚀 Document Summary Update Tool');
  console.log('================================\n');
  
  // First analyze what data is available
  await analyzeAvailableData();
  
  // Ask for confirmation
  console.log('\n⚠️  This will update the summary, action_items, and bullet_points columns');
  console.log('   from metadata fields where available.');
  console.log('\nPress Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Run the update
  await updateDocumentSummaries();
  
  console.log('\n✅ Update process complete!');
  process.exit(0);
}

// Execute
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});