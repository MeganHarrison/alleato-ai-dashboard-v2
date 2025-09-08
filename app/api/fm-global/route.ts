import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Add context about FM Global requirements
    const systemMessage = {
      role: 'system',
      content: `You are an expert assistant specialized in FM Global standards for sprinkler systems, particularly FM Global 8-34 for ASRS (Automated Storage and Retrieval Systems). 
      
      Provide detailed, accurate information about:
      - FM Global requirements and standards
      - ASRS sprinkler design specifications
      - Fire protection systems
      - Compliance requirements
      - Installation guidelines
      
      Always cite specific sections or figures from FM Global documentation when applicable.
      Be precise, technical, and helpful.`
    };

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: [systemMessage, ...messages],
      temperature: 0.3,
      maxTokens: 4000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('FM Global API error:', error);
    return new Response('Error processing FM Global request', { status: 500 });
  }
}