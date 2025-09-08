#!/usr/bin/env node

/**
 * Quick pre-deployment validation (without build test)
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, COLORS.GREEN);
    return true;
  } else {
    log(`❌ ${description} - Missing: ${filePath}`, COLORS.RED);
    return false;
  }
}

function quickCheck() {
  log('🚀 Quick Deployment Check...', COLORS.BLUE);
  log('==============================\n', COLORS.BLUE);
  
  let issues = [];
  
  // Critical files
  const criticalFiles = [
    ['package.json', 'Package configuration'],
    ['next.config.mjs', 'Next.js configuration'],
    ['tsconfig.json', 'TypeScript configuration'],
    ['app/layout.tsx', 'Root layout component'],
  ];
  
  log('📁 Critical Files:', COLORS.BLUE);
  criticalFiles.forEach(([file, desc]) => {
    if (!checkFile(file, desc)) {
      issues.push(`Missing ${file}`);
    }
  });
  
  // Tailwind config
  const tailwindExists = fs.existsSync('tailwind.config.js') || fs.existsSync('tailwind.config.ts');
  if (tailwindExists) {
    log('✅ Tailwind CSS configuration', COLORS.GREEN);
  } else {
    log('❌ Tailwind CSS configuration', COLORS.RED);
    issues.push('Missing Tailwind config');
  }
  
  // Environment variables
  log('\n📋 Environment Check:', COLORS.BLUE);
  const envFile = '.env.local';
  if (fs.existsSync(envFile)) {
    log('✅ Environment file exists', COLORS.GREEN);
  } else {
    log('⚠️  No .env.local file (using system/Vercel env vars)', COLORS.YELLOW);
  }
  
  // Deployment files
  log('\n🚀 Deployment Files:', COLORS.BLUE);
  const deployFiles = [
    ['vercel.json', 'Vercel configuration'],
    ['.vercelignore', 'Vercel ignore file'],
    ['app/api/health/route.ts', 'Health check endpoint'],
  ];
  
  deployFiles.forEach(([file, desc]) => {
    checkFile(file, desc);
  });
  
  // Summary
  log('\n==============================', COLORS.BLUE);
  if (issues.length === 0) {
    log('🎉 Quick check passed! Ready for deployment.', COLORS.GREEN);
    return true;
  } else {
    log(`❌ Found ${issues.length} issues:`, COLORS.RED);
    issues.forEach(issue => log(`  • ${issue}`, COLORS.RED));
    return false;
  }
}

if (require.main === module) {
  const passed = quickCheck();
  process.exit(passed ? 0 : 1);
}