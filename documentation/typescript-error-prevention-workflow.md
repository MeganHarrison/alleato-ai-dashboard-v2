# TypeScript Error Prevention Workflow

## Overview
This document outlines the automated workflow to prevent TypeScript errors from entering the codebase and ensure all components, especially chat interfaces, are thoroughly tested before deployment.

## Automated Prevention Strategy

### 1. Pre-Commit Hooks
Every code change triggers automatic validation before committing.

```json
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run TypeScript type checking
npm run type-check || {
  echo "❌ TypeScript errors detected. Running ts-doctor to fix..."
  # Auto-invoke ts-doctor subagent
  exit 1
}

# Run linting
npm run lint || {
  echo "❌ Linting errors detected. Running lint-stylist to fix..."
  # Auto-invoke lint-stylist subagent
  exit 1
}

# Run tests
npm run test || {
  echo "❌ Tests failed. Running test-runner to fix..."
  # Auto-invoke test-runner subagent
  exit 1
}
```

### 2. Continuous Integration Pipeline

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      
  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

### 3. Subagent Invocation Rules

#### Automatic Subagent Triggers

| Event | Subagent | Action |
|-------|----------|--------|
| TypeScript errors detected | ts-doctor | Fix type errors automatically |
| ESLint errors | lint-stylist | Clean lint issues |
| Test failures | test-runner | Fix failing tests |
| Build failures | build-gatekeeper | Ensure build passes |
| Chat UI changes | ai-validator | Test chat functionality |
| Deployment readiness | validation-gates | Run all quality checks |

#### Workflow Implementation

```typescript
// scripts/auto-fix-errors.ts
import { execSync } from 'child_process';

interface SubagentTrigger {
  condition: () => boolean;
  subagent: string;
  action: string;
}

const triggers: SubagentTrigger[] = [
  {
    condition: () => hasTypeScriptErrors(),
    subagent: 'ts-doctor',
    action: 'fix-typescript-errors'
  },
  {
    condition: () => hasLintErrors(),
    subagent: 'lint-stylist',
    action: 'fix-lint-errors'
  },
  {
    condition: () => hasTestFailures(),
    subagent: 'test-runner',
    action: 'fix-test-failures'
  },
  {
    condition: () => hasBuildErrors(),
    subagent: 'build-gatekeeper',
    action: 'fix-build-errors'
  },
  {
    condition: () => hasChatUIChanges(),
    subagent: 'ai-validator',
    action: 'validate-chat-ui'
  }
];

async function runSubagentWorkflow() {
  for (const trigger of triggers) {
    if (trigger.condition()) {
      console.log(`🤖 Invoking ${trigger.subagent} to ${trigger.action}`);
      await invokeSubagent(trigger.subagent, trigger.action);
    }
  }
}

function hasTypeScriptErrors(): boolean {
  try {
    execSync('npm run type-check', { stdio: 'ignore' });
    return false;
  } catch {
    return true;
  }
}

function hasLintErrors(): boolean {
  try {
    execSync('npm run lint', { stdio: 'ignore' });
    return false;
  } catch {
    return true;
  }
}

function hasTestFailures(): boolean {
  try {
    execSync('npm run test', { stdio: 'ignore' });
    return false;
  } catch {
    return true;
  }
}

function hasBuildErrors(): boolean {
  try {
    execSync('npm run build', { stdio: 'ignore' });
    return false;
  } catch {
    return true;
  }
}

function hasChatUIChanges(): boolean {
  const changedFiles = execSync('git diff --name-only HEAD~1').toString();
  return changedFiles.includes('chat') || changedFiles.includes('Chat');
}
```

### 4. Chat Interface Testing Protocol

#### Mandatory Chat Interface Tests

```typescript
// tests/chat-interfaces.test.ts
import { test, expect } from '@playwright/test';

const CHAT_INTERFACES = [
  '/chat',
  '/chat-asrs',
  '/chat-asrs2',
  '/fm-global-form'
];

test.describe('Chat Interface Validation', () => {
  for (const path of CHAT_INTERFACES) {
    test(`${path} - loads successfully`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(/Chat|ASRS|FM Global/);
      await expect(page.locator('input, textarea').first()).toBeVisible();
    });

    test(`${path} - sends and receives messages`, async ({ page }) => {
      await page.goto(path);
      
      // Find message input
      const input = page.locator('input[type="text"], textarea').first();
      await input.fill('Hello, this is a test message');
      
      // Send message
      await page.keyboard.press('Enter');
      
      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"], .ai-message, [class*="assistant"]', {
        timeout: 30000
      });
      
      // Verify response exists and is not empty
      const response = await page.locator('[data-testid="ai-response"], .ai-message, [class*="assistant"]').first().textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(10);
    });

    test(`${path} - handles errors gracefully`, async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      await page.goto(path);
      
      const input = page.locator('input[type="text"], textarea').first();
      await input.fill('Test message during network failure');
      await page.keyboard.press('Enter');
      
      // Should show error message, not crash
      const errorMessage = await page.waitForSelector('[class*="error"], [data-testid="error-message"]', {
        timeout: 5000
      }).catch(() => null);
      
      // Page should still be interactive
      await expect(input).toBeEnabled();
    });
  }
});
```

