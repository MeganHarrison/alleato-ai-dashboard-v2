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
  'app/(active)/rag-chat/page.tsx',
  'app/(active)/rag-system/chat/page.tsx'
];

const projectRoot = path.join(__dirname, '..', '..');

filesToFix.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace !input.trim() with !input?.trim()
    content = content.replace(/!input\.trim\(\)/g, '!input?.trim()');
    
    // Replace input.trim() && with input?.trim() &&
    content = content.replace(/input\.trim\(\)\s*&&/g, 'input?.trim() &&');
    
    // Replace input.trim() ? with input?.trim() ?
    content = content.replace(/input\.trim\(\)\s*\?/g, 'input?.trim() ?');
    
    // Replace input.trim() === with input?.trim() ===
    content = content.replace(/input\.trim\(\)\s*===/g, 'input?.trim() ===');
    
    // Replace input.trim() !== with input?.trim() !==
    content = content.replace(/input\.trim\(\)\s*!==/g, 'input?.trim() !==');
    
    // Replace input.trim().length with input?.trim()?.length
    content = content.replace(/input\.trim\(\)\.length/g, 'input?.trim()?.length');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n✨ Done! All trim() errors have been fixed.');