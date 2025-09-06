#!/usr/bin/env node

/**
 * Script to generate insights for meetings that have embeddings
 * and ensure they're mapped to their assigned projects
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  console.error('Current values:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Worker endpoint (local development)
const WORKER_URL = 'http://localhost:8787';

async function checkMeetingsForInsightGeneration() {
  console.log('🔍 Checking meetings that need insight generation...\n');

  try {
    // Get meetings that have embeddings but might not have insights
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        date,
        project_id,
        participants,
        duration_minutes
      `)
      .order('date', { ascending: false })
      .limit(10);

    if (meetingsError) {
      console.error('❌ Error fetching meetings:', meetingsError);
      return [];
    }

    console.log(`Found ${meetings.length} recent meetings\n`);

    // Check which meetings have chunks and embeddings
    const meetingsWithData = [];
    
    for (const meeting of meetings) {
      // Check for meeting chunks
      const { count: chunkCount } = await supabase
        .from('meeting_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('meeting_id', meeting.id);

      // Check for existing insights
      const { count: insightCount } = await supabase
        .from('ai_insights')
        .select('*', { count: 'exact', head: true })
        .eq('meeting_id', meeting.id);

      meetingsWithData.push({
        ...meeting,
        hasChunks: chunkCount > 0,
        chunkCount,
        hasInsights: insightCount > 0,
        insightCount,
        needsInsights: chunkCount > 0 && insightCount === 0
      });
    }

    // Display meeting status
    console.log('📊 Meeting Status:\n');
    console.log('─'.repeat(80));
    
    meetingsWithData.forEach(meeting => {
      const projectBadge = meeting.project_id ? `✅ Project #${meeting.project_id}` : '❌ No Project';
      const chunkBadge = meeting.hasChunks ? `✅ ${meeting.chunkCount} chunks` : '❌ No chunks';
      const insightBadge = meeting.hasInsights ? `✅ ${meeting.insightCount} insights` : '❌ No insights';
      const needsBadge = meeting.needsInsights ? '⚡ NEEDS INSIGHTS' : '';
      
      console.log(`📅 ${meeting.title || 'Untitled Meeting'}`);
      console.log(`   ID: ${meeting.id}`);
      console.log(`   Date: ${meeting.date}`);
      console.log(`   Status: ${projectBadge} | ${chunkBadge} | ${insightBadge} ${needsBadge}`);
      console.log('─'.repeat(80));
    });

    return meetingsWithData.filter(m => m.needsInsights);
    
  } catch (error) {
    console.error('❌ Error checking meetings:', error);
    return [];
  }
}

async function assignProjectsToMeetings(meetings) {
  console.log('\n🎯 Assigning projects to meetings without assignments...\n');
  
  for (const meeting of meetings.filter(m => !m.project_id)) {
    try {
      console.log(`Assigning project to: ${meeting.title || meeting.id}...`);
      
      const response = await fetch(`${WORKER_URL}/project/assign/${meeting.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Assigned to project ${result.projectId} with ${(result.confidence * 100).toFixed(1)}% confidence`);
        meeting.project_id = result.projectId;
      } else {
        console.log(`⚠️ Could not assign project: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error assigning project:`, error.message);
    }
  }
}

async function generateInsightsForMeeting(meetingId, projectId) {
  try {
    console.log(`\n📊 Generating insights for meeting ${meetingId}...`);
    
    const response = await fetch(`${WORKER_URL}/insights/meeting/${meetingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId // Ensure project mapping
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Generated ${result.insightsGenerated} insights`);
      
      if (result.summaryGenerated) {
        console.log(`✅ Generated meeting summary`);
      }
      
      return result;
    } else {
      const error = await response.text();
      console.error(`❌ Failed to generate insights: ${error}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error generating insights:`, error.message);
    return null;
  }
}

async function verifyInsightProjectMapping() {
  console.log('\n🔍 Verifying insight-project mappings...\n');
  
  try {
    // Get recent insights with their meeting and project info
    const { data: insights, error } = await supabase
      .from('ai_insights')
      .select(`
        id,
        meeting_id,
        project_id,
        insight_type,
        title,
        meetings!inner (
          id,
          title,
          project_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Error fetching insights:', error);
      return;
    }

    // Check for mapping inconsistencies
    let correctMappings = 0;
    let missingMappings = 0;
    let inconsistentMappings = 0;

    insights.forEach(insight => {
      const meeting = insight.meetings;
      
      if (!insight.project_id && !meeting.project_id) {
        missingMappings++;
        console.log(`⚠️ No project mapping: ${insight.title.substring(0, 50)}...`);
      } else if (insight.project_id !== meeting.project_id) {
        inconsistentMappings++;
        console.log(`❌ Inconsistent mapping: Insight->Project ${insight.project_id} vs Meeting->Project ${meeting.project_id}`);
      } else {
        correctMappings++;
      }
    });

    console.log('\n📈 Mapping Summary:');
    console.log(`✅ Correct mappings: ${correctMappings}`);
    console.log(`⚠️ Missing mappings: ${missingMappings}`);
    console.log(`❌ Inconsistent mappings: ${inconsistentMappings}`);
    
  } catch (error) {
    console.error('❌ Error verifying mappings:', error);
  }
}

async function main() {
  console.log('🚀 Starting Insight Generation Process\n');
  console.log('═'.repeat(80));
  
  try {
    // Step 1: Check which meetings need insights
    const meetingsNeedingInsights = await checkMeetingsForInsightGeneration();
    
    if (meetingsNeedingInsights.length === 0) {
      console.log('\n✨ All meetings with embeddings already have insights!');
      await verifyInsightProjectMapping();
      return;
    }

    console.log(`\n📋 Found ${meetingsNeedingInsights.length} meetings that need insights\n`);

    // Step 2: Assign projects to meetings that don't have them
    await assignProjectsToMeetings(meetingsNeedingInsights);

    // Step 3: Generate insights for each meeting
    console.log('\n🤖 Generating insights for meetings...\n');
    console.log('═'.repeat(80));
    
    let successCount = 0;
    let failCount = 0;
    
    for (const meeting of meetingsNeedingInsights) {
      const result = await generateInsightsForMeeting(meeting.id, meeting.project_id);
      
      if (result && result.success) {
        successCount++;
      } else {
        failCount++;
      }

      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Step 4: Summary
    console.log('\n═'.repeat(80));
    console.log('📊 Generation Summary:\n');
    console.log(`✅ Successfully processed: ${successCount} meetings`);
    console.log(`❌ Failed: ${failCount} meetings`);
    
    // Step 5: Verify project mappings
    await verifyInsightProjectMapping();
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Check for environment configuration
async function checkWorkerHealth() {
  try {
    const response = await fetch(`${WORKER_URL}/health`);
    if (!response.ok) {
      throw new Error(`Worker not responding at ${WORKER_URL}`);
    }
    console.log('✅ Worker is healthy\n');
    return true;
  } catch (error) {
    console.error(`❌ Worker is not available at ${WORKER_URL}`);
    console.error('Please run: npm run dev --prefix agents/ACTIVE-worker-pm-rag-sep-1\n');
    return false;
  }
}

// Run the script
(async () => {
  // Check worker health first
  const isHealthy = await checkWorkerHealth();
  if (!isHealthy) {
    process.exit(1);
  }
  
  await main();
  console.log('\n✅ Insight generation process completed!\n');
})();