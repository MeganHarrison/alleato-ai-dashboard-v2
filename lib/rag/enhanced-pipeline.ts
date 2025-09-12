import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Configuration for document processing
export interface ChunkingConfig {
  maxChunkSize: number;
  overlapSize: number;
  semanticBoundaries: boolean;
  preserveContext: boolean;
}

export interface ProcessingConfig {
  chunking: ChunkingConfig;
  embedding: {
    model: string;
    batchSize: number;
  };
  metadata: {
    extractKeywords: boolean;
    generateSummary: boolean;
    detectEntities: boolean;
  };
}

// Default configuration
const DEFAULT_CONFIG: ProcessingConfig = {
  chunking: {
    maxChunkSize: 1500,
    overlapSize: 200,
    semanticBoundaries: true,
    preserveContext: true,
  },
  embedding: {
    model: 'text-embedding-3-large',
    batchSize: 100,
  },
  metadata: {
    extractKeywords: true,
    generateSummary: true,
    detectEntities: true,
  },
};

export class EnhancedRAGPipeline {
  private config: ProcessingConfig;
  private supabase: unknown;

  constructor(config: Partial<ProcessingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize() {
    this.supabase = await createClient();
  }

  // Process a document through the entire pipeline
  async processDocument(
    documentId: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; chunks: number; error?: string }> {
    try {
      // Step 1: Smart chunking
      const chunks = await this.smartChunking(content);
      
      // Step 2: Generate embeddings
      const embeddings = await this.generateEmbeddings(
        chunks.map(c => c.text)
      );
      
      // Step 3: Extract metadata for each chunk
      const enrichedChunks = await this.enrichChunksWithMetadata(
        chunks,
        embeddings,
        metadata
      );
      
      // Step 4: Store in database
      await this.storeChunks(documentId, enrichedChunks);
      
      // Step 5: Update document processing status
      await this.updateDocumentStatus(documentId, 'processed');
      
      return { success: true, chunks: enrichedChunks.length };
    } catch (error) {
      console.error('Document processing error:', error);
      await this.updateDocumentStatus(documentId, 'failed');
      return {
        success: false,
        chunks: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Smart chunking with semantic boundaries
  private async smartChunking(
    content: string
  ): Promise<Array<{ text: string; start: number; end: number }>> {
    const chunks: Array<{ text: string; start: number; end: number }> = [];
    
    if (!this.config.chunking.semanticBoundaries) {
      // Simple chunking by size
      return this.simpleChunking(content);
    }
    
    // Semantic chunking - split by paragraphs first
    const paragraphs = content.split(/\n\n+/);
    const currentChunk = '';
    const currentStart = 0;
    const currentEnd = 0;
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      
      if (!trimmedParagraph) continue;
      
      // Check if adding this paragraph would exceed max chunk size
      if (
        currentChunk.length + trimmedParagraph.length + 2 >
        this.config.chunking.maxChunkSize
      ) {
        // Save current chunk if it has content
        if (currentChunk) {
          chunks.push({
            text: currentChunk,
            start: currentStart,
            end: currentEnd,
          });
        }
        
        // Start new chunk with overlap
        if (this.config.chunking.preserveContext && currentChunk) {
          const overlapText = this.extractOverlap(currentChunk);
          currentChunk = overlapText + '\n\n' + trimmedParagraph;
          currentStart = currentEnd - overlapText.length;
        } else {
          currentChunk = trimmedParagraph;
          currentStart = content.indexOf(trimmedParagraph, currentEnd);
        }
      } else {
        // Add to current chunk
        currentChunk = currentChunk
          ? currentChunk + '\n\n' + trimmedParagraph
          : trimmedParagraph;
        
        if (currentStart === 0) {
          currentStart = content.indexOf(trimmedParagraph);
        }
      }
      
      currentEnd = currentStart + currentChunk.length;
    }
    
    // Add final chunk
    if (currentChunk) {
      chunks.push({
        text: currentChunk,
        start: currentStart,
        end: currentEnd,
      });
    }
    
    return chunks;
  }

  // Simple chunking by size
  private simpleChunking(
    content: string
  ): Array<{ text: string; start: number; end: number }> {
    const chunks: Array<{ text: string; start: number; end: number }> = [];
    const { maxChunkSize, overlapSize } = this.config.chunking;
    
    const start = 0;
    while (start < content.length) {
      const end = Math.min(start + maxChunkSize, content.length);
      const text = content.substring(start, end);
      
      chunks.push({ text, start, end });
      
      // Move to next chunk with overlap
      start = end - overlapSize;
    }
    
    return chunks;
  }

  // Extract overlap text from the end of a chunk
  private extractOverlap(text: string): string {
    const { overlapSize } = this.config.chunking;
    
    // Try to find a sentence boundary near the overlap size
    const targetStart = Math.max(0, text.length - overlapSize);
    const overlapSection = text.substring(targetStart);
    
    // Find the start of the last complete sentence
    const sentenceStart = overlapSection.search(/[.!?]\s+[A-Z]/);
    
    if (sentenceStart !== -1) {
      return overlapSection.substring(sentenceStart + 2);
    }
    
    return overlapSection;
  }

  // Generate embeddings for text chunks
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const { model, batchSize } = this.config.embedding;
    const embeddings: number[][] = [];
    
    // Process in batches
    for (const i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      try {
        const response = await openai.embeddings.create({
          model,
          input: batch,
        });
        
        embeddings.push(
          ...response.data.map(item => item.embedding)
        );
      } catch (error) {
        console.error('Embedding generation error:', error);
        throw error;
      }
    }
    
    return embeddings;
  }

  // Enrich chunks with metadata
  private async enrichChunksWithMetadata(
    chunks: Array<{ text: string; start: number; end: number }>,
    embeddings: number[][],
    documentMetadata: Record<string, any>
  ): Promise<any[]> {
    const enrichedChunks = [];
    
    for (const i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      
      const metadata: Record<string, any> = {
        ...documentMetadata,
        chunk_index: i,
        chunk_total: chunks.length,
        char_start: chunk.start,
        char_end: chunk.end,
        char_length: chunk.text.length,
      };
      
      // Extract keywords if enabled
      if (this.config.metadata.extractKeywords) {
        metadata.keywords = await this.extractKeywords(chunk.text);
      }
      
      // Generate summary if enabled
      if (this.config.metadata.generateSummary && chunk.text.length > 500) {
        metadata.summary = await this.generateSummary(chunk.text);
      }
      
      // Detect entities if enabled
      if (this.config.metadata.detectEntities) {
        metadata.entities = await this.detectEntities(chunk.text);
      }
      
      enrichedChunks.push({
        content: chunk.text,
        embedding,
        metadata,
      });
    }
    
    return enrichedChunks;
  }

  // Extract keywords from text
  private async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract 3-5 key terms from the text. Return only the terms, comma-separated.',
          },
          {
            role: 'user',
            content: text.substring(0, 1000),
          },
        ],
        temperature: 0.3,
        max_tokens: 50,
      });
      
      const keywords = response.choices[0].message.content
        ?.split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0) || [];
      
      return keywords;
    } catch (error) {
      console.error('Keyword extraction error:', error);
      return [];
    }
  }

  // Generate summary of text
  private async generateSummary(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Summarize the text in 1-2 sentences.',
          },
          {
            role: 'user',
            content: text.substring(0, 2000),
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      });
      
      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Summary generation error:', error);
      return '';
    }
  }

  // Detect entities in text
  private async detectEntities(text: string): Promise<Record<string, string[]>> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract entities from the text. Return JSON with:
{
  "people": [],
  "organizations": [],
  "locations": [],
  "dates": [],
  "projects": []
}`,
          },
          {
            role: 'user',
            content: text.substring(0, 1500),
          },
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });
      
      const content = response.choices[0].message.content;
      return content ? JSON.parse(content) : {};
    } catch (error) {
      console.error('Entity detection error:', error);
      return {};
    }
  }

  // Store chunks in database
  private async storeChunks(
    documentId: string,
    chunks: unknown[]
  ): Promise<void> {
    const { error } = await this.supabase
      .from('document_chunks')
      .insert(
        chunks.map((chunk, index) => ({
          document_id: documentId,
          content: chunk.content,
          embedding: chunk.embedding,
          metadata: chunk.metadata,
          chunk_index: index,
        }))
      );
    
    if (error) {
      console.error('Error storing chunks:', error);
      throw error;
    }
  }

  // Update document processing status
  private async updateDocumentStatus(
    documentId: string,
    status: 'processing' | 'processed' | 'failed'
  ): Promise<void> {
    const { error } = await this.supabase
      .from('documents')
      .update({
        processing_status: status,
        processed_at: status === 'processed' ? new Date().toISOString() : null,
      })
      .eq('id', documentId);
    
    if (error) {
      console.error('Error updating document status:', error);
    }
  }

  // Hybrid search combining vector similarity and keyword matching
  async hybridSearch(
    query: string,
    filters: Record<string, any> = {},
    limit: number = 10
  ): Promise<any[]> {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbeddings([query]);
      
      // Perform vector similarity search
      const { data: vectorResults, error: vectorError } = await this.supabase
        .rpc('match_documents_hybrid', {
          query_embedding: queryEmbedding[0],
          query_text: query,
          match_count: limit * 2, // Get more results for re-ranking
          filter: filters,
        });
      
      if (vectorError) {
        console.error('Vector search error:', vectorError);
        return [];
      }
      
      // Re-rank results using GPT-5
      const rerankedResults = await this.rerankResults(
        query,
        vectorResults || []
      );
      
      return rerankedResults.slice(0, limit);
    } catch (error) {
      console.error('Hybrid search error:', error);
      return [];
    }
  }

  // Re-rank search results using GPT-5
  private async rerankResults(
    query: string,
    results: unknown[]
  ): Promise<any[]> {
    if (results.length === 0) return [];
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Re-rank these search results by relevance to the query.
Return a JSON array of indices in order of relevance (most relevant first).`,
          },
          {
            role: 'user',
            content: `Query: ${query}

Results:
${results.map((r, i) => `[${i}] ${r.content.substring(0, 200)}`).join('\n\n')}`,
          },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      });
      
      const content = response.choices[0].message.content;
      if (content) {
        const indices = JSON.parse(content).indices || [];
        return indices.map((i: number) => results[i]).filter(Boolean);
      }
    } catch (error) {
      console.error('Re-ranking error:', error);
    }
    
    // Fall back to original order if re-ranking fails
    return results;
  }

  // Process meeting transcript
  async processMeetingTranscript(
    meetingId: string,
    transcript: string,
    metadata: Record<string, any> = {}
  ): Promise<{
    success: boolean;
    insights?: unknown;
    error?: string;
  }> {
    try {
      // Process transcript through RAG pipeline
      const processingResult = await this.processDocument(
        meetingId,
        transcript,
        {
          ...metadata,
          document_type: 'meeting_transcript',
        }
      );
      
      if (!processingResult.success) {
        return processingResult;
      }
      
      // Extract meeting-specific insights
      const insights = await this.extractMeetingInsights(transcript, metadata);
      
      // Store insights
      await this.storeMeetingInsights(meetingId, insights);
      
      return {
        success: true,
        insights,
      };
    } catch (error) {
      console.error('Meeting processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Extract insights from meeting transcript
  private async extractMeetingInsights(
    transcript: string,
    metadata: Record<string, any>
  ): Promise<any> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Extract structured insights from this meeting transcript.
Return JSON with:
{
  "decisions": [{ "decision": "", "owner": "", "deadline": "" }],
  "action_items": [{ "task": "", "assignee": "", "due_date": "", "priority": "" }],
  "risks": [{ "risk": "", "probability": "", "impact": "", "mitigation": "" }],
  "opportunities": [{ "opportunity": "", "potential_value": "", "next_steps": "" }],
  "key_discussions": [],
  "follow_ups": [],
  "summary": ""
}`,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : {};
  }

  // Store meeting insights
  private async storeMeetingInsights(
    meetingId: string,
    insights: unknown
  ): Promise<void> {
    const { error } = await this.supabase
      .from('meeting_insights')
      .upsert({
        meeting_id: meetingId,
        decisions: insights.decisions,
        action_items: insights.action_items,
        risks: insights.risks,
        opportunities: insights.opportunities,
        key_discussions: insights.key_discussions,
        follow_ups: insights.follow_ups,
        summary: insights.summary,
        generated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error storing meeting insights:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ragPipeline = new EnhancedRAGPipeline();