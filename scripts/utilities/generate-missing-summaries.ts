#!/usr/bin/env node

/**
 * Generate summaries for documents that don't have them
 * Uses OpenAI to create summaries from transcript content
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

interface Document {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  metadata: any;
  source: string;
}

async function fetchTranscriptContent(document: Document): Promise<string | null> {
  try {
    // First check if content is directly available
    if (document.content) {
      return document.content;
    }
    
    // Check if there's a file path in metadata
    const filePath = document.metadata?.file_path;
    if (filePath) {
      console.log(`  📥 Reading file from storage: ${filePath}`);
      
      // Try to download from 'documents' bucket
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);
      
      if (error) {
        console.error(`  ❌ Error downloading file: ${error.message}`);
        return null;
      }
      
      const text = await data.text();
      return text;
    }
    
    return null;
  } catch (error) {
    console.error(`  ❌ Error fetching transcript: ${error}`);
    return null;
  }
}

async function generateSummary(title: string, content: string): Promise<string> {
  try {
    // Truncate content if it's too long (max ~12000 tokens for GPT-4)
    const maxLength = 50000; // Roughly 12k tokens
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + '...[truncated]'
      : content;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional meeting summarizer. Create a comprehensive summary of the following meeting transcript. 
          The summary should:
          1. Start with a brief overview (2-3 sentences)
          2. List the main topics discussed
          3. Highlight key decisions made
          4. Note important action items
          5. Include any notable insights or conclusions
          
          Keep the summary concise but informative (aim for 200-400 words).`
        },
        {
          role: 'user',
          content: `Meeting Title: ${title}\n\nTranscript:\n${truncatedContent}`
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    });
    
    return response.choices[0].message.content || 'Unable to generate summary';
  } catch (error) {
    console.error(`  ❌ Error generating summary with OpenAI: ${error}`);
    throw error;
  }
}

async function updateDocumentSummary(documentId: string, summary: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ 
      summary,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId);
  
  if (error) {
    throw new Error(`Failed to update document ${documentId}: ${error.message}`);
  }
}

async function processDocuments(batchSize: number = 5, limit?: number) {
  console.log('🔍 Finding documents without summaries...\n');
  
  // Get documents without summaries
  let query = supabase
    .from('documents')
    .select('id, title, summary, content, metadata, source')
    .or('summary.is.null,summary.eq.""')
    .order('created_at', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data: documents, error } = await query;
  
  if (error) {
    console.error('Error fetching documents:', error);
    return;
  }
  
  if (!documents || documents.length === 0) {
    console.log('✅ All documents already have summaries!');
    return;
  }
  
  console.log(`📄 Found ${documents.length} documents without summaries\n`);
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  // Process in batches
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, Math.min(i + batchSize, documents.length));
    
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} documents)`);
    console.log('=' .repeat(60));
    
    await Promise.all(batch.map(async (doc) => {
      try {
        console.log(`\n📄 Processing: ${doc.title}`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  Source: ${doc.source}`);
        
        // Fetch transcript content
        const content = await fetchTranscriptContent(doc);
        
        if (!content) {
          console.log(`  ⚠️ Skipped - Could not fetch content`);
          skippedCount++;
          return;
        }
        
        console.log(`  📝 Content length: ${content.length} characters`);
        
        // Generate summary
        console.log(`  🤖 Generating summary with GPT-4...`);
        const summary = await generateSummary(doc.title, content);
        
        console.log(`  ✨ Summary generated (${summary.length} characters)`);
        
        // Update document
        await updateDocumentSummary(doc.id, summary);
        
        console.log(`  ✅ Document updated successfully`);
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Error processing document ${doc.id}:`, error);
        errorCount++;
      }
    }));
    
    // Add a small delay between batches to avoid rate limits
    if (i + batchSize < documents.length) {
      console.log('\n⏳ Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary Generation Complete');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount} documents`);
  console.log(`⚠️ Skipped: ${skippedCount} documents`);
  console.log(`❌ Errors: ${errorCount} documents`);
  console.log(`📄 Total processed: ${documents.length} documents`);
}

// Command line arguments
const args = process.argv.slice(2);
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch='))?.split('=')[1] || '5');
const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

if (args.includes('--help')) {
  console.log(`
Usage: npm run generate-summaries [options]

Options:
  --batch=N     Process N documents at a time (default: 5)
  --limit=N     Only process the first N documents
  --dry-run     Show what would be processed without making changes
  --help        Show this help message

Examples:
  npm run generate-summaries                    # Process all documents
  npm run generate-summaries --limit=10         # Process only 10 documents
  npm run generate-summaries --batch=3 --limit=9 # Process 9 documents, 3 at a time
`);
  process.exit(0);
}

async function main() {
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
    
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, summary, content, metadata, source')
      .or('summary.is.null,summary.eq.""')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching documents:', error);
      process.exit(1);
    }
    
    console.log(`Found ${documents?.length || 0} documents without summaries:\n`);
    
    documents?.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Source: ${doc.source}`);
      console.log(`   Has content: ${doc.content ? 'Yes' : 'No'}`);
      console.log(`   Has file_path in metadata: ${doc.metadata?.file_path ? 'Yes' : 'No'}`);
      console.log();
    });
    
    process.exit(0);
  }

  // Run the script
  try {
    await processDocuments(batchSize, limit ? parseInt(limit) : undefined);
    console.log('\n✨ Done!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run main function
main();