#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY;

console.log(chalk.blue('🔍 Testing LangSmith Tracing Setup\n'));

// Step 1: Check health endpoint
console.log(chalk.yellow('1. Checking FM Global API health...'));
try {
  const healthResponse = await fetch(`${API_URL}/api/fm-global`, {
    method: 'GET',
  });
  const healthData = await healthResponse.json();
  
  if (healthData.tracing === 'enabled') {
    console.log(chalk.green('✓ Tracing is enabled'));
    console.log(chalk.gray(`  Project: ${healthData.project}`));
  } else {
    console.log(chalk.red('✗ Tracing is disabled'));
    console.log(chalk.gray('  Set LANGSMITH_TRACING=true in .env.local'));
  }
} catch (error) {
  console.log(chalk.red('✗ Failed to check health endpoint'));
  console.error(error);
}

// Step 2: Test chat endpoint with tracing
console.log(chalk.yellow('\n2. Testing chat endpoint with tracing...'));
try {
  const chatResponse = await fetch(`${API_URL}/api/fm-global`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: 'What are the key requirements for shuttle ASRS sprinkler systems?'
        }
      ],
      sessionId: 'test-session-123',
      userId: 'test-user',
    }),
  });
  
  const chatData = await chatResponse.json();
  
  if (chatData.runId) {
    console.log(chalk.green('✓ Chat response received with run ID'));
    console.log(chalk.gray(`  Run ID: ${chatData.runId}`));
    console.log(chalk.gray(`  Source: ${chatData._source || 'unknown'}`));
    
    // Step 3: Test feedback endpoint
    console.log(chalk.yellow('\n3. Testing feedback submission...'));
    const feedbackResponse = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        runId: chatData.runId,
        score: 1.0,
        comment: 'Test feedback from tracing test script',
        key: 'test-feedback',
      }),
    });
    
    const feedbackData = await feedbackResponse.json();
    
    if (feedbackData.success) {
      console.log(chalk.green('✓ Feedback submitted successfully'));
    } else {
      console.log(chalk.red('✗ Failed to submit feedback'));
    }
  } else {
    console.log(chalk.yellow('⚠ No run ID in response (tracing might be disabled)'));
  }
  
  // Display response preview
  console.log(chalk.yellow('\n4. Response preview:'));
  const responseText = chatData.response || chatData.message || 'No response';
  console.log(chalk.gray(responseText.substring(0, 200) + '...'));
  
} catch (error) {
  console.log(chalk.red('✗ Failed to test chat endpoint'));
  console.error(error);
}

// Step 4: Provide LangSmith dashboard link
if (LANGSMITH_API_KEY) {
  console.log(chalk.blue('\n📊 View traces at:'));
  console.log(chalk.cyan('   https://smith.langchain.com'));
  console.log(chalk.gray('   Navigate to your project to see the traces'));
} else {
  console.log(chalk.yellow('\n⚠ LANGSMITH_API_KEY not set'));
  console.log(chalk.gray('  Add it to your .env.local to enable tracing'));
}

console.log(chalk.blue('\n✅ Tracing test complete!\n'));