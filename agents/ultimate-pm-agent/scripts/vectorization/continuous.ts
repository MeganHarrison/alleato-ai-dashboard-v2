#!/usr/bin/env tsx

import { DocumentProcessor } from '@/lib/vectorization/processor'
import { EmbeddingGenerator } from '@/lib/vectorization/embeddings'
import { VectorStorage } from '@/lib/vectorization/storage'
import { supabaseAdmin } from '@/lib/db/supabase'

interface ProcessingQueue {
  documentId: string
  action: 'insert' | 'update' | 'delete'
  metadata?: Record<string, any>
}

class ContinuousProcessor {
  private processor: DocumentProcessor
  private embedder: EmbeddingGenerator
  private storage: VectorStorage
  private supabase: ReturnType<typeof supabaseAdmin>
  private processingQueue: ProcessingQueue[] = []
  private isProcessing = false

  constructor() {
    this.processor = new DocumentProcessor(1000, 200)
    this.embedder = new EmbeddingGenerator()
    this.storage = new VectorStorage()
    this.supabase = supabaseAdmin()
  }

  /**
   * Start continuous processing
   */
  async start() {
    console.log('🔄 Starting continuous document processor...')
    
    // Subscribe to document changes
    this.subscribeToDocumentChanges()
    
    // Process queue periodically
    setInterval(() => this.processQueue(), 5000) // Every 5 seconds
    
    console.log('✅ Continuous processor is running')
    console.log('   Listening for document changes...')
  }

  /**
   * Subscribe to Supabase realtime changes
   */
  private subscribeToDocumentChanges() {
    // Subscribe to INSERT events
    this.supabase
      .channel('document-inserts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'documents',
          filter: 'embedding=is.null', // Only process documents without embeddings
        },
        (payload) => {
          console.log('📥 New document detected:', payload.new.id)
          this.addToQueue({
            documentId: payload.new.id,
            action: 'insert',
            metadata: payload.new,
          })
        }
      )
      .subscribe()

    // Subscribe to UPDATE events
    this.supabase
      .channel('document-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
        },
        (payload) => {
          // Check if content changed
          if (payload.old.content !== payload.new.content) {
            console.log('📝 Document updated:', payload.new.id)
            this.addToQueue({
              documentId: payload.new.id,
              action: 'update',
              metadata: payload.new,
            })
          }
        }
      )
      .subscribe()

    // Subscribe to meeting chunks
    this.supabase
      .channel('meeting-chunks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_chunks',
          filter: 'embedding=is.null',
        },
        (payload) => {
          console.log('🎙️ New meeting chunk detected:', payload.new.id)
          this.processMeetingChunk(payload.new)
        }
      )
      .subscribe()
  }

  /**
   * Add document to processing queue
   */
  private addToQueue(item: ProcessingQueue) {
    // Avoid duplicates
    const exists = this.processingQueue.some(
      q => q.documentId === item.documentId && q.action === item.action
    )
    
    if (!exists) {
      this.processingQueue.push(item)
      console.log(`📋 Added to queue: ${item.documentId} (${item.action})`)
    }
  }

  /**
   * Process queued documents
   */
  private async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return
    }

    this.isProcessing = true
    
    try {
      // Process up to 5 items at once
      const batch = this.processingQueue.splice(0, 5)
      console.log(`⚙️  Processing ${batch.length} queued items...`)
      
      await Promise.all(
        batch.map(item => this.processDocument(item))
      )
      
      console.log(`✅ Processed ${batch.length} items`)
    } catch (error) {
      console.error('❌ Queue processing error:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single document
   */
  private async processDocument(item: ProcessingQueue) {
    try {
      if (item.action === 'delete') {
        // Handle deletion
        await this.storage.deleteDocument(item.documentId)
        console.log(`🗑️  Deleted document: ${item.documentId}`)
        return
      }

      // Get document from database
      const document = await this.storage.getDocument(item.documentId)
      if (!document || !document.content) {
        console.error(`❌ Document not found or empty: ${item.documentId}`)
        return
      }

      console.log(`📄 Processing document: ${document.title}`)

      // Chunk the document
      const fileType = this.processor.detectFileType(document.title, document.content)
      const chunks = await this.processor.chunkDocument(document.content, fileType)
      
      // Generate embeddings
      const embeddedChunks = await this.embedder.generateEmbeddings(chunks)
      
      // For update action, delete old chunks first
      if (item.action === 'update') {
        await this.storage.deleteDocument(item.documentId)
      }

      // Store new chunks
      const result = await this.storage.storeDocumentChunks(embeddedChunks, {
        title: document.title,
        source: document.metadata?.source || 'continuous',
        project_id: document.project_id,
        file_type: fileType,
        processed_at: new Date().toISOString(),
        ...document.metadata,
      })

      if (result.success) {
        console.log(`✅ Processed document: ${document.title} (${result.stored} chunks)`)
      } else {
        console.error(`❌ Failed to process document: ${document.title}`, result.errors)
      }

    } catch (error) {
      console.error(`❌ Error processing document ${item.documentId}:`, error)
    }
  }

  /**
   * Process a meeting chunk
   */
  private async processMeetingChunk(chunk: any) {
    try {
      console.log(`🎙️ Processing meeting chunk: ${chunk.id}`)
      
      if (!chunk.content) {
        console.error(`❌ Meeting chunk empty: ${chunk.id}`)
        return
      }

      // Generate embedding
      const embedding = await this.embedder.generateEmbedding(chunk.content)
      
      // Update the chunk with embedding
      const { error } = await this.supabase
        .from('meeting_chunks')
        .update({ embedding })
        .eq('id', chunk.id)

      if (error) {
        console.error(`❌ Failed to update meeting chunk: ${chunk.id}`, error)
      } else {
        console.log(`✅ Processed meeting chunk: ${chunk.id}`)
      }

    } catch (error) {
      console.error(`❌ Error processing meeting chunk ${chunk.id}:`, error)
    }
  }

  /**
   * Stop continuous processing
   */
  stop() {
    console.log('🛑 Stopping continuous processor...')
    this.supabase.removeAllChannels()
    this.processingQueue = []
    console.log('✅ Continuous processor stopped')
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      queue: this.processingQueue,
    }
  }
}

// CLI Interface
async function main() {
  const processor = new ContinuousProcessor()
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n⚠️  Received SIGINT, shutting down gracefully...')
    processor.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n⚠️  Received SIGTERM, shutting down gracefully...')
    processor.stop()
    process.exit(0)
  })

  // Start processing
  await processor.start()
  
  // Keep the process alive
  console.log('Press Ctrl+C to stop')
  
  // Status reporting every 30 seconds
  setInterval(() => {
    const status = processor.getStatus()
    console.log(`📊 Status - Queue: ${status.queueLength}, Processing: ${status.isProcessing}`)
  }, 30000)
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { ContinuousProcessor }