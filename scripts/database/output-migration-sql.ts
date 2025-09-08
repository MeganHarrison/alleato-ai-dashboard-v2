#!/usr/bin/env tsx

/**
 * Script to output the SQL migration for duplicate prevention
 * Copy and run this in Supabase SQL Editor
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📋 Copy and paste the following SQL into your Supabase SQL Editor:\n');
console.log('=' .repeat(80));

// Read the migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250908_prevent_duplicate_insights.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log(migrationSQL);

console.log('=' .repeat(80));
console.log('\n✨ Instructions:');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Create a new query');
console.log('4. Paste the SQL above');
console.log('5. Click "Run" to execute');
console.log('\nThis will add duplicate prevention to your ai_insights table.');