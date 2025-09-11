#!/usr/bin/env node

/**
 * Regenerate summaries with the new brief, scannable format
 * Removes meeting metadata and focuses on core content only
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

/**
 * Generate a brief, scannable summary
 */
async function generateBriefSummary(title: string, existingSummary: string): Promise<string> {
  try {
    const prompt = `Convert this verbose summary into a brief, scannable format.

Original Summary:
${existingSummary}

Requirements:
1. REMOVE all references to meeting name, date, duration, participants
2. START directly with the main topic or purpose
3. Focus on: What was discussed, what was decided, what needs to be done
4. Maximum 150-200 words
5. Use clear, direct language for quick scanning
6. Structure: One paragraph for main topics/decisions, one for next steps/actions

Example output:
"Discussed economic impact study for tourism data including visitor spending and ROI estimates. Study will take 8 weeks, funded through tourism account. Key concerns: data accuracy and funding sources. 

Next steps: review attorney feedback on agreement, begin data collection, and schedule follow-up meeting for progress review."

Brief Summary:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Convert verbose summaries to brief, scannable text. Remove ALL meeting metadata. Focus only on core content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 250,
    });

    return response.choices[0]?.message?.content || existingSummary;
  } catch (error) {
    console.error('Error generating brief summary:', error);
    return existingSummary;
  }
}

/**
 * Main function to regenerate summaries
 */
async function regenerateSummaries() {
  console.log('🔄 Brief Summary Regeneration\n' + '='.repeat(50));
  
  // Get documents with long summaries (over 1000 chars indicates verbose format)
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, summary')
    .not('summary', 'is', null)
    .neq('summary', '')
    .gte('length(summary)', 1000)
    .order('created_at', { ascending: false })
    .limit(100); // Process first 100 verbose summaries
  
  if (error || !documents) {
    console.error('Failed to fetch documents:', error);
    return;
  }
  
  console.log(`Found ${documents.length} documents with verbose summaries`);
  
  if (documents.length === 0) {
    console.log('✨ No verbose summaries found!');
    return;
  }
  
  const successCount = 0;
  const errorCount = 0;
  
  // Process documents
  for (const i = 0; i < documents.length; i++) {
    const doc = documents[i];
    
    try {
      console.log(`\n${i + 1}. ${doc.title}`);
      console.log(`   Original length: ${doc.summary?.length} chars`);
      
      // Generate brief summary
      const briefSummary = await generateBriefSummary(doc.title, doc.summary!);
      
      // Update document
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          summary: briefSummary,
          updated_at: new Date().toISOString()
        })
        .eq('id', doc.id);
      
      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Reduced to ${briefSummary.length} chars (${Math.round((1 - briefSummary.length / doc.summary!.length) * 100)}% reduction)`);
        successCount++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      errorCount++;
    }
    
    // Progress update
    if ((i + 1) % 10 === 0) {
      console.log(`\n📈 Progress: ${i + 1}/${documents.length} (${Math.round((i + 1) / documents.length * 100)}%)`);
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(50));
  console.log('✨ Brief summary regeneration complete!');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
}

// Run the regeneration
regenerateSummaries().catch(console.error);