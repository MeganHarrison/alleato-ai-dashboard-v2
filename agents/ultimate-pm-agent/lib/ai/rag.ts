import { openai, gpt5Config } from './openai'
import { EmbeddingGenerator } from '@/lib/vectorization/embeddings'
import { VectorStorage } from '@/lib/vectorization/storage'

export interface SearchResult {
  content: string
  metadata: Record<string, any>
  similarity: number
  source: string
}

export interface RAGContext {
  query: string
  results: SearchResult[]
  totalTokens: number
  sources: string[]
}

export interface RAGOptions {
  projectId?: string
  searchType?: 'hybrid' | 'vector' | 'keyword'
  maxResults?: number
  maxTokens?: number
  minSimilarity?: number
  includeMetadata?: boolean
  rerank?: boolean
}

export class RAGSystem {
  private embedder: EmbeddingGenerator
  private storage: VectorStorage
  private contextWindowSize: number

  constructor(contextWindowSize = 8000) {
    this.embedder = new EmbeddingGenerator()
    this.storage = new VectorStorage()
    this.contextWindowSize = contextWindowSize
  }

  /**
   * Main RAG search function
   */
  async search(query: string, options: RAGOptions = {}): Promise<RAGContext> {
    const {
      projectId,
      searchType = 'hybrid',
      maxResults = 10,
      maxTokens = 4000,
      minSimilarity = 0.7,
      includeMetadata = true,
      rerank = true,
    } = options

    console.log(`🔍 RAG Search: "${query.substring(0, 50)}..."`)

    // Generate query embedding
    const queryEmbedding = await this.embedder.generateEmbedding(query)

    // Perform search based on type
    let results: SearchResult[] = []
    
    if (searchType === 'vector' || searchType === 'hybrid') {
      const vectorResults = await this.vectorSearch(
        queryEmbedding,
        projectId,
        maxResults * 2, // Get more for reranking
        minSimilarity
      )
      results.push(...vectorResults)
    }

    if (searchType === 'keyword' || searchType === 'hybrid') {
      const keywordResults = await this.keywordSearch(
        query,
        projectId,
        maxResults
      )
      results.push(...keywordResults)
    }

    // Deduplicate results
    results = this.deduplicateResults(results)

    // Rerank if enabled
    if (rerank && results.length > 0) {
      results = await this.rerankResults(query, results, maxResults)
    } else {
      results = results.slice(0, maxResults)
    }

    // Build context within token limit
    const context = this.buildContext(results, maxTokens, includeMetadata)

    return context
  }

  /**
   * Vector similarity search
   */
  private async vectorSearch(
    queryEmbedding: number[],
    projectId?: string,
    maxResults = 10,
    minSimilarity = 0.7
  ): Promise<SearchResult[]> {
    // Search documents
    const documents = await this.storage.searchDocuments(queryEmbedding, {
      matchThreshold: minSimilarity,
      matchCount: maxResults,
      projectId,
    })

    // Search meeting chunks
    const meetingChunks = await this.storage.searchMeetingChunks(queryEmbedding, {
      matchThreshold: minSimilarity,
      matchCount: Math.floor(maxResults / 2),
    })

    // Combine and format results
    const results: SearchResult[] = []

    documents.forEach(doc => {
      results.push({
        content: doc.content,
        metadata: {
          ...doc.metadata,
          ...doc.chunk_metadata,
          document_id: doc.id,
          type: 'document',
        },
        similarity: doc.metadata?.similarity || 0,
        source: doc.title,
      })
    })

    meetingChunks.forEach(chunk => {
      results.push({
        content: chunk.content,
        metadata: {
          ...chunk.metadata,
          chunk_id: chunk.id,
          meeting_id: chunk.meeting_id,
          type: 'meeting',
        },
        similarity: chunk.similarity || 0,
        source: `Meeting: ${chunk.meeting_id}`,
      })
    })

    return results.sort((a, b) => b.similarity - a.similarity)
  }

  /**
   * Keyword-based search
   */
  private async keywordSearch(
    query: string,
    projectId?: string,
    maxResults = 10
  ): Promise<SearchResult[]> {
    // Extract keywords from query
    const keywords = this.extractKeywords(query)
    
    // Search in database using text search
    const { data: documents, error } = await this.storage['supabase']
      .from('documents')
      .select('*')
      .textSearch('content', keywords.join(' | '))
      .limit(maxResults)

    if (error || !documents) {
      console.error('Keyword search error:', error)
      return []
    }

    // Filter by project if specified
    let filtered = documents
    if (projectId) {
      filtered = documents.filter(doc => doc.project_id === projectId)
    }

    return filtered.map(doc => ({
      content: doc.content,
      metadata: {
        ...doc.metadata,
        ...doc.chunk_metadata,
        document_id: doc.id,
        type: 'document',
      },
      similarity: 0.5, // Default similarity for keyword matches
      source: doc.title,
    }))
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was',
      'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall',
      'to', 'of', 'in', 'for', 'with', 'by', 'from', 'about', 'into',
      'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down',
      'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    ])

    const words = query.toLowerCase().split(/\s+/)
    const keywords = words.filter(word => 
      word.length > 2 && !stopWords.has(word)
    )

    return keywords
  }

