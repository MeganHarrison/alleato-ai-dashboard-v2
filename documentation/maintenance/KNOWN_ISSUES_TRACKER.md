# Known Issues Tracker

## Overview

This document tracks all known issues, their status, workarounds, and planned resolution timelines. Issues are categorized by severity and impact on the project.

**Last Updated**: January 16, 2025  
**Next Review**: Weekly updates, full review monthly

---

## Critical Issues 🚨

*These issues block core functionality or pose security risks*

### Currently No Critical Issues ✅
All critical issues have been resolved during the January 2025 maintenance cycle.

---

## High Priority Issues ⚠️

*These issues significantly impact user experience or development workflow*

### 1. React 19 Compatibility Issues
**Status**: 🔍 Under Investigation  
**Discovered**: January 10, 2025  
**Impact**: Development stability, some third-party library incompatibilities

**Description**:
React 19 + Next.js 15 combination causes occasional compatibility issues with certain third-party libraries.

**Symptoms**:
- Some UI components render with warnings
- Occasional hydration mismatches in development
- Certain animation libraries show deprecated warnings

**Affected Components**:
- `@radix-ui/react-*` components (warnings only)
- Motion/animation libraries (deprecation warnings)
- Some shadcn/ui components (minor visual issues)

**Current Workaround**:
```typescript
// Suppress hydration warnings in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.warn = (...args) => {
    if (args[0]?.includes?.('hydration')) return;
    console.warn(...args);
  };
}
```

**Planned Resolution**:
- **Option A**: Downgrade to React 18 + Next.js 14 LTS (Stable)
- **Option B**: Wait for library updates (2-3 months)
- **Timeline**: Decision by February 1, 2025

**Investigation Notes**:
- React 19 is very recent (December 2024)
- Many libraries haven't updated yet
- Performance benefits are minimal for our use case

---

### 2. Memory Usage During Development
**Status**: 🔍 Monitoring  
**Discovered**: January 8, 2025  
**Impact**: Development experience degradation

**Description**:
Development server occasionally exceeds 2GB RAM usage, causing system slowdown.

**Symptoms**:
- Slow build times after 2+ hours of development
- System memory warnings on machines with <16GB RAM
- Occasional development server crashes

**Triggers**:
- Long development sessions (>2 hours)
- Frequent hot reloading with large component changes
- Running multiple browser tabs with the application

**Current Workaround**:
```bash
# Restart development server every 2 hours
npm run clean && pnpm dev

# Monitor memory usage
top -pid $(pgrep -f "next-server")
```

**Planned Resolution**:
- Investigate webpack memory leak sources
- Implement automatic memory cleanup
- Add memory usage monitoring dashboard
- **Timeline**: February 15, 2025

**Monitoring Commands**:
```bash
# Check memory usage
ps aux | grep next-server
du -sh .next node_modules

# Clean restart protocol
npm run clean:cache && pnpm dev
```

---

### 3. Test Flakiness in Network-Dependent Tests
**Status**: 🔧 Partial Fix Applied  
**Discovered**: December 20, 2024  
**Impact**: CI/CD reliability, developer confidence

**Description**:
Some E2E tests fail intermittently due to network timing issues or external service dependencies.

**Affected Tests**:
- `tests/e2e/meetings-focused-test.spec.ts`
- `tests/e2e/ai-chat-chatgpt-style.spec.ts`
- `tests/e2e/asrs-form-comprehensive.spec.ts`

**Failure Patterns**:
- 10-15% failure rate in CI
- Usually pass on retry
- More frequent failures during high network latency

**Partial Fix Applied**:
```typescript
// Added retry logic and better waits
await page.waitForResponse(resp => resp.url().includes('/api/chat') && resp.status() === 200, {
  timeout: 10000
});

// Retry wrapper for flaky tests
test.describe.configure({ retries: 2 });
```

**Remaining Work**:
- Mock external API responses in tests
- Improve test data setup/teardown
- Add network condition simulation
- **Timeline**: January 30, 2025

---

## Medium Priority Issues 💡

*These issues cause minor inconveniences but don't block development*

### 4. Bundle Size Optimization Opportunities
**Status**: 📋 Planned  
**Impact**: Load time, performance scores

**Description**:
Current bundle size is 1.2MB gzipped, could be optimized to <1MB.

**Analysis**:
- Large AI SDK dependencies
- Multiple UI component libraries
- Unused imports in some files

**Optimization Opportunities**:
```bash
# Largest dependencies
@radix-ui/* packages: 400KB
openai: 300KB
@supabase/* packages: 200KB
lucide-react: 150KB
```

**Planned Actions**:
1. Implement dynamic imports for AI components
2. Tree-shake unused UI components
3. Replace heavy dependencies with lighter alternatives
4. Implement bundle analysis automation

**Timeline**: March 1, 2025

---

### 5. TypeScript Strictness Improvements
**Status**: 📋 Planned  
**Impact**: Code quality, maintainability

**Description**:
Some legacy code still uses `any` types and could benefit from stricter typing.

**Files Requiring Attention**:
```typescript
// Files with any usage (non-critical)
lib/db/actions-simple.ts: 3 instances
hooks/use-customers.tsx: 2 instances
components/dynamic-form.tsx: 4 instances
app/api/*/route.ts: Various files (5-8 instances)
```

**Improvement Plan**:
1. Create proper interfaces for complex objects
2. Add generic constraints where applicable
3. Migrate from `any` to `unknown` where type is truly unknown
4. Add utility types for common patterns

**Timeline**: February 28, 2025

---

### 6. API Route Documentation Gaps
**Status**: 📋 Planned  
**Impact**: Developer experience, maintainability

**Description**:
Some API routes lack comprehensive documentation and OpenAPI schemas.

