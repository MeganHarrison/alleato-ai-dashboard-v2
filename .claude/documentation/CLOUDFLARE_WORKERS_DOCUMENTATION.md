# Cloudflare Workers Documentation

## Overview

Alleato AI uses a sophisticated multi-worker architecture on Cloudflare's edge platform to provide intelligent document management, search capabilities, and business insights. The system processes documents stored in R2 buckets, extracts metadata using AI, stores structured data in D1 databases, and provides both traditional search and AI-powered semantic search through AutoRAG.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   R2 Storage    │────▶│   API Worker    │────▶│   D1 Database   │
│  (Documents)    │     │ (Sync & Extract)│     │   (Metadata)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Next.js App    │◀────│ Search API      │◀────│  Sync Worker    │
│   (Frontend)    │     │   (Query)       │     │  (Analytics)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                                 │
         └─────────────────────┬───────────────────────────┘
                               ▼
                        ┌─────────────────┐
                        │   AutoRAG API   │
                        │ (Semantic Search)│
                        └─────────────────┘
```

## Worker Components

### 1. Main Application Worker

**File**: `wrangler.jsonc` (root)  
**Name**: `alleato-ai`  
**Purpose**: Hosts the Next.js application on Cloudflare Workers

**Configuration**:
```json
{
  "name": "alleato-ai",
  "main": ".open-next/worker.js",
  "compatibility_date": "2025-03-07",
  "compatibility_flags": ["nodejs_compat"],
  "binding": {
    "name": "ASSETS",
    "service": "alleato-ai-assets"
  }
}
```

**Environment Variables**:
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account identifier
- `CLOUDFLARE_API_TOKEN`: API token for Cloudflare services
- `ALLEATO_DATABASE_ID`: D1 database identifier
- `R2_BUCKET_NAME`: R2 bucket name for document storage
- `FIREFLIES_API_KEY`: API key for Fireflies.ai integration

### 2. API Worker

**Files**: 
- `workers/api-worker.ts`
- `workers/api-worker.wrangler.jsonc`

**Name**: `alleato-api-worker`  
**Purpose**: Synchronizes documents from R2 to D1 with AI-powered metadata extraction

**Key Features**:
- Full and incremental document synchronization
- AI-powered metadata extraction using Cloudflare AI (Llama 3.1-8b)
- Automatic tagging and categorization
- Batch processing with rate limiting
- Analytics tracking

**Endpoints**:
- `GET /sync-all` - Synchronize all documents from R2
- `GET /sync-recent` - Sync documents modified in last 24 hours
- `GET /health` - Health check endpoint

**Metadata Extraction**:
1. **Structured Data**: Meeting ID, date, duration, participants, project
2. **AI Analysis**: Summary, priority, status, department, action items, decisions
3. **Search Optimization**: Keywords, tags, searchable text generation

**Configuration**:
```json
{
  "name": "alleato-api-worker",
  "main": "src/api-worker.ts",
  "compatibility_date": "2025-02-11",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "ENVIRONMENT": "production"
  },
  "d1_databases": [{
    "binding": "ALLEATO_DB",
    "database_name": "alleato",
    "database_id": "fc7c9a6d-ca65-4768-b3f9-07ec5afb38c5"
  }],
  "r2_buckets": [{
    "binding": "ALLEATO_DOCUMENTS",
    "bucket_name": "alleato"
  }],
  "ai": {
    "binding": "AI"
  }
}
```

### 3. Search API Worker

**Files**: 
- `workers/search-api-worker.ts`
- `workers/search-api-worker.wrangler.jsonc`

**Name**: `alleato-search-api`  
**Purpose**: Provides search API for the frontend application

**Key Features**:
- Full-text search across documents
- Advanced filtering (project, department, date range, type)
- Relevance scoring for search results
- AI-powered response generation
- CORS support for frontend integration

**Endpoints**:
- `POST /search` - Search documents with filters
  - Query parameters: query, project, department, dateFrom, dateTo, docType, limit

**Search Algorithm**:
1. Builds SQL query with filters
2. Applies relevance scoring (title matches weighted higher)
3. Retrieves documents from D1
4. Generates conversational AI response
5. Returns structured results + AI summary

**Configuration**:
```json
{
  "name": "alleato-search-api",
  "main": "src/search-api-worker.ts",
  "compatibility_date": "2025-02-11",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [{
    "binding": "ALLEATO_DB",
    "database_name": "alleato",
    "database_id": "fc7c9a6d-ca65-4768-b3f9-07ec5afb38c5"
  }],
  "ai": {
    "binding": "AI"
  }
}
```

### 4. Sync Worker

**Files**: 
- `workers/sync-worker.ts`
- `workers/sync-worker.wrangler.jsonc`

**Name**: `alleato-sync-worker`  
**Purpose**: Scheduled worker for analytics and project insights

**Key Features**:
- Project management dashboard
- Leadership analytics
- Task and meeting tracking
- Financial metrics calculation
- AI-powered risk analysis
- Scheduled execution (every 6 hours)

**Endpoints**:
- `GET /projects` - List active projects with metrics
- `GET /project-insight?project={name}` - Detailed project analysis
- `GET /search?q={query}` - Hybrid search across projects/meetings/tasks
- `GET /leadership-dashboard` - Executive metrics and KPIs

**Scheduled Trigger**:
```json
{
  "triggers": {
    "crons": ["0 */6 * * *"]
  }
}
```

**Configuration**:
```json
{
  "name": "alleato-sync-worker",
  "main": "src/sync-worker.ts",
  "compatibility_date": "2025-02-11",
  "compatibility_flags": ["nodejs_compat"],
  "triggers": {
    "crons": ["0 */6 * * *"]
  },
  "d1_databases": [{
    "binding": "ALLEATO_DB",
    "database_name": "alleato",
    "database_id": "fc7c9a6d-ca65-4768-b3f9-07ec5afb38c5"
  }],
  "r2_buckets": [{
    "binding": "ALLEATO_DOCUMENTS",
    "bucket_name": "alleato"
  }],
  "ai": {
    "binding": "AI"
  }
}
```

### 5. R2-D1 Sync Worker (Duplicate)

**File**: `workers/r2-d1-sync-worker.ts`

**Note**: This worker contains identical code to the API Worker and appears to be redundant. Consider removing this file to avoid confusion.

## Database Schema

### D1 Database: `alleato`

**Tables**:

#### `meetings` Table
Stores document metadata with rich search and analytics capabilities.

```sql
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  duration REAL,
  participants TEXT,
  fireflies_id TEXT,
  searchable_text TEXT,
  summary TEXT,
  project TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  department TEXT,
  action_items TEXT,
  decisions TEXT,
  keywords TEXT,
  tags TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_meetings_date ON meetings(date);
