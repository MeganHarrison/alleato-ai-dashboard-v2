import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response('Content-Type must be application/json', { status: 400 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response('Invalid JSON in request body', { status: 400 });
    }

    const { messages } = body;

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Messages array is required and cannot be empty', { status: 400 });
    }

    // Validate message format
    for (const message of messages) {
      if (!message.role || !message.content) {
        return new Response('Each message must have role and content properties', { status: 400 });
      }
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        return new Response('Message role must be user, assistant, or system', { status: 400 });
      }
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Call OpenAI API with gpt-3.5-turbo (more widely available)
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Handle OpenAI specific errors
    if (error instanceof Error && 'status' in error) {
      const openaiError = error as any;
      if (openaiError.status === 401) {
        return new Response('Invalid OpenAI API key', { status: 401 });
      }
      if (openaiError.status === 403) {
        return new Response('OpenAI API access denied - check model permissions', { status: 403 });
      }
      if (openaiError.status === 429) {
        return new Response('OpenAI API rate limit exceeded', { status: 429 });
      }
    }
    
    return new Response('Internal Server Error', { status: 500 });
  }
}