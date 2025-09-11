# Alleato AI Dashboard - Deployment Guide

## Table of Contents
- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Vercel Deployment](#vercel-deployment)
- [Railway Deployment](#railway-deployment)
- [Supabase Configuration](#supabase-configuration)
- [Environment Variables](#environment-variables)
- [Post-Deployment Verification](#post-deployment-verification)
- [Performance Monitoring](#performance-monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

The Alleato AI Dashboard is a Next.js 15 application with React 19, featuring:
- **Multi-tenant AI chat system** with RAG capabilities
- **Meeting intelligence** with Fireflies.ai integration
- **Project management** with AI insights
- **FM Global ASRS** specialized documentation system
- **Real-time collaboration** features

**Supported Deployment Platforms:**
- **Vercel** (Primary) - Optimized for Next.js applications
- **Railway** - Alternative with integrated database options

## Pre-Deployment Checklist

### 1. Code Quality Validation
```bash
# Run full validation suite
npm run validate
npm run build:check

# Check for TypeScript errors
npm run typecheck

# Verify linting passes
npm run lint

# Run E2E tests
npm run test:e2e
```

### 2. Environment Configuration
```bash
# Verify all required environment variables
node scripts/utilities/validate-env.js

# Check API key validity
node scripts/utilities/check-jwt-token.js

# Validate database connections
node scripts/database/verify-ai-sdk5-tables.js
```

### 3. Security Audit
- [ ] Rotate any exposed API keys
- [ ] Review `.env.local` for sensitive data
- [ ] Verify RLS policies in Supabase
- [ ] Check authentication flows

### 4. Database Preparation
```bash
# Setup required tables
npm run setup:rag
node scripts/database/setup-ai-sdk5-simple.js

# Verify table creation
node scripts/database/verify-ai-sdk5-tables.js

# Update Supabase types
npm run update-types
```

## Vercel Deployment

### Step 1: Repository Connection
1. **Connect Repository**
   ```bash
   # Ensure code is pushed to main branch
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub: `alleato-project/alleato-ai-dashboard`

### Step 2: Build Configuration
```bash
# Vercel Build Settings
Build Command: npm run build
Output Directory: .next
Install Command: npm install

# Framework Preset: Next.js
# Node.js Version: 20.x (Latest LTS)
```

### Step 3: Environment Variables Setup
In Vercel Dashboard → Settings → Environment Variables:

```bash
# Core Variables (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# AI Integration Variables
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...

# RAG System Variables
RAILWAY_RAG_API_URL=https://your-rag-api.railway.app
PM_RAG_VECTORIZE_WORKER_URL=https://worker.your-domain.workers.dev

# Meeting Intelligence Variables
FIREFLIES_API_KEY=your_fireflies_key
CRON_SECRET_KEY=your_secure_cron_key

# Optional Integrations
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=your_notion_db_id

# Application Configuration
NODE_ENV=production
DEPLOYMENT_ENV=production
APP_VERSION=1.0.0

# LangSmith Tracing (Optional)
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=ls__...
LANGSMITH_PROJECT=alleato-ai-production
```

### Step 4: Advanced Configuration
```bash
# vercel.json (optional customization)
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/rag-proxy/:path*",
      "destination": "https://your-rag-api.railway.app/:path*"
    }
  ]
}
```

### Step 5: Deploy
```bash
# Automatic deployment on push
git push origin main

# Manual deployment via CLI
npx vercel --prod

# Check deployment status
npx vercel ls
```

## Railway Deployment

### Step 1: Project Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init
railway link
```

### Step 2: Database Configuration
```bash
# Add PostgreSQL database
railway add postgresql

# Get database URL
railway variables
# Copy DATABASE_URL for environment configuration
```

### Step 3: Environment Configuration
```bash
# Set environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://...
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJ...
railway variables set OPENAI_API_KEY=sk-...
railway variables set NODE_ENV=production

# Set Railway-specific variables
railway variables set PORT=3000
railway variables set RAILWAY_STATIC_URL=https://your-app.railway.app
```

### Step 4: Railway Configuration
```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[[services]]
name = "web"

[services.web]
source = "."
```

### Step 5: Deploy to Railway
```bash
# Deploy application
railway up

# Monitor deployment logs
railway logs

# Check service status
railway status
```

## Supabase Configuration

### Step 1: Project Setup
1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create new project
   - Save project URL and anon key

### Step 2: Database Migration
```sql
-- Run migrations in SQL Editor
-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Create application tables
-- Copy content from: supabase/migrations/20250828_vector_search_setup.sql
-- Run all migration files in order
```

### Step 3: Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example for chats table)
CREATE POLICY "Users can view own chats" ON chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON chats
    FOR UPDATE USING (auth.uid() = user_id);
```

### Step 4: Storage Configuration
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Set up storage policies
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );
```

### Step 5: Authentication Configuration
```bash
# In Supabase Dashboard → Authentication → Settings
# Site URL: https://your-app.vercel.app
# Redirect URLs: 
# - https://your-app.vercel.app/auth/callback
# - https://your-app.vercel.app/dashboard

# Enable OAuth providers as needed
# - Google OAuth
# - GitHub OAuth
# - Magic Link
```

## Environment Variables

### Core Application Variables
```bash
# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# Supabase Integration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### AI Service Variables
```bash
# Primary AI Provider
OPENAI_API_KEY=sk-proj-...

# Secondary AI Providers
ANTHROPIC_API_KEY=sk-ant-api03-...
GROQ_API_KEY=gsk_...

# Model Configuration
DEFAULT_MODEL=gpt-4o
EMBEDDING_MODEL=text-embedding-3-small
```

### RAG System Variables
```bash
# External RAG API
RAILWAY_RAG_API_URL=https://rag-agent-pm.railway.app
PM_RAG_VECTORIZE_WORKER_URL=https://pm-vectorizer.your-domain.workers.dev

# FM Global Integration
ASRS_FM_GLOBAL_WORKER_URL=https://fm-global-worker.your-domain.workers.dev
```

### Integration Variables
```bash
# Meeting Intelligence
FIREFLIES_API_KEY=your_fireflies_api_key

# Project Management
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=your_notion_database_id

# Monitoring & Analytics
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=ls__...
LANGSMITH_PROJECT=alleato-ai-production
LANGSMITH_WORKSPACE_ID=your_workspace_id
```

### Security & Performance Variables
```bash
# Authentication
AUTH_SECRET=your-super-secure-auth-secret-32-chars-min

# Cron Jobs
CRON_SECRET_KEY=your_secure_cron_key_for_webhooks

# Performance
MAX_CONCURRENT_REQUESTS=50
REQUEST_TIMEOUT=30000
CACHE_TTL=3600
```

## Post-Deployment Verification

### Step 1: Health Checks
```bash
# Check application status
curl https://your-app.vercel.app/api/health

# Verify database connection
curl https://your-app.vercel.app/api/check-chat-tables

# Test RAG system
curl https://your-app.vercel.app/api/rag/stats
```

### Step 2: Feature Testing
```bash
# Test AI chat functionality
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'

# Test FM Global RAG
curl -X POST https://your-app.vercel.app/api/fm-global-rag \
  -H "Content-Type: application/json" \
  -d '{"query": "What are ASRS requirements?"}'

# Test meeting intelligence
curl https://your-app.vercel.app/api/insights/generate
```

### Step 3: UI Verification
- [ ] **Home Page Loads** - https://your-app.vercel.app/
- [ ] **Authentication Works** - Sign in/up flows
- [ ] **AI Chat Responds** - Test chat interface
- [ ] **Tables Load Data** - Check database connections
- [ ] **Mobile Responsive** - Test on mobile devices
- [ ] **Navigation Functions** - Sidebar and routing

### Step 4: Performance Testing
```bash
# Load testing with artillery
npm install -g artillery
artillery quick --count 10 --num 5 https://your-app.vercel.app/

# Lighthouse audit
npx lighthouse https://your-app.vercel.app/ --output html

# Core Web Vitals check
npx @lhci/cli@0.12.x autorun --upload.target=filesystem
```

## Performance Monitoring

### Vercel Analytics
```bash
# Enable Vercel Analytics
npm install @vercel/analytics

# Add to app layout
import { Analytics } from '@vercel/analytics/react'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Custom Monitoring
```typescript
// lib/monitoring.ts
export const trackApiUsage = async (endpoint: string, duration: number) => {
  if (process.env.NODE_ENV === 'production') {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, duration, timestamp: Date.now() })
    });
  }
};

// Usage in API routes
const start = Date.now();
// ... API logic
await trackApiUsage(req.url, Date.now() - start);
```

### Error Tracking
```typescript
// lib/error-tracking.ts
export const logError = async (error: Error, context: any) => {
  console.error('Application Error:', error);
  
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      })
    });
  }
};
```

## Troubleshooting

### Common Deployment Issues

#### 1. Build Failures
```bash
# Issue: TypeScript errors during build
# Solution: Run type check locally first
npm run typecheck
# Fix type errors before deployment

# Issue: Memory limit exceeded
# Solution: Increase Node.js memory
NODE_OPTIONS='--max-old-space-size=4096' npm run build
```

#### 2. Environment Variable Issues
```bash
# Issue: Missing environment variables
# Check: Verify all required variables are set
echo $OPENAI_API_KEY
echo $NEXT_PUBLIC_SUPABASE_URL

# Issue: Environment variables not loading
# Solution: Check variable names and restart deployment
```

#### 3. Database Connection Issues
```bash
# Issue: Supabase connection timeout
# Solution: Check RLS policies and connection string
node scripts/database/verify-ai-sdk5-tables.js

# Issue: Migration failures
# Solution: Run migrations manually in Supabase SQL Editor
```

#### 4. API Route Failures
```bash
# Issue: 500 errors on API routes
# Check: Vercel function logs
vercel logs

# Issue: CORS errors
# Solution: Configure headers in vercel.json or API routes
```

### Performance Issues

#### 1. Slow Page Loads
```bash
# Check: Bundle size analysis
npm run build -- --analyze

# Solution: Implement dynamic imports
const Component = dynamic(() => import('./Component'));
```

#### 2. High Memory Usage
```bash
# Check: Memory usage in Vercel dashboard
# Solution: Optimize images and reduce bundle size
```

#### 3. Database Query Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);
CREATE INDEX IF NOT EXISTS idx_meeting_chunks_embedding ON meeting_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Security Issues

#### 1. API Key Exposure
```bash
# Immediately rotate exposed keys
# Update environment variables in deployment platform
# Clear git history if keys were committed
```

#### 2. Authentication Problems
```bash
# Check: Supabase auth configuration
# Verify: Redirect URLs match deployment URL
# Test: Auth flows in incognito mode
```

## Maintenance

### Regular Updates
```bash
# Weekly: Update dependencies
npm update
npm audit fix

# Monthly: Update Supabase types
npm run update-types

# Quarterly: Review and update documentation
```

### Backup Strategy
```sql
-- Database backup (run in Supabase SQL Editor)
SELECT * FROM pg_dump('your_database_name');

-- Environment variables backup
# Keep encrypted backup of all environment variables
```

### Monitoring Checklist
- [ ] **Error rates** < 1% for API routes
- [ ] **Response times** < 2 seconds for 95th percentile
- [ ] **Database connections** stable and within limits
- [ ] **Memory usage** within Vercel limits
- [ ] **Disk usage** monitored for log files

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Next Review**: March 2025