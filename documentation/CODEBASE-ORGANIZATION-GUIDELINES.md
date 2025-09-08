# Codebase Organization Guidelines

## Overview
This document establishes clear rules and guidelines for maintaining a clean, organized codebase. Following these guidelines will prevent the accumulation of technical debt and ensure long-term maintainability.

## Directory Structure Rules

### Root Directory (STRICT)
The root directory should contain **ONLY**:
- Configuration files (package.json, next.config.js, etc.)
- README.md and CLAUDE.md
- Core framework files (next-env.d.ts, etc.)
- Standard dotfiles (.gitignore, .env*, etc.)

**FORBIDDEN in root:**
- Documentation files (except README.md and CLAUDE.md)
- Test files
- Temporary scripts
- Screenshot files
- Backup files

### Documentation Structure
```
documentation/
├── technical/          # Architecture decisions, technical specifications
├── api/               # API documentation
├── guides/            # How-to guides and tutorials
├── meetings/          # Meeting notes and decisions
├── changes/           # Change logs and migration guides
└── README.md          # Documentation index
```

### Application Structure
```
app/
├── (active)/          # Active feature pages
├── (admin)/           # Administrative pages
├── (dashboard)/       # Dashboard pages
├── (pages)/           # General pages
├── (project-manager)/ # Project management features
├── (tables)/          # Table/data views
└── api/               # API routes
```

### Components Organization
```
components/
├── ui/                # Base UI components (shadcn/ui)
├── common/            # Shared application components
├── [feature]/         # Feature-specific components
│   ├── __tests__/     # Co-located tests
│   └── index.ts       # Public API exports
```

### Scripts Organization
```
scripts/
├── deployment/        # Deployment scripts
├── database/          # Database maintenance scripts
├── sync/              # Data synchronization scripts
├── dev/               # Development utilities
└── README.md          # Script documentation
```

## File Naming Conventions

### Components
- **PascalCase**: `UserProfile.tsx`, `DataTable.tsx`
- **Feature components**: `[feature]-[component].tsx` (e.g., `meetings-table.tsx`)

### Utilities and Functions
- **camelCase**: `formatDate.ts`, `apiClient.ts`
- **Constants**: `UPPER_SNAKE_CASE` in `constants.ts`

### Types and Interfaces
- **PascalCase** with descriptive suffixes:
  - Types: `UserData`, `ProjectInfo`
  - Props: `ButtonProps`, `TableProps`
  - Interfaces: `ApiResponse`, `DatabaseRecord`

### Test Files
- **Match source naming**: `UserProfile.test.tsx`
- **Integration tests**: `[feature].integration.test.ts`
- **E2E tests**: `[flow].e2e.spec.ts`

### Documentation Files
- **kebab-case**: `api-documentation.md`
- **Date prefixed**: `2025-01-15-migration-guide.md`
- **Descriptive**: Use clear, searchable names

## File Organization Rules

### Size Limits (MANDATORY)
- **Files**: Maximum 500 lines
- **Components**: Maximum 200 lines
- **Functions**: Maximum 50 lines
- **Refactor when approaching limits**

### Co-location Strategy
- Tests with their components in `__tests__/` folders
- Feature-specific utilities within feature folders
- Types close to their usage

### Import Organization
```typescript
// 1. React/Next framework imports
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { z } from 'zod'
import { format } from 'date-fns'

// 3. Internal absolute imports
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

// 4. Relative imports
import { LocalComponent } from './LocalComponent'
import type { LocalType } from './types'
```

## Cleanup Prevention Rules

### Before Creating New Files
1. **Search for existing functionality** using ripgrep
2. **Check if similar components exist**
3. **Verify the file belongs in the chosen location**
4. **Consider if existing files can be extended instead**

### Regular Maintenance Tasks
- **Weekly**: Review untracked files in git status
- **Monthly**: Check for duplicate functionality
- **Quarterly**: Audit file sizes and refactor large files
- **Before major releases**: Full codebase cleanup

