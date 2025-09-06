const fs = require('fs');
const path = require('path');

const appDir = process.cwd();
console.log('Validating Alleato AI Dashboard...\n');

let issues = [];
let warnings = [];

// Check critical files exist
const criticalFiles = [
  'package.json',
  'next.config.mjs',
  'tailwind.config.ts',
  'tsconfig.json',
  'app/layout.tsx',
  'app/(pages)/layout.tsx',
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'utils/supabase/service.ts',
  'types/database.types.ts'
];

console.log('Checking critical files...');
criticalFiles.forEach(file => {
  const filePath = path.join(appDir, file);
  if (!fs.existsSync(filePath)) {
    issues.push(`Missing critical file: ${file}`);
  } else {
    console.log(` ${file}`);
  }
});

// Check common UI components exist
console.log('\nChecking UI components...');
const commonUIComponents = [
  'components/ui/button.tsx',
  'components/ui/card.tsx',
  'components/ui/input.tsx',
  'components/ui/badge.tsx',
  'components/ui/tabs.tsx',
  'components/ui/dialog.tsx',
  'components/ui/toaster.tsx'
];

commonUIComponents.forEach(comp => {
  if (fs.existsSync(path.join(appDir, comp))) {
    console.log(` ${comp}`);
  } else {
    warnings.push(`Missing UI component: ${comp}`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(50));

if (issues.length === 0 && warnings.length === 0) {
  console.log(' No issues found! Application looks healthy.');
} else {
  if (issues.length > 0) {
    console.log(`\n CRITICAL ISSUES (${issues.length}):`);
    issues.forEach(issue => console.log(`   " ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n  WARNINGS (${warnings.length}):`);
    warnings.forEach(warning => console.log(`   " ${warning}`));
  }
}

console.log('\nNext steps:');
console.log('   1. Fix critical issues first');
console.log('   2. Address warnings if needed');
console.log('   3. Run: npm run build');
console.log('   4. Test key pages manually');

process.exit(issues.length > 0 ? 1 : 0);