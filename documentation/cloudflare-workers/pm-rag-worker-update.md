# PM RAG Worker - Meeting Chunks Integration Update

## Overview
The PM RAG Worker has been updated to use the new `meeting_chunks` table with proper chunking, embedding generation, and semantic search capabilities.

## Key Changes

### 1. Embedding Model Update
- Changed from `text-embedding-3-large` (3072 dimensions) to `text-embedding-3-small` (1536 dimensions)
- This aligns with the database vector column size (1536)
- More cost-effective while maintaining good performance

### 2. Database Integration
Updated Supabase client to work with the `meeting_chunks` table:
- Uses the new `search_meeting_chunks_semantic` RPC function for vector similarity search
- Added methods for saving and deleting meeting chunks
- Proper handling of chunk metadata and speaker information

### 3. New Endpoints

#### `/insights` - Meeting Processing Endpoint
Processes meeting transcripts to generate chunks and embeddings:

**Request:**
```json
{
  "meeting_id": "uuid",
  "transcript": "optional transcript text",
  "reprocess": false
}
```

**Response:**
```json
{
  "success": true,
  "meeting_id": "uuid",
  "chunks_created": 15,
  "insights": "Generated insights text...",
  "message": "Successfully processed meeting and created 15 chunks with embeddings"
}
```

**Features:**
- Chunks meetings into 500-1000 token segments
- Preserves speaker information and timestamps
- Generates embeddings for each chunk
- Extracts topics, entities, and importance scores
- Provides AI-generated insights from the meeting

#### `/search` - Semantic Search Endpoint
Performs semantic search across meeting chunks:

**Request:**
```json
{
  "query": "What were the action items discussed?",
  "meeting_id": "optional-meeting-uuid",
  "project_id": 123,
  "limit": 10,
  "threshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "query": "What were the action items discussed?",
  "results": [
    {
      "content": "Chunk content...",
      "meeting_id": "uuid",
      "similarity": 0.89,
      "speaker": "John Doe",
      "timestamp": 1234,
      "metadata": {...}
    }
  ],
  "count": 5
}
```

#### `/chat` - Enhanced Chat Endpoint
The existing chat endpoint now uses meeting chunks for better context retrieval:
- Searches through chunked meeting content
- Provides more accurate and relevant responses
- Includes speaker attribution in context

### 4. Chunking Strategy

The `DocumentChunker` class implements smart chunking:
- **Size**: 500-1000 tokens per chunk with 100 token overlap
- **Structure Preservation**: Maintains speaker turns and timestamps
- **Metadata Extraction**: Automatically extracts topics, entities, and importance scores
- **Speaker Attribution**: Preserves who said what in meetings

### 5. RAG Engine Updates

The RAG engine now:
- Uses meeting chunks for more granular context retrieval
- Includes speaker information in responses
- Calculates confidence scores based on semantic similarity
- Provides better source attribution

## Database Schema

The `meeting_chunks` table structure:
```sql
- id: UUID (primary key)
- meeting_id: UUID (references meetings)
- chunk_index: INTEGER
- content: TEXT
- chunk_type: TEXT (default 'transcript')
- speaker_info: JSONB
- start_timestamp: FLOAT
- end_timestamp: FLOAT
- embedding: vector(1536)
- metadata: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Search Function

The `search_meeting_chunks_semantic` function:
```sql
search_meeting_chunks_semantic(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_meeting_id uuid,
  filter_project_id int
)
```

## Usage Examples

### Processing a Meeting
```bash
curl -X POST https://pm-rag-sep-1.megan-d14.workers.dev/insights \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
    "reprocess": true
  }'
```

### Searching for Content
```bash
curl -X POST https://pm-rag-sep-1.megan-d14.workers.dev/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What decisions were made about the budget?",
    "limit": 5,
    "threshold": 0.75
  }'
```

### Chatting with Context
```bash
curl -X POST https://pm-rag-sep-1.megan-d14.workers.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Summarize the key action items from recent meetings",
    "options": {
      "include_meetings": true,
      "reasoning_effort": "high"
    }
  }'
```

## Performance Considerations

1. **Chunk Size**: Optimized for balance between context and embedding quality
2. **Parallel Processing**: Embeddings are generated in parallel for better performance
3. **Caching**: Consider implementing caching for frequently accessed chunks
4. **Rate Limiting**: OpenAI API rate limits should be considered for large meetings

## Error Handling

The worker includes comprehensive error handling:
- Validates all required parameters
- Provides detailed error messages
- Handles missing transcripts gracefully
- Includes proper CORS headers for cross-origin requests

## Next Steps

1. **Monitoring**: Add logging and metrics for chunk processing
2. **Optimization**: Consider batch processing for multiple meetings
3. **Caching**: Implement edge caching for frequently accessed chunks
4. **Analytics**: Track search queries and improve relevance over time

## Deployment

The worker is deployed to Cloudflare Workers and accessible at:
```
https://pm-rag-sep-1.megan-d14.workers.dev
```

Environment variables required:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Testing

Test the worker endpoints using the provided curl examples or integrate with your application using the JSON API.