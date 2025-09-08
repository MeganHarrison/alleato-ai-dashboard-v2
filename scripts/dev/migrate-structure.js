#!/usr/bin/env node

/**
 * Alleato AI Dashboard - Structure Migration Script
 * 
 * This script reorganizes the project structure for better maintainability
 * Run with: node migrate-structure.js
 */

const fs = require('fs-extra');
const path = require('path');

const migrations = {
  // Components reorganization
  components: {
    // Auth components
    'components/login-form.tsx': 'src/components/features/auth/login-form.tsx',
    'components/sign-up-form.tsx': 'src/components/features/auth/sign-up-form.tsx',
    'components/forgot-password-form.tsx': 'src/components/features/auth/forgot-password-form.tsx',
    'components/update-password-form.tsx': 'src/components/features/auth/update-password-form.tsx',
    'components/logout-button.tsx': 'src/components/features/auth/logout-button.tsx',
    
    // Dashboard components
    'components/dashboard': 'src/components/features/dashboard',
    'components/chart-area-interactive.tsx': 'src/components/features/dashboard/chart-area-interactive.tsx',
    'components/users-growth-chart.tsx': 'src/components/features/dashboard/users-growth-chart.tsx',
    'components/section-cards.tsx': 'src/components/features/dashboard/section-cards.tsx',
    
    // Tables components
    'components/tables': 'src/components/features/tables',
    'components/results-table.tsx': 'src/components/features/tables/results-table.tsx',
    'components/sql-editor.tsx': 'src/components/features/tables/sql-editor.tsx',
    
    // Meetings components
    'components/meetings': 'src/components/features/meetings',
    
    // Core reusable components
    'components/page-header.tsx': 'src/components/core/page-header.tsx',
    'components/search-form.tsx': 'src/components/core/search-form.tsx',
    'components/date-picker.tsx': 'src/components/core/date-picker.tsx',
    'components/dropzone.tsx': 'src/components/core/dropzone.tsx',
    'components/error-boundary.tsx': 'src/components/core/error-boundary.tsx',
    'components/dynamic-form.tsx': 'src/components/core/dynamic-form.tsx',
    'components/avatar-stack.tsx': 'src/components/core/avatar-stack.tsx',
    'components/realtime-avatar-stack.tsx': 'src/components/core/realtime-avatar-stack.tsx',
    
    // Keep UI components as-is
    'components/ui': 'src/components/ui'
  },
  
  // Scripts reorganization
  scripts: {
    // Fireflies scripts
    'scripts/fireflies-*.js': 'scripts-new/fireflies/',
    'scripts/enhanced-fireflies-*.js': 'scripts-new/fireflies/',
    'scripts/sync-fireflies*.js': 'scripts-new/fireflies/',
    'scripts/check-fireflies*.js': 'scripts-new/fireflies/',
    
    // Database scripts
    'scripts/create-*.js': 'scripts-new/database/',
    'scripts/execute-*.js': 'scripts-new/database/',
    'scripts/fix-*.js': 'scripts-new/database/',
    'scripts/*migration*.js': 'scripts-new/database/',
    'scripts/*tables*.js': 'scripts-new/database/',
    
    // Vectorization scripts
    'scripts/vectorize-*.js': 'scripts-new/vectorization/',
    'scripts/generate-*embeddings*.ts': 'scripts-new/vectorization/',
    'scripts/auto-trigger-vectorization.js': 'scripts-new/vectorization/',
    
    // Setup scripts
    'scripts/setup-*.js': 'scripts-new/setup/',
    'scripts/verify-*.js': 'scripts-new/setup/'
  },
  
  // Lib reorganization
  lib: {
    'lib/supabase': 'src/lib/database/supabase',
    'lib/db': 'src/lib/database/core',
    'lib/openai': 'src/lib/ai/openai',
    'lib/rag': 'src/lib/ai/rag',
    'lib/vector': 'src/lib/ai/vector',
    'lib/pm-rag-chat': 'src/lib/ai/pm-rag-chat',
    'lib/utils.ts': 'src/lib/utils/index.ts',
    'lib/env.ts': 'config/env.ts',
    'lib/rules.ts': 'config/rules.ts'
  }
};

async function executeMove(source, destination) {
  try {
    const sourcePath = path.resolve(source);
    const destPath = path.resolve(destination);
    
    if (await fs.pathExists(sourcePath)) {
      await fs.ensureDir(path.dirname(destPath));
      await fs.move(sourcePath, destPath);
      console.log(`✅ Moved: ${source} → ${destination}`);
      return true;
    } else {
      console.log(`⚠️  Source not found: ${source}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error moving ${source} → ${destination}:`, error.message);
    return false;
  }
}

async function updateImports() {
  console.log('\n📝 Updating import statements...');
  
  // This would need to be implemented to update all import statements
  // For now, we'll create a separate script for this
  console.log('Import updates will need to be done separately');
}

async function main() {
  console.log('🚀 Starting Alleato AI Dashboard structure migration...\n');
  
  let successCount = 0;
  let totalCount = 0;
  
  // Execute component migrations
  console.log('📁 Migrating components...');
  for (const [source, dest] of Object.entries(migrations.components)) {
    totalCount++;
    if (await executeMove(source, dest)) {
      successCount++;
    }
  }
  
  // Execute lib migrations
  console.log('\n📚 Migrating lib files...');
  for (const [source, dest] of Object.entries(migrations.lib)) {
    totalCount++;
    if (await executeMove(source, dest)) {
      successCount++;
    }
  }
  
  await updateImports();
  
  console.log(`\n✨ Migration completed: ${successCount}/${totalCount} successful moves`);
  console.log('\n📋 Next steps:');
  console.log('1. Update import statements throughout the codebase');
  console.log('2. Update tsconfig.json paths');
  console.log('3. Update any build scripts that reference old paths');
  console.log('4. Test the application thoroughly');
  console.log('5. Remove empty directories');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { migrations, executeMove };
