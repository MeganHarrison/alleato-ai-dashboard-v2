#!/usr/bin/env node

/**
 * DEPLOYMENT READINESS CHECK SCRIPT
 * 
 * Validates the alleato-ai-dashboard for production deployment
 * by checking critical files, configurations, and dependencies.
 */

const fs = require('fs');
const path = require('path');

class DeploymentChecker {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19);
    const prefix = {
      'info': '📋',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'warning') this.warnings.push(message);
    if (type === 'error') this.errors.push(message);
  }

  checkFileExists(filePath, required = true) {
    const exists = fs.existsSync(filePath);
    const fileName = path.basename(filePath);
    
    if (exists) {
      this.log(`${fileName} found`, 'success');
      return true;
    } else {
      this.log(`${fileName} missing${required ? ' (REQUIRED)' : ' (optional)'}`, required ? 'error' : 'warning');
      return false;
    }
  }

  checkPackageJson() {
    this.log('Checking package.json configuration...');
    
    if (!this.checkFileExists('package.json')) {
      return false;
    }
    
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Check critical scripts
      const requiredScripts = ['build', 'start', 'dev'];
      const missingScripts = requiredScripts.filter(script => !pkg.scripts[script]);
      
      if (missingScripts.length === 0) {
        this.log('All required scripts present', 'success');
      } else {
        this.log(`Missing scripts: ${missingScripts.join(', ')}`, 'error');
      }
      
      // Check dependencies
      const criticalDeps = ['next', 'react', 'react-dom'];
      const missingDeps = criticalDeps.filter(dep => !pkg.dependencies[dep]);
      
      if (missingDeps.length === 0) {
        this.log('Core dependencies present', 'success');
      } else {
        this.log(`Missing dependencies: ${missingDeps.join(', ')}`, 'error');
      }
      
      return true;
    } catch (error) {
      this.log(`Error reading package.json: ${error.message}`, 'error');
      return false;
    }
  }

  checkNextConfig() {
    this.log('Checking Next.js configuration...');
    
    const configFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
    const configExists = configFiles.some(file => fs.existsSync(file));
    
    if (configExists) {
      this.log('Next.js config found', 'success');
      return true;
    } else {
      this.log('No Next.js config found (using defaults)', 'warning');
      return true;
    }
  }

  checkTypeScriptConfig() {
    this.log('Checking TypeScript configuration...');
    
    if (!this.checkFileExists('tsconfig.json')) {
      return false;
    }
    
    try {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      
      if (tsconfig.compilerOptions) {
        this.log('TypeScript configuration valid', 'success');
        
        // Check strict mode
        if (tsconfig.compilerOptions.strict) {
          this.log('Strict mode enabled', 'success');
        } else {
          this.log('Strict mode disabled - consider enabling', 'warning');
        }
        
        return true;
      } else {
        this.log('Invalid TypeScript configuration', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error reading tsconfig.json: ${error.message}`, 'error');
      return false;
    }
  }

  checkEnvironmentFiles() {
    this.log('Checking environment configuration...');
    
    this.checkFileExists('.env.example', false);
    
    // Check for environment files (should not be committed)
    const envFiles = ['.env', '.env.local', '.env.production'];
    const committedEnvFiles = envFiles.filter(file => fs.existsSync(file));
    
    if (committedEnvFiles.length > 0) {
      this.log(`Environment files found: ${committedEnvFiles.join(', ')} - ensure they're in .gitignore`, 'warning');
    } else {
      this.log('No environment files in repository (good)', 'success');
    }
  }

  checkCriticalDirectories() {
    this.log('Checking critical directories...');
    
    const requiredDirs = ['app', 'components', 'lib'];
    const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));
    
    if (missingDirs.length === 0) {
      this.log('All critical directories present', 'success');
    } else {
      this.log(`Missing directories: ${missingDirs.join(', ')}`, 'error');
    }
    
    // Check for common build artifacts that shouldn't be committed
    const buildArtifacts = ['.next', 'dist', 'out', 'build'];
    const presentArtifacts = buildArtifacts.filter(dir => fs.existsSync(dir));
    
    if (presentArtifacts.length > 0) {
      this.log(`Build artifacts found: ${presentArtifacts.join(', ')} - should be in .gitignore`, 'warning');
    }
  }

  checkGitIgnore() {
    this.log('Checking .gitignore...');
    
    if (!this.checkFileExists('.gitignore', false)) {
      return;
    }
    
    try {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      
      const requiredEntries = ['.next', 'node_modules', '.env', '.env.local'];
      const missingEntries = requiredEntries.filter(entry => !gitignore.includes(entry));
      
      if (missingEntries.length === 0) {
        this.log('.gitignore properly configured', 'success');
      } else {
        this.log(`Missing .gitignore entries: ${missingEntries.join(', ')}`, 'warning');
      }
    } catch (error) {
      this.log(`Error reading .gitignore: ${error.message}`, 'warning');
    }
  }

  checkAPIRoutes() {
    this.log('Checking API routes...');
    
    const apiDir = 'app/api';
    if (!fs.existsSync(apiDir)) {
      this.log('No API routes directory found', 'warning');
      return;
    }
    
    try {
      const findRoutes = (dir) => {
        const items = fs.readdirSync(dir);
        let routes = [];
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            routes = routes.concat(findRoutes(fullPath));
          } else if (item === 'route.ts' || item === 'route.js') {
            routes.push(fullPath.replace('app/api/', '').replace('/route.ts', '').replace('/route.js', ''));
          }
        }
        
        return routes;
      };
      
      const routes = findRoutes(apiDir);
      this.log(`Found ${routes.length} API routes`, 'success');
      
      if (routes.length > 0) {
        console.log('   API Routes:');
        routes.forEach(route => console.log(`     - /api/${route}`));
      }
    } catch (error) {
      this.log(`Error scanning API routes: ${error.message}`, 'warning');
    }
  }

  checkComponents() {
    this.log('Checking components directory...');
    
    if (!fs.existsSync('components')) {
      this.log('Components directory not found', 'error');
      return;
    }
    
    try {
      const countFiles = (dir) => {
        let count = 0;
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            count += countFiles(fullPath);
          } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
            count++;
          }
        }
        
        return count;
      };
      
      const componentCount = countFiles('components');
      this.log(`Found ${componentCount} component files`, 'success');
    } catch (error) {
      this.log(`Error scanning components: ${error.message}`, 'warning');
    }
  }

  run() {
    console.log('\n🚀 ALLEATO AI DASHBOARD - DEPLOYMENT READINESS CHECK');
    console.log('=' .repeat(60));
    
    // Run all checks
    this.checkPackageJson();
    this.checkNextConfig();
    this.checkTypeScriptConfig();
    this.checkEnvironmentFiles();
    this.checkCriticalDirectories();
    this.checkGitIgnore();
    this.checkAPIRoutes();
    this.checkComponents();
    
    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT READINESS SUMMARY');
    console.log('='.repeat(60));
    
    const totalIssues = this.errors.length + this.warnings.length;
    const criticalIssues = this.errors.length;
    
    if (criticalIssues === 0 && this.warnings.length === 0) {
      console.log('🎉 PERFECT! Ready for deployment with no issues.');
    } else if (criticalIssues === 0) {
      console.log(`⚡ READY with ${this.warnings.length} minor warnings.`);
    } else {
      console.log(`⚠️  ${criticalIssues} critical issues must be fixed before deployment.`);
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ CRITICAL ERRORS:');
      this.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }
    
    // Deployment recommendation
    console.log('\n🎯 DEPLOYMENT RECOMMENDATION:');
    if (criticalIssues === 0) {
      console.log('✅ APPROVED - Safe to deploy to production');
      if (this.warnings.length > 0) {
        console.log('   Address warnings in next release cycle');
      }
    } else {
      console.log('❌ BLOCKED - Fix critical errors before deployment');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Run: npm run build (to test production build)');
    console.log('2. Run: npm run test:e2e (to run end-to-end tests)');
    console.log('3. Run: npx playwright test tests/e2e/deployment-validation.spec.ts');
    console.log('4. Review screenshots in screenshots/ directory');
    
    process.exit(criticalIssues > 0 ? 1 : 0);
  }
}

// Run the deployment check
const checker = new DeploymentChecker();
checker.run();