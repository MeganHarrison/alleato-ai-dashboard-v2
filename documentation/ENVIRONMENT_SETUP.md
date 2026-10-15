# Environment Setup Guide

## Table of Contents
- [Overview](#overview)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Environment Variables Reference](#environment-variables-reference)
- [Configuration Validation](#configuration-validation)
- [Platform-Specific Setup](#platform-specific-setup)
- [Troubleshooting](#troubleshooting)

## Overview

The Alleato AI Dashboard requires specific environment variables for different services and integrations. This guide covers all environment configurations for development, staging, and production environments.

## Development Environment

### Step 1: Clone and Install
```bash
# Clone repository
git clone https://github.com/alleato-project/alleato-ai-dashboard.git
cd alleato-ai-dashboard

# Install dependencies
pnpm install
# or
npm install
```

### Step 2: Environment File Setup
```bash
# Copy example environment file
cp .env.example .env.local

# Open for editing
code .env.local
```

### Step 3: Core Development Variables
```bash
# .env.local for development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...

# Authentication
AUTH_SECRET=your-development-secret-min-32-chars
```

### Step 4: Development Server
```bash
# Start development server
pnpm dev

# Open browser
open http://localhost:3000
```

## Production Environment

### Vercel Production Setup
```bash
# Environment variables in Vercel dashboard
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Core Services
NEXT_PUBLIC_SUPABASE_URL=https://production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
OPENAI_API_KEY=sk-proj-...

# Security
AUTH_SECRET=your-super-secure-production-secret-64-chars-minimum
```

### Railway Production Setup
```bash
# Set via Railway CLI
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_APP_URL=https://your-app.railway.app
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

## Environment Variables Reference

### Core Application Variables

#### Next.js Framework
```bash
# Application Environment
NODE_ENV=development|staging|production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Build Configuration
NODE_OPTIONS=--max-old-space-size=4096
```

#### Authentication & Security
```bash
# NextAuth.js Configuration
AUTH_SECRET=your-secure-random-string-minimum-32-characters
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=same-as-auth-secret

# Session Configuration
AUTH_TRUST_HOST=true
```

### Database Configuration

#### Supabase (Primary Database)
```bash
# Public Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side Configuration
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Direct Database Access (Optional)
DATABASE_URL=postgresql://postgres:password@host:5432/database
DATABASE_URL_POOLED=postgresql://postgres:password@pooler.host:5432/database
```

#### Cloudflare D1 (Optional Alternative)
```bash
# D1 Database Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
D1_DATABASE_ID=your-d1-database-id
```

### AI Service Configuration

#### OpenAI (Primary AI Provider)
```bash
# API Configuration
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG_ID=org-... # Optional
OPENAI_PROJECT_ID=proj_... # Optional

# Model Configuration
DEFAULT_MODEL=gpt-4o
EMBEDDING_MODEL=text-embedding-3-small
VISION_MODEL=gpt-4o-mini
```

#### Anthropic (Secondary AI Provider)
```bash
# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

#### Groq (Alternative Provider)
```bash
# Groq API Configuration
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama3-70b-8192
```

### RAG System Configuration

#### External RAG API
```bash
# Railway-deployed RAG API
RAILWAY_RAG_API_URL=https://rag-agent-pm.railway.app
RAG_API_KEY=your-rag-api-key # If authentication required

# PM RAG Worker
PM_RAG_VECTORIZE_WORKER_URL=https://pm-vectorizer.your-domain.workers.dev
```

#### Cloudflare Workers
```bash
# ASRS FM Global Worker
ASRS_FM_GLOBAL_WORKER_URL=https://fm-global-worker.your-domain.workers.dev

# Vector Search Worker
VECTOR_SEARCH_WORKER_URL=https://vector-search.your-domain.workers.dev
```

### Integration Services

#### Fireflies.ai (Meeting Intelligence)
```bash
# Fireflies API Configuration
FIREFLIES_API_KEY=your_fireflies_api_key
FIREFLIES_WORKSPACE_ID=your_workspace_id # Optional

# Webhook Configuration
FIREFLIES_WEBHOOK_SECRET=your_webhook_secret
```

#### Notion Integration
```bash
# Notion API Configuration
NOTION_API_KEY=secret_your_notion_integration_key
NOTION_DATABASE_ID=your_notion_database_id

# Notion Workspace
NOTION_WORKSPACE_ID=your_workspace_id # Optional
```

### Monitoring & Analytics

#### LangSmith (AI Observability)
```bash
# LangSmith Configuration
LANGSMITH_TRACING=true|false
LANGSMITH_API_KEY=ls__your_langsmith_api_key
LANGSMITH_PROJECT=alleato-ai-dashboard
LANGSMITH_WORKSPACE_ID=your_workspace_id

# Custom Endpoint (Optional)
LANGSMITH_API_URL=https://api.smith.langchain.com
```

#### Error Tracking
```bash
# Sentry Configuration (Optional)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-organization
SENTRY_PROJECT=alleato-ai-dashboard

# Custom Error Tracking
ERROR_REPORTING_ENABLED=true
ERROR_WEBHOOK_URL=https://your-error-webhook.com/errors
```

### Security & Performance

#### Cron Jobs & Webhooks
```bash
# Secure cron job execution
CRON_SECRET_KEY=your-secure-cron-key-for-webhook-authentication

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

#### Performance Tuning
```bash
# Request Configuration
MAX_CONCURRENT_REQUESTS=50
REQUEST_TIMEOUT=30000
API_RESPONSE_TIMEOUT=15000

# Caching Configuration
CACHE_TTL=3600
REDIS_URL=redis://localhost:6379 # If using Redis
```

#### CORS Configuration
```bash
# CORS Settings
ALLOWED_ORIGINS=https://your-domain.com,http://localhost:3000
CORS_CREDENTIALS=true
```

### Application Metadata

#### Deployment Information
```bash
# Application Versioning
APP_VERSION=1.0.0
BUILD_DATE=2025-01-11
GIT_COMMIT_SHA=abc123...

# Environment Classification
DEPLOYMENT_ENV=development|staging|production
FEATURE_FLAGS=feature1:true,feature2:false
```

## Configuration Validation

### Automated Validation Script
```bash
# Create validation script
cat > scripts/validate-env.js << 'EOF'
#!/usr/bin/env node

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'AUTH_SECRET'
];

const optionalVars = [
  'ANTHROPIC_API_KEY',
  'GROQ_API_KEY',
  'FIREFLIES_API_KEY',
  'NOTION_API_KEY',
  'LANGSMITH_API_KEY'
];

console.log('🔍 Validating environment configuration...\n');

let missingRequired = [];
let missingOptional = [];

// Check required variables
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingRequired.push(varName);
  } else {
    console.log(`✅ ${varName} - Set`);
  }
});