CREATE INDEX idx_meetings_project ON meetings(project);
CREATE INDEX idx_meetings_searchable ON meetings(searchable_text);
CREATE INDEX idx_meetings_priority_status ON meetings(priority, status);
```

#### `sync_analytics` Table
Tracks synchronization operations for monitoring and debugging.

```sql
CREATE TABLE IF NOT EXISTS sync_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_type TEXT NOT NULL,
  documents_processed INTEGER DEFAULT 0,
  documents_added INTEGER DEFAULT 0,
  documents_updated INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT DEFAULT 'running',
  error_details TEXT
);
```

## Supporting Files

### Configuration Files

1. **`schema/setup-d1-tables.sql`**: Database schema definition
2. **`lib/workers-reference/metadata_extraction_system.ts`**: Reference implementation for metadata extraction
3. **`lib/workers-reference/rag_worker_implementation.ts`**: Reference implementation for RAG system

### Deployment Scripts

Located in `scripts/` directory:

- **`deploy-search-api.sh`**: Deploys search API worker
- **`setup-and-sync.sh`**: Initial setup and document sync
- **`sync-documents.sh`**: Manual document synchronization
- **`run-sync.sh`**: Triggers sync operation

### Utility Scripts

Located in `scripts/workers/`:

- **`direct-d1-setup.js`**: Direct D1 database setup
- **`execute-d1-sql.js`**: Execute arbitrary SQL on D1
- **`test-sync-locally.js`**: Local testing for sync operations
- **`import-csv-to-d1.js`**: Import CSV data to D1
- **`verify-d1-database.js`**: Verify database integrity

## Integration with AutoRAG

While the workers prepare and structure data, the actual AutoRAG integration happens at the Next.js API level:

1. **Document Preparation**: Workers sync documents to D1 with rich metadata
2. **API Route**: `/api/chat/route.ts` queries AutoRAG directly
3. **Hybrid Approach**: Combines structured search (D1) with semantic search (AutoRAG)

## Environment Configuration

### Development Environment
```bash
# .env.local
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
ALLEATO_DATABASE_ID=fc7c9a6d-ca65-4768-b3f9-07ec5afb38c5
R2_BUCKET_NAME=alleato
FIREFLIES_API_KEY=your_fireflies_key
```

### Production Deployment
All workers support multi-environment deployment:
- Development: `wrangler deploy --env development`
- Staging: `wrangler deploy --env staging`
- Production: `wrangler deploy --env production`

## Best Practices

1. **Rate Limiting**: API Worker implements batch processing with delays
2. **Error Handling**: Comprehensive try-catch blocks with detailed logging
3. **Analytics**: Track sync operations for monitoring
4. **Security**: Use environment variables for sensitive data
5. **Performance**: Database indexes for fast queries
6. **Observability**: All workers have observability enabled

## Monitoring and Debugging

1. **Health Checks**: Use `/health` endpoints
2. **Sync Analytics**: Query `sync_analytics` table
3. **Cloudflare Dashboard**: Monitor worker metrics
4. **Wrangler Tail**: Real-time log streaming
   ```bash
   wrangler tail --name alleato-api-worker
   ```

## Future Improvements

1. **Remove Duplicate Worker**: Delete `r2-d1-sync-worker.ts`
2. **Add Vector Search**: Integrate Cloudflare Vectorize for embeddings
3. **Enhanced Caching**: Implement edge caching for frequent queries
4. **Real-time Updates**: Add WebSocket support for live updates
5. **Advanced Analytics**: Expand business intelligence capabilities

## Troubleshooting

### Common Issues

1. **Sync Failures**: Check R2 bucket permissions and D1 database connectivity
2. **Search Performance**: Verify database indexes are created
3. **AI Extraction Errors**: Monitor AI quota usage
4. **CORS Issues**: Ensure proper CORS headers in workers

### Debug Commands

```bash
# Check worker logs
wrangler tail --name alleato-api-worker

# Test D1 queries
wrangler d1 execute alleato --command "SELECT COUNT(*) FROM meetings"

# List R2 objects
wrangler r2 object list alleato

# Deploy specific environment
wrangler deploy --env development
```