### Automated Quality Checks
```bash
# Check for oversized files
find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 500 {print $2 ": " $1 " lines (OVER LIMIT)"}'

# Find potential duplicates
rg --files | sort | uniq -d

# Check import organization
rg "^import" --no-heading | head -20
```

## Git Workflow Rules

### Staging Files
- **Never stage temporary files**: test-*.js, *-screenshot.png
- **Review staged changes**: Use `git diff --staged` before committing
- **Verify no debugging code**: console.log, debugger statements

### Commit Messages
Follow conventional commit format:
- `feat:` New features
- `fix:` Bug fixes  
- `refactor:` Code refactoring
- `docs:` Documentation changes
- `test:` Test additions/modifications
- `chore:` Maintenance tasks

### Branch Protection
- **No direct commits to main**
- **Require PR reviews for structural changes**
- **Run automated checks before merge**

## Testing Strategy

### Test Organization
```
__tests__/
├── components/        # Component tests
├── features/         # Feature integration tests  
├── e2e/             # End-to-end tests
└── utils/           # Test utilities
```

### Coverage Requirements
- **Minimum 80% code coverage**
- **All new components must have tests**
- **Critical paths require E2E tests**

### Test Naming
- **Descriptive test names**: "should update user profile when form is submitted"
- **Group related tests**: Use `describe` blocks effectively
- **Test edge cases**: Error states, empty data, invalid inputs

## Monitoring and Alerts

### File System Monitoring
Set up alerts for:
- Files exceeding size limits
- Too many files in root directory
- Untracked files accumulating
- Duplicate file patterns

### Code Quality Metrics
Track:
- Lines of code per file
- Cyclomatic complexity
- Import statement organization
- Dead code detection

## Emergency Cleanup Procedures

### When the Codebase Gets Disorganized
1. **Stop new development**
2. **Create cleanup branch**
3. **Backup important files**
4. **Run systematic cleanup**:
   - Move documentation to proper folders
   - Remove temporary/test files
   - Consolidate duplicate scripts
   - Update .gitignore
5. **Test that application still works**
6. **Create PR with detailed cleanup report**

### Cleanup Checklist
- [ ] Root directory contains only allowed files
- [ ] All documentation in `documentation/` folder
- [ ] No temporary test files in git
- [ ] Scripts organized by purpose
- [ ] .gitignore updated with new patterns
- [ ] File sizes within limits
- [ ] No obvious duplicates
- [ ] Application builds and tests pass

## Tools and Automation

### Recommended Tools
- **ripgrep (rg)**: For fast searching and duplicate detection
- **fd**: For finding files by patterns
- **prettier**: For consistent code formatting
- **eslint**: For code quality enforcement
- **husky**: For git hooks

### Automation Scripts
Create these maintenance scripts:
- `scripts/dev/check-file-sizes.sh`
- `scripts/dev/find-duplicates.sh`  
- `scripts/dev/organize-imports.sh`
- `scripts/dev/cleanup-untracked.sh`

### CI/CD Integration
Add checks for:
- File size limits
- Root directory cleanliness
- Import organization
- Documentation updates

## Enforcement

### Code Review Requirements
All PRs must verify:
- Files are in correct locations
- No temporary files added
- Documentation updated if needed
- Tests co-located with components
- Imports properly organized

### Consequences of Non-Compliance
- **Warning**: First violation gets educational comment
- **Block**: Second violation blocks PR until fixed
- **Process Review**: Pattern of violations triggers process discussion

## Conclusion

These guidelines exist to maintain code quality and prevent technical debt. They should be followed consistently by all contributors. When in doubt, err on the side of organization and cleanliness.

For questions or suggestions about these guidelines, create an issue or discuss in team meetings.

---
*Last updated: 2025-01-15*
*Next review: 2025-04-15*