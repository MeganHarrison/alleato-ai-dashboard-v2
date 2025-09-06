import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// GPT-5 Configuration
export const gpt5Config = {
  model: 'gpt-5-nano' as const,     // Cost-efficient default
  verbosity: 'medium' as const,      // Adjustable per context
  reasoning_effort: 'standard' as const,
  stream: true,
  temperature: 0.7,
  max_tokens: 4000,
}

// Model configurations for different use cases
export const modelConfigs = {
  // For complex reasoning and analysis
  reasoning: {
    ...gpt5Config,
    model: 'gpt-5' as const,
    reasoning_effort: 'high' as const,
    verbosity: 'verbose' as const,
  },
  
  // For quick responses and utilities
  utility: {
    ...gpt5Config,
    model: 'gpt-5-mini' as const,
    reasoning_effort: 'low' as const,
    verbosity: 'concise' as const,
  },
  
  // For embeddings
  embedding: {
    model: 'text-embedding-3-small' as const,
    dimensions: 1536,
  }
}

// Helper to create streaming responses
export async function createStreamingResponse(
  prompt: string,
  config = gpt5Config
) {
  const response = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    ...config,
  })
  
  const stream = OpenAIStream(response as any)
  return new StreamingTextResponse(stream)
}