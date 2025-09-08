const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function extractTitleFromContent(content) {
  if (!content) return null;
  
  // Try to extract title from markdown headers
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  
  const h2Match = content.match(/^##\s+(.+)$/m);
  if (h2Match) return h2Match[1].trim();
  
  // Try to extract from first non-empty line
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].substring(0, 100);
    // Remove markdown formatting
    return firstLine.replace(/[#*_`]/g, '').trim();
  }
  
  return null;
}

function generateTitleFromName(name) {
  if (!name) return 'Untitled Document';
  
  // Remove file extension
  const nameWithoutExt = name.replace(/\.[^/.]+$/, '');
  
  // Replace underscores and hyphens with spaces
  const formatted = nameWithoutExt.replace(/[_-]/g, ' ');
  
  // Capitalize first letter of each word
  const title = formatted.replace(/\b\w/g, char => char.toUpperCase());
  
  // Handle special cases for meeting files
  if (name.includes('meeting') || name.includes('Meeting')) {
    const dateMatch = name.match(/(\d{4}[-_]\d{2}[-_]\d{2})/);
    if (dateMatch) {
      const date = dateMatch[1].replace(/[_]/g, '-');
      return `Meeting - ${date}`;
    }
  }
  
  return title;
}

async function backfillDocumentTitles() {
  console.log('🔄 Starting document title backfill...\n');
  
  try {
    // Fetch all documents with missing titles
    console.log('📊 Fetching documents with missing titles...');
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, source, content, title, metadata')
      .or('title.is.null,title.eq.'); // Get documents with null or empty titles
    
    if (fetchError) {
      console.error('❌ Error fetching documents:', fetchError);
      return;
    }
    
    if (!documents || documents.length === 0) {
      console.log('✅ No documents with missing titles found!');
      return;
    }
    
    console.log(`📝 Found ${documents.length} documents with missing titles\n`);
    
    const updates = [];
    const results = {
      successful: 0,
      failed: 0,
      skipped: 0
    };
    
    // Process each document
    for (const doc of documents) {
      console.log(`Processing: ${doc.source || 'Unnamed document'} (ID: ${doc.id})`);
      
      let newTitle = null;
      
      // Try to extract title from content first
      if (doc.content) {
        newTitle = await extractTitleFromContent(doc.content);
        if (newTitle) {
          console.log(`  ✓ Extracted title from content: "${newTitle}"`);
        }
      }
      
      // If no title from content, generate from source filename
      if (!newTitle && doc.source) {
        newTitle = generateTitleFromName(doc.source);
        console.log(`  ✓ Generated title from source: "${newTitle}"`);
      }
      
      // If still no title, check metadata
      if (!newTitle && doc.metadata) {
        if (doc.metadata.title) {
          newTitle = doc.metadata.title;
          console.log(`  ✓ Found title in metadata: "${newTitle}"`);
        } else if (doc.metadata.original_name) {
          newTitle = generateTitleFromName(doc.metadata.original_name);
          console.log(`  ✓ Generated title from metadata name: "${newTitle}"`);
        }
      }
      
      // Default title if nothing else works
      if (!newTitle) {
        newTitle = `Document ${doc.id.substring(0, 8)}`;
        console.log(`  ✓ Using default title: "${newTitle}"`);
      }
      
      // Prepare update
      updates.push({
        id: doc.id,
        title: newTitle
      });
    }
    
    // Batch update all documents
    if (updates.length > 0) {
      console.log(`\n📤 Updating ${updates.length} documents...`);
      
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('documents')
          .update({ title: update.title })
          .eq('id', update.id);
        
        if (updateError) {
          console.error(`  ❌ Failed to update document ${update.id}:`, updateError.message);
          results.failed++;
        } else {
          console.log(`  ✅ Updated: ${update.title}`);
          results.successful++;
        }
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully updated: ${results.successful} documents`);
    console.log(`❌ Failed updates: ${results.failed} documents`);
    console.log(`⏭️  Skipped: ${results.skipped} documents`);
    console.log(`📝 Total processed: ${documents.length} documents`);
    console.log('='.repeat(50));
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('documents')
      .select('id, title')
      .or('title.is.null,title.eq.');
    
    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError);
    } else if (verifyData && verifyData.length > 0) {
      console.log(`⚠️  Still ${verifyData.length} documents without titles`);
    } else {
      console.log('✅ All documents now have titles!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Add a function to show current status
async function showCurrentStatus() {
  console.log('📊 Checking current document status...\n');
  
  const { data: allDocs, error: allError } = await supabase
    .from('documents')
    .select('id', { count: 'exact' });
  
  const { data: missingTitles, error: missingError } = await supabase
    .from('documents')
    .select('id', { count: 'exact' })
    .or('title.is.null,title.eq.');
  
  if (!allError && !missingError) {
    const totalCount = allDocs?.length || 0;
    const missingCount = missingTitles?.length || 0;
    const hasTitle = totalCount - missingCount;
    
    console.log(`📁 Total documents: ${totalCount}`);
    console.log(`✅ Documents with titles: ${hasTitle}`);
    console.log(`❌ Documents missing titles: ${missingCount}`);
    console.log(`📈 Completion: ${totalCount > 0 ? ((hasTitle / totalCount) * 100).toFixed(1) : 0}%\n`);
  }
}

// Main execution
async function main() {
  console.log('🚀 Document Title Backfill Script');
  console.log('='.repeat(50));
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🕐 Started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50) + '\n');
  
  // Show current status
  await showCurrentStatus();
  
  // Run backfill
  await backfillDocumentTitles();
  
  console.log('\n✨ Script completed!');
  console.log(`🕐 Finished at: ${new Date().toLocaleString()}`);
}

// Run the script
main().catch(console.error);