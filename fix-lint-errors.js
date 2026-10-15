#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common patterns to fix
const fixes = [
  // Remove unused imports - common patterns
  {
    pattern: /import\s*{\s*[^}]*Badge[^}]*}\s*from\s*["']@\/components\/ui\/badge["'];?\s*\n/g,
    replacement: '',
    condition: (content) => !content.includes('<Badge') && !content.includes('Badge ')
  },
  {
    pattern: /import\s*{\s*[^}]*FileText[^}]*}\s*from\s*["']lucide-react["'];?\s*\n/g,
    replacement: '',
    condition: (content) => !content.includes('<FileText') && !content.includes('FileText ')
  },
  
  // Fix common any types
  {
    pattern: /useState<any>/g,
    replacement: 'useState<unknown>'
  },
  {
    pattern: /: any\b/g,
    replacement: ': unknown'
  },
  {
    pattern: /\bas any\b/g,
    replacement: 'as unknown'
  },
  
  // Fix common React entity issues
  {
    pattern: /'/g,
    replacement: '&apos;'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach(fix => {
      if (fix.condition && !fix.condition(content)) {
        return;
      }
      
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Get all TypeScript/JavaScript files in app directory
function getAllFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  }
  
  walk(dir);
  return files;
}

// Main execution
console.log('Starting automated lint fixes...');

const appDir = path.join(process.cwd(), 'app');
const files = getAllFiles(appDir);

console.log(`Found ${files.length} files to process`);

files.forEach(fixFile);

console.log('Automated fixes complete. Running lint check...');

try {
  execSync('npm run lint', { stdio: 'inherit' });
} catch (error) {
  console.log('Some lint errors remain - manual fixes may be needed');
}