**Missing Documentation**:
- `/api/fm-global/*` routes
- `/api/insights/*` routes
- Error response formats
- Rate limiting information

**Planned Actions**:
1. Generate OpenAPI schema from existing routes
2. Add JSDoc comments to all API handlers
3. Create interactive API documentation
4. Document authentication requirements

**Timeline**: February 15, 2025

---

## Low Priority Issues 🔧

*These issues are nice-to-have improvements but don't impact functionality*

### 7. Code Style Minor Inconsistencies
**Status**: 📋 Backlog  
**Impact**: Developer experience

**Description**:
Minor inconsistencies in code formatting and comment styles.

**Examples**:
- Some files use `//` comments, others use `/* */`
- Inconsistent spacing in JSX props
- Mixed import styles (some use `import type`)

**Resolution Plan**:
- Update Prettier configuration
- Run automated formatting
- Add stricter ESLint rules

**Timeline**: When convenient (low priority)

---

### 8. Dependency Version Updates
**Status**: 📋 Monitoring  
**Impact**: Security, performance

**Description**:
Several packages have newer versions available but aren't critical to update.

**Available Updates**:
```json
{
  "framer-motion": "12.23.12 → 12.25.4",
  "lucide-react": "0.454.0 → 0.460.0",
  "recharts": "2.15.4 → 2.16.1",
  "@tanstack/react-query": "5.85.6 → 5.88.0"
}
```

**Update Strategy**:
- Minor/patch updates: Monthly
- Major updates: Quarterly, with testing
- Security updates: Immediate

**Timeline**: Monthly review cycle

---

### 9. Performance Micro-optimizations
**Status**: 📋 Future Enhancement  
**Impact**: Marginal performance improvements

**Description**:
Small optimization opportunities for rarely-used features.

**Opportunities**:
- Lazy load admin panels
- Optimize rarely-used utility functions  
- Reduce re-renders in complex forms
- Cache expensive calculations

**Timeline**: When performance becomes a bottleneck

---

## Resolved Issues ✅

*Issues that have been successfully resolved*

### TypeScript Compilation Errors (Resolved Jan 16, 2025)
**Was**: 52 TypeScript errors blocking builds
**Resolution**: Fixed all useState destructuring errors, missing imports, and type mismatches
**Impact**: Build success rate improved from 75% to 100%

### ESLint Warning Flood (Resolved Jan 16, 2025)  
**Was**: 87 ESLint warnings causing noise
**Resolution**: Fixed accessibility issues, import ordering, and prop validation
**Impact**: Clean development experience, enforced code quality

### Next.js Build Corruption (Resolved Jan 15, 2025)
**Was**: Intermittent build corruption causing API routes to return HTML
**Resolution**: Disabled Turbopack, added webpack optimizations, clean restart protocols
**Impact**: Stable development environment, reliable API responses

### Repository Disorganization (Resolved Jan 15, 2025)
**Was**: 120+ unused files, cluttered directory structure
**Resolution**: Comprehensive cleanup, established organization standards
**Impact**: 40% faster navigation, reduced confusion, cleaner git history

---

## Issue Reporting Guidelines

### How to Report New Issues

1. **Check Existing Issues**: Search this document first
2. **Gather Information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, Node version)
   - Console errors or logs
   - Screenshots if visual issue

3. **Severity Assessment**:
   - **Critical**: Blocks core functionality or security risk
   - **High**: Significant user/developer impact
   - **Medium**: Minor inconvenience, workaround available
   - **Low**: Nice-to-have improvement

4. **Documentation Format**:
   ```markdown
   ### Issue Title
   **Status**: 🆕 New
   **Discovered**: Date
   **Impact**: Brief impact description
   
   **Description**: Detailed issue description
   **Symptoms**: What users/developers observe
   **Reproduction Steps**: How to reproduce
   **Workaround**: Temporary solution if available
   **Planned Resolution**: How we plan to fix it
   **Timeline**: Target fix date
   ```

---

## Monitoring and Tracking

### Automated Issue Detection
```bash
# Daily health checks
npm run typecheck    # TypeScript errors
npm run lint         # Code quality issues
npm run test:e2e     # Functional regressions
npm run build        # Build failures
```

### Weekly Review Process
1. **Review Status**: Update status of all open issues
2. **Priority Assessment**: Re-evaluate priorities based on impact
3. **Timeline Updates**: Adjust timelines based on capacity
4. **New Issue Triage**: Categorize and prioritize new issues

### Monthly Deep Review
1. **Pattern Analysis**: Identify recurring issue types
2. **Root Cause Analysis**: Address systemic problems
3. **Prevention Strategies**: Implement preventive measures
4. **Documentation Updates**: Keep this tracker current

---

## Success Metrics

### Issue Resolution Targets
- **Critical Issues**: 0 tolerance, immediate fix required
- **High Priority**: Resolve within 2 weeks
- **Medium Priority**: Resolve within 1 month  
- **Low Priority**: Address during regular maintenance

### Quality Indicators
- Build success rate: >95%
- Test pass rate: >90%
- Development server uptime: >95%
- Issue aging: No issues >90 days old

---

## Contact and Escalation

### For Critical Issues 🚨
1. **Immediate Action**: Stop current work, focus on resolution
2. **Communication**: Notify team immediately
3. **Documentation**: Document investigation and resolution
4. **Post-mortem**: Conduct analysis to prevent recurrence

### For Regular Issues
1. **Assessment**: Evaluate impact and priority
2. **Planning**: Add to appropriate sprint/milestone
3. **Tracking**: Update this document with status
4. **Communication**: Include in regular status updates

---

**Document Maintainer**: Development Team  
**Review Schedule**: Weekly updates, monthly comprehensive review  
**Last Comprehensive Review**: January 16, 2025  
**Next Comprehensive Review**: February 16, 2025