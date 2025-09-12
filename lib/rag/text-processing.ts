// Text Processing Utilities for RAG System

import { ChunkingConfig } from './types';

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  chunk_size: 1000,
  chunk_overlap: 200,
  separator: '\n\n',
  keep_separator: false,
};

/**
 * Split text into chunks with overlap
 */
export function chunkText(
  text: string,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): string[] {
  const { chunk_size, chunk_overlap, separator, keep_separator } = config;
  
  // Clean the text
  const cleanedText = text.trim().replace(/\r\n/g, '\n');
  
  // Split by separator if provided
  let sections: string[] = [];
  if (separator) {
    sections = cleanedText.split(separator);
    if (keep_separator && separator !== '\n') {
      sections = sections.map((s, i) => 
        i < sections.length - 1 ? s + separator : s
      );
    }
  } else {
    sections = [cleanedText];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const section of sections) {
    // If section is empty, skip
    if (!section.trim()) continue;
    
    // If adding this section would exceed chunk size
    if (currentChunk && (currentChunk.length + section.length + 1) > chunk_size) {
      // Save current chunk
      chunks.push(currentChunk.trim());
      
      // Start new chunk with overlap from previous chunk
      if (chunk_overlap > 0 && currentChunk.length > chunk_overlap) {
        const overlapText = currentChunk.slice(-chunk_overlap);
        currentChunk = overlapText + (separator || ' ') + section;
      } else {
        currentChunk = section;
      }
    } else {
      // Add section to current chunk
      currentChunk = currentChunk 
        ? currentChunk + (separator || ' ') + section 
        : section;
    }
    
    // If current chunk exceeds size, split it further
    while (currentChunk.length > chunk_size) {
      const splitPoint = findSplitPoint(currentChunk, chunk_size);
      chunks.push(currentChunk.slice(0, splitPoint).trim());
      
      // Create overlap for next chunk
      const overlapStart = Math.max(0, splitPoint - chunk_overlap);
      currentChunk = currentChunk.slice(overlapStart);
    }
  }
  
  // Add remaining chunk if any
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Find optimal split point in text (prefer sentence boundaries)
 */
function findSplitPoint(text: string, maxLength: number): number {
  if (text.length <= maxLength) return text.length;
  
  // Try to split at sentence boundary
  const sentenceEnders = ['. ', '! ', '? ', '\n'];
  for (const ender of sentenceEnders) {
    const lastIndex = text.lastIndexOf(ender, maxLength);
    if (lastIndex > maxLength * 0.5) {
      return lastIndex + ender.length;
    }
  }
  
  // Try to split at word boundary
  const lastSpace = text.lastIndexOf(' ', maxLength);
  if (lastSpace > maxLength * 0.5) {
    return lastSpace;
  }
  
  // Force split at maxLength
  return maxLength;
}

/**
 * Extract metadata from document content
 */
export function extractMetadata(content: string, fileName?: string): Record<string, any> {
  const metadata: Record<string, any> = {};
  
  // Extract title from markdown headers
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }
  
  // Extract file type from extension
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    metadata.file_type = extension;
    
    // Use filename as title if no title found
    if (!metadata.title) {
      metadata.title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    }
  }
  
  // Count words and estimate reading time
  const wordCount = content.split(/\s+/).length;
  metadata.word_count = wordCount;
  metadata.reading_time_minutes = Math.ceil(wordCount / 200);
  
  // Extract potential tags from hashtags
  const hashtagMatches = content.match(/#\w+/g);
  if (hashtagMatches) {
    metadata.extracted_tags = hashtagMatches.map(tag => tag.slice(1));
  }
  
  return metadata;
}

/**
 * Clean and normalize text for processing
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, '    ') // Convert tabs to spaces
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .trim();
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English text
  // This is a simplified version; for production, use tiktoken
  const words = text.split(/\s+/).length;
  const chars = text.length;
  
  // Average between word-based and character-based estimates
  const wordBasedEstimate = words * 1.3;
  const charBasedEstimate = chars / 4;
  
  return Math.ceil((wordBasedEstimate + charBasedEstimate) / 2);
}

/**
 * Extract text from different file formats
 */
export async function extractTextFromFile(
  file: File | Blob,
  fileType: string
): Promise<string> {
  const text = await file.text();
  
  switch (fileType) {
    case 'txt':
    case 'md':
    case 'markdown':
      return text;
      
    case 'json':
      try {
        const json = JSON.parse(text);
        return JSON.stringify(json, null, 2);
      } catch {
        return text;
      }
      
    // For other formats like PDF and DOCX, we'll need specific libraries
    // These would be implemented with pdf.js and mammoth.js respectively
    default:
      return text;
  }
}

/**
 * Generate a summary of text chunks for context
 */
export function generateChunkSummary(chunks: string[], maxLength: number = 200): string {
  if (chunks.length === 0) return '';
  
  const firstChunk = chunks[0];
  if (firstChunk.length <= maxLength) return firstChunk;
  
  // Find a good breaking point
  const breakPoint = findSplitPoint(firstChunk, maxLength - 3);
  return firstChunk.slice(0, breakPoint).trim() + '...';
}