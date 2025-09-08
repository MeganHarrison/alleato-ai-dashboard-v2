# 🚀 Deployment Guide

This guide ensures smooth, error-free deployments every time.

## ⚡ Quick Deploy Checklist

Before every deployment, run:

```bash
npm run pre-deploy
```

This automated script checks:
- ✅ Project structure
- ✅ Environment variables
- ✅ Dependencies
- ✅ TypeScript compilation
- ✅ Linting
- ✅ Production build test

## 🔄 Automated Deployment Pipeline

### GitHub Actions Setup

1. **Add Vercel Secrets** to your GitHub repository:
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   VERCEL_URL=your_production_url
   ```

2. **Pipeline automatically runs on**:
   - Every push to `main` → Production deployment
   - Every PR → Preview deployment + E2E tests

### Manual Deployment

If you need to deploy manually:

```bash
# 1. Run pre-deployment checks
npm run pre-deploy

# 2. Deploy to Vercel
npx vercel --prod

# 3. Verify deployment
curl -f https://your-app.vercel.app/api/health
```

## 🛡️ Prevention Strategies

### 1. Environment Management
- All environment variables documented in `.env.example`
- Use Vercel dashboard for production env vars
- Never commit secrets to git

### 2. Build Configuration
- Memory optimized builds (`NODE_OPTIONS=--max-old-space-size=4096`)
- Standalone output mode for better serverless performance
- `.vercelignore` prevents conflicting projects

### 3. Dependency Management
- Lock AI SDK to compatible version (v3.x)
- Regular dependency audits
- Separate project concerns (Astro docs isolated)

### 4. Testing Strategy
- Pre-commit hooks prevent broken code
- E2E tests on preview deployments
- Health check endpoint for deployment validation

## 🔍 Troubleshooting

### Common Issues & Solutions

#### Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### AI SDK Version Conflicts
```bash
# Check current version
npm list ai

# Update API routes for v3 compatibility
# Use generateId instead of createIdGenerator
# Use streamText instead of deprecated methods
```

#### Build Conflicts
```bash
# Check for conflicting package.json files
find . -name "package.json" -not -path "./node_modules/*"

# Add to .vercelignore if needed
echo "external-projects/" >> .vercelignore
```

#### Environment Variable Issues
```bash
# Verify all required vars are set
npm run pre-deploy

# Check Vercel environment variables
npx vercel env ls
```

## 📊 Monitoring

### Health Check Endpoint
- **URL**: `/api/health`
- **Purpose**: Validates deployment success
- **Checks**: API status, database connection, memory usage

### Post-Deployment Validation
```bash
# Check application health
curl -f https://your-app.vercel.app/api/health

# Test key functionality
npm run test:e2e
```

## 🎯 Best Practices

### Development Workflow
1. **Feature branches** for all changes
2. **Pre-commit hooks** catch issues early  
3. **PR previews** test before production
4. **Automated testing** prevents regressions

### Release Process
1. Run `npm run pre-deploy` locally
2. Create PR with preview deployment
3. Review and test preview
4. Merge to main for production deploy
5. Verify with health check

## 🔧 Scripts Reference

```bash
# Development
npm run dev              # Start development server
npm run dev:with-mcp     # Start with MCP server

# Testing
npm run lint             # Check code quality
npm run lint:fix         # Auto-fix lint issues
npm run test:e2e         # Run E2E tests
npm run validate         # Full validation suite

# Deployment
npm run pre-deploy       # Pre-deployment checks
npm run build            # Production build
npm run build:check      # Build with validation
```

## 🎉 Success Metrics

A successful deployment should have:
- ✅ All pre-deploy checks passing
- ✅ Build completes without errors
- ✅ Health check returns 200 OK
- ✅ Key features working in production
- ✅ No console errors in browser

---

*Following this guide should eliminate deployment surprises and ensure smooth releases every time!* 🚀