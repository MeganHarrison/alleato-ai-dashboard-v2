# API Routes Reference Documentation

## Overview
After cleanup, this application has 11 API routes serving specific business functions. Each route is documented below with its purpose, usage, and implementation details.

---

## 1. `/api/fm-global` - FM Global ASRS Expert System

### Purpose
Main endpoint for FM Global 8-34 ASRS (Automated Storage and Retrieval Systems) sprinkler design expertise. Provides expert guidance on sprinkler requirements, regulations, and cost optimization.

### Method
`GET` - Health check  
`POST` - Chat interaction

### Request Body (POST)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What are the sprinkler requirements for shuttle ASRS?"
    }
  ],
  "sessionId": "optional-session-id",
  "userId": "optional-user-id"
}
```

### Response
```json
{
  "message": "Based on FM Global 8-34 standards...",
  "sources": ["Figure 12", "Table 8"],
  "confidence": 0.95
}
```

### Implementation Details
- **Primary**: Calls Railway deployment at `fm-global-asrs-expert-production.up.railway.app`
- **Fallback**: OpenAI GPT-4 with FM Global context
- **Tracing**: LangSmith integration for observability
- **Timeout**: 10 seconds for Railway, then fallback

### Error Handling
- Returns fallback response if Railway is down
- Graceful degradation to OpenAI
- Always returns a response (never fails completely)

---

## 2. `/api/pm-rag-fallback` - Project Management Assistant

### Purpose
RAG (Retrieval-Augmented Generation) system for project management insights. Searches meetings, documents, and generates contextual responses about projects, action items, and decisions.

### Method
`GET` - Health check  
`POST` - Query for information

### Request Body (POST)
```json
{
  "message": "What were the key decisions from last week?",
  "conversationHistory": []
}
```

### Response
```json
{
  "message": "Based on recent meetings...",
  "sources": [
    {
      "type": "meeting",
      "title": "Project Alpha Standup",
      "date": "2024-01-15"
    }
  ],
  "metadata": {
    "meetings_found": 3,
    "documents_found": 2,
    "search_type": "text-based"
  }
}
```

### Implementation Details
- **Database**: Queries Supabase for meetings, documents, insights
- **Search**: Text-based search (no vector embeddings required)
- **Context Building**: Aggregates data from multiple tables
- **AI Generation**: Uses GPT-4-turbo for response generation

### Data Sources
- `meetings` table - Meeting transcripts and summaries
- `documents` table - Project documentation
- `ai_insights` table - Generated insights
- `projects` table - Project metadata

---

## 3. `/api/insights/generate` - AI Insights Generator

### Purpose
Generates actionable insights from meetings and documents. Identifies risks, opportunities, action items, and strategic recommendations.

### Method
`POST` - Generate insights

### Request Body
```json
{
  "meetingId": "uuid-of-meeting",
  "documentId": "uuid-of-document",
  "type": "risk|opportunity|action_item|strategic"
}
```

### Response
```json
{
  "insights": [
    {
      "type": "risk",
      "title": "Timeline Risk Identified",
      "description": "Project may face delays due to...",
      "severity": "high",
      "confidence": 0.85
    }
  ],
  "processed": true,
  "count": 5
}
```

### Implementation Details
- **Processing**: Analyzes meeting transcripts and documents
- **AI Model**: GPT-4 for insight extraction
- **Storage**: Saves insights to `ai_insights` table
- **Deduplication**: Prevents duplicate insights

---

## 4. `/api/documents/upload` - Document Upload Handler

### Purpose
Handles document uploads to Supabase storage and creates database records for tracking.

### Method
`POST` - Upload document

### Request Body
```typescript
FormData with:
- file: File object
- projectId: string (optional)
- tags: string[] (optional)
```

### Response
```json
{
  "success": true,
  "document": {
    "id": "document-uuid",
    "title": "Project Charter.pdf",
    "url": "https://supabase.co/storage/...",
    "size": 1024000,
    "type": "application/pdf"
  }
}
```

### Implementation Details
- **Storage**: Supabase Storage bucket
- **File Types**: PDF, DOCX, TXT, MD
- **Size Limit**: 10MB per file
- **Metadata**: Extracts and stores file metadata

---

## 5. `/api/documents/recent` - Get Recent Documents

### Purpose
Retrieves recently uploaded or modified documents with optional filtering.

### Method
`GET` - Fetch recent documents

### Query Parameters
- `limit` - Number of documents (default: 10)
- `projectId` - Filter by project
- `type` - Filter by document type

### Response
```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "Q3 Planning.pdf",
      "uploadedAt": "2024-01-15T10:00:00Z",
      "projectId": "project-uuid",
      "size": 512000
    }
  ],
  "total": 25
}
```

---

## 6. `/api/documents/pending` - Get Pending Documents

### Purpose
Retrieves documents awaiting processing (vectorization, insight extraction).

### Method
`GET` - Fetch pending documents

### Response
```json
{
  "pending": [
    {
      "id": "uuid",
      "title": "Meeting Notes.docx",
      "status": "pending_vectorization",
      "queuedAt": "2024-01-15T09:00:00Z"
    }
  ],
  "count": 3
}
```

---

## 7. `/api/fireflies/auto-sync` - Fireflies Meeting Sync

### Purpose
Automatically syncs meeting transcripts from Fireflies.ai to the application database.

### Method
`GET` - Check sync status  
`POST` - Trigger sync

### Request Body (POST)
```json
{
  "since": "2024-01-01T00:00:00Z",
  "projectId": "optional-project-uuid"
}
```

### Response
```json
{
  "synced": 5,
  "new": 3,
  "updated": 2,
  "errors": [],
  "lastSync": "2024-01-15T12:00:00Z"
}
```

### Implementation Details
- **API**: Fireflies GraphQL API
- **Webhook**: Can receive real-time updates
- **Deduplication**: Checks `fireflies_id` to prevent duplicates
- **Processing**: Queues new meetings for vectorization

---

## 8. `/api/fireflies/sync` - Manual Fireflies Sync

### Purpose
Manual endpoint for syncing specific meetings or date ranges from Fireflies.

### Method
`POST` - Trigger manual sync

### Request Body
```json
{
  "meetingIds": ["fireflies-meeting-id"],
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

---

## 9. `/api/cron/vectorize-meetings` - Meeting Vectorization Job

### Purpose
Background job that processes meeting transcripts to generate vector embeddings for semantic search.

### Method
`POST` - Trigger vectorization

### Request Body
```json
{
  "meetingIds": ["uuid1", "uuid2"],
  "force": false
}
```

### Response
```json
{
  "processed": 5,
  "skipped": 2,
  "errors": 0,
  "duration": "45s"
}
```

### Implementation Details
- **Chunking**: Splits transcripts into ~1000 char chunks
- **Embedding Model**: OpenAI text-embedding-3-small (384 dimensions)
- **Storage**: `meeting_embeddings` table
- **Rate Limiting**: 500ms delay between API calls

---

## 10. `/api/ai/sql` - SQL Query Assistant

### Purpose
AI-powered SQL query generator and executor. Helps users write complex queries with natural language.

### Method
`POST` - Generate/execute SQL

### Request Body
```json
{
  "prompt": "Show me all meetings from last week with action items",
  "execute": true,
  "dryRun": false
}
```

### Response
```json
{
  "sql": "SELECT * FROM meetings WHERE date >= NOW() - INTERVAL '7 days' AND action_items IS NOT NULL",
  "results": [...],
  "rowCount": 5,
  "explanation": "This query retrieves meetings from the past 7 days that have action items"
}
```

### Implementation Details
- **Safety**: Read-only queries only
- **Validation**: SQL injection prevention
- **Schema Awareness**: Knows database structure
- **Explanation**: Provides query explanation

---

## 11. `/api/vector` - Vector Operations

### Purpose
Utility endpoint for vector operations including embedding generation and similarity search.

### Method
`POST` - Perform vector operation

### Request Body
```json
{
  "operation": "embed|search|similarity",
  "text": "Content to embed",
  "vectors": [[0.1, 0.2, ...]],
  "threshold": 0.7
}
```

### Response
```json
{
  "embedding": [0.1, 0.2, ...],
  "similarity": 0.85,
  "matches": [...]
}
```

### Implementation Details
- **Embedding**: Uses OpenAI text-embedding-3-small
- **Similarity**: Cosine similarity calculation
- **Caching**: Results cached for 5 minutes

---

## Error Handling Standards

All endpoints follow these error response patterns:

### Client Error (4xx)
```json
{
  "error": "Validation error",
  "message": "Missing required field: meetingId",
  "status": 400
}
```

### Server Error (5xx)
```json
{
  "error": "Internal server error",
  "message": "Database connection failed",
  "status": 500,
  "requestId": "req_123abc"
}
```

---

## Authentication & Security

### Current State
- **Public Access**: All endpoints currently public
- **CORS**: Configured for local development
- **Rate Limiting**: Not yet implemented

### Planned Security
```typescript
// Future middleware
middleware: [
  authenticate(),
  rateLimit({ requests: 100, window: '1m' }),
  validateApiKey(),
  logRequest()
]
```

---

## Environment Variables

Required environment variables for API routes:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Railway Deployments
RAILWAY_FM_GLOBAL_URL=https://fm-global-asrs-expert-production.up.railway.app

# Fireflies (optional)
FIREFLIES_API_KEY=...

# LangSmith (optional)
LANGSMITH_API_KEY=...
LANGSMITH_PROJECT=fm-global-rag
LANGSMITH_TRACING=true
```

---

## Testing Endpoints

### Quick Test Commands

```bash
# Test FM Global Expert
curl -X POST http://localhost:3000/api/fm-global \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Test PM Assistant
curl -X POST http://localhost:3000/api/pm-rag-fallback \
  -H "Content-Type: application/json" \
  -d '{"message":"What meetings do we have?"}'

# Check Recent Documents
curl http://localhost:3000/api/documents/recent?limit=5

# Health Check
curl http://localhost:3000/api/fm-global
```

---

## Monitoring & Observability

### LangSmith Tracing
- Enabled for `/api/fm-global` and `/api/pm-rag-fallback`
- Tracks: Latency, token usage, errors, fallbacks
- Dashboard: https://smith.langchain.com

### Logging
- Console logs in development
- Structured logs in production
- Error tracking with stack traces

### Metrics to Track
- Response times per endpoint
- Error rates
- Token usage (OpenAI costs)
- Cache hit rates
- Database query performance

---

## Deployment Considerations

### Railway
- FM Global Expert deployed on Railway
- Auto-scaling enabled
- SSL/TLS configured
- Environment variables set

### Vercel
- Main application on Vercel
- Edge functions for API routes
- Automatic deployments from GitHub

### Supabase
- Database and storage backend
- Row-level security enabled
- Connection pooling configured

---

## Future Enhancements

### Planned Improvements
1. **Authentication**: Add user authentication
2. **Rate Limiting**: Implement per-user limits
3. **Caching**: Redis for response caching
4. **Webhooks**: Real-time notifications
5. **GraphQL**: Alternative query interface
6. **Batch Operations**: Bulk document processing

### API Versioning Strategy
```
/api/v1/fm-global  (current)
/api/v2/fm-global  (future)
```

---

## Support & Troubleshooting

### Common Issues

**Railway Timeout**
- Symptom: FM Global falls back to OpenAI
- Fix: Check Railway deployment status

**Supabase Connection**
- Symptom: 500 errors on PM assistant
- Fix: Verify service role key

**OpenAI Rate Limits**
- Symptom: 429 errors
- Fix: Implement backoff and retry

### Debug Mode
Set `DEBUG=true` in environment for verbose logging.

---

*Last Updated: January 2025*
*Version: 1.0.0 (Post-Cleanup)*