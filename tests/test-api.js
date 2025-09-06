const http = require('http');

// Test PM Chat API endpoint
function testPMChatAPI() {
  console.log('Testing PM Chat API endpoint...\n');
  
  const testData = {
    chatId: 'test-123',
    messages: [
      {
        id: '1',
        role: 'user',
        content: 'Hello, can you help with project management?',
        parts: [{ type: 'text', content: 'Hello, can you help with project management?' }]
      }
    ]
  };

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/pm-chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(testData))
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
      // For streaming responses, just show first chunk
      if (data.length > 200) {
        console.log('Response (first 200 chars):', data.substring(0, 200));
        req.destroy();
      }
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ API endpoint is working');
      } else {
        console.log('❌ API returned error:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.setTimeout(5000, () => {
    console.log('⏱️  Request timed out after 5 seconds');
    req.destroy();
  });

  req.write(JSON.stringify(testData));
  req.end();
}

// Test if server is running
function testServerConnection() {
  console.log('Checking if server is running...');
  
  http.get('http://localhost:3000/', (res) => {
    if (res.statusCode === 200 || res.statusCode === 307) {
      console.log('✅ Server is running\n');
      testPMChatAPI();
    } else {
      console.log(`⚠️  Server returned status: ${res.statusCode}\n`);
      testPMChatAPI();
    }
  }).on('error', (err) => {
    console.log('❌ Server is not running:', err.message);
    console.log('Please run: npm run dev');
  });
}

testServerConnection();