/**
 * PDF text extraction using PDF.js
 */

// Dynamic import to handle browser-only loading
let pdfjs: unknown = null;

/**
 * Initialize PDF.js library
 */
async function initializePDFJS() {
  if (!pdfjs) {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjs = pdfjsLib;
    
    // Set up the worker
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    }
  }
  return pdfjs;
}

/**
 * Extract text from a PDF file using PDF.js
 */
export async function extractTextFromPDF(file: File): Promise<{ content: string; pageCount: number }> {
  try {
    // Initialize PDF.js
    await initializePDFJS();
    
    if (!pdfjs) {
      throw new Error('PDF.js failed to initialize');
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      // Disable font face to avoid warnings
      disableFontFace: true,
      // Use standard fonts when possible
      standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/',
    });
    
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    
    const fullText = '';
    
    // Extract text from each page
    for (const pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items into a single string
      const pageText = textContent.items
        .map((item: unknown) => item.str)
        .join(' ');
      
      fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
    }
    
    // Clean up the text
    fullText = fullText
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
      .trim();
    
    return {
      content: fullText,
      pageCount
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // Fallback error message with more details
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    } else {
      throw new Error('Failed to extract text from PDF: Unknown error');
    }
  }
}

/**
 * Extract metadata from PDF
 */
export async function extractPDFMetadata(file: File): Promise<any> {
  try {
    await initializePDFJS();
    
    if (!pdfjs) {
      throw new Error('PDF.js failed to initialize');
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const metadata = await pdf.getMetadata();
    
    return {
      title: metadata.info?.Title || file.name,
      author: metadata.info?.Author || 'Unknown',
      subject: metadata.info?.Subject || '',
      keywords: metadata.info?.Keywords || '',
      creator: metadata.info?.Creator || '',
      producer: metadata.info?.Producer || '',
      creationDate: metadata.info?.CreationDate || '',
      modificationDate: metadata.info?.ModDate || '',
      pageCount: pdf.numPages
    };
  } catch (error) {
    console.error('Failed to extract PDF metadata:', error);
    return {
      title: file.name,
      pageCount: 0
    };
  }
}