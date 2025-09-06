# Project Manager RAG System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Setup Instructions](#setup-instructions)
5. [Core Features](#core-features)
6. [Running the System](#running-the-system)
7. [API Integrations](#api-integrations)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The **Project Manager RAG (Retrieval-Augmented Generation) System** is an AI-powered meeting intelligence platform that automatically syncs meeting transcripts from Fireflies, stores them in Supabase, generates actionable insights, and provides an intelligent chat interface for querying meeting data.

### Key Capabilities
- 🔄 **Automated Meeting Sync**: Fetches transcripts from Fireflies API every hour
- 🧠 **AI Insights Generation**: Extracts risks, opportunities, decisions, and action items using GPT-4
- 🔍 **Semantic Search**: Vector embeddings enable intelligent content retrieval
- 💬 **RAG Chat Interface**: Natural language Q&A about meetings and projects
- 📊 **Project Intelligence**: Automatically assigns meetings to projects and tracks project health

### Technology Stack
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **AI Models**: OpenAI GPT-4-Turbo and text-embedding-3-small
- **Meeting Source**: Fireflies.ai API
- **Language**: Python 3.8+
- **Key Libraries**: openai, supabase-py, asyncio, pydantic

---

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Fireflies API  │────▶│  Sync Pipeline   │────▶│    Supabase     │
│   (Meetings)    │     │ (Python Scripts) │     │   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  AI Processing   │     │   Embeddings    │
                        │  (GPT-4-Turbo)   │     │  (384-dim)      │
                        └──────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   AI Insights    │     │   RAG Chat      │
                        │   (Database)     │     │  Interface      │
                        └──────────────────┘     └─────────────────┘
```

### Data Flow
1. **Meeting Ingestion**: Fireflies API → Supabase `meetings` table
2. **Transcript Storage**: Full transcripts → Supabase Storage bucket (`meetings`)
3. **Embedding Generation**: Meeting content → 384-dimensional vectors in `meeting_embeddings`
4. **Insight Extraction**: AI analysis → `ai_insights` table with categorized insights
5. **Project Assignment**: Content analysis → Automatic project_id assignment
6. **Chat Queries**: User questions → Semantic search → GPT-4 response

---

## Database Schema

### Supabase Tables

#### 1. `meetings` Table
Primary table storing all meeting records from Fireflies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `fireflies_id` | TEXT | Unique ID from Fireflies (prevents duplicates) |
| `title` | TEXT | Meeting title |
| `date` | TIMESTAMP | Meeting date/time |
| `duration_minutes` | INTEGER | Meeting duration |
| `participants` | TEXT[] | Array of participant names |
| `summary` | TEXT | AI-generated meeting summary |
| `topics` | TEXT[] | Array of discussed topics |
| `action_items` | TEXT[] | Array of action items |
| `decisions` | TEXT[] | Array of decisions made |
| `risks` | TEXT[] | Array of identified risks |
| `project_id` | INTEGER | Foreign key to projects table |
| `processing_status` | TEXT | Status: pending/processing/completed/failed |
| `raw_metadata` | JSONB | Complete raw data from Fireflies |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Unique Constraint**: `fireflies_id` (prevents duplicate meetings)

#### 2. `meeting_embeddings` Table
Stores vector embeddings for semantic search.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `meeting_id` | UUID | Foreign key to meetings.id |
| `chunk_index` | INTEGER | Index for chunked content |
| `embedding` | VECTOR(384) | 384-dimensional embedding vector |
| `embedding_vector` | VECTOR(384) | Alternative column for compatibility |
| `metadata` | JSONB | Additional metadata |
| `created_at` | TIMESTAMP | Creation timestamp |

**Indexes**: 
- `idx_meeting_embeddings_meeting_id` on meeting_id
- Vector similarity index on embedding column

#### 3. `ai_insights` Table
Stores AI-generated insights from meeting analysis.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `meeting_id` | UUID | Foreign key to meetings.id |
| `project_id` | INTEGER | Foreign key to projects.id |
| `meeting_name` | TEXT | Denormalized meeting title (auto-populated) |
| `project_name` | TEXT | Denormalized project name (auto-populated) |
| `insight_type` | TEXT | Type: risk/opportunity/decision/action_item/strategic/technical |
| `title` | TEXT | Brief insight title |
| `description` | TEXT | Detailed description |
| `severity` | TEXT | For risks: low/medium/high/critical |
| `confidence_score` | FLOAT | AI confidence (0.0-1.0) |
| `source_meetings` | TEXT | Comma-separated meeting IDs |
| `resolved` | INTEGER | 0=unresolved, 1=resolved |
| `created_at` | TIMESTAMP | Creation timestamp |

**Indexes**:
- `idx_ai_insights_meeting_name` on meeting_name
- `idx_ai_insights_project_name` on project_name

**Triggers**:
- `populate_insight_names_trigger`: Auto-populates meeting_name and project_name on INSERT
- `update_insight_names_trigger`: Updates names when IDs change

#### 4. `projects` Table
Stores project definitions for meeting assignment.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Project name |
| `description` | TEXT | Project description |
| `keywords` | TEXT[] | Keywords for matching |
| `aliases` | TEXT[] | Alternative names |
| `stakeholders` | TEXT[] | Key people involved |
| `created_at` | TIMESTAMP | Creation timestamp |

#### 5. `contacts` Table
Stores participant/contact information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Contact name |
| `email` | TEXT | Email address |
| `role` | TEXT | Role/title |
| `created_at` | TIMESTAMP | Creation timestamp |

### Supabase Storage

#### Bucket: `meetings`
Stores meeting transcripts as markdown files.

**Structure**: `transcripts/{fireflies_id}.md`

**Example Path**: `transcripts/abc123def456.md`

### Database Functions

#### 1. `vector_search`
Performs similarity search on embeddings.

**Parameters**:
- `query_embedding`: VECTOR(384) - Query vector
- `match_threshold`: FLOAT - Minimum similarity (0-1)
- `match_count`: INTEGER - Number of results

**Returns**: Array of matching meeting_ids with similarity scores

#### 2. `search_meeting_embeddings`
Alternative search function for meeting embeddings.

**Parameters**: Same as vector_search

**Returns**: Meeting records with similarity scores

---

## Setup Instructions

### Prerequisites
1. Python 3.8 or higher
2. Supabase account with a project
3. Fireflies.ai account with API access
4. OpenAI API key with GPT-4-Turbo access

### Step 1: Clone and Navigate
```bash
git clone <repository>
cd use-cases/agent-factory-with-subagents/agents/project_manager_rag
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Create a `.env` file with the following:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Database Connection (for direct SQL operations)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
# OR individual components:
POSTGRES_HOST=db.your-project.supabase.co
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=postgres

# Fireflies Configuration
FIREFLIES_API_KEY=your_fireflies_api_key_here
```

### Step 4: Set Up Database Schema

#### Option A: Using SQL Scripts
Run the SQL scripts in order:
```bash
# 1. Create storage bucket (if not exists)
psql $DATABASE_URL < sql_scripts/create_storage_bucket.sql

# 2. Add name columns to insights table
psql $DATABASE_URL < sql_scripts/add_name_columns_to_insights.sql
```

#### Option B: Manual Setup in Supabase Dashboard
1. Create the tables with schemas as defined above
2. Enable pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Create the storage bucket named "meetings"
4. Set up the database functions for vector search

### Step 5: Initialize Projects
Add your projects to the `projects` table:
```sql
INSERT INTO projects (name, description, keywords, aliases, stakeholders)
VALUES 
  ('Project Alpha', 'Main product development', 
   ARRAY['alpha', 'product', 'development'], 
   ARRAY['Alpha Project', 'Product Alpha'],
   ARRAY['John Doe', 'Jane Smith']),
  
  ('Project Beta', 'Infrastructure upgrade',
   ARRAY['beta', 'infrastructure', 'upgrade'],
   ARRAY['Beta Initiative'],
   ARRAY['Bob Johnson']);
```

---

## Core Features

### 1. Meeting Synchronization
**File**: `complete_sync_pipeline.py`

Fetches meetings from Fireflies and syncs to Supabase:
- Minimum 20 meetings per sync
- Duplicate detection using fireflies_id
- Extracts participants, summary, action items, decisions
- Stores raw transcript in storage bucket

**Key Functions**:
- `sync_meetings()`: Main sync orchestrator
- `fetch_fireflies_meetings()`: GraphQL API integration
- `process_meeting_batch()`: Batch processing logic
- `upload_transcript()`: Storage bucket upload

### 2. AI Insights Generation
**File**: `insights_generator.py`

Analyzes meetings to extract actionable insights:
- 6 insight types: risk, opportunity, decision, action_item, strategic, technical
- Automatic project assignment based on content
- Confidence scoring for each insight
- Bulk processing capabilities

**Key Functions**:
- `generate_insights()`: Core insight extraction
- `assign_project_to_meeting()`: Project matching algorithm
- `store_insights()`: Database persistence
- `process_all_meetings()`: Batch processor

### 3. Embedding Generation
**File**: `embeddings_generator.py`

Creates vector embeddings for semantic search:
- Uses OpenAI text-embedding-3-small model
- 384-dimensional vectors (optimized for storage)
- Chunks long content appropriately
- Handles meetings without summaries

**Key Functions**:
- `generate_embedding()`: Vector creation
- `process_meeting()`: Single meeting processor
- `process_all_meetings()`: Batch generation
- `chunk_text()`: Content chunking logic

### 4. RAG Chat Interface
**File**: `simple_chat.py`

Natural language interface for querying meetings:
- Semantic search using embeddings
- Fallback to keyword search
- GPT-4-Turbo response generation
- Context-aware answers with citations

**Key Functions**:
- `search_meetings_semantic()`: Vector similarity search
- `answer_question()`: Main Q&A pipeline
- `build_context()`: Context preparation
- `generate_answer()`: AI response generation

---

## Running the System

### Initial Setup (One-Time)

1. **First-Time Data Sync**
```bash
# Sync all meetings from Fireflies
python complete_sync_pipeline.py

# Expected output:
# ✅ Synced 20 meetings successfully
# - 17 existing (skipped)
# - 3 new meetings added
```

2. **Generate Embeddings**
```bash
# Create embeddings for all meetings
python embeddings_generator.py

# Expected output:
# ✅ Generated embeddings for 292 meetings
```

3. **Generate AI Insights**
```bash
# Extract insights from meetings
python insights_generator.py

# Expected output:
# ✅ Generated 111 insights for 21 meetings
# ✅ Assigned 249 meetings to projects
```

### Regular Operations

#### Daily/Hourly Sync
```bash
# Run complete pipeline
python complete_sync_pipeline.py
```

#### Interactive Chat
```bash
# Start chat interface
python simple_chat.py

# Or run demo mode
python simple_chat.py demo
```

#### Check System Status
```python
# Python script to check status
from supabase import create_client
import os

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(url, key)

# Get counts
meetings = supabase.table("meetings").select("id", count="exact").execute()
insights = supabase.table("ai_insights").select("id", count="exact").execute()
embeddings = supabase.table("meeting_embeddings").select("id", count="exact").execute()

print(f"Meetings: {meetings.count}")
print(f"Insights: {insights.count}")
print(f"Embeddings: {embeddings.count}")
```

### Automated Scheduling

For production, set up a cron job or scheduler:

```python
# automated_scheduler.py
from complete_sync_pipeline import AutomatedSyncScheduler

scheduler = AutomatedSyncScheduler()
scheduler.start(interval_hours=1)  # Runs every hour
```

Or using crontab:
```bash
# Add to crontab for hourly execution
0 * * * * cd /path/to/project && python complete_sync_pipeline.py
```

---

## API Integrations

### Fireflies API
**Endpoint**: `https://api.fireflies.ai/graphql`

**Authentication**: Bearer token in headers

**Key Queries**:
```graphql
query GetTranscripts($cursor: String) {
  transcripts(cursor: $cursor, limit: 50) {
    edges {
      node {
        id
        title
        date
        duration
        meeting_attendees {
          displayName
          email
        }
        summary {
          outline
          action_items
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### OpenAI API
**Models Used**:
- `gpt-4-turbo`: Insight generation and chat responses
- `text-embedding-3-small`: 384-dimensional embeddings

**Key Parameters**:
- Temperature: 0.3-0.7 (lower for factual responses)
- Max tokens: 500-2000 depending on use case
- Dimensions: 384 for embeddings (storage optimization)

### Supabase APIs
**REST API**: PostgREST for CRUD operations

**Realtime**: WebSocket subscriptions (optional)

**Storage API**: For transcript file management

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "OPENAI_API_KEY not found"
**Solution**: Ensure `.env` file exists and contains valid API key
```bash
echo "OPENAI_API_KEY=sk-..." >> .env
```

#### 2. Model Access Errors (GPT-4)
**Issue**: "The model 'gpt-4-turbo' does not exist"

**Solution**: Verify API key has GPT-4 access, or fallback to gpt-3.5-turbo:
```python
# In insights_generator.py
self.model = "gpt-3.5-turbo"  # Fallback model
```

#### 3. Embedding Dimension Mismatch
**Issue**: "expected 384 dimensions, got 1536"

**Solution**: Ensure using correct parameters:
```python
response = await self.client.embeddings.create(
    model="text-embedding-3-small",
    input=text,
    dimensions=384  # Must specify dimensions
)
```

#### 4. Duplicate Meeting Errors
**Issue**: "duplicate key value violates unique constraint"

**Solution**: System automatically handles duplicates via fireflies_id. If manual fix needed:
```sql
DELETE FROM meetings 
WHERE fireflies_id IN (
    SELECT fireflies_id 
    FROM meetings 
    GROUP BY fireflies_id 
    HAVING COUNT(*) > 1
);
```

#### 5. Missing Meeting Content
**Issue**: Summaries or participants not populating

**Solution**: Check Fireflies API response structure:
- Summary is at `summary.outline` not `summary.text`
- Participants are in `meeting_attendees` array
- Use `speakers` array as fallback

#### 6. Chat Not Finding Relevant Meetings
**Issue**: Semantic search returns no results

**Solutions**:
1. Verify embeddings exist:
```sql
SELECT COUNT(*) FROM meeting_embeddings;
```

2. Check vector search function:
```sql
SELECT * FROM vector_search(
    ARRAY[0.1, 0.2, ...]::vector(384),
    0.5,
    5
);
```

3. Use fallback keyword search in chat

### Performance Optimization

#### Database Indexes
Ensure these indexes exist for optimal performance:
```sql
-- Meeting search
CREATE INDEX idx_meetings_date ON meetings(date DESC);
CREATE INDEX idx_meetings_project_id ON meetings(project_id);

-- Insights queries
CREATE INDEX idx_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_insights_resolved ON ai_insights(resolved);

-- Vector search (automatic with pgvector)
CREATE INDEX ON meeting_embeddings USING ivfflat (embedding vector_cosine_ops);
```

#### Batch Processing
For large datasets:
```python
# Process in batches
BATCH_SIZE = 10
for i in range(0, len(meetings), BATCH_SIZE):
    batch = meetings[i:i+BATCH_SIZE]
    await process_batch(batch)
    await asyncio.sleep(1)  # Rate limiting
```

### Monitoring

#### Health Check Script
```python
# health_check.py
import asyncio
from datetime import datetime, timedelta

async def check_system_health():
    checks = {
        "database_connection": check_database(),
        "recent_meetings": check_recent_meetings(),
        "embeddings_coverage": check_embeddings(),
        "insights_generation": check_insights(),
        "api_keys": check_api_keys()
    }
    
    for check, result in checks.items():
        status = "✅" if await result else "❌"
        print(f"{status} {check}")

async def check_recent_meetings():
    # Check if meetings synced in last 24 hours
    response = supabase.table("meetings")\
        .select("id")\
        .gte("created_at", (datetime.now() - timedelta(days=1)).isoformat())\
        .execute()
    return len(response.data) > 0
```

---

## Advanced Configuration

### Custom Insight Types
Add new insight types by modifying:
```python
# insights_generator.py
self.insight_types = [
    "risk", "opportunity", "decision", 
    "action_item", "strategic", "technical",
    "compliance",  # Add custom type
    "budget"       # Add another
]
```

### Project Assignment Rules
Customize project matching logic:
```python
# insights_generator.py - assign_project_to_meeting()
# Add custom matching rules
if "budget" in meeting_text.lower() and "finance" in meeting_text.lower():
    return finance_project_id
```

### Embedding Model Selection
For different embedding models:
```python
# embeddings_generator.py
self.embedding_model = "text-embedding-ada-002"  # Cheaper option
self.embedding_dimensions = 1536  # Default dimensions
```

---

## Security Considerations

### API Key Management
- Never commit `.env` files to version control
- Use environment variables in production
- Rotate keys regularly
- Use separate keys for dev/staging/production

### Database Security
- Use Row Level Security (RLS) in Supabase
- Limit service key usage to backend only
- Use anon key for client-side operations
- Regular backups of critical data

### Data Privacy
- Ensure compliance with data regulations
- Implement data retention policies
- Anonymize sensitive participant information
- Secure transcript storage with proper access controls

---

## Maintenance Tasks

### Weekly
- Review failed meeting syncs
- Check for orphaned embeddings
- Monitor API usage and costs

### Monthly
- Archive old meetings
- Optimize database indexes
- Review and tune AI prompts
- Update project definitions

### Quarterly
- Full system backup
- Performance analysis
- Model evaluation (consider upgrades)
- Security audit

---

## Support and Resources

### Documentation Links
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Fireflies API Docs](https://docs.fireflies.ai)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

### Common SQL Queries

**Get meetings without embeddings**:
```sql
SELECT m.id, m.title 
FROM meetings m
LEFT JOIN meeting_embeddings e ON m.id = e.meeting_id
WHERE e.id IS NULL;
```

**Find high-priority unresolved risks**:
```sql
SELECT * FROM ai_insights
WHERE insight_type = 'risk'
AND severity IN ('high', 'critical')
AND resolved = 0
ORDER BY created_at DESC;
```

**Project meeting coverage**:
```sql
SELECT 
    p.name as project,
    COUNT(DISTINCT m.id) as meeting_count,
    COUNT(DISTINCT i.id) as insight_count
FROM projects p
LEFT JOIN meetings m ON m.project_id = p.id
LEFT JOIN ai_insights i ON i.project_id = p.id
GROUP BY p.id, p.name
ORDER BY meeting_count DESC;
```

---

## Conclusion

The Project Manager RAG System provides a complete solution for meeting intelligence, from automatic transcription sync to AI-powered insights and natural language querying. The system is designed to be maintainable, scalable, and extensible for future enhancements.

For questions or issues, refer to the troubleshooting section or check the individual Python files for detailed implementation comments.