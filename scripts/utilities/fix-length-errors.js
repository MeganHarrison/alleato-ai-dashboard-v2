#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'components/ai-chat.tsx',
  'components/pm-assistant-chat-gpt5.tsx',
  'components/pm-rag/rag-chat-interface.tsx',
  'components/chat/ChatInterface.tsx',
  'components/ai-sdk5/enhanced-chat-fixed.tsx',
  'components/ai-sdk5/chat.tsx',
  'components/ai-sdk5/enhanced-chat-v5.tsx',
  'components/ai-sdk5/enhanced-chat.tsx',
  'components/asrs/fm-global-chat-interface.tsx',
  'app/(active)/rag-chat/page.tsx',
  'app/(active)/rag-system/chat/page.tsx'
];

const projectRoot = path.join(__dirname, '..', '..');

filesToFix.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace input.length patterns with optional chaining
    content = content.replace(/input\.length\s*>/g, '(input?.length || 0) >');
    content = content.replace(/input\.length\s*</g, '(input?.length || 0) <');
    content = content.replace(/input\.length\s*===/g, '(input?.length || 0) ===');
    content = content.replace(/input\.length\s*!==/g, '(input?.length || 0) !==');
    content = content.replace(/\{input\.length\}/g, '{input?.length || 0}');
    
    // Also handle messages.length
    content = content.replace(/messages\.length\s*>/g, '(messages?.length || 0) >');
    content = content.replace(/messages\.length\s*</g, '(messages?.length || 0) <');
    content = content.replace(/messages\.length\s*===/g, '(messages?.length || 0) ===');
    content = content.replace(/messages\.length\s*!==/g, '(messages?.length || 0) !==');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n✨ Done! All .length errors have been fixed.');