// Check optional variables
optionalVars.forEach(varName => {
  if (!process.env[varName]) {
    missingOptional.push(varName);
  } else {
    console.log(`✅ ${varName} - Set (optional)`);
  }
});

// Report results
if (missingRequired.length > 0) {
  console.log(`\n❌ Missing required variables:`);
  missingRequired.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  process.exit(1);
}

if (missingOptional.length > 0) {
  console.log(`\n⚠️  Missing optional variables (features may be limited):`);
  missingOptional.forEach(varName => {
    console.log(`   - ${varName}`);
  });
}

console.log('\n✅ Environment validation completed successfully!');
EOF

# Make executable and run
chmod +x scripts/validate-env.js
node scripts/validate-env.js
```

### Manual Validation Checklist
```bash
# Test database connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
client.from('chats').select('count').limit(1)
  .then(() => console.log('✅ Supabase connection successful'))
  .catch(err => console.log('❌ Supabase connection failed:', err.message));
"

# Test OpenAI API
node -e "
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
openai.models.list()
  .then(() => console.log('✅ OpenAI API connection successful'))
  .catch(err => console.log('❌ OpenAI API connection failed:', err.message));
"
```

## Platform-Specific Setup

### Vercel Environment Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables via CLI
vercel env add OPENAI_API_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add AUTH_SECRET production

# Or bulk import from .env file
vercel env pull .env.production
```

### Railway Environment Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create and link project
railway init
railway link

# Set environment variables
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Set from file
railway variables --file .env.production
```

### Local Development with Docker
```dockerfile
# docker-compose.yml for local development
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
```

## Troubleshooting

### Common Environment Issues

#### 1. Missing Environment Variables
```bash
# Symptoms: App crashes on startup or features don't work
# Solution: Check required variables
node scripts/validate-env.js

# Debug specific variable
echo "OPENAI_API_KEY is: ${OPENAI_API_KEY:0:8}..."
```

#### 2. Wrong Variable Names
```bash
# Common mistakes:
# ❌ SUPABASE_URL (missing NEXT_PUBLIC_)
# ✅ NEXT_PUBLIC_SUPABASE_URL

# ❌ OPENAI_KEY (missing _API_)
# ✅ OPENAI_API_KEY
```

#### 3. Environment Variable Not Loading
```bash
# Check Next.js environment variable rules
# Client-side variables MUST start with NEXT_PUBLIC_
# Server-side variables should NOT have NEXT_PUBLIC_

# Restart development server after adding new variables
pnpm dev
```

#### 4. API Key Format Issues
```bash
# OpenAI API Key format: sk-proj-...
# Anthropic API Key format: sk-ant-api03-...
# Supabase keys are JWT tokens starting with: eyJ...

# Validate key formats
node -e "
const key = process.env.OPENAI_API_KEY;
if (!key.startsWith('sk-proj-')) {
  console.log('⚠️  OpenAI API key may be in wrong format');
}
"
```

#### 5. Database Connection Issues
```bash
# Check Supabase project URL format
# Correct: https://abcdefghijklmnop.supabase.co
# Incorrect: https://supabase.co/dashboard/project/abcdefghijklmnop

# Test connection
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/chats?limit=1"
```

### Environment-Specific Debugging

#### Development Environment
```bash
# Enable debug logging
DEBUG=true pnpm dev

# Check environment loading
node -e "console.log(process.env)" | grep -E "(SUPABASE|OPENAI|AUTH)"
```

#### Production Environment
```bash
# Check Vercel deployment logs
vercel logs

# Check environment variables in Vercel dashboard
vercel env ls

# Test production environment variables
vercel dev
```

### Security Checklist
- [ ] **No API keys** in git repository
- [ ] **Different keys** for development vs production
- [ ] **Minimum required permissions** for service accounts
- [ ] **Regular key rotation** schedule established
- [ ] **Environment variable encryption** in deployment platforms
- [ ] **Access logging** enabled for sensitive operations

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Next Review**: March 2025