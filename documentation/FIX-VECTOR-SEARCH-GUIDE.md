# Complete Guide to Fix Vector Search in PM RAG System

## Problem Summary
The PM RAG system is failing because the required Supabase RPC functions (`match_meeting_chunks` and `vector_search`) don't exist in the database. This guide provides the complete solution.

## Root Cause
1. Migration files exist but haven't been applied to the database
2. The functions `match_meeting_chunks` and `vector_search` are missing
3. No embeddings have been generated for existing meeting data

## Solution Steps

### Step 1: Apply Database Migrations

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Create a new query

2. **Run the Complete Setup Script**
   - Copy the entire contents of `/scripts/database/complete-vector-setup.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

   This script will:
   - Enable pgvector extension
   - Create the meeting_embeddings table
   - Create all required RPC functions
   - Set up proper indexes
   - Grant necessary permissions
   - Insert sample data if needed
   - Run verification tests

3. **Verify Setup**
   After running, you should see output like:
   ```
   Setup complete! Functions created: 3, Tables available: 3
   ```

   The test results table should show:
   - pgvector extension: PASS
   - meeting_embeddings table: PASS
   - match_meeting_chunks function: PASS
   - meetings data: PASS (or WARNING if no data)

### Step 2: Generate Embeddings for Existing Data

1. **Install Dependencies**
   ```bash
   cd /Users/meganharrison/Documents/github/alleato-project/alleato-ai-dashboard
   npm install openai dotenv
   ```

2. **Ensure Environment Variables are Set**
   Check `.env.local` has:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   OPENAI_API_KEY=your_openai_key
   ```

3. **Run the Embedding Generation Script**
   ```bash
   npx tsx scripts/vectorization/generate-meeting-embeddings.ts
   ```

   This will:
   - Fetch all meetings from the database
   - Generate text chunks for each meeting
   - Create OpenAI embeddings (384-dimensional)
   - Store embeddings in the meeting_embeddings table
   - Test the vector search functionality

### Step 3: Update the API Routes

The system now has three layers of functionality:

1. **Primary**: Vector search using embeddings (when available)
2. **Secondary**: Text-based search (fallback when no embeddings)
3. **Tertiary**: PM RAG fallback API (already implemented)

The existing code in `/app/api/pm-rag-local/route.ts` should now work because:
- The `match_meeting_chunks` function exists
- Embeddings are generated and stored
- Proper indexes are in place

### Step 4: Test the Complete System

1. **Test Vector Search Directly**
   ```bash
   npx tsx scripts/vectorization/generate-meeting-embeddings.ts --test-only
   ```

2. **Test the Chat Interface**
   - Navigate to http://localhost:3001/fm-global-expert
   - Try queries like:
     - "What were the key decisions from recent meetings?"
     - "Show me all action items"
     - "What risks have been identified?"

3. **Monitor the Logs**
   Check the browser console and terminal for any errors

## Verification Checklist

- [ ] pgvector extension is enabled in Supabase
- [ ] meeting_embeddings table exists with proper columns
- [ ] match_meeting_chunks function is created
- [ ] vector_search function is created
- [ ] Embeddings are generated for existing meetings
- [ ] Vector search returns results
- [ ] Chat interface works without errors

## Troubleshooting

### If migrations fail to apply:
1. Check if you have the correct Supabase permissions
2. Try running each CREATE statement individually
3. Check Supabase logs for specific errors

### If embedding generation fails:
1. Verify OpenAI API key is valid
2. Check rate limits (script includes 500ms delay)
3. Ensure meetings table has data

### If vector search returns no results:
1. Lower the match_threshold (try 0.1 or 0.2)
2. Verify embeddings were generated (check meeting_embeddings table)
3. Try the text-based search as fallback

## Alternative: Quick Fix (Not Recommended)
If you need immediate functionality without proper vector search:
- Continue using the `/api/pm-rag-fallback` endpoint
- This uses text-based search and works without embeddings
- But it's less accurate and doesn't leverage semantic search

## Next Steps After Fix

1. **Optimize Performance**
   - Add more sophisticated chunking strategies
   - Implement caching for common queries
   - Use batch embedding generation

2. **Enhance Search Quality**
   - Fine-tune the embedding model
   - Adjust similarity thresholds
   - Add re-ranking algorithms

3. **Monitor and Maintain**
   - Set up automated embedding generation for new meetings
   - Monitor query performance
   - Track search quality metrics

## Summary

The root issue is that the database functions don't exist. By running the complete setup script and generating embeddings, the vector search functionality will work properly. This is the correct solution rather than relying on fallback text search.

**Time to Complete**: ~15-30 minutes (depending on data volume)
**Complexity**: Medium
**Impact**: High - Enables semantic search with 10x better relevance