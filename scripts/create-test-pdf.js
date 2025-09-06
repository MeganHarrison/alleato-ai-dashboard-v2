#!/usr/bin/env node

/**
 * Create a simple test PDF file for testing PDF upload and extraction
 */

const fs = require('fs');
const path = require('path');

// Create a simple PDF file manually (minimal PDF structure)
function createTestPDF() {
  // This creates a very basic PDF with text content
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica
      >>
    >>
  >>
  /MediaBox [0 0 612 792]
  /Contents 4 0 R
>>
endobj

4 0 obj
<< /Length 500 >>
stream
BT
/F1 12 Tf
50 750 Td
(Test PDF Document for Vector Search) Tj
0 -20 Td
(This is a test PDF file created to verify PDF text extraction.) Tj
0 -20 Td
(It contains sample content about artificial intelligence and machine learning.) Tj
0 -40 Td
(Key Topics:) Tj
0 -20 Td
(- Natural Language Processing enables computers to understand human language) Tj
0 -20 Td
(- Computer Vision allows machines to interpret visual information) Tj
0 -20 Td
(- Deep Learning uses neural networks to learn from data) Tj
0 -20 Td
(- Reinforcement Learning trains agents through rewards and penalties) Tj
0 -40 Td
(This document helps test the PDF upload and vector search functionality.) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000338 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
892
%%EOF`;

  const outputPath = path.join(__dirname, '..', 'test-document.pdf');
  fs.writeFileSync(outputPath, pdfContent, 'binary');
  console.log(`✅ Created test PDF: ${outputPath}`);
  console.log('\nYou can now upload this PDF to test the extraction functionality.');
}

createTestPDF();