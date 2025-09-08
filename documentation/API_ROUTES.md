# API Routes Documentation

This document provides a comprehensive overview of all API routes in the application.

## Overview

All API routes are located in the `/app/api/` directory and follow Next.js 13+ App Router conventions. Routes use both REST and streaming patterns depending on functionality.

## Core Chat & AI Routes

### `/api/chat` - Main Chat Interface
**File**: `/app/api/chat/route.ts`
**Method**: POST
**Purpose**: Primary AI-powered chat with RAG integration
**Features**:
- Streaming responses with AI SDK 5
- Meeting transcript search via RAG
- Project management knowledge integration
- Chat history persistence
- Tool calling for meeting searches

**Usage**:
- `/components/homepage-chat.tsx`
- `/components/ai-sdk5/main-chat.tsx`
- `/agents/ultimate-pm-agent/app/chat/page.tsx`

**Request Format**:
```json
{
  "messages": [...],
  "chatId": "optional"
}
```

### `/api/pm-chat` - Project Manager Chat
**File**: `/app/api/pm-chat/route.ts`
**Method**: POST
**Purpose**: Specialized project management assistant
**Features**:
- Project-specific AI responses
- Integration with PM actions

**Usage**:
- `/components/ai-sdk5/debug-enhanced-chat.tsx`
- `/components/ai-sdk5/enhanced-chat-v5.tsx`

### `/api/meeting-intelligence/chat` - Meeting Intelligence
**File**: `/app/api/meeting-intelligence/chat/route.ts`
**Method**: POST
**Purpose**: Meeting-focused AI conversations
**Features**:
- Meeting analysis and insights
- Context-aware responses

**Usage**:
- `/components/meeting-intelligence-chat.tsx`

## RAG (Retrieval Augmented Generation) Routes

### `/api/rag/chat` - RAG Chat Interface
**File**: `/app/api/rag/chat/route.ts`
**Method**: POST
**Purpose**: Document-based RAG chat system
**Usage**: `/app/(project-manager)/rag-system/chat/page.tsx`

### `/api/rag/documents` - Document Management
**File**: `/app/api/rag/documents/route.ts`
**Methods**: GET, POST, DELETE
**Purpose**: Manage documents in RAG system

### `/api/rag/documents/[id]` - Single Document
**File**: `/app/api/rag/documents/[id]/route.ts`
**Methods**: GET, PUT, DELETE
**Purpose**: Individual document operations

### `/api/rag/documents/upload` - Document Upload
**File**: `/app/api/rag/documents/upload/route.ts`
**Method**: POST
**Purpose**: Upload documents for processing
**Usage**: `/app/(project-manager)/rag-system/page.tsx`

### `/api/rag/search` - RAG Search
**File**: `/app/api/rag/search/route.ts`
**Method**: POST
**Purpose**: Search through processed documents

### `/api/rag/stats` - RAG Statistics
**File**: `/app/api/rag/stats/route.ts`
**Method**: GET
**Purpose**: System statistics and health
**Usage**: `/app/(project-manager)/rag-system/stats/page.tsx`

### `/api/rag/vectorize/[documentId]` - Document Vectorization
**File**: `/app/api/rag/vectorize/[documentId]/route.ts`
**Method**: POST
**Purpose**: Process documents into vector embeddings

### `/api/rag/vectorize/status/[jobId]` - Vectorization Status
**File**: `/app/api/rag/vectorize/status/[jobId]/route.ts`
**Method**: GET
**Purpose**: Check processing job status

## FM Global & Domain-Specific Routes

### `/api/fm-global-rag` - FM Global RAG System
**File**: `/app/api/fm-global-rag/route.ts`
**Method**: POST
**Purpose**: FM Global document search and analysis
**Features**:
- Specialized for FM Global documentation
- Risk assessment and safety guidelines

**Usage**:
- `/components/FMGlobalRAGChat.tsx`
- Middleware allows public access

### `/api/fm-rag` - FM RAG Interface
**File**: `/app/api/fm-rag/route.ts`
**Method**: POST
**Purpose**: Alternative FM documentation interface

### `/api/fm-docs/search` - FM Document Search
**File**: `/app/api/fm-docs/search/route.ts`
**Method**: GET/POST
**Purpose**: Search FM documentation directly

### `/api/fm-optimize` - FM Optimization
**File**: `/app/api/fm-optimize/route.ts`
**Purpose**: FM Global optimization recommendations

## Project Manager Assistant Routes

### `/api/pm-rag/chat` - PM RAG Chat
**File**: `/app/api/pm-rag/chat/route.ts`
**Method**: POST
**Purpose**: Project manager with RAG integration

### `/api/pm-rag/chat-demo` - PM RAG Demo
**File**: `/app/api/pm-rag/chat-demo/route.ts`
**Method**: POST
**Purpose**: Demo version of PM RAG chat
**Usage**: `/components/pm-rag/rag-chat-interface.tsx`

### `/api/pm-rag/insights` - PM Insights
**File**: `/app/api/pm-rag/insights/route.ts`
**Method**: GET
**Purpose**: Retrieve project management insights
**Usage**: `/components/pm-rag/ai-insights-display.tsx`

### `/api/pm-rag/insights/[id]/resolve` - Resolve Insight
**File**: `/app/api/pm-rag/insights/[id]/resolve/route.ts`
**Method**: POST
**Purpose**: Mark insight as resolved

