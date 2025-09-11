/**
 * File text extraction utilities for different file types
 */

import { extractTextFromPDF, extractPDFMetadata } from './pdf-extractor';

export interface ExtractedText {
  content: string;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    extractedAt: string;
    pageCount?: number;
    wordCount?: number;
  };
}

export class FileTextExtractor {
  /**
   * Extract text from different file types
   */
  static async extractText(file: File): Promise<ExtractedText> {
    const metadata = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      extractedAt: new Date().toISOString(),
    };

    try {
      const content = '';

      switch (file.type) {
        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
          content = await this.extractTextFromTextFile(file);
          break;
        
        case 'application/pdf':
          content = await this.extractTextFromPDF(file);
          break;
        
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          content = await this.extractTextFromWord(file);
          break;
        
        default:
          // Try to read as text anyway
          try {
            content = await this.extractTextFromTextFile(file);
          } catch (error) {
            throw new Error(`Unsupported file type: ${file.type}`);
          }
      }

      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

      return {
        content: content.trim(),
        metadata: {
          ...metadata,
          wordCount,
        }
      };
    } catch (error) {
      throw new Error(`Failed to extract text from ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  private static async extractTextFromTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const text = event.target?.result as string;
        resolve(text);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read text file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Extract text from PDF files using PDF.js
   */
  private static async extractTextFromPDF(file: File): Promise<string> {
    try {
      const { content, pageCount } = await extractTextFromPDF(file);
      
      // Add page count to metadata if possible
      console.log(`Extracted text from PDF: ${pageCount} pages, ${content.length} characters`);
      
      return content;
    } catch (error) {
      console.error('PDF extraction failed:', error);
      // Provide a more user-friendly error message
      throw new Error(
        `Unable to extract text from PDF "${file.name}". The file may be corrupted, password-protected, or contain only images. ${error instanceof Error ? error.message : ''}`
      );
    }
  }

  /**
   * Extract text from Word documents
   * Note: This is a placeholder. For production, consider using mammoth.js or similar
   */
  private static async extractTextFromWord(file: File): Promise<string> {
    // For now, we'll return a placeholder implementation
    // In a real application, you'd want to use a library like mammoth.js
    throw new Error('Word document text extraction requires additional library. Please convert to text format first.');
  }

  /**
   * Validate file for text extraction
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (10MB)`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Split extracted text into chunks for better vector search
   */
  static splitTextIntoChunks(
    text: string, 
    options: {
      maxChunkSize?: number;
      overlapSize?: number;
      preserveStructure?: boolean;
    } = {}
  ): string[] {
    const {
      maxChunkSize = 1000,
      overlapSize = 200,
      preserveStructure = true
    } = options;

    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    
    if (preserveStructure) {
      // Try to split on paragraph boundaries first
      const paragraphs = text.split(/\n\s*\n/);
      const currentChunk = '';
      
      for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length <= maxChunkSize) {
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }
          
          if (paragraph.length > maxChunkSize) {
            // Split long paragraphs at sentence boundaries
            const sentences = paragraph.split(/[.!?]+\s+/);
            const sentenceChunk = '';
            
            for (const sentence of sentences) {
              if ((sentenceChunk + sentence).length <= maxChunkSize) {
                sentenceChunk += (sentenceChunk ? '. ' : '') + sentence;
              } else {
                if (sentenceChunk) {
                  chunks.push(sentenceChunk.trim() + '.');
                }
                sentenceChunk = sentence;
              }
            }
            if (sentenceChunk) {
              chunks.push(sentenceChunk.trim() + (sentenceChunk.endsWith('.') ? '' : '.'));
            }
          } else {
            currentChunk = paragraph;
          }
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
    } else {
      // Simple character-based chunking with overlap
      for (const i = 0; i < text.length; i += maxChunkSize - overlapSize) {
        const chunk = text.slice(i, i + maxChunkSize);
        chunks.push(chunk.trim());
        
        if (i + maxChunkSize >= text.length) break;
      }
    }

    return chunks.filter(chunk => chunk.length > 0);
  }
}