# API Routes Documentation

## Active Routes (After Cleanup)

### FM Global Expert System
- `/api/fm-global` - Main FM Global ASRS expert endpoint
  - Primary: Railway deployment
  - Fallback: OpenAI GPT-4

### Project Management RAG
- `/api/pm-rag-fallback` - PM assistant with meeting/document search
  - Uses Supabase for data
  - Text-based search (no vectors required)

### Data Management
- `/api/documents/upload` - Upload documents to Supabase
- `/api/documents/recent` - Get recent documents
- `/api/documents/pending` - Get pending documents
- `/api/insights/generate` - Generate AI insights from meetings

### Integrations
- `/api/fireflies/auto-sync` - Sync meeting transcripts from Fireflies
- `/api/cron/vectorize-meetings` - Background job for vectorization

### Utilities
- `/api/ai/sql` - SQL query generation assistant
- `/api/vector` - Vector operations for embeddings

## Deleted Routes (Backed up)
Total removed: 32 unused/duplicate routes
Backup location: api-routes-backup-[timestamp]/

## Migration Notes
- All active UI components have been verified to use only the kept routes
- Railway deployment handles primary FM Global traffic
- Supabase provides fallback for all critical functions
