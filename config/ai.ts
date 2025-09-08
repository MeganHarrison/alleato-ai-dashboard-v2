/**
 * AI Configuration
 * Centralized AI/ML settings and API configurations
 */

export const AI_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    defaultModel: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-ada-002',
    maxTokens: 4000,
    temperature: 0.7,
  },
  
  rag: {
    chunkSize: 1000,
    chunkOverlap: 200,
    maxResults: 10,
    similarityThreshold: 0.7,
    vectorDimensions: 1536,
  },
  
  processing: {
    batchSize: 50,
    maxRetries: 3,
    timeoutMs: 30000,
  },
  
  features: {
    streamingEnabled: true,
    cacheEnabled: true,
    enableLogging: process.env.NODE_ENV === 'development',
  }
} as const;

export const PROMPT_TEMPLATES = {
  DOCUMENT_SUMMARY: `Summarize the following document in a clear, concise manner. Focus on key insights and actionable information:

{content}

Summary:`,
  
  MEETING_INSIGHTS: `Analyze the following meeting transcript and extract key insights, action items, and decisions:

{transcript}

Insights:`,
  
  CHAT_CONTEXT: `You are an AI assistant for the Alleato dashboard. Use the following context to answer questions accurately:

Context: {context}

Question: {question}

Answer:`,
} as const;

export type AIModels = typeof AI_CONFIG.openai.defaultModel;
export type PromptTemplateKeys = keyof typeof PROMPT_TEMPLATES;