  /**
   * Deduplicate search results
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>()
    const deduplicated: SearchResult[] = []

    for (const result of results) {
      // Create a hash of the content for deduplication
      const hash = this.hashContent(result.content)
      
      if (!seen.has(hash)) {
        seen.add(hash)
        deduplicated.push(result)
      } else {
        // If duplicate, keep the one with higher similarity
        const existing = deduplicated.find(r => this.hashContent(r.content) === hash)
        if (existing && result.similarity > existing.similarity) {
          const index = deduplicated.indexOf(existing)
          deduplicated[index] = result
        }
      }
    }

    return deduplicated
  }

  /**
   * Rerank results using GPT-5
   */
  private async rerankResults(
    query: string,
    results: SearchResult[],
    maxResults: number
  ): Promise<SearchResult[]> {
    if (results.length === 0) return []

    const prompt = `Given the following search query and results, rerank them by relevance.
Return only the indices of the top ${maxResults} most relevant results in order.

Query: "${query}"

Results:
${results.map((r, i) => `${i}. ${r.content.substring(0, 200)}...`).join('\n')}

Return a JSON array of indices (e.g., [2, 0, 4, 1, 3]):
`

    try {
      const response = await openai.chat.completions.create({
        ...gpt5Config,
        model: 'gpt-5-mini', // Use faster model for reranking
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        stream: false,
      })

      const content = response.choices[0]?.message?.content
      if (!content) return results.slice(0, maxResults)

      const parsed = JSON.parse(content)
      const indices = parsed.indices || parsed.ranking || []
      
      const reranked: SearchResult[] = []
      for (const index of indices) {
        if (index >= 0 && index < results.length) {
          reranked.push(results[index])
        }
      }

      return reranked.length > 0 ? reranked : results.slice(0, maxResults)
    } catch (error) {
      console.error('Reranking failed:', error)
      return results.slice(0, maxResults)
    }
  }

  /**
   * Build context from results within token limit
   */
  private buildContext(
    results: SearchResult[],
    maxTokens: number,
    includeMetadata: boolean
  ): RAGContext {
    const context: RAGContext = {
      query: '',
      results: [],
      totalTokens: 0,
      sources: [],
    }

    let currentTokens = 0
    const seenSources = new Set<string>()

    for (const result of results) {
      // Estimate tokens for this result
      const resultTokens = this.estimateTokens(result.content)
      
      if (currentTokens + resultTokens > maxTokens) {
        // Try to fit a truncated version
        const remainingTokens = maxTokens - currentTokens
        if (remainingTokens > 100) {
          const truncatedContent = this.truncateToTokens(result.content, remainingTokens)
          context.results.push({
            ...result,
            content: truncatedContent,
          })
          currentTokens += this.estimateTokens(truncatedContent)
        }
        break
      }

      context.results.push(result)
      currentTokens += resultTokens

      // Track unique sources
      if (!seenSources.has(result.source)) {
        seenSources.add(result.source)
        context.sources.push(result.source)
      }
    }

    context.totalTokens = currentTokens
    return context
  }

  /**
   * Create a hash of content for deduplication
   */
  private hashContent(content: string): string {
    // Simple hash function
    let hash = 0
    const str = content.substring(0, 100) // Use first 100 chars
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString()
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Truncate text to approximate token count
   */
  private truncateToTokens(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4
    if (text.length <= maxChars) {
      return text
    }

    // Try to truncate at sentence boundary
    const truncated = text.substring(0, maxChars)
    const lastPeriod = truncated.lastIndexOf('.')
    const lastQuestion = truncated.lastIndexOf('?')
    const lastExclamation = truncated.lastIndexOf('!')
    
    const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclamation)
    
    if (lastSentence > maxChars * 0.8) {
      return truncated.substring(0, lastSentence + 1)
    }
    
    return truncated + '...'
  }

  /**
   * Format context for LLM prompt
   */
  formatContextForPrompt(context: RAGContext): string {
    const sections = context.results.map((result, index) => {
      const header = `[Source ${index + 1}: ${result.source}]`
      const content = result.content
      return `${header}\n${content}`
    })

    return sections.join('\n\n---\n\n')
  }

  /**
   * Generate augmented prompt with context
   */
  generateAugmentedPrompt(query: string, context: RAGContext): string {
    const formattedContext = this.formatContextForPrompt(context)
    
    return `Based on the following context, please answer the question. If the answer cannot be found in the context, say so.

Context:
${formattedContext}

Question: ${query}

Answer:`
  }
}