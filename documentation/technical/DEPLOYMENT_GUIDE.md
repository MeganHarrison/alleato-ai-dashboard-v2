# Deployment Guide - Unified RAG System

## Overview
This guide covers deploying the unified RAG system with:
- **Vercel**: Next.js frontend and pm-rag-vectorize (Cloudflare Worker)
- **Render**: Python RAG agent with vectorization API

## Architecture
```
Fireflies/Documents → pm-rag-vectorize (Vercel) → documents table → rag-agent-pm (Render) → vectorized chunks
```

## Prerequisites
- Supabase database with pgvector extension
- API Keys: OpenAI (required), Anthropic, Cohere (optional)
- Vercel account
- Render account

## Part 1: Database Setup

### 1.1 Run Migrations
```bash
# Connect to your Supabase/PostgreSQL database
psql $DATABASE_URL -f monorepo-agents/rag-agent-pm/sql/unified_schema.sql
psql $DATABASE_URL -f monorepo-agents/rag-agent-pm/sql/conversation_memory.sql
```

### 1.2 Verify Tables
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('documents', 'chunks', 'conversations', 'conversation_messages');
```

## Part 2: Deploy RAG Agent to Render

### 2.1 Prepare Repository
```bash
cd monorepo-agents/rag-agent-pm
git init
git add .
git commit -m "Initial RAG agent deployment"
git remote add origin YOUR_GIT_REPO
git push -u origin main
```

### 2.2 Create Render Services

1. **Main RAG Agent**:
   - Go to Render Dashboard → New → Web Service
   - Connect GitHub repo
   - Settings:
     ```
     Name: rag-agent-api
     Branch: main
     Root Directory: monorepo-agents/rag-agent-pm
     Runtime: Python 3
     Build Command: pip install -r requirements.txt && python -c 'import nltk; nltk.download("punkt")'
     Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
     ```

2. **Vectorization API**:
   - Create another Web Service
   - Settings:
     ```
     Name: rag-vectorization-api
     Branch: main
     Root Directory: monorepo-agents/rag-agent-pm
     Runtime: Python 3
     Build Command: pip install -r requirements.txt && python -c 'import nltk; nltk.download("punkt")'
     Start Command: uvicorn vectorization_api:app --host 0.0.0.0 --port $PORT
     ```

### 2.3 Configure Environment Variables

For both services, add:
```
DATABASE_URL=postgresql://...your_supabase_url...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-... (optional)
COHERE_API_KEY=... (optional for reranking)
GROQ_API_KEY=... (optional)
```

### 2.4 Deploy
Click "Create Web Service" and wait for deployment.

Note the service URLs:
- Main API: `https://rag-agent-api-xxxx.onrender.com`
- Vectorization: `https://rag-vectorization-api-xxxx.onrender.com`

## Part 3: Deploy Frontend to Vercel

### 3.1 Update Environment Variables

Update `.env.local`:
```bash
# RAG Agent URLs (from Render)
NEXT_PUBLIC_RAG_AGENT_URL=https://rag-agent-api-xxxx.onrender.com
RAG_VECTORIZATION_URL=https://rag-vectorization-api-xxxx.onrender.com

# Existing variables
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
```

### 3.2 Update pm-rag-vectorize Configuration

In `monorepo-agents/pm-rag-vectorize/src/database-service-updated.ts`, update the RAG agent URL:
```typescript
// Line 119 - Update with your Render URL
const ragAgentUrl = process.env.RAG_VECTORIZATION_URL || 'https://rag-vectorization-api-xxxx.onrender.com';
```

### 3.3 Fix TypeScript Errors (if any)

```bash
# Check for errors
npm run type-check

# If errors exist, fix them or use:
npm run build -- --no-lint
```

### 3.4 Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod

# Or push to GitHub and auto-deploy
git add .
git commit -m "Deploy unified RAG system"
git push origin main
```

### 3.5 Configure Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_RAG_AGENT_URL=https://rag-agent-api-xxxx.onrender.com
RAG_VECTORIZATION_URL=https://rag-vectorization-api-xxxx.onrender.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
```

## Part 4: Deploy pm-rag-vectorize (Cloudflare Worker)

### 4.1 Configure Wrangler

In `monorepo-agents/pm-rag-vectorize/wrangler.toml`:
```toml
name = "pm-rag-vectorize"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
RAG_VECTORIZATION_URL = "https://rag-vectorization-api-xxxx.onrender.com"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

### 4.2 Deploy Worker

```bash
cd monorepo-agents/pm-rag-vectorize
npm install
npx wrangler publish

# Or deploy to Vercel Edge Functions
vercel --prod
```

## Part 5: Testing the Deployment

### 5.1 Test Vectorization API
```bash
curl https://rag-vectorization-api-xxxx.onrender.com/health
```

### 5.2 Test Main RAG Agent
```bash
curl https://rag-agent-api-xxxx.onrender.com/health
```

### 5.3 Test Document Ingestion
```bash
# Create a test document
curl -X POST https://rag-vectorization-api-xxxx.onrender.com/api/vectorize \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "test-doc-001",
    "document_type": "meeting",
    "use_intelligent_chunking": true
  }'
```

### 5.4 Test Search
```bash
curl -X POST https://rag-agent-api-xxxx.onrender.com/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test query",
    "limit": 5
  }'
```

## Part 6: Monitor and Maintain

### 6.1 Check Logs

**Render:**
- Dashboard → Service → Logs

**Vercel:**
- Dashboard → Functions → Logs

### 6.2 Database Monitoring
```sql
-- Check document processing status
SELECT processing_status, COUNT(*) 
FROM documents 
GROUP BY processing_status;

-- Check chunk counts
SELECT COUNT(*) as total_chunks,
       COUNT(DISTINCT document_id) as total_documents
FROM chunks;

-- Check conversation memory
SELECT COUNT(*) as total_conversations,
       SUM(total_messages) as total_messages
FROM conversations;
```

### 6.3 Performance Tuning

1. **Increase Render instances** for high load
2. **Add caching** in Cloudflare Worker
3. **Optimize indexes** in PostgreSQL
4. **Adjust chunk sizes** based on your data

## Troubleshooting

### TypeScript Errors
```bash
# Skip type checking temporarily
npm run build -- --no-lint

# Or fix in tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

### Database Connection Issues
- Verify DATABASE_URL format
- Check SSL requirements
- Ensure pgvector extension is installed

### API Connection Failures
- Check CORS settings
- Verify environment variables
- Check service logs

### Memory Issues on Render
- Upgrade to larger instance
- Implement request queuing
- Reduce batch sizes

## Success Checklist

- [ ] Database migrations completed
- [ ] RAG Agent deployed to Render
- [ ] Vectorization API deployed to Render
- [ ] Environment variables configured
- [ ] Frontend deployed to Vercel
- [ ] Worker deployed (Cloudflare or Vercel)
- [ ] Health checks passing
- [ ] Test document vectorized
- [ ] Search functionality working
- [ ] Conversation memory active

## Next Steps

1. **Set up monitoring** with Datadog or New Relic
2. **Configure auto-scaling** on Render
3. **Add authentication** if needed
4. **Set up backup** for conversation memory
5. **Configure webhooks** from Fireflies

---

Your unified RAG system is now deployed! 🚀

For support:
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs