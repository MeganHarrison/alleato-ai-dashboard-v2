import { Agent, tool } from '@openai/agents';
import { openai } from '@ai-sdk/openai';
import { aisdk } from '@openai/agents-extensions';
import { z } from 'zod';

// Simple tools for the agent
const getWeatherTool = tool({
  name: 'get_weather',
  description: 'Get the weather for a given city',
  parameters: z.object({ 
    city: z.string().describe('The city to get weather for') 
  }),
  execute: async (input) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return `The weather in ${input.city} is partly cloudy with temperature around 72°F`;
  },
});

const getCurrentTimeTool = tool({
  name: 'get_current_time',
  description: 'Get the current date and time',
  parameters: z.object({}),
  execute: async () => {
    return new Date().toLocaleString();
  },
});

// Main agent with tools
export const agent = new Agent({
  name: 'Helpful Assistant',
  instructions: `You are a helpful AI assistant. You can:
  - Answer general questions
  - Get weather information for cities
  - Tell the current time
  - Have friendly conversations
  
  Be concise but helpful in your responses.`,
  tools: [getWeatherTool, getCurrentTimeTool],
  model: aisdk(openai('gpt-4o-mini')), // Using a cost-effective model
});