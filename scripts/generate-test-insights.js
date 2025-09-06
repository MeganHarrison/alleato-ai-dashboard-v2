#!/usr/bin/env node

/**
 * Script to generate test meeting data and insights
 * This will create sample chunks for meetings and then generate insights
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
);

// Sample meeting transcript chunks for testing
const sampleChunks = [
  {
    content: "John mentioned that we need to complete the API integration by next Friday. This is critical for the product launch.",
    speaker_info: { speaker: "John Smith", email: "john@company.com" },
    start_timestamp: 0,
    end_timestamp: 30
  },
  {
    content: "Sarah agreed to handle the frontend implementation. She estimated it would take about 3 days with the current resources.",
    speaker_info: { speaker: "Sarah Johnson", email: "sarah@company.com" },
    start_timestamp: 30,
    end_timestamp: 60
  },
  {
    content: "We discussed the risk of delays if the third-party API documentation isn't complete. Mike will follow up with the vendor.",
    speaker_info: { speaker: "Mike Chen", email: "mike@company.com" },
    start_timestamp: 60,
    end_timestamp: 90
  },
  {
    content: "Decision made: We'll use GraphQL for the new API endpoints instead of REST. This will provide better flexibility for mobile apps.",
    speaker_info: { speaker: "John Smith", email: "john@company.com" },
    start_timestamp: 90,
    end_timestamp: 120
  },
  {
    content: "Action item for the team: Everyone needs to review the new security requirements document by Wednesday.",
    speaker_info: { speaker: "Sarah Johnson", email: "sarah@company.com" },
    start_timestamp: 120,
    end_timestamp: 150
  }
];

async function createTestChunksForMeeting(meetingId, meetingTitle) {
  console.log(`\n📝 Creating test chunks for: ${meetingTitle}`);
  
  try {
    // First, check if chunks already exist
    const { count: existingCount } = await supabase
      .from('meeting_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('meeting_id', meetingId);
      
    if (existingCount > 0) {
      console.log(`   ⚠️ Meeting already has ${existingCount} chunks, skipping...`);
      return false;
    }
    
    // Create chunks with proper structure
    const chunks = sampleChunks.map((chunk, index) => ({
      meeting_id: meetingId,
      content: chunk.content,
      speaker_info: chunk.speaker_info,
      chunk_index: index,
      start_timestamp: chunk.start_timestamp,
      end_timestamp: chunk.end_timestamp,
      metadata: {
        word_count: chunk.content.split(' ').length,
        has_action_item: chunk.content.toLowerCase().includes('action'),
        has_decision: chunk.content.toLowerCase().includes('decision'),
        created_at: new Date().toISOString()
      }
    }));
    
    const { error } = await supabase
      .from('meeting_chunks')
      .insert(chunks);
      
    if (error) {
      console.error(`   ❌ Error creating chunks:`, error.message);
      return false;
    }
    
    console.log(`   ✅ Created ${chunks.length} chunks`);
    
    // Update meeting summary if it doesn't have one
    const { data: meeting } = await supabase
      .from('meetings')
      .select('summary')
      .eq('id', meetingId)
      .single();
      
    if (!meeting?.summary) {
      const summary = "Discussion covered API integration timeline, frontend implementation assignments, and architecture decisions. Team agreed on GraphQL implementation and established security review deadline.";
      
      const { error: updateError } = await supabase
        .from('meetings')
        .update({ 
          summary,
          chunk_count: chunks.length,
          word_count: chunks.reduce((sum, c) => sum + (c.metadata?.word_count || 0), 0)
        })
        .eq('id', meetingId);
        
      if (!updateError) {
        console.log(`   ✅ Added meeting summary`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }
}

async function generateInsightsViaAPI(meetingId, projectId) {
  try {
    console.log(`\n🤖 Calling insight generator API for meeting ${meetingId}...`);
    
    const response = await fetch(`http://localhost:57097/insights/meeting/${meetingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Generated ${result.insightsGenerated || 0} insights`);
      console.log(`   ✅ Summary generated: ${result.summaryGenerated || false}`);
      return result;
    } else {
      const error = await response.text();
      console.error(`   ❌ API error:`, error);
      return null;
    }
  } catch (error) {
    console.error(`   ❌ Request failed:`, error.message);
    return null;
  }
}

async function assignProjectToMeeting(meetingId) {
  try {
    console.log(`\n🎯 Assigning project to meeting ${meetingId}...`);
    
    const response = await fetch(`http://localhost:57097/project/assign/${meetingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (response.ok) {
      const result = await response.json();
      if (result.projectId) {
        console.log(`   ✅ Assigned to project ${result.projectId} (${(result.confidence * 100).toFixed(1)}% confidence)`);
        return result.projectId;
      }
    }
    
    console.log(`   ⚠️ Could not assign project`);
    return null;
  } catch (error) {
    console.error(`   ❌ Assignment failed:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Test Insight Generation\n');
  console.log('═'.repeat(80));
  
  // Check worker health
  try {
    const healthCheck = await fetch('http://localhost:57097/health');
    if (!healthCheck.ok) {
      throw new Error('Worker not responding');
    }
    console.log('✅ Worker is healthy\n');
  } catch (error) {
    console.error('❌ Worker is not available. Please run: npm run dev --prefix agents/ACTIVE-worker-pm-rag-sep-1');
    process.exit(1);
  }
  
  // Get recent meetings without chunks
  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('id, title, date, project_id')
    .order('date', { ascending: false })
    .limit(5);
    
  if (error || !meetings) {
    console.error('❌ Error fetching meetings:', error);
    process.exit(1);
  }
  
  console.log(`📋 Processing ${meetings.length} recent meetings\n`);
  console.log('═'.repeat(80));
  
  let successCount = 0;
  
  for (const meeting of meetings) {
    console.log(`\n📅 Processing: ${meeting.title || 'Untitled'} (${meeting.id})`);
    console.log(`   Date: ${meeting.date}`);
    console.log(`   Current Project: ${meeting.project_id || 'None'}`);
    
    // Step 1: Create test chunks if needed
    const chunksCreated = await createTestChunksForMeeting(meeting.id, meeting.title);
    
    // Step 2: Assign project if needed
    let projectId = meeting.project_id;
    if (!projectId && chunksCreated) {
      projectId = await assignProjectToMeeting(meeting.id);
    }
    
    // Step 3: Generate insights if we have chunks
    if (chunksCreated || projectId) {
      const result = await generateInsightsViaAPI(meeting.id, projectId);
      if (result && result.success) {
        successCount++;
      }
    }
    
    console.log('─'.repeat(80));
    
    // Small delay between meetings
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Final summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 Final Summary:\n');
  console.log(`✅ Successfully processed: ${successCount} meetings`);
  
  // Check the results
  console.log('\n📈 Checking generated insights...\n');
  
  const { data: insights, error: insightsError } = await supabase
    .from('ai_insights')
    .select('id, meeting_id, project_id, insight_type, title')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (insights) {
    console.log(`Found ${insights.length} recent insights:`);
    insights.forEach(insight => {
      console.log(`  - ${insight.insight_type}: ${insight.title.substring(0, 50)}...`);
    });
  }
}

// Run the script
main().catch(console.error);