### `/api/insights/generate` - AI Insights Generation
**File**: `/app/api/insights/generate/route.ts`
**Methods**: GET, POST
**Purpose**: Generate and retrieve AI-powered document insights
**Features**:
- Batch processing of multiple documents
- Single document insight generation
- Insight status tracking
- Integration with InsightGenerator agent

**Usage**:
- `/app/(dashboard)/ai-insights/page.tsx` (planned backend integration)
- `/components/pm-rag/ai-insights-display.tsx`

**Request Format (POST)**:
```json
{
  "documentId": "uuid",
  "documentIds": ["uuid1", "uuid2"],
  "source": "manual"
}
```

**Response Format**:
```json
{
  "success": true,
  "data": [...insights],
  "count": 10
}
```

### `/api/pm-assistant-gpt5` - GPT-5 PM Assistant
**File**: `/app/api/pm-assistant-gpt5/route.ts`
**Purpose**: Advanced PM assistant with latest model

### `/api/pm-rag-worker` - PM RAG Worker
**File**: `/app/api/pm-rag-worker/route.ts`
**Purpose**: Background processing for PM RAG
**Usage**: `/components/pm-assistant-chat-gpt5.tsx`

## System & Utility Routes

### `/api/cron/vectorize-meetings` - Meeting Vectorization
**File**: `/app/api/cron/vectorize-meetings/route.ts`
**Methods**: GET, POST
**Purpose**: Background job to vectorize meeting transcripts
**Features**:
- Processes meeting transcripts into searchable embeddings
- Can be triggered manually or via cron

**Usage**:
- `/components/meeting-upload.tsx`
- `/app/(pages)/trigger-vectorization/page.tsx`
- Various E2E tests

### `/api/populate-meeting-chunks` - Meeting Data Population
**File**: `/app/api/populate-meeting-chunks/route.ts`
**Purpose**: Populate meeting chunks for testing/development

### `/api/vector` - Vector Operations
**File**: `/app/api/vector/route.ts`
**Method**: POST
**Purpose**: Generic vector operations and testing
**Usage**: `/app/(pages)/team-chat/page.tsx`

### `/api/d1` - Cloudflare D1 Integration
**File**: `/app/api/d1/route.ts`
**Methods**: GET, POST
**Purpose**: Cloudflare D1 database operations
**Usage**: Various D1-related tests and components

## Database & Management Routes

### `/api/check-chat-tables` - Database Health Check
**File**: `/app/api/check-chat-tables/route.ts`
**Purpose**: Verify chat table structure and health

### `/api/supabase-proxy/[...path]` - Supabase Proxy
**File**: `/app/api/supabase-proxy/[...path]/route.ts`
**Purpose**: Proxy requests to Supabase management API
**Usage**: Administrative operations via `/lib/management-api.ts`

## AI & Processing Routes

### `/api/ai/sql` - AI SQL Generation
**File**: `/app/api/ai/sql/route.ts`
**Method**: POST
**Purpose**: Generate SQL queries using AI
**Usage**: `/components/sql-editor.tsx`

### `/api/citation` - Citation Management
**File**: `/app/api/citation/route.ts`
**Purpose**: Handle citations and references
**Usage**: `/app/(pages)/persistent-chat/page.tsx`

### `/api/orchestrate` - Agent Orchestration
**File**: `/app/api/orchestrate/route.ts`
**Method**: POST
**Purpose**: Coordinate multiple AI agents
**Dependencies**: `/app/actions/agent-orchestrator.ts`

## Webhook Routes

### `/api/webhooks/fireflies` - Fireflies Integration
**File**: `/app/api/webhooks/fireflies/route.ts`
**Method**: POST
**Purpose**: Handle webhooks from Fireflies.ai for meeting transcripts

## Alternative & Development Routes

### `/api/chat5` - Alternative Chat Interface
**File**: `/app/api/chat5/route.ts`
**Purpose**: Alternative implementation of chat functionality

### `/api/weather` - Weather Tool Demo
**File**: `/app/api/weather/route.tsx`
**Purpose**: Example weather tool for testing tool calling

## Middleware Protection

The following routes are configured in middleware to bypass authentication:
- `/api/chat`
- `/api/d1`
- `/api/vector`
- `/api/fm-global-rag`
- `/api/fm-rag`
- `/api/fm-optimize`
- `/api/pm-assistant-gpt5`
- `/api/rag`
- `/api/pm-rag`
- `/api/insights` (protected - requires authentication)

## Common Response Patterns

### Streaming Responses
Most AI chat routes return streaming responses:
```typescript
return new Response(stream, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
  },
})
```

### Standard JSON Responses
```typescript
return Response.json({ 
  success: true, 
  data: result 
})
```

### Error Responses
```typescript
return Response.json(
  { error: "Error message" }, 
  { status: 500 }
)
```

## Development Notes

- Most AI routes use streaming for better UX
- RAG routes require vector database setup
- Meeting-related routes depend on transcript processing
- Some routes use service keys to bypass RLS
- CORS is handled via middleware for public routes

---

*This documentation is auto-generated and should be updated when API routes are modified.*

## Recent Updates

- **2025-01-08**: Added `/api/insights/generate` route for AI insights functionality
- **2025-01-08**: Updated middleware protection notes