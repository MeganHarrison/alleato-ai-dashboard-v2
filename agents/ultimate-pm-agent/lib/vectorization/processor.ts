import { openai } from '@/lib/ai/openai'

export interface DocumentChunk {
  content: string
  metadata: {
    startIndex: number
    endIndex: number
    type: 'paragraph' | 'heading' | 'list' | 'code' | 'text'
    tokens?: number
  }
}

export class DocumentProcessor {
  private readonly chunkSize: number
  private readonly chunkOverlap: number

  constructor(chunkSize = 1000, chunkOverlap = 200) {
    this.chunkSize = chunkSize
    this.chunkOverlap = chunkOverlap
  }

  /**
   * Process and clean document content
   */
  preprocessDocument(content: string): string {
    // Remove excessive whitespace
    let cleaned = content.replace(/\s+/g, ' ').trim()
    
    // Remove common non-content patterns
    cleaned = cleaned.replace(/^[-=_*]{3,}$/gm, '') // Horizontal rules
    cleaned = cleaned.replace(/^\s*Page \d+\s*$/gm, '') // Page numbers
    
    // Normalize quotes and special characters
    cleaned = cleaned.replace(/[""]/g, '"')
    cleaned = cleaned.replace(/['']/g, "'")
    
    return cleaned
  }

  /**
   * Detect file type from extension or content
   */
  detectFileType(filename: string, content: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    
    if (ext) {
      const typeMap: Record<string, string> = {
        'md': 'markdown',
        'txt': 'text',
        'pdf': 'pdf',
        'doc': 'document',
        'docx': 'document',
        'json': 'json',
        'ts': 'code',
        'tsx': 'code',
        'js': 'code',
        'jsx': 'code',
      }
      return typeMap[ext] || 'text'
    }
    
    // Fallback to content detection
    if (content.includes('```') || content.includes('# ')) {
      return 'markdown'
    }
    
    return 'text'
  }

  /**
   * Chunk document using adaptive strategy
   */
  async chunkDocument(
    content: string,
    fileType: string = 'text'
  ): Promise<DocumentChunk[]> {
    const preprocessed = this.preprocessDocument(content)
    
    // Try semantic chunking first for appropriate content
    if (fileType === 'markdown' || fileType === 'document') {
      try {
        return await this.semanticChunk(preprocessed)
      } catch (error) {
        console.warn('Semantic chunking failed, falling back to simple chunking:', error)
      }
    }
    
    // Fallback to simple chunking
    return this.simpleChunk(preprocessed)
  }

  /**
   * Semantic chunking using natural boundaries
   */
  private async semanticChunk(content: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = []
    
    // Split by paragraphs first
    const paragraphs = content.split(/\n\n+/)
    
    let currentChunk = ''
    let currentStart = 0
    
    for (const paragraph of paragraphs) {
      // Check if adding this paragraph would exceed chunk size
      if (currentChunk.length + paragraph.length > this.chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            startIndex: currentStart,
            endIndex: currentStart + currentChunk.length,
            type: 'paragraph',
            tokens: this.estimateTokens(currentChunk),
          }
        })
        
        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, this.chunkOverlap)
        currentChunk = overlapText + ' ' + paragraph
        currentStart = currentStart + currentChunk.length - overlapText.length
      } else {
        // Add to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph
      }
    }
    
    // Add final chunk
    if (currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          startIndex: currentStart,
          endIndex: currentStart + currentChunk.length,
          type: 'paragraph',
          tokens: this.estimateTokens(currentChunk),
        }
      })
    }
    
    return chunks
  }

  /**
   * Simple chunking with character limit and overlap
   */
  private simpleChunk(content: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    const sentences = this.splitIntoSentences(content)
    
    let currentChunk = ''
    let currentStart = 0
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            startIndex: currentStart,
            endIndex: currentStart + currentChunk.length,
            type: 'text',
            tokens: this.estimateTokens(currentChunk),
          }
        })
        
        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, this.chunkOverlap)
        currentChunk = overlapText + ' ' + sentence
        currentStart = currentStart + currentChunk.length - overlapText.length
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence
      }
    }
    
    // Add final chunk
    if (currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          startIndex: currentStart,
          endIndex: currentStart + currentChunk.length,
          type: 'text',
          tokens: this.estimateTokens(currentChunk),
        }
      })
    }
    
    return chunks
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting (can be improved with NLP libraries)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    return sentences.map(s => s.trim())
  }

  /**
   * Get overlap text from the end of a chunk
   */
  private getOverlapText(chunk: string, overlapSize: number): string {
    if (chunk.length <= overlapSize) {
      return chunk
    }
    
    // Try to find a sentence boundary
    const overlapStart = chunk.length - overlapSize
    const overlapText = chunk.substring(overlapStart)
    
    // Find the start of the last complete sentence in overlap
    const sentenceStart = overlapText.search(/[.!?]\s+/)
    if (sentenceStart !== -1) {
      return overlapText.substring(sentenceStart + 1).trim()
    }
    
    return overlapText
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Validate document for processing
   */
  validateDocument(content: string, filename: string): { valid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, error: 'Document is empty' }
    }
    
    if (content.length > 1000000) { // 1MB limit
      return { valid: false, error: 'Document is too large (max 1MB)' }
    }
    
    const fileType = this.detectFileType(filename, content)
    const supportedTypes = ['text', 'markdown', 'document', 'code', 'json', 'pdf']
    
    if (!supportedTypes.includes(fileType)) {
      return { valid: false, error: `Unsupported file type: ${fileType}` }
    }
    
    return { valid: true }
  }
}