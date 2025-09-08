# RAG System API Contracts

## Overview
This document defines the API contracts for the RAG (Retrieval-Augmented Generation) system. All components (backend, frontend, and deployment) must adhere to these specifications.

## Base Configuration
- **Base URL**: `https://api.alleato.ai` (production) / `http://localhost:3000` (development)
- **Authentication**: Bearer token in Authorization header
- **Content-Type**: `application/json`
- **CORS**: Enabled for frontend domain

## API Endpoints

### 1. Document Management

#### Upload Document
```http
POST /api/documents/upload
```

**Request:**
```json
{
  "file": "multipart/form-data",
  "metadata": {
    "title": "string",
    "source": "string",
    "tags": ["string"],
    "category": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "title": "string",
    "source": "string",
    "status": "processing | completed | failed",
    "chunks_count": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### List Documents
```http
GET /api/documents
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search query
- `status` (string): Filter by status

**Response:**
```json
{
  "documents": [{
    "id": "uuid",
    "title": "string",
    "source": "string",
    "status": "string",
    "chunks_count": 42,
    "created_at": "2024-01-01T00:00:00Z"
  }],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### Delete Document
```http
DELETE /api/documents/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### 2. Vectorization

#### Process Document
```http
POST /api/vectorize/:documentId
```

**Request:**
```json
{
  "chunk_size": 1000,
  "chunk_overlap": 200,
  "embedding_model": "text-embedding-3-small"
}
```

**Response:**
```json
{
  "success": true,
  "job_id": "uuid",
  "status": "queued",
  "estimated_time": 30
}
```

#### Get Vectorization Status
```http
GET /api/vectorize/status/:jobId
```

**Response:**
```json
{
  "job_id": "uuid",
  "status": "processing | completed | failed",
  "progress": 75,
  "chunks_processed": 30,
  "total_chunks": 40,
  "error": null
}
```

### 3. Chat & Search

#### Chat Completion (Streaming)
```http
POST /api/chat
```

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "string"
    }
  ],
  "context": {
    "document_ids": ["uuid"],
    "search_type": "semantic | hybrid",
    "max_chunks": 10,
    "temperature": 0.7
  },
  "stream": true
}
```

**Response (SSE Stream):**
```
data: {"type": "chunk", "content": "The answer is..."}
data: {"type": "source", "document_id": "uuid", "chunk_id": "uuid", "relevance": 0.92}
data: {"type": "done", "message_id": "uuid"}
```

#### Search Documents
```http
POST /api/search
```

**Request:**
```json
{
  "query": "string",
  "search_type": "semantic | hybrid | keyword",
  "filters": {
    "document_ids": ["uuid"],
    "date_from": "2024-01-01",
    "date_to": "2024-12-31",
    "tags": ["string"]
  },
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "chunk_id": "uuid",
      "document_id": "uuid",
      "document_title": "string",
      "content": "string",
      "relevance_score": 0.92,
      "metadata": {}
    }
  ],
  "total_results": 42,
  "search_time_ms": 120
}
```

### 4. Statistics & Analytics

#### System Statistics
```http
GET /api/stats
```

**Response:**
```json
{
  "documents": {
    "total": 150,
    "processing": 2,
    "completed": 148,
    "failed": 0
  },
  "vectors": {
    "total_chunks": 4500,
    "total_embeddings": 4500,
    "embedding_dimension": 1536,
    "last_processed": "2024-01-01T00:00:00Z"
  },
  "storage": {
    "documents_size_mb": 125.5,
    "vectors_size_mb": 89.3,
    "total_size_mb": 214.8
  },
  "usage": {
    "queries_today": 250,
    "queries_this_month": 5420,
    "avg_response_time_ms": 320
  }
}
```

### 5. WebSocket Events

#### Connection
```javascript
ws://localhost:3000/ws
```

**Events:**
```json
// Document processing update
{
  "event": "document.processing",
  "data": {
    "document_id": "uuid",
    "status": "chunking | embedding | completed",
    "progress": 45
  }
}

// Chat response
{
  "event": "chat.response",
  "data": {
    "message_id": "uuid",
    "chunk": "string",
    "is_final": false
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Error Codes
- `AUTH_REQUIRED`: Authentication required
- `AUTH_INVALID`: Invalid authentication token
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMIT`: Rate limit exceeded
- `PROCESSING_ERROR`: Document processing failed
- `INTERNAL_ERROR`: Internal server error

## Rate Limits
- **Upload**: 10 requests per minute
- **Search**: 100 requests per minute
- **Chat**: 50 requests per minute
- **Stats**: 30 requests per minute

## Supabase Schema Requirements

### Tables
1. `rag_documents` - Document metadata
2. `rag_chunks` - Document chunks with embeddings
3. `rag_chat_history` - Chat conversation history
4. `rag_processing_queue` - Document processing queue

### Storage Buckets
1. `rag-documents` - Original document files
2. `rag-exports` - Exported data and reports

## Environment Variables
```env
# Required for all components
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional
EMBEDDING_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4-turbo-preview
MAX_CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```