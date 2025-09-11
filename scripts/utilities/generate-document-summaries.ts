#!/usr/bin/env node

/**
 * Generate summaries for documents and store them in the summary column
 * Uses GPT to create concise, actionable summaries from document chunks
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface DocumentWithChunks {
  id: string;
  title: string;
  summary: string | null;
  metadata: unknown;
  chunks?: Array<{
    content: string;
    chunk_index: number;
  }>;
}

/**
 * Generate a summary using GPT
 */
async function generateSummary(title: string, content: string): Promise<string> {
  try {
    const prompt = `Create a brief, scannable summary of the core content.

Title: ${title}

Content:
${content.substring(0, 8000)}

Requirements:
1. DO NOT include meeting name, date, duration, or participant names (these are stored separately)
2. Start directly with the main topic or purpose
3. Focus on: What was discussed, what was decided, what needs to be done
4. Keep it to 2-3 concise paragraphs maximum (150-250 words)
5. Use clear, direct language suitable for quick scanning
6. Highlight only the most critical information

Example format:
"Discussed economic impact study for tourism data including visitor spending and ROI estimates. Study will take 8 weeks and is funded through tourism account. Key concerns raised about data accuracy and funding sources. Next steps: review attorney feedback on agreement and begin data collection."

Summary:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You create brief, scannable summaries focusing only on core content. Never include meeting metadata like names, dates, or participants. Start directly with what matters: topics, decisions, and actions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300,  // Reduced to enforce brevity
    });

    return response.choices[0]?.message?.content || 'Unable to generate summary';
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Error generating summary';
  }
}

/**
 * Process a single document
 */
async function processDocument(doc: DocumentWithChunks): Promise<boolean> {
  try {
    console.log(`\n📄 Processing: ${doc.title}`);
    
    // Get chunks for this document
    const { data: chunks } = await supabase
      .from('chunks')
      .select('content, chunk_index')
      .eq('document_id', doc.id)
      .order('chunk_index')
      .limit(10); // Use first 10 chunks for summary
    
    if (!chunks || chunks.length === 0) {
      console.log('   ⚠️  No chunks found, skipping');
      return false;
    }
    
    // Combine chunk content
    const content = chunks
      .map(c => c.content)
      .join('\n\n')
      .substring(0, 8000); // Limit to ~8000 chars for GPT
    
    console.log(`   📝 Generating summary from ${chunks.length} chunks...`);
    
    // Generate summary
    const summary = await generateSummary(doc.title, content);
    
    // Update document with summary
    const { error } = await supabase
      .from('documents')
      .update({ 
        summary,
        updated_at: new Date().toISOString()
      })
      .eq('id', doc.id);
    
    if (error) {
      console.log(`   ❌ Failed to update: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ Summary generated (${summary.length} chars)`);
    console.log(`   Preview: ${summary.substring(0, 100)}...`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Main function to generate summaries for all documents
 */
async function generateAllSummaries() {
  console.log('🚀 Document Summary Generator\n' + '='.repeat(50));
  
  // Get documents without summaries (or with NULL summaries)
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, summary, metadata')
    .or('summary.is.null,summary.eq.')
    .order('created_at', { ascending: false });
  
  if (error || !documents) {
    console.error('Failed to fetch documents:', error);
    return;
  }
  
  console.log(`Found ${documents.length} documents without summaries`);
  
  if (documents.length === 0) {
    console.log('✨ All documents already have summaries!');
    return;
  }
  
  // Process in batches
  const BATCH_SIZE = 5;
  const successCount = 0;
  const errorCount = 0;
  
  for (const i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(documents.length / BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches}`);
    console.log('─'.repeat(50));
    
    // Process batch sequentially to respect rate limits
    for (const doc of batch) {
      const success = await processDocument(doc);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Progress update
    const processed = Math.min(i + BATCH_SIZE, documents.length);
    const percentage = ((processed / documents.length) * 100).toFixed(1);
    console.log(`\n📈 Progress: ${processed}/${documents.length} (${percentage}%)`);
    console.log(`   ✅ Success: ${successCount} | ❌ Errors: ${errorCount}`);
    
    // Delay between batches
    if (i + BATCH_SIZE < documents.length) {
      console.log('\n⏳ Waiting 5 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(50));
  console.log('✨ Summary generation complete!');
  console.log(`   Total processed: ${successCount + errorCount}`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  
  // Verify final state
  const { count: totalWithSummaries } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .not('summary', 'is', null)
    .neq('summary', '');
  
  const { count: totalDocs } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 Final Statistics:`);
  console.log(`   Documents with summaries: ${totalWithSummaries}/${totalDocs}`);
  console.log(`   Coverage: ${((totalWithSummaries! / totalDocs!) * 100).toFixed(1)}%`);
}

// Add command line argument parsing
const args = process.argv.slice(2);
const limit = args[0] ? parseInt(args[0]) : undefined;

if (limit) {
  console.log(`Processing only first ${limit} documents...`);
}

// Run the generator
generateAllSummaries().catch(console.error);