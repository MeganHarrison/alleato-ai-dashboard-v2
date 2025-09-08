#!/usr/bin/env node
/**
 * Verify Supabase MCP Setup
 * Run with: node scripts/verify-mcp-setup.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

console.log('=== Supabase MCP Setup Verification ===\n');

// 1. Check environment variables
console.log('1. Environment Variables:');
const envVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_KEY,
  'SUPABASE_MANAGEMENT_API_TOKEN': process.env.SUPABASE_MANAGEMENT_API_TOKEN,
  'PROJ_REF': process.env.PROJ_REF || 'lgveqfnpkxvzbnnwuled (default)'
};

Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    const display = key.includes('KEY') || key.includes('TOKEN') 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 6)}` 
      : value;
    console.log(`✅ ${key}: ${display}`);
  } else {
    console.log(`❌ ${key}: Not found`);
  }
});

// 2. Check MCP configuration files
console.log('\n2. MCP Configuration Files:');
const configFiles = [
  'claude_project.json',
  '.mcp.json',
  'scripts/run-mcp-server.js'
];

configFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// 3. Test database connection
console.log('\n3. Database Connection Test:');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (supabaseUrl && supabaseServiceKey) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test basic query
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (e) {
    console.log('❌ Database connection error:', e.message);
  }
} else {
  console.log('❌ Missing database credentials');
}

// 4. MCP Server Status
console.log('\n4. MCP Server Status:');
if (process.env.SUPABASE_MANAGEMENT_API_TOKEN) {
  console.log('✅ Management API token configured');
  console.log('✅ MCP server should be functional');
  console.log('\nTo use MCP in Claude Desktop:');
  console.log('1. Copy the claude_project.json to your Claude Desktop project');
  console.log('2. Reload Claude Desktop');
  console.log('3. MCP tools will be available in the tools menu');
} else {
  console.log('❌ Management API token not configured');
  console.log('ℹ️  Standard Supabase client is still fully functional');
}

// 5. Summary
console.log('\n=== Summary ===');
const hasToken = !!process.env.SUPABASE_MANAGEMENT_API_TOKEN;
const hasDB = !!(supabaseUrl && supabaseServiceKey);

if (hasToken && hasDB) {
  console.log('✅ Both MCP and standard Supabase client are configured');
} else if (hasDB) {
  console.log('✅ Standard Supabase client is configured (MCP optional)');
} else {
  console.log('❌ Database configuration incomplete');
}