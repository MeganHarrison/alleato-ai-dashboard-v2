import { openai, modelConfigs } from '@/lib/ai/openai'
import { DocumentChunk } from './processor'

export interface EmbeddedChunk extends DocumentChunk {
  embedding: number[]
}

export class EmbeddingGenerator {
  private readonly model: string
  private readonly dimensions: number
  private readonly batchSize: number

  constructor(
    model = modelConfigs.embedding.model,
    dimensions = modelConfigs.embedding.dimensions,
    batchSize = 20
  ) {
    this.model = model
    this.dimensions = dimensions
    this.batchSize = batchSize
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimensions,
      })
      
      return response.data[0].embedding
    } catch (error) {
      console.error('Failed to generate embedding:', error)
      throw new Error(`Embedding generation failed: ${error}`)
    }
  }

  /**
   * Generate embeddings for multiple chunks in batches
   */
  async generateEmbeddings(
    chunks: DocumentChunk[],
    onProgress?: (current: number, total: number) => void
  ): Promise<EmbeddedChunk[]> {
    const embeddedChunks: EmbeddedChunk[] = []
    
    // Process in batches
    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const batch = chunks.slice(i, Math.min(i + this.batchSize, chunks.length))
      const batchTexts = batch.map(chunk => chunk.content)
      
      try {
        const response = await openai.embeddings.create({
          model: this.model,
          input: batchTexts,
          dimensions: this.dimensions,
        })
        
        // Combine chunks with embeddings
        batch.forEach((chunk, index) => {
          embeddedChunks.push({
            ...chunk,
            embedding: response.data[index].embedding,
          })
        })
        
        // Report progress
        if (onProgress) {
          onProgress(Math.min(i + this.batchSize, chunks.length), chunks.length)
        }
        
        // Rate limiting - wait between batches
        if (i + this.batchSize < chunks.length) {
          await this.delay(100) // 100ms delay between batches
        }
      } catch (error) {
        console.error(`Failed to process batch ${i / this.batchSize + 1}:`, error)
        
        // Try individual processing for failed batch
        for (const chunk of batch) {
          try {
            const embedding = await this.generateEmbedding(chunk.content)
            embeddedChunks.push({
              ...chunk,
              embedding,
            })
          } catch (individualError) {
            console.error('Failed to process individual chunk:', individualError)
            // Skip this chunk
          }
        }
      }
    }
    
    return embeddedChunks
  }

  /**
   * Validate embedding dimensions
   */
  validateEmbedding(embedding: number[]): boolean {
    if (!embedding || !Array.isArray(embedding)) {
      return false
    }
    
    if (embedding.length !== this.dimensions) {
      console.warn(`Embedding dimension mismatch: expected ${this.dimensions}, got ${embedding.length}`)
      return false
    }
    
    // Check if all values are numbers
    return embedding.every(val => typeof val === 'number' && !isNaN(val))
  }

  /**
   * Calculate similarity between two embeddings (cosine similarity)
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions')
    }
    
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }
    
    norm1 = Math.sqrt(norm1)
    norm2 = Math.sqrt(norm2)
    
    if (norm1 === 0 || norm2 === 0) {
      return 0
    }
    
    return dotProduct / (norm1 * norm2)
  }

  /**
   * Create a cache key for embedding
   */
  createCacheKey(text: string): string {
    // Simple hash function for cache key
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `embed_${this.model}_${hash}_${text.length}`
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get embedding statistics
   */
  getEmbeddingStats(embeddings: number[][]): {
    avgMagnitude: number
    minMagnitude: number
    maxMagnitude: number
    avgSimilarity: number
  } {
    const magnitudes = embeddings.map(emb => 
      Math.sqrt(emb.reduce((sum, val) => sum + val * val, 0))
    )
    
    let totalSimilarity = 0
    let comparisons = 0
    
    // Sample similarity calculations (not all pairs for performance)
    const sampleSize = Math.min(10, embeddings.length)
    for (let i = 0; i < sampleSize; i++) {
      for (let j = i + 1; j < sampleSize; j++) {
        totalSimilarity += this.calculateSimilarity(embeddings[i], embeddings[j])
        comparisons++
      }
    }
    
    return {
      avgMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
      minMagnitude: Math.min(...magnitudes),
      maxMagnitude: Math.max(...magnitudes),
      avgSimilarity: comparisons > 0 ? totalSimilarity / comparisons : 0,
    }
  }
}