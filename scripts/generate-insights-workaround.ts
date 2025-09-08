#!/usr/bin/env node

/**
 * Workaround script to generate insights by using meetings table
 * This creates meeting records from documents to bypass the ai_insights trigger issue
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateInsightsWorkaround() {
  try {
    console.log('🔄 Starting insight generation workaround...\n');
    
    // 1. Get documents that need insights (including pending ones)
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .or('processing_status.eq.completed,processing_status.eq.pending')
      .order('created_at', { ascending: false })
      .limit(50); // Process 50 documents at a time
    
    if (docError) {
      throw docError;
    }
    
    if (!documents || documents.length === 0) {
      console.log('No documents found to process');
      return;
    }
    
    console.log(`Found ${documents.length} documents to process\n`);
    
    for (const doc of documents) {
      console.log(`Processing: ${doc.title || doc.id}`);
      
      try {
        // 2. Check if meeting record exists
        const { data: existingMeeting } = await supabase
          .from('meetings')
          .select('id')
          .eq('id', doc.id)
          .single();
        
        if (!existingMeeting) {
          // 3. Create meeting record from document
          console.log('  Creating meeting record...');
          const { error: meetingError } = await supabase
            .from('meetings')
            .insert({
              id: doc.id,
              title: doc.title,
              date: doc.date || doc.created_at,
              summary: doc.metadata?.summary || doc.summary,
              participants: doc.metadata?.participants || doc.participants || [],
              transcript_url: doc.transcript_url,
              category: doc.category,
              duration_minutes: doc.metadata?.duration_minutes || doc.duration_minutes,
              project_id: doc.metadata?.project_id || doc.project_id,
              processing_status: 'completed',
              raw_metadata: doc.metadata
            });
          
          if (meetingError) {
            console.log(`  ⚠️  Failed to create meeting record: ${meetingError.message}`);
            continue;
          }
        }
        
        // 4. Get content for analysis
        let content = '';
        
        // Try to get chunks first
        const { data: chunks } = await supabase
          .from('chunks')
          .select('content')
          .eq('document_id', doc.id)
          .order('chunk_index')
          .limit(10);
        
        if (chunks && chunks.length > 0) {
          // Use chunk content if available
          content = chunks.map(c => c.content).join('\n\n');
        } else {
          // Fall back to document content or metadata
          content = doc.content || doc.summary || doc.metadata?.summary || '';
          
          if (!content && doc.transcript_url) {
            console.log('  ⚠️  No content available, only transcript URL');
            continue;
          }
          
          if (!content) {
            console.log('  ⚠️  No content available for analysis');
            continue;
          }
        }
        
        // 6. Generate insights using GPT
        console.log('  🤖 Generating insights with AI...');
        const insights = await generateInsightsWithGPT(doc.title || 'Document', content);
        
        // 7. Store insights directly in meetings table
        const { error: updateError } = await supabase
          .from('meetings')
          .update({
            action_items: insights.actionItems,
            decisions: insights.decisions,
            risks: insights.risks,
            topics: insights.topics,
            insights: insights.actionItems.length + insights.decisions.length
          })
          .eq('id', doc.id);
        
        if (updateError) {
          console.log(`  ❌ Failed to update insights: ${updateError.message}`);
        } else {
          console.log(`  ✅ Generated ${insights.actionItems.length} actions, ${insights.decisions.length} decisions`);
        }
        
        // 8. Insert into ai_insights table with duplicate prevention
        let insertedCount = 0;
        let duplicateCount = 0;
        
        // Insert action items
        for (const item of insights.actionItems) {
          const { error } = await supabase
            .from('ai_insights')
            .insert({
              meeting_id: doc.id,  // Use meeting_id (the meetings table expects this)
              insight_type: 'action_item',
              title: item.title,
              description: item.description,
              severity: item.priority || 'medium',
              confidence_score: 0.8,
              project_id: doc.metadata?.project_id || doc.project_id || null
            });
          
          if (error) {
            if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
              duplicateCount++;
            } else {
              console.log(`    ⚠️  Failed to insert action item: ${error.message}`);
            }
          } else {
            insertedCount++;
          }
        }
        
        // Insert decisions as insights
        for (const decision of insights.decisions) {
          const { error } = await supabase
            .from('ai_insights')
            .insert({
              meeting_id: doc.id,
              insight_type: 'decision',
              title: decision.title,
              description: decision.description,
              severity: 'medium',
              confidence_score: 0.85,
              project_id: doc.metadata?.project_id || doc.project_id || null
            });
          
          if (error) {
            if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
              duplicateCount++;
            } else {
              console.log(`    ⚠️  Failed to insert decision: ${error.message}`);
            }
          } else {
            insertedCount++;
          }
        }
        
        // Insert risks as insights
        for (const risk of insights.risks) {
          const { error } = await supabase
            .from('ai_insights')
            .insert({
              meeting_id: doc.id,
              insight_type: 'risk',
              title: risk.title,
              description: risk.description,
              severity: 'high',
              confidence_score: 0.75,
              project_id: doc.metadata?.project_id || doc.project_id || null
            });
          
          if (error) {
            if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
              duplicateCount++;
            } else {
              console.log(`    ⚠️  Failed to insert risk: ${error.message}`);
            }
          } else {
            insertedCount++;
          }
        }
        
        if (insertedCount > 0) {
          console.log(`  📊 Inserted ${insertedCount} new insights`);
        }
        if (duplicateCount > 0) {
          console.log(`  ⏭️  Skipped ${duplicateCount} duplicate insights`);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log('\n✨ Insight generation complete!');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

async function generateInsightsWithGPT(title: string, content: string) {
  const { OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  
  const prompt = `Analyze this document and extract insights:

Title: ${title}

Content:
${content.substring(0, 4000)}

Extract:
1. Action items (tasks that need to be done)
2. Decisions made
3. Risks identified
4. Key topics discussed

Return as JSON with arrays: actionItems, decisions, risks, topics
Each item should have 'title' and 'description' fields.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a meeting analyst. Extract actionable insights from documents.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { actionItems: [], decisions: [], risks: [], topics: [] };
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error('GPT error:', error);
    return { actionItems: [], decisions: [], risks: [], topics: [] };
  }
}

// Run the script
generateInsightsWorkaround();