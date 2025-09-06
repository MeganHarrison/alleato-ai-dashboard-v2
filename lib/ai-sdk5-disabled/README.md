# AI SDK 5 RAG-Enabled Project Manager Chat

This directory contains the implementation of an AI-powered Project Manager assistant that leverages meeting transcripts and RAG (Retrieval-Augmented Generation) to provide strategic business insights.

## Features

- **RAG-Powered Intelligence**: Searches through meeting transcripts using vector embeddings
- **Meeting Analysis Tools**: 
  - Search meeting content by topic or keyword
  - Retrieve meeting insights and summaries
  - Analyze trends across multiple meetings
  - Get contextual information about projects
- **Message Persistence**: All conversations stored in Supabase
- **Streaming Responses**: Real-time AI responses with tool execution
- **Strategic Insights**: AI positioned as a senior project manager providing actionable recommendations

## Database Schema

The implementation uses three main tables:

1. **ai_sdk5_chats**: Chat metadata (id, project_id, title, timestamps)
2. **ai_sdk5_messages**: Message records (id, chat_id, role, timestamps)
3. **ai_sdk5_parts**: Message parts with prefix-based columns for different types

## RAG Integration

The chat integrates with your existing meeting data infrastructure:

### Meeting Data Sources
- **meetings**: Core meeting metadata (title, date, attendees)
- **meetings_chunks**: Vectorized meeting transcript chunks with embeddings
- **meetings_insights**: Pre-analyzed insights, action items, and decisions

### Available AI Tools

1. **searchMeetingsTool**: Vector similarity search through meeting transcripts
   - Uses OpenAI text-embedding-ada-002 for query embedding
   - Searches against pre-computed embeddings in meetings_chunks
   - Returns relevant content with meeting context

2. **getMeetingInsightsTool**: Retrieves analyzed insights
   - Filters by timeframe, meeting, or insight type
   - Returns summaries, action items, decisions, and risks

3. **analyzeMeetingTrendsTool**: Identifies patterns across meetings
   - Analyzes topics, participation, and action completion
   - Provides trend analysis over configurable timeframes

4. **getMeetingContextTool**: Comprehensive context retrieval
   - Searches by project, topic, or timeline
   - Aggregates related meeting information

## Usage

### Starting a New Session

Navigate to `/persistent-chat` to see all sessions or create a new one. Each session maintains context and can reference meeting data.

### Example Queries

- "What were the key decisions from this week's meetings?"
- "Show me all risks discussed about the Q4 product launch"
- "Analyze team participation patterns over the last month"
- "What action items are still pending from our strategy meetings?"

### System Capabilities

The AI Project Manager can:
- Search through all meeting transcripts to find specific discussions
- Track action items and their completion status
- Identify recurring themes and patterns
- Provide strategic recommendations based on meeting data
- Surface risks and opportunities from team discussions

## Migration Notes

To run the migration:

1. Apply the SQL migration in `/supabase/migrations/20250825_ai_sdk5_persistent_chat.sql`
2. Run `npm install` to install the new dependencies
3. Ensure `DATABASE_URL` or `SUPABASE_DATABASE_URL` is set in your environment

## Development

The implementation follows the existing patterns in the codebase:
- Server Components for pages
- Client Components for interactive UI
- Server Actions for database operations
- Supabase for authentication and RLS