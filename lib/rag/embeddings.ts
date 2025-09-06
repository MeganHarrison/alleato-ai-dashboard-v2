// Embedding utilities for RAG system

import { EmbeddingConfig } from './types';

export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batch_size: 100,
};

/**
 * Generate embeddings for a single text
 */
export async function generateEmbedding(
  text: string,
  config: EmbeddingConfig = DEFAULT_EMBEDDING_CONFIG
): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: text,
        dimensions: config.dimensions,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batches
 */
export async function generateEmbeddings(
  texts: string[],
  config: EmbeddingConfig = DEFAULT_EMBEDDING_CONFIG
): Promise<number[][]> {
  const embeddings: number[][] = [];
  const { batch_size } = config;

  // Process in batches to avoid API limits
  for (let i = 0; i < texts.length; i += batch_size) {
    const batch = texts.slice(i, i + batch_size);
    
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: config.model,
          input: batch,
          dimensions: config.dimensions,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const batchEmbeddings = data.data.map((item: any) => item.embedding);
      embeddings.push(...batchEmbeddings);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batch_size < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error generating embeddings for batch ${i}:`, error);
      throw error;
    }
  }

  return embeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Find the most similar chunks to a query embedding
 */
export function findSimilarChunks(
  queryEmbedding: number[],
  chunkEmbeddings: Array<{ id: string; embedding: number[]; content: string }>,
  topK: number = 10,
  threshold: number = 0.7
): Array<{ id: string; content: string; score: number }> {
  const similarities = chunkEmbeddings.map(chunk => ({
    id: chunk.id,
    content: chunk.content,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by similarity score (descending) and filter by threshold
  return similarities
    .filter(item => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Prepare text for embedding (cleaning and truncation)
 */
export function prepareTextForEmbedding(text: string, maxTokens: number = 8000): string {
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Remove special characters that don't add meaning
  cleaned = cleaned.replace(/[^\w\s.,!?;:'"()-]/g, '');
  
  // Truncate if too long (rough approximation of tokens)
  const estimatedTokens = cleaned.length / 4;
  if (estimatedTokens > maxTokens) {
    const maxChars = maxTokens * 4;
    cleaned = cleaned.substring(0, maxChars);
    
    // Try to cut at a sentence boundary
    const lastPeriod = cleaned.lastIndexOf('.');
    if (lastPeriod > maxChars * 0.8) {
      cleaned = cleaned.substring(0, lastPeriod + 1);
    }
  }
  
  return cleaned;
}

/**
 * Batch process documents for embedding
 */
export async function processDocumentForEmbeddings(
  chunks: Array<{ id: string; content: string }>,
  config: EmbeddingConfig = DEFAULT_EMBEDDING_CONFIG,
  onProgress?: (processed: number, total: number) => void
): Promise<Array<{ id: string; content: string; embedding: number[] }>> {
  const results: Array<{ id: string; content: string; embedding: number[] }> = [];
  const preparedTexts = chunks.map(chunk => prepareTextForEmbedding(chunk.content));
  
  // Generate embeddings in batches
  for (let i = 0; i < chunks.length; i += config.batch_size) {
    const batchChunks = chunks.slice(i, i + config.batch_size);
    const batchTexts = preparedTexts.slice(i, i + config.batch_size);
    
    try {
      const embeddings = await generateEmbeddings(batchTexts, config);
      
      for (let j = 0; j < batchChunks.length; j++) {
        results.push({
          id: batchChunks[j].id,
          content: batchChunks[j].content,
          embedding: embeddings[j],
        });
      }
      
      if (onProgress) {
        onProgress(Math.min(i + config.batch_size, chunks.length), chunks.length);
      }
    } catch (error) {
      console.error(`Error processing batch starting at index ${i}:`, error);
      throw error;
    }
  }
  
  return results;
}