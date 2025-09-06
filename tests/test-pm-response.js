#!/usr/bin/env node

async function testPMResponse() {
  const response = await fetch('http://localhost:3001/pm-assistant/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'what was discussed in the last meeting?', id: 'msg-test' }
      ],
      chatId: 'test-chat'
    })
  });

  if (!response.ok) {
    console.error('HTTP Error:', response.status);
    return;
  }

  const reader = response.body.getReader();
  let fullResponse = '';
  let allChunks = [];
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          console.log('Stream chunk:', line);
          allChunks.push(line);
          
          if (line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text-delta') {
                fullResponse += data.delta;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    }
    
    console.log('\n=== ANALYSIS ===');
    console.log('Total chunks received:', allChunks.length);
    console.log('Full AI Response length:', fullResponse.length);
    console.log('Full AI Response:');
    console.log('================');
    console.log(fullResponse || '(empty)');
    
  } finally {
    reader.releaseLock();
  }
}

testPMResponse().catch(console.error);