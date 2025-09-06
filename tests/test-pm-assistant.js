/**
 * Test script for PM Assistant with proper AI SDK 5 tool calling
 * This bypasses auth to test the core functionality
 */

const fs = require('fs');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

async function testPMAssistant() {
  console.log('🧪 Testing PM Assistant with AI SDK 5 tool calling...\n');

  const messages = [
    {
      role: 'user',
      content: 'What are the recent project updates and any blockers mentioned in meetings?'
    }
  ];

  try {
    // Make request to the API endpoint
    const response = await fetch('http://localhost:3004/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Response received, status:', response.status);
    console.log('📝 Headers:', Object.fromEntries(response.headers.entries()));
    
    // Read the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    console.log('\n📊 Streaming response:\n');
    console.log('---'.repeat(20));

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      fullResponse += chunk;
      process.stdout.write(chunk);
    }

    console.log('\n' + '---'.repeat(20));
    console.log('\n✅ Test completed successfully!');
    
    // Check if tools were called
    if (fullResponse.includes('searchMeetings')) {
      console.log('✅ Tool calling detected - searchMeetings was invoked');
    }
    
    if (fullResponse.includes('tool-call') || fullResponse.includes('🔍')) {
      console.log('✅ Tool execution UI elements detected');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Details:', error);
  }
}

// Check if server is running
fetch('http://localhost:3004/api/chat', { method: 'OPTIONS' })
  .then(() => {
    console.log('🚀 Server is running, starting test...\n');
    testPMAssistant();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start the dev server first with: npm run dev');
    process.exit(1);
  });