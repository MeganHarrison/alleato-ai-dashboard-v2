#!/usr/bin/env tsx

import fs from 'fs/promises'
import path from 'path'
import { DocumentProcessor } from '@/lib/vectorization/processor'
import { EmbeddingGenerator } from '@/lib/vectorization/embeddings'
import { VectorStorage } from '@/lib/vectorization/storage'

interface IngestionOptions {
  directory: string
  projectId?: string
  recursive?: boolean
  extensions?: string[]
  batchSize?: number
}

class DocumentIngestion {
  private processor: DocumentProcessor
  private embedder: EmbeddingGenerator
  private storage: VectorStorage
  private stats = {
    totalFiles: 0,
    processedFiles: 0,
    failedFiles: 0,
    totalChunks: 0,
    totalTokens: 0,
  }

  constructor() {
    this.processor = new DocumentProcessor(1000, 200) // 1000 char chunks, 200 char overlap
    this.embedder = new EmbeddingGenerator()
    this.storage = new VectorStorage()
  }

  /**
   * Main ingestion pipeline
   */
  async ingest(options: IngestionOptions) {
    console.log('🚀 Starting document ingestion...')
    console.log(`📁 Directory: ${options.directory}`)
    console.log(`🏷️  Project ID: ${options.projectId || 'None'}`)
    
    // Get all files to process
    const files = await this.getFiles(
      options.directory,
      options.recursive || true,
      options.extensions || ['.txt', '.md', '.pdf', '.doc', '.docx']
    )
    
    this.stats.totalFiles = files.length
    console.log(`📄 Found ${files.length} files to process`)
    
    // Process files in batches
    const batchSize = options.batchSize || 5
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, Math.min(i + batchSize, files.length))
      await Promise.all(batch.map(file => this.processFile(file, options.projectId)))
      
      console.log(`✅ Processed ${Math.min(i + batchSize, files.length)}/${files.length} files`)
    }
    
    // Print final statistics
    this.printStats()
  }

  /**
   * Process a single file
   */
  private async processFile(filePath: string, projectId?: string) {
    try {
      console.log(`\n📄 Processing: ${path.basename(filePath)}`)
      
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8')
      const filename = path.basename(filePath)
      
      // Validate document
      const validation = this.processor.validateDocument(content, filename)
      if (!validation.valid) {
        console.error(`  ❌ Validation failed: ${validation.error}`)
        this.stats.failedFiles++
        return
      }
      
      // Detect file type and chunk document
      const fileType = this.processor.detectFileType(filename, content)
      console.log(`  📋 File type: ${fileType}`)
      
      const chunks = await this.processor.chunkDocument(content, fileType)
      console.log(`  ✂️  Created ${chunks.length} chunks`)
      
      // Generate embeddings
      console.log(`  🧮 Generating embeddings...`)
      const embeddedChunks = await this.embedder.generateEmbeddings(
        chunks,
        (current, total) => {
          process.stdout.write(`\r  🧮 Generating embeddings... ${current}/${total}`)
        }
      )
      console.log('') // New line after progress
      
      // Store in database
      console.log(`  💾 Storing in database...`)
      const result = await this.storage.storeDocumentChunks(embeddedChunks, {
        title: filename,
        source: filePath,
        project_id: projectId,
        file_type: fileType,
        ingested_at: new Date().toISOString(),
      })
      
      if (result.success) {
        console.log(`  ✅ Stored ${result.stored} chunks successfully`)
        this.stats.processedFiles++
        this.stats.totalChunks += result.stored
        this.stats.totalTokens += chunks.reduce((sum, chunk) => 
          sum + (chunk.metadata.tokens || 0), 0
        )
      } else {
        console.error(`  ❌ Storage errors:`, result.errors)
        this.stats.failedFiles++
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing ${filePath}:`, error)
      this.stats.failedFiles++
    }
  }

  /**
   * Get all files in directory
   */
  private async getFiles(
    directory: string,
    recursive: boolean,
    extensions: string[]
  ): Promise<string[]> {
    const files: string[] = []
    
    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory() && recursive) {
          await walk(fullPath)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (extensions.includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    }
    
    await walk(directory)
    return files
  }

  /**
   * Print ingestion statistics
   */
  private printStats() {
    console.log('\n' + '='.repeat(50))
    console.log('📊 Ingestion Statistics:')
    console.log('='.repeat(50))
    console.log(`Total files:      ${this.stats.totalFiles}`)
    console.log(`Processed:        ${this.stats.processedFiles}`)
    console.log(`Failed:           ${this.stats.failedFiles}`)
    console.log(`Total chunks:     ${this.stats.totalChunks}`)
    console.log(`Estimated tokens: ${this.stats.totalTokens}`)
    console.log('='.repeat(50))
    
    if (this.stats.failedFiles === 0) {
      console.log('✅ All files processed successfully!')
    } else {
      console.log(`⚠️  ${this.stats.failedFiles} files failed to process`)
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: tsx scripts/vectorization/initial.ts <directory> [options]

Options:
  --project-id <id>    Associate documents with a project
  --recursive          Process subdirectories (default: true)
  --extensions <list>  Comma-separated list of extensions (default: .txt,.md,.pdf,.doc,.docx)
  --batch-size <n>     Number of files to process in parallel (default: 5)
  --help               Show this help message

Examples:
  tsx scripts/vectorization/initial.ts ./documents
  tsx scripts/vectorization/initial.ts ./documents --project-id abc123
  tsx scripts/vectorization/initial.ts ./documents --extensions .txt,.md --batch-size 10
    `)
    process.exit(0)
  }
  
  const directory = args[0]
  const options: IngestionOptions = {
    directory,
    recursive: true,
    extensions: ['.txt', '.md', '.pdf', '.doc', '.docx'],
    batchSize: 5,
  }
  
  // Parse additional options
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--project-id':
        options.projectId = args[++i]
        break
      case '--recursive':
        options.recursive = args[++i] !== 'false'
        break
      case '--extensions':
        options.extensions = args[++i].split(',')
        break
      case '--batch-size':
        options.batchSize = parseInt(args[++i], 10)
        break
    }
  }
  
  // Validate directory exists
  try {
    await fs.access(directory)
  } catch {
    console.error(`❌ Directory not found: ${directory}`)
    process.exit(1)
  }
  
  // Run ingestion
  const ingestion = new DocumentIngestion()
  await ingestion.ingest(options)
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { DocumentIngestion }