#!/usr/bin/env node

/**
 * Import Statement Updater
 * Updates all import statements to match the new folder structure
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const IMPORT_MAPPINGS = {
  // Component imports
  "from 'components/ui/": "from '@/components/ui/",
  "from '../components/ui/": "from '@/components/ui/",
  "from '../../components/ui/": "from '@/components/ui/",
  "from '../../../components/ui/": "from '@/components/ui/",
  
  // Auth component imports
  "from 'components/login-form'": "from '@/components/features/auth/login-form'",
  "from 'components/sign-up-form'": "from '@/components/features/auth/sign-up-form'",
  "from 'components/logout-button'": "from '@/components/features/auth/logout-button'",
  
  // Dashboard component imports
  "from 'components/chart-area-interactive'": "from '@/components/features/dashboard/chart-area-interactive'",
  "from 'components/users-growth-chart'": "from '@/components/features/dashboard/users-growth-chart'",
  
  // Core component imports
  "from 'components/page-header'": "from '@/components/core/page-header'",
  "from 'components/search-form'": "from '@/components/core/search-form'",
  "from 'components/date-picker'": "from '@/components/core/date-picker'",
  "from 'components/error-boundary'": "from '@/components/core/error-boundary'",
  
  // Lib imports
  "from 'lib/supabase/": "from '@/lib/database/supabase/",
  "from '../lib/supabase/": "from '@/lib/database/supabase/",
  "from 'lib/openai/": "from '@/lib/ai/openai/",
  "from 'lib/rag/": "from '@/lib/ai/rag/",
  "from 'lib/utils'": "from '@/lib/utils'",
  "from '../lib/utils'": "from '@/lib/utils'",
  "from '../../lib/utils'": "from '@/lib/utils'",
  
  // Config imports
  "from 'lib/env'": "from '@/config/env'",
  "from '../lib/env'": "from '@/config/env'",
  
  // Type imports
  "from 'types/": "from '@/types/",
  "from '../types/": "from '@/types/",
  "from '../../types/": "from '@/types/",
  
  // Hook imports
  "from 'hooks/": "from '@/hooks/",
  "from '../hooks/": "from '@/hooks/",
};

async function updateImportsInFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let hasChanges = false;
    
    for (const [oldImport, newImport] of Object.entries(IMPORT_MAPPINGS)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await fs.writeFile(filePath, content);
      console.log(`✅ Updated imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

async function updateAllImports() {
  console.log('🔄 Updating import statements throughout the codebase...\n');
  
  // Find all TypeScript and JavaScript files
  const patterns = [
    'app/**/*.{ts,tsx,js,jsx}',
    'src/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'hooks/**/*.{ts,tsx,js,jsx}',
    'utils/**/*.{ts,tsx,js,jsx}',
    'middleware.ts',
  ];
  
  let allFiles = [];
  for (const pattern of patterns) {
    const files = glob.sync(pattern, { ignore: 'node_modules/**' });
    allFiles = allFiles.concat(files);
  }
  
  // Remove duplicates
  allFiles = [...new Set(allFiles)];
  
  console.log(`📁 Found ${allFiles.length} files to process\n`);
  
  let updatedCount = 0;
  
  for (const file of allFiles) {
    if (await updateImportsInFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n✨ Import update completed: ${updatedCount}/${allFiles.length} files updated`);
}

async function main() {
  console.log('🚀 Starting import statement updates...\n');
  await updateAllImports();
  
  console.log('\n📋 Next steps:');
  console.log('1. Run TypeScript check: npm run typecheck');
  console.log('2. Run build: npm run build');
  console.log('3. Test the application: npm run dev');
  console.log('4. Fix any remaining import issues manually');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateImportsInFile, IMPORT_MAPPINGS };
