import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const systemMessage = {
      role: 'system',
      content: `You are an FM Global ASRS expert with access to the complete FM Global 8-34 documentation database.
      
      ${context ? `Context from RAG system:\n${context}\n\n` : ''}
      
      Provide accurate, detailed answers based on FM Global standards. Always cite specific figures, tables, and section numbers.
      Focus on practical implementation guidance for ASRS sprinkler design.`
    };

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: [systemMessage, ...messages],
      temperature: 0.2,
      maxTokens: 4000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('FM Global Python RAG API error:', error);
    return new Response('Error processing FM Global RAG request', { status: 500 });
  }
}