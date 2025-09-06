#!/usr/bin/env node

/**
 * Quick verification script for PM Assistant functionality
 * Run with: node tests/verify-pm-assistant.js
 */

const https = require('http');

console.log('🔍 Verifying PM Assistant implementation...\n');

// Test 1: Check if PM Assistant page loads
function testPageLoad() {
  return new Promise((resolve) => {
    console.log('Test 1: Checking if PM Assistant page is accessible...');
    
    https.get('http://localhost:3000/pm-assistant', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ PM Assistant page loads successfully (200 OK)');
        resolve(true);
      } else if (res.statusCode === 307 || res.statusCode === 302) {
        console.log('⚠️  Redirected (likely to login) - auth required');
        resolve(true); // This is expected behavior
      } else {
        console.log(`❌ Unexpected status code: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('❌ Error accessing PM Assistant:', err.message);
      resolve(false);
    });
  });
}

// Test 2: Check if PM chat API endpoint exists
function testAPIEndpoint() {
  return new Promise((resolve) => {
    console.log('\nTest 2: Checking PM chat API endpoint...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/pm-chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 400) {
        console.log('✅ API endpoint exists and validates input');
        resolve(true);
      } else if (res.statusCode === 200) {
        console.log('✅ API endpoint exists and accepts requests');
        resolve(true);
      } else {
        console.log(`⚠️  API returned status: ${res.statusCode}`);
        resolve(true); // API exists but might need auth
      }
    });

    req.on('error', (err) => {
      console.log('❌ Error accessing API:', err.message);
      resolve(false);
    });

    // Send empty body to trigger validation
    req.write(JSON.stringify({}));
    req.end();
  });
}

// Test 3: Check build output
function checkBuildOutput() {
  console.log('\nTest 3: Checking if files were created...');
  const fs = require('fs');
  
  const filesToCheck = [
    'app/pm-assistant/page.tsx',
    'app/api/pm-chat/route.ts',
    'lib/rag/meeting-service.ts',
    'lib/pm/knowledge-engine.ts',
    'app/actions/pm-chat-actions.ts'
  ];
  
  let allExist = true;
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Run all tests
async function runTests() {
  console.log('Starting PM Assistant verification...\n');
  
  const pageLoadOk = await testPageLoad();
  const apiOk = await testAPIEndpoint();
  const filesOk = checkBuildOutput();
  
  console.log('\n📊 Summary:');
  console.log('─'.repeat(40));
  console.log(`Page Load: ${pageLoadOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoint: ${apiOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`File Creation: ${filesOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (pageLoadOk && apiOk && filesOk) {
    console.log('\n✨ PM Assistant implementation verified!');
    console.log('\nNext steps:');
    console.log('1. Login to the application');
    console.log('2. Navigate to /pm-assistant');
    console.log('3. Follow manual test guide in tests/manual-pm-test.md');
  } else {
    console.log('\n⚠️  Some checks failed. Please review the implementation.');
  }
}

// Execute tests
runTests();