#### E2E Chat Validation Script

```bash
#!/bin/bash
# scripts/validate-chat-interfaces.sh

echo "🔍 Starting Chat Interface Validation..."

# Run TypeScript checks on chat components
echo "📝 Checking TypeScript in chat components..."
npx tsc --noEmit --project tsconfig.json $(find app -name "*chat*" -o -name "*Chat*" | grep -E "\.(tsx?|jsx?)$")

# Run specific chat tests
echo "🧪 Running chat interface tests..."
npx playwright test tests/chat-interfaces.test.ts

# Run AI validation
echo "🤖 Running AI validation tests..."
npm run test:ai-validation

# Check for common chat issues
echo "🔎 Checking for common issues..."
rg "useChat|streamText|generateText" --type ts --type tsx | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  npx tsc --noEmit "$file" || {
    echo "❌ TypeScript error in $file"
    echo "🔧 Auto-fixing with ts-doctor..."
    # Invoke ts-doctor
  }
done

echo "✅ Chat Interface Validation Complete!"
```

### 5. Automated Fix and Retry Loop

```typescript
// scripts/auto-fix-loop.ts
import { runSubagent } from './subagent-runner';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  subagentNeeded?: string;
}

async function autoFixLoop(maxAttempts = 3): Promise<boolean> {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    console.log(`🔄 Validation attempt ${attempt}/${maxAttempts}`);
    
    const results = await runValidation();
    
    if (results.every(r => r.passed)) {
      console.log('✅ All validations passed!');
      return true;
    }
    
    // Fix issues with appropriate subagents
    for (const result of results) {
      if (!result.passed && result.subagentNeeded) {
        console.log(`🤖 Running ${result.subagentNeeded} to fix issues...`);
        await runSubagent(result.subagentNeeded);
      }
    }
  }
  
  console.error('❌ Failed to fix all issues after maximum attempts');
  return false;
}

async function runValidation(): Promise<ValidationResult[]> {
  return [
    await validateTypeScript(),
    await validateLinting(),
    await validateTests(),
    await validateChatInterfaces(),
    await validateBuild()
  ];
}
```

### 6. Package.json Scripts

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "next lint --max-warnings 0",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:chat": "playwright test tests/chat-interfaces.test.ts",
    "test:ai-validation": "node scripts/ai-validation.js",
    "build": "next build",
    "validate": "npm run type-check && npm run lint && npm run test && npm run build",
    "validate:chat": "bash scripts/validate-chat-interfaces.sh",
    "auto-fix": "node scripts/auto-fix-loop.js",
    "pre-deploy": "npm run auto-fix && npm run validate",
    "deploy": "npm run pre-deploy && vercel --prod"
  }
}
```

### 7. Monitoring and Alerts

```typescript
// scripts/monitor-errors.ts
import { WebClient } from '@slack/web-api';

interface ErrorReport {
  type: 'typescript' | 'lint' | 'test' | 'build' | 'chat';
  count: number;
  files: string[];
  timestamp: Date;
}

class ErrorMonitor {
  private errors: ErrorReport[] = [];
  
  async checkAndReport() {
    const errors = await this.collectErrors();
    
    if (errors.length > 0) {
      await this.notifyTeam(errors);
      await this.autoFix(errors);
    }
  }
  
  private async collectErrors(): Promise<ErrorReport[]> {
    // Collect all types of errors
    return [];
  }
  
  private async autoFix(errors: ErrorReport[]) {
    for (const error of errors) {
      const subagent = this.getSubagentForError(error.type);
      await this.invokeSubagent(subagent);
    }
  }
  
  private getSubagentForError(type: string): string {
    const mapping = {
      'typescript': 'ts-doctor',
      'lint': 'lint-stylist',
      'test': 'test-runner',
      'build': 'build-gatekeeper',
      'chat': 'ai-validator'
    };
    return mapping[type] || 'validation-gates';
  }
}
```

## Implementation Timeline

1. **Immediate**: Install husky and set up pre-commit hooks
2. **Day 1**: Implement automated subagent triggers
3. **Day 2**: Set up E2E chat interface tests
4. **Day 3**: Configure CI/CD pipeline
5. **Ongoing**: Monitor and refine based on detected issues

## Success Metrics

- Zero TypeScript errors reaching main branch
- All chat interfaces passing E2E tests
- <5 minute fix time for detected issues
- 100% build success rate
- Zero production deployment failures

## Maintenance

- Review and update subagent rules weekly
- Add new test cases for new chat features
- Monitor error patterns and adjust automation
- Regular subagent performance reviews