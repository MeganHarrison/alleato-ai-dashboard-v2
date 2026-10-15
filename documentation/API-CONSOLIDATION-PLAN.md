# API Routes Consolidation Plan

## Current Situation
- **47 total API routes** in the codebase
- **Only ~10-15 actively used** based on code analysis
- **Multiple duplicate implementations** of the same functionality
- **Security risk** from unmaintained endpoints
- **Confusion** about which routes to use

## Recommended Final Structure

### 1. **Primary Business Logic** (Keep These)
```
/api/
├── fm-global/          # FM Global ASRS Expert System
│   └── route.ts        # Railway primary, OpenAI fallback
├── pm-assistant/       # Project Management Assistant  
│   └── route.ts        # Consolidate all PM RAG variants
├── insights/           # AI Insights Generation
│   └── route.ts        # Generate insights from meetings/docs
```

### 2. **Data Management** (Keep These)
```
/api/
├── documents/          # Document operations
│   ├── upload/         # Upload new documents
│   ├── recent/         # Get recent documents
│   └── pending/        # Get pending documents
├── meetings/           # Meeting operations
│   └── vectorize/      # Vectorize meeting content
```

### 3. **Integrations** (Keep These)
```
/api/
├── fireflies/          # Fireflies.ai integration
│   └── sync/           # Sync meeting transcripts
├── sql-assistant/      # SQL query generator
│   └── route.ts        # AI-powered SQL help
```

### 4. **Infrastructure** (Create New)
```
/api/
├── health/             # Health check endpoint
│   └── route.ts        # Simple status check
└── version/            # API version info
    └── route.ts        # Version and capabilities
```

## Routes to Delete (32 total)

### Duplicate FM Global Implementations
- `/api/fm-global-chat` ❌
- `/api/fm-global-proxy` ❌  
- `/api/fm-global-python-rag` ❌
- `/api/fm-global-rag` ❌
- `/api/fm-global/form` ❌
- `/api/fm-optimize` ❌
- `/api/fm-rag` ❌

### Duplicate PM RAG Implementations  
- `/api/pm-rag-local` ❌
- `/api/pm-rag-worker` ❌
- `/api/pm-rag/chat-demo` ❌
- `/api/pm-rag/chat` ❌
- `/api/rag-agent-pm` ❌

### Old RAG System (Replaced)
- `/api/rag/chat` ❌
- `/api/rag/documents` ❌
- `/api/rag/search` ❌
- `/api/rag/stats` ❌
- `/api/rag/vectorize` ❌
- `/api/rag-proxy` ❌

### Unused/Debug Routes
- `/api/chat` ❌
- `/api/check-chat-tables` ❌
- `/api/citation` ❌
- `/api/d1` ❌
- `/api/debug` ❌
- `/api/feedback` ❌
- `/api/health` ❌ (will recreate cleaner version)
- `/api/orchestrate` ❌
- `/api/populate-meeting-chunks` ❌
- `/api/railway-status` ❌
- `/api/supabase-proxy` ❌
- `/api/vector` ❌ (integrate into main routes)
- `/api/webhooks/fireflies` ❌

## Benefits of Consolidation

### 1. **Security**
- Reduced attack surface
- No forgotten endpoints with vulnerabilities
- Easier to audit and monitor

### 2. **Maintainability**  
- Clear purpose for each route
- No confusion about which to use
- Easier to update and test

### 3. **Performance**
- Smaller bundle size
- Faster builds
- Less memory usage

### 4. **Developer Experience**
- Clear documentation
- Obvious naming conventions
- Single source of truth

## Implementation Steps

### Step 1: Backup Everything
```bash
# Create timestamped backup
cp -r app/api api-backup-$(date +%Y%m%d)
```

### Step 2: Run Cleanup Script
```bash
chmod +x scripts/cleanup-api-routes.sh
./scripts/cleanup-api-routes.sh
```

### Step 3: Consolidate Remaining Routes
Merge similar functionality:
- Combine all PM RAG variants into `/api/pm-assistant`
- Ensure Railway fallback is in main `/api/fm-global`
- Merge vector operations into main routes

### Step 4: Test Everything
```bash
# Test each endpoint
curl http://localhost:3000/api/fm-global
curl http://localhost:3000/api/pm-assistant
curl http://localhost:3000/api/insights
```

### Step 5: Update Environment Variables
Ensure `.env.local` only has variables for active routes:
```env
# Active API Keys
OPENAI_API_KEY=...
RAILWAY_FM_GLOBAL_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Remove unused like:
# RAILWAY_PM_RAG_URL (not working anyway)
# D1_TOKEN (not using Cloudflare D1)
```

## Risk Mitigation

1. **Full Backup**: Complete backup before deletion
2. **Git History**: Can always recover from git
3. **Staged Rollout**: Test in development first
4. **Documentation**: Clear docs on what changed
5. **Monitoring**: Watch for 404s after deployment

## Expected Outcome

### Before: 47 routes 😱
- Confusing
- Error-prone
- Security risk
- Slow builds

### After: ~10 routes ✅
- Clear purpose
- Well-documented
- Secure
- Fast

## Decision

**Yes, absolutely clean this up!** The benefits far outweigh the risks, especially with proper backups. This will make your codebase much more maintainable and secure.