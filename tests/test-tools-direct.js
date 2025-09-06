/**
 * Direct test of AI SDK 5 tool calling
 * Testing the exact pattern from documentation
 */

import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

async function testTools() {
  console.log('Testing AI SDK 5 tools directly...\n');

  const weatherTool = tool({
    description: 'Get weather for a city',
    parameters: z.object({
      city: z.string().describe('City name'),
    }),
    execute: async ({ city }) => {
      console.log(`Tool called with city: ${city}`);
      return { temperature: 72, condition: 'Sunny' };
    },
  });

  try {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [{ role: 'user', content: 'What is the weather in San Francisco?' }],
      tools: { weather: weatherTool },
      maxSteps: 2,
    });

    console.log('Stream started successfully');
    
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }

    console.log('\n\nTest completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.responseBody) {
      console.error('Response body:', error.responseBody);
    }
  }
}

testTools().catch(console.error);