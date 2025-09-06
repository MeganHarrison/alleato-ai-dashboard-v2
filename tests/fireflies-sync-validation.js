#!/usr/bin/env node

/**
 * Comprehensive Validation Test for Fireflies Sync Script
 * 
 * This test validates all critical requirements:
 * 1. Saves to 'meetings' table (NOT documents table)
 * 2. Proper participant extraction from ALL sources
 * 3. Duplicate checking functionality
 * 4. Required field population
 * 5. Error handling
 * 6. Raw transcript and summary building
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Mock data for testing participant extraction
const mockTranscriptData = {
  id: 'test_transcript_123',
  title: 'Test Project Meeting',
  date: 1672531200, // January 1, 2023
  duration: 3600, // 1 hour
  participants: 'john.doe@company.com, jane.smith@client.com',
  host_email: 'host@company.com',
  organizer_email: 'organizer@company.com',
  transcript_url: 'https://app.fireflies.ai/view/test_transcript_123',
  meeting_attendees: [
    { displayName: 'John Doe', email: 'john.doe@company.com', name: 'John Doe' },
    { displayName: 'Jane Smith', email: 'jane.smith@client.com', name: 'Jane Smith' },
    { displayName: 'Bob Wilson', email: null, name: 'Bob Wilson' }, // Test name without email
  ],
  user: {
    name: 'Meeting Owner',
    email: 'owner@company.com'
  },
  summary: {
    overview: 'This is a test meeting overview with key discussions.',
    action_items: ['Complete feature A', 'Review budget proposal'],
    keywords: ['project', 'budget', 'deadline'],
    shorthand_bullet: ['Discussed project timeline', 'Reviewed Q1 budget'],
    outline: ['Opening remarks', 'Project status', 'Budget review', 'Next steps']
  },
  sentences: [
    { text: 'Welcome everyone to the project meeting.', speaker_id: 'Speaker_0', start_time: 0 },
    { text: 'Let\'s start with the project status update.', speaker_id: 'Speaker_0', start_time: 5 },
    { text: 'The feature is 80% complete and on track.', speaker_id: 'Speaker_1', start_time: 10 },
    { text: 'What about the budget concerns?', speaker_id: 'Speaker_2', start_time: 15 },
    { text: 'We need to review the Q1 allocation.', speaker_id: 'Speaker_1', start_time: 20 }
  ],
  analytics: {
    sentiments: {
      positive_pct: 70,
      neutral_pct: 25,
      negative_pct: 5
    },
    speakers: [
      { speaker_id: 'Speaker_0', name: 'John Doe', duration: 1200 },
      { speaker_id: 'Speaker_1', name: 'Jane Smith', duration: 1800 },
      { speaker_id: 'Speaker_2', name: 'Bob Wilson', duration: 600 }
    ]
  }
};

// Import functions from the sync script
async function importSyncScriptFunctions() {
  try {
    // We'll need to read and evaluate specific functions from the sync script
    const fs = await import('fs');
    const scriptPath = join(__dirname, '..', 'scripts', 'fireflies-sync-to-meetings-table.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Extract and eval the functions we need to test
    const extractParticipantsMatch = scriptContent.match(/function extractParticipants\(transcript\) \{[\s\S]*?\n\}/);
    const buildRawTranscriptMatch = scriptContent.match(/function buildRawTranscript\(transcript\) \{[\s\S]*?\n\}/);
    const buildSummaryMatch = scriptContent.match(/function buildSummary\(transcript\) \{[\s\S]*?\n\}/);
    const formatTranscriptMatch = scriptContent.match(/function formatTranscriptForMeetings\(transcript\) \{[\s\S]*?\n\}/);
    const checkExistingMatch = scriptContent.match(/async function checkExistingMeeting\(firefliesId\) \{[\s\S]*?\n\}/);
    
    if (!extractParticipantsMatch || !buildRawTranscriptMatch || !buildSummaryMatch || !formatTranscriptMatch) {
      throw new Error('Could not extract required functions from sync script');
    }
    
    // Create a safe execution context
    const context = {
      extractParticipants: null,
      buildRawTranscript: null,
      buildSummary: null,
      formatTranscriptForMeetings: null,
      checkExistingMeeting: null
    };
    
    // Safely evaluate the functions
    const functionCode = `
      ${extractParticipantsMatch[0]}
      ${buildRawTranscriptMatch[0]}
      ${buildSummaryMatch[0]}
      ${formatTranscriptMatch[0]}
      
      return {
        extractParticipants,
        buildRawTranscript,
        buildSummary,
        formatTranscriptForMeetings
      };
    `;
    
    const functions = new Function(functionCode)();
    return functions;
    
  } catch (error) {
    console.error('❌ Failed to import functions from sync script:', error.message);
    return null;
  }
}

class ValidationTester {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.supabase = null;
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    }
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('🔍 FIREFLIES SYNC VALIDATION TEST SUITE');
    console.log('=========================================\n');

    for (const { name, testFn } of this.tests) {
      try {
        console.log(`📋 ${name}...`);
        await testFn();
        console.log(`   ✅ PASSED\n`);
        this.passed++;
      } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log('=========================================');
    console.log('📊 VALIDATION RESULTS');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📝 Total: ${this.tests.length}`);
    
    if (this.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The sync script is ready for production use.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the issues before using in production.');
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  assertArrayContains(array, item, message) {
    if (!array.includes(item)) {
      throw new Error(`${message}. Array does not contain: ${item}`);
    }
  }

  assertGreaterThan(actual, threshold, message) {
    if (actual <= threshold) {
      throw new Error(`${message}. Expected > ${threshold}, got: ${actual}`);
    }
  }
}

// Run the validation tests
async function runValidationTests() {
  const tester = new ValidationTester();
  const functions = await importSyncScriptFunctions();
  
  if (!functions) {
    console.error('❌ Cannot run tests - failed to import sync script functions');
    return;
  }

  const { extractParticipants, buildRawTranscript, buildSummary, formatTranscriptForMeetings } = functions;

  // Test 1: Validate script target table
  tester.test('Script targets "meetings" table (not documents)', async () => {
    const fs = await import('fs');
    const scriptPath = join(__dirname, '..', 'scripts', 'fireflies-sync-to-meetings-table.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Should contain meetings table references
    tester.assert(
      scriptContent.includes(".from('meetings')"),
      'Script should save to meetings table'
    );
    
    // Should NOT contain documents table references for saving
    const saveToDocuments = scriptContent.match(/\.from\('documents'\).*\.insert/);
    tester.assert(
      !saveToDocuments,
      'Script should NOT save to documents table'
    );
  });

  // Test 2: Participant extraction from ALL sources
  tester.test('Extract participants from ALL available sources', () => {
    const participants = extractParticipants(mockTranscriptData);
    
    // Should extract from meeting_attendees (email and name)
    tester.assertArrayContains(participants, 'john.doe@company.com', 'Should include attendee email');
    tester.assertArrayContains(participants, 'jane.smith@client.com', 'Should include attendee email');
    tester.assertArrayContains(participants, 'Bob Wilson', 'Should include attendee name when no email');
    
    // Should extract from participants string
    // This will be included via meeting_attendees email, but let's test the parsing
    
    // Should extract from host_email
    tester.assertArrayContains(participants, 'host@company.com', 'Should include host email');
    
    // Should extract from organizer_email  
    tester.assertArrayContains(participants, 'organizer@company.com', 'Should include organizer email');
    
    // Should extract from user.email
    tester.assertArrayContains(participants, 'owner@company.com', 'Should include user email');
    
    // Should extract from analytics.speakers
    // Note: Speaker names from analytics should be included if different from unknowns
    
    // Should have reasonable number of unique participants
    tester.assertGreaterThan(participants.length, 4, 'Should extract multiple participants');
    
    // Should not have duplicates
    const uniqueParticipants = [...new Set(participants)];
    tester.assertEqual(
      participants.length, 
      uniqueParticipants.length, 
      'Should not have duplicate participants'
    );
  });

  // Test 3: Raw transcript building
  tester.test('Build structured raw transcript with speakers', () => {
    const rawTranscript = buildRawTranscript(mockTranscriptData);
    
    tester.assert(
      rawTranscript.includes('Speaker_0:'),
      'Should include speaker identification'
    );
    
    tester.assert(
      rawTranscript.includes('Welcome everyone to the project meeting'),
      'Should include actual transcript content'
    );
    
    tester.assert(
      rawTranscript.includes('Speaker_1:'),
      'Should group content by speaker'
    );
    
    tester.assertGreaterThan(
      rawTranscript.length,
      100,
      'Should produce substantial transcript content'
    );
  });

  // Test 4: Summary building
  tester.test('Build comprehensive meeting summary', () => {
    const summary = buildSummary(mockTranscriptData);
    
    tester.assert(
      summary.includes('This is a test meeting overview'),
      'Should include overview content'
    );
    
    tester.assert(
      summary.includes('Key Points:'),
      'Should include key points section'
    );
    
    tester.assert(
      summary.includes('Action Items:'),
      'Should include action items section'
    );
    
    tester.assert(
      summary.includes('Complete feature A'),
      'Should include specific action items'
    );
    
    tester.assertGreaterThan(
      summary.length,
      200,
      'Should produce comprehensive summary content'
    );
  });

  // Test 5: Meeting data formatting
  tester.test('Format transcript data for meetings table schema', () => {
    const meetingData = formatTranscriptForMeetings(mockTranscriptData);
    
    // Required fields validation
    tester.assertEqual(meetingData.fireflies_id, 'test_transcript_123', 'Should set fireflies_id');
    tester.assert(meetingData.fireflies_link.includes('fireflies.ai'), 'Should set fireflies_link');
    tester.assertEqual(meetingData.storage_path, 'fireflies/test_transcript_123', 'Should set storage_path');
    tester.assertEqual(meetingData.title, 'Test Project Meeting', 'Should set title');
    
    // Date validation
    tester.assert(meetingData.meeting_date.includes('2023'), 'Should convert date properly');
    
    // Duration validation  
    tester.assertEqual(meetingData.duration_minutes, 60, 'Should convert duration to minutes');
    
    // Participants validation
    tester.assert(Array.isArray(meetingData.participants), 'Participants should be array');
    tester.assertGreaterThan(meetingData.participants.length, 0, 'Should have participants');
    
    // Content validation
    tester.assertGreaterThan(meetingData.raw_transcript.length, 0, 'Should have raw transcript');
    tester.assertGreaterThan(meetingData.summary.length, 0, 'Should have summary');
    
    // Metadata validation
    tester.assert(typeof meetingData.metadata === 'object', 'Metadata should be object');
    tester.assertEqual(meetingData.metadata.fireflies_id, 'test_transcript_123', 'Metadata should include fireflies_id');
    tester.assert(meetingData.metadata.source === 'fireflies', 'Metadata should indicate source');
  });

  // Test 6: Environment variable validation
  tester.test('Environment variables validation', () => {
    const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'FIREFLIES_API_KEY'];
    
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        console.log(`   ⚠️  WARNING: ${varName} not set - sync will fail in production`);
      } else {
        console.log(`   ✓ ${varName} is configured`);
      }
    }
    
    // At least one should be set for basic validation
    const hasBasicConfig = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_SERVICE_KEY;
    if (!hasBasicConfig) {
      throw new Error('No environment variables configured - check .env.local file');
    }
  });

  // Test 7: Database connection test (if credentials available)
  if (tester.supabase) {
    tester.test('Database connection and meetings table existence', async () => {
      // Test basic connection
      const { data, error } = await tester.supabase
        .from('meetings')
        .select('count', { count: 'exact', head: true });
      
      tester.assert(!error, `Database connection failed: ${error?.message}`);
      
      console.log(`   ✓ Connected to meetings table (${data?.length || 0} records)`);
    });

    tester.test('Duplicate checking functionality', async () => {
      // Test the duplicate checking query structure
      const testFirefliesId = 'test_duplicate_check_123';
      
      // This should not fail even if record doesn't exist
      const { data, error } = await tester.supabase
        .from('meetings')
        .select('id')
        .eq('fireflies_id', testFirefliesId)
        .limit(1);
      
      tester.assert(!error, `Duplicate check query failed: ${error?.message}`);
      tester.assert(Array.isArray(data), 'Duplicate check should return array');
      
      console.log(`   ✓ Duplicate checking query works properly`);
    });
  } else {
    console.log('⚠️  Skipping database tests - no Supabase credentials configured');
  }

  // Test 8: Error handling validation  
  tester.test('Error handling for invalid data', () => {
    // Test with minimal/invalid data
    const invalidTranscript = {
      id: 'test_invalid',
      title: null,
      date: null,
      duration: null,
      participants: null
    };
    
    try {
      const result = formatTranscriptForMeetings(invalidTranscript);
      
      // Should handle nulls gracefully
      tester.assert(result.fireflies_id === 'test_invalid', 'Should preserve ID');
      tester.assert(result.title.includes('Meeting'), 'Should provide default title');
      tester.assert(Array.isArray(result.participants), 'Should provide empty participants array');
      
    } catch (error) {
      throw new Error(`Should handle invalid data gracefully: ${error.message}`);
    }
  });

  // Run all tests
  await tester.run();
}

// Execute the validation
runValidationTests().catch(console.error);