import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemMessage = {
      role: 'system',
      content: `You are an FM Global ASRS sprinkler design expert. Help users understand and apply FM Global 8-34 standards for Automated Storage and Retrieval Systems.
      
      Your knowledge includes:
      - Shuttle ASRS and Mini-Load ASRS configurations
      - Closed-top vs open-top container protection
      - In-rack sprinkler arrangements
      - Ceiling-only protection schemes
      - Wet and dry system requirements
      - Commodity classifications and protection levels
      
      Provide specific figure and table references from FM Global 8-34 when applicable.`
    };

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: [systemMessage, ...messages],
      temperature: 0.3,
      maxTokens: 4000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('FM Global Chat API error:', error);
    return new Response('Error processing FM Global chat request', { status: 500 });
  }
}