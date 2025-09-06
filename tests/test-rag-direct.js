#!/usr/bin/env node

const { meetingRAGService } = require('../lib/rag/meeting-service.ts');

async function testRAGDirect() {
  try {
    console.log('Testing RAG service directly...');
    
    const result = await meetingRAGService.searchMeetingContext('recent meetings', {
      matchCount: 5,
    });
    
    console.log('RAG Results:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('RAG Error:', error);
  }
}

testRAGDirect();