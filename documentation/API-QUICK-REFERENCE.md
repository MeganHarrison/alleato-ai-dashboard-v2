# API Routes Quick Reference

## 🎯 Core Business Logic

### FM Global Expert (`/api/fm-global`)
**What it does:** Answers FM Global 8-34 ASRS sprinkler design questions  
**How it works:** Railway API → Falls back to OpenAI GPT-4 if Railway is down  
**Use case:** "What sprinkler spacing for shuttle ASRS with 8ft deep racks?"

### PM Assistant (`/api/pm-rag-fallback`)
**What it does:** Searches meetings & documents to answer project questions  
**How it works:** Queries Supabase → Builds context → GPT-4 generates response  
**Use case:** "What action items came from yesterday's meeting?"

### Insights Generator (`/api/insights/generate`)
**What it does:** Extracts risks, opportunities, and action items from content  
**How it works:** Analyzes text → GPT-4 identifies insights → Saves to database  
**Use case:** Auto-generate insights after each meeting upload

---

## 📄 Document Management

### Upload (`/api/documents/upload`)
**What:** Upload files to Supabase storage  
**Accepts:** PDF, DOCX, TXT, MD (max 10MB)  
**Returns:** Document ID and storage URL

### Recent (`/api/documents/recent`)
**What:** Get recently uploaded documents  
**Query:** `?limit=10&projectId=uuid`  
**Returns:** List of recent documents with metadata

### Pending (`/api/documents/pending`)
**What:** Get documents awaiting processing  
**Returns:** Documents needing vectorization or insights

---

## 🔄 Integrations

### Fireflies Sync (`/api/fireflies/auto-sync`)
**What:** Pull meeting transcripts from Fireflies.ai  
**How:** GraphQL API → Parse transcript → Save to database  
**Schedule:** Can run as cron job or manual trigger

### Meeting Vectorization (`/api/cron/vectorize-meetings`)
**What:** Generate embeddings for semantic search  
**How:** Chunk text → OpenAI embeddings → Store vectors  
**When:** After new meetings are uploaded

---

## 🛠️ Utilities

### SQL Assistant (`/api/ai/sql`)
**What:** Natural language to SQL queries  
**How:** Understand request → Generate SQL → Execute safely  
**Example:** "Show all high-priority action items" → SQL query

### Vector Operations (`/api/vector`)
**What:** Embedding generation and similarity search  
**How:** Text → OpenAI embedding → Cosine similarity  
**Use:** Powers semantic search features

---

## 🔑 Required Environment Variables

```bash
# Core APIs
OPENAI_API_KEY=sk-...                    # OpenAI for GPT-4 and embeddings
NEXT_PUBLIC_SUPABASE_URL=https://...     # Database and storage
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # Admin access to Supabase

# Deployments
RAILWAY_FM_GLOBAL_URL=https://...        # Railway deployment URL

# Optional
FIREFLIES_API_KEY=...                    # For meeting sync
LANGSMITH_API_KEY=...                    # For tracing
```

---

## 🧪 Test Each Endpoint

```bash
# Quick health checks
curl http://localhost:3000/api/fm-global
curl http://localhost:3000/api/pm-rag-fallback

# Test chat
curl -X POST http://localhost:3000/api/fm-global \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Get recent documents
curl http://localhost:3000/api/documents/recent?limit=5
```

---

## 🏗️ Architecture

```
User Request
    ↓
API Route (Next.js)
    ↓
Primary Service (Railway/Supabase)
    ↓ (if fails)
Fallback (OpenAI Direct)
    ↓
Response
```

---

## ⚠️ Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| Railway timeout | FM Global uses fallback | Check Railway deployment |
| No search results | PM assistant returns generic | Run vectorization script |
| 500 errors | Database connection failed | Check Supabase service key |
| 429 errors | Too many requests | Add rate limiting |

---

## 📊 Usage Patterns

### Most Used Endpoints
1. `/api/fm-global` - Main expert system
2. `/api/pm-rag-fallback` - Project queries
3. `/api/documents/upload` - Document management

### Data Flow
```
Fireflies → Sync API → Database → Vectorization → Search API → Chat UI
```

### Performance Targets
- Response time: < 2s
- Fallback activation: < 10s
- Search results: < 1s
- Upload processing: < 30s

---

## 🚀 Next Steps

1. **Add Authentication** - Secure endpoints with user auth
2. **Rate Limiting** - Prevent abuse
3. **Caching Layer** - Improve response times
4. **Monitoring** - Track usage and errors
5. **API Versioning** - Prepare for v2

---

*Quick reference for developers working with Alleato AI Dashboard API routes*  
*For detailed documentation, see API-ROUTES-REFERENCE.md*