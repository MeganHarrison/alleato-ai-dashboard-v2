#!/usr/bin/env node

/**
 * Check and update meetings table structure
 * Ensures the meetings table has all necessary columns for enhanced sync
 * 
 * Usage:
 *   npm run check:meetings-table
 *   
 * Or with environment variables:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/check-meetings-table.js
 *   
 * Or with command line args:
 *   node scripts/check-meetings-table.js --supabase-url=xxx --supabase-key=xxx
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  if (key && value) {
    acc[key.replace('--', '')] = value;
  }
  return acc;
}, {});

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

// Configuration with fallback order: CLI args > ENV vars > .env.local
const SUPABASE_URL = args['supabase-url'] || 
                     process.env.SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_KEY = args['supabase-key'] || 
                              process.env.SUPABASE_SERVICE_ROLE_KEY || 
                              process.env.SUPABASE_SERVICE_KEY;

// Display configuration (mask sensitive data)
console.log('🔧 Configuration:');
console.log(`   Supabase URL: ${SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET'}`);
console.log(`   Supabase Key: ${SUPABASE_SERVICE_KEY ? '***' + SUPABASE_SERVICE_KEY.slice(-4) : 'NOT SET'}`);
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables\n');
  console.log('Please provide the following:');
  console.log('  1. Via .env.local file:');
  console.log('     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('     SUPABASE_SERVICE_ROLE_KEY=your_service_key\n');
  console.log('  2. Via environment variables:');
  console.log('     SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npm run check:meetings-table\n');
  console.log('  3. Via command line arguments:');
  console.log('     node scripts/check-meetings-table.js --supabase-url=xxx --supabase-key=xxx\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function checkMeetingsTable() {
  console.log('🔍 Checking meetings table structure...\n');

  try {
    // Get a sample record to check structure
    const { data: sample, error } = await supabase
      .from('meetings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing meetings table:', error);
      console.log('\n📝 SQL to create meetings table with enhanced structure:\n');
      console.log(`
CREATE TABLE IF NOT EXISTS meetings (
  -- Primary key
  id TEXT PRIMARY KEY,
  
  -- Fireflies fields
  fireflies_id TEXT UNIQUE,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  participants TEXT[],
  speaker_count INTEGER,
  transcript_url TEXT,
  storage_url TEXT,
  organizer_email TEXT,
  
  -- Meeting metadata
  meeting_type TEXT DEFAULT 'general',
  meeting_attendees JSONB DEFAULT '[]'::jsonb,
  topics JSONB DEFAULT '[]'::jsonb,
  
  -- Summary fields (stored as JSONB)
  summary JSONB,
  
  -- Statistics
  total_words INTEGER,
  has_action_items BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  
  -- Indexes for performance
  INDEX idx_meetings_date (date DESC),
  INDEX idx_meetings_fireflies_id (fireflies_id),
  INDEX idx_meetings_meeting_type (meeting_type),
  INDEX idx_meetings_has_action_items (has_action_items)
);

-- Create RLS policies if needed
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for service role to manage
CREATE POLICY "Allow service role to manage meetings"
  ON meetings FOR ALL
  TO service_role
  USING (true);
      `);
      return;
    }

    // Check existing columns
    console.log('✅ Table exists. Checking columns...\n');
    
    const existingColumns = sample && sample[0] ? Object.keys(sample[0]) : [];
    console.log('Existing columns:', existingColumns.join(', '));

    // Required columns for enhanced sync
    const requiredColumns = [
      'id',
      'fireflies_id',
      'title',
      'date',
      'duration_minutes',
      'participants',
      'speaker_count',
      'transcript_url',
      'storage_url',
      'organizer_email',
      'meeting_type',
      'meeting_attendees',
      'topics',
      'summary',
      'total_words',
      'has_action_items',
      'created_at',
      'updated_at',
      'synced_at'
    ];

    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n⚠️  Missing columns:', missingColumns.join(', '));
      console.log('\n📝 SQL to add missing columns:\n');

      missingColumns.forEach(col => {
        let sql = `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS `;
        
        switch(col) {
          case 'fireflies_id':
            sql += `fireflies_id TEXT UNIQUE`;
            break;
          case 'storage_url':
            sql += `storage_url TEXT`;
            break;
          case 'organizer_email':
            sql += `organizer_email TEXT`;
            break;
          case 'meeting_type':
            sql += `meeting_type TEXT DEFAULT 'general'`;
            break;
          case 'meeting_attendees':
            sql += `meeting_attendees JSONB DEFAULT '[]'::jsonb`;
            break;
          case 'topics':
            sql += `topics JSONB DEFAULT '[]'::jsonb`;
            break;
          case 'summary':
            sql += `summary JSONB`;
            break;
          case 'total_words':
            sql += `total_words INTEGER`;
            break;
          case 'has_action_items':
            sql += `has_action_items BOOLEAN DEFAULT false`;
            break;
          case 'synced_at':
            sql += `synced_at TIMESTAMPTZ`;
            break;
          default:
            sql += `${col} TEXT`;
        }
        
        console.log(sql + ';');
      });
    } else {
      console.log('\n✅ All required columns exist!');
    }

    // Check for sample data
    const { data: count } = await supabase
      .from('meetings')
      .select('id', { count: 'exact', head: true });

    console.log(`\n📊 Table contains ${count || 0} meetings`);

    // Check storage bucket
    console.log('\n🗄️  Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
    } else {
      const meetingsBucket = buckets?.find(b => b.name === 'meetings');
      if (meetingsBucket) {
        console.log('✅ Meetings bucket exists');
        
        // Check bucket contents
        const { data: files } = await supabase.storage
          .from('meetings')
          .list('', { limit: 5 });
        
        console.log(`   Contains ${files?.length || 0} files (showing up to 5)`);
      } else {
        console.log('⚠️  Meetings bucket not found');
        console.log('\n📝 SQL to create storage bucket:\n');
        console.log(`
-- Run this in Supabase SQL editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('meetings', 'meetings', true);
        `);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkMeetingsTable()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });