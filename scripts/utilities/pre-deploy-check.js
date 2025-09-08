#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Run this before every deployment to catch issues early
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function runCommand(command, description) {
  try {
    log(`🔍 ${description}...`, COLORS.BLUE);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description}`, COLORS.GREEN);
    return true;
  } catch (error) {
    log(`❌ ${description} - Failed:`, COLORS.RED);
    console.log(error.stdout || error.message);
    return false;
  }
}

function checkEnvironmentVars() {
  log('\n📋 Checking Environment Variables...', COLORS.BLUE);
  
  const envFile = path.join(process.cwd(), '.env.local');
  const envExampleFile = path.join(process.cwd(), '.env.example');
  
  let hasErrors = false;
  
  if (fs.existsSync(envExampleFile)) {
    const envExample = fs.readFileSync(envExampleFile, 'utf8');
    const requiredVars = envExample.match(/^[A-Z_]+=.*/gm) || [];
    
    log(`Found ${requiredVars.length} required environment variables`, COLORS.BLUE);
    
    if (fs.existsSync(envFile)) {
      const envLocal = fs.readFileSync(envFile, 'utf8');
      
      requiredVars.forEach(line => {
        const varName = line.split('=')[0];
        if (!envLocal.includes(varName)) {
          log(`❌ Missing environment variable: ${varName}`, COLORS.RED);
          hasErrors = true;
        }
      });
    } else {
      log('⚠️  No .env.local file found', COLORS.YELLOW);
    }
  }
  
  return !hasErrors;
}

function checkProjectStructure() {
  log('\n📁 Checking Project Structure...', COLORS.BLUE);
  
  const criticalFiles = [
    ['package.json', 'Package configuration'],
    ['next.config.mjs', 'Next.js configuration'],
    ['tsconfig.json', 'TypeScript configuration'],
    ['app/layout.tsx', 'Root layout component'],
  ];
  
  // Check for Tailwind config (either .js or .ts)
  const tailwindExists = fs.existsSync('tailwind.config.js') || fs.existsSync('tailwind.config.ts');
  if (tailwindExists) {
    log('✅ Tailwind CSS configuration', COLORS.GREEN);
  } else {
    log('❌ Tailwind CSS configuration - Missing: tailwind.config.js or tailwind.config.ts', COLORS.RED);
    hasErrors = true;
  }
  
  const optionalFiles = [
    ['vercel.json', 'Vercel configuration'],
    ['.vercelignore', 'Vercel ignore file'],
    ['documentation/guides/VERCEL_ENV_VARS.md', 'Environment variables documentation'],
  ];
  
  let hasErrors = false;
  
  criticalFiles.forEach(([file, desc]) => {
    if (!checkFile(file, desc)) {
      hasErrors = true;
    }
  });
  
  log('\nOptional files:', COLORS.BLUE);
  optionalFiles.forEach(([file, desc]) => {
    checkFile(file, desc);
  });
  
  return !hasErrors;
}

function checkBuildIssues() {
  log('\n🔧 Checking for Known Build Issues...', COLORS.BLUE);
  
  const nextConfig = path.join(process.cwd(), 'next.config.mjs');
  let hasIssues = false;
  
  if (fs.existsSync(nextConfig)) {
    const content = fs.readFileSync(nextConfig, 'utf8');
    
    // Check for problematic experimental features
    if (content.includes('experimental.*turbo')) {
      log('⚠️  Experimental turbo config detected - may cause build issues', COLORS.YELLOW);
    }
    
    // Check for proper memory configuration
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts.build && !packageJson.scripts.build.includes('max-old-space-size')) {
      log('⚠️  Consider adding NODE_OPTIONS=--max-old-space-size=4096 for large builds', COLORS.YELLOW);
    }
    
    // Check for conflicting projects
    const conflictDirs = [
      'app/(fm-global)/fm-global-pdf',
      'astro-docs/node_modules',
      'external-projects'
    ];
    
    conflictDirs.forEach(dir => {
      if (fs.existsSync(dir) && fs.readdirSync(dir).includes('package.json')) {
        log(`⚠️  Potential conflict: ${dir} contains package.json`, COLORS.YELLOW);
      }
    });
  }
  
  return !hasIssues;
}

function checkDependencies() {
  log('\n📦 Checking Dependencies...', COLORS.BLUE);
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check for version conflicts
  const aiSdkVersion = packageJson.dependencies?.ai;
  if (aiSdkVersion && aiSdkVersion.startsWith('4.') || aiSdkVersion.startsWith('5.')) {
    log('⚠️  AI SDK v4/5 detected - ensure API routes use compatible syntax', COLORS.YELLOW);
  }
  
  // Check Next.js version
  const nextVersion = packageJson.dependencies?.next;
  if (nextVersion && !nextVersion.includes('15.')) {
    log('⚠️  Next.js version not 15.x - may have compatibility issues', COLORS.YELLOW);
  }
  
  return true;
}

async function main() {
  log('🚀 Pre-deployment Check Starting...', COLORS.BLUE);
  log('=====================================\n', COLORS.BLUE);
  
  const checks = [
    { name: 'Project Structure', fn: checkProjectStructure },
    { name: 'Environment Variables', fn: checkEnvironmentVars },
    { name: 'Dependencies', fn: checkDependencies },
    { name: 'Build Issues', fn: checkBuildIssues },
    // Skip TypeScript check in development - only run in CI
    ...(process.env.CI ? [{ name: 'TypeScript Check', fn: () => runCommand('npx tsc --noEmit', 'TypeScript validation') }] : []),
    { name: 'Linting', fn: () => runCommand('npm run lint', 'ESLint validation') },
    // Skip build test in development - only run in CI or with flag
    ...(process.env.CI || process.env.RUN_BUILD_TEST ? [{ name: 'Build Test', fn: () => runCommand('NODE_OPTIONS="--max-old-space-size=4096" npm run build', 'Production build test') }] : []),
  ];
  
  let allPassed = true;
  const results = [];
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, passed: result });
      if (!result) allPassed = false;
    } catch (error) {
      log(`❌ ${check.name} - Error: ${error.message}`, COLORS.RED);
      results.push({ name: check.name, passed: false });
      allPassed = false;
    }
  }
  
  // Summary
  log('\n=====================================', COLORS.BLUE);
  log('📊 Pre-deployment Check Summary:', COLORS.BLUE);
  log('=====================================', COLORS.BLUE);
  
  results.forEach(({ name, passed }) => {
    log(`${passed ? '✅' : '❌'} ${name}`, passed ? COLORS.GREEN : COLORS.RED);
  });
  
  if (allPassed) {
    log('\n🎉 All checks passed! Ready for deployment.', COLORS.GREEN);
    process.exit(0);
  } else {
    log('\n💥 Some checks failed. Please fix issues before deploying.', COLORS.RED);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}