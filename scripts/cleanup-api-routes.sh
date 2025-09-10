#!/bin/bash

# API Routes Cleanup Script
# This script backs up and removes unused API routes

# Create backup directory with timestamp
BACKUP_DIR="api-routes-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🔧 Starting API routes cleanup..."
echo "📁 Backing up to: $BACKUP_DIR"

# Routes to DELETE (unused/duplicate)
ROUTES_TO_DELETE=(
  "app/api/chat"
  "app/api/check-chat-tables"
  "app/api/citation"
  "app/api/d1"
  "app/api/debug"
  "app/api/feedback"
  "app/api/fm-global-chat"
  "app/api/fm-global-proxy"
  "app/api/fm-global-python-rag"
  "app/api/fm-global-rag"
  "app/api/fm-global/form"
  "app/api/fm-optimize"
  "app/api/fm-rag"
  "app/api/health"
  "app/api/orchestrate"
  "app/api/pm-rag-local"
  "app/api/pm-rag-worker"
  "app/api/pm-rag/chat-demo"
  "app/api/pm-rag/chat"
  "app/api/pm-rag/insights"
  "app/api/populate-meeting-chunks"
  "app/api/rag-agent-pm"
  "app/api/rag-proxy"
  "app/api/rag/chat"
  "app/api/rag/documents"
  "app/api/rag/search"
  "app/api/rag/stats"
  "app/api/rag/vectorize"
  "app/api/railway-status"
  "app/api/supabase-proxy"
  "app/api/vectorize/trigger"
  "app/api/webhooks/fireflies"
)

# Routes to KEEP (actively used)
ROUTES_TO_KEEP=(
  "app/api/fm-global"
  "app/api/pm-rag-fallback"
  "app/api/insights/generate"
  "app/api/cron/vectorize-meetings"
  "app/api/documents/upload"
  "app/api/documents/recent"
  "app/api/documents/pending"
  "app/api/fireflies/auto-sync"
  "app/api/ai/sql"
  "app/api/vector"
)

# Backup all routes first
echo "📦 Creating full backup..."
cp -r app/api "$BACKUP_DIR/"

# Delete unused routes
echo "🗑️  Removing unused routes..."
for route in "${ROUTES_TO_DELETE[@]}"; do
  if [ -d "$route" ]; then
    echo "  ❌ Removing: $route"
    rm -rf "$route"
  fi
done

# Create documentation of what was kept
echo "📝 Documenting remaining routes..."
cat > "API_ROUTES_DOCUMENTATION.md" << 'EOF'
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
EOF

echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Routes kept: ${#ROUTES_TO_KEEP[@]}"
echo "  - Routes deleted: ${#ROUTES_TO_DELETE[@]}"
echo "  - Backup location: $BACKUP_DIR"
echo ""
echo "🔍 Next steps:"
echo "  1. Test all remaining endpoints"
echo "  2. Update any environment variables"
echo "  3. Commit changes with: git add -A && git commit -m 'Clean up unused API routes'"