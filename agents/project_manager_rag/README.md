# Project Manager RAG Agent

An intelligent meeting analysis and project management system that syncs Fireflies transcripts to Supabase, generates AI insights, and enables semantic search across all meeting content.

## 📋 Script Documentation

| Script | Purpose | Usage | Dependencies |
|--------|---------|-------|--------------|
| **complete_sync_pipeline.py** | Main orchestrator that fetches meetings from Fireflies, processes them, and stores in Supabase | `python complete_sync_pipeline.py` | Fireflies API, Supabase |
| **chat.py** | Interactive terminal chat interface for querying meetings with natural language | `python chat.py` | OpenAI GPT-4, Supabase |
| **insights_generator.py** | Analyzes meetings to extract AI insights (risks, opportunities, decisions, action items) | `python insights_generator.py` | OpenAI GPT-4, Supabase |
| **embeddings_generator.py** | Creates 384-dimensional vector embeddings for semantic search | `python embeddings_generator.py` | OpenAI Embeddings, Supabase |
| **upload_transcripts_to_storage.py** | Uploads meeting transcripts as markdown files to Supabase storage bucket | `python upload_transcripts_to_storage.py` | Supabase Storage |
| **fireflies_client.py** | Client library for Fireflies GraphQL API interactions | Imported by other scripts | Fireflies API |
| **meeting_intelligence.py** | AI processing module for extracting structured data from transcripts | Imported by sync pipeline | OpenAI GPT-4 |
| **supabase_client_updated.py** | Database interface for all Supabase operations | Imported by other scripts | Supabase |

## 🚀 Quick Start

### 1. Initial Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys
```

### 2. Run Complete Pipeline
```bash
# Sync meetings from Fireflies
python complete_sync_pipeline.py

# Generate vector embeddings
python embeddings_generator.py

# Extract AI insights
python insights_generator.py

# Upload transcripts to storage
python upload_transcripts_to_storage.py
```

### 3. Query Your Data
```bash
# Start interactive chat
python chat.py

# Example questions:
# - "What are Jack Curtin's action items?"
# - "Show me risks for the Goodwill Bloomington project"
# - "What decisions were made this week?"
```

## 📊 Features

### 🔄 Automated Meeting Sync
- Fetches meeting transcripts from Fireflies API (minimum 20 per sync)
- Extracts participants, summaries, action items, and decisions
- Stores transcripts as markdown in Supabase storage
- Detects and prevents duplicates using Fireflies IDs

### 🧠 AI-Powered Meeting Intelligence
- Generates insights using GPT-4-Turbo
- Categorizes insights: risks, opportunities, decisions, action items, strategic, technical
- Automatically assigns meetings to projects based on content analysis
- Stores insights in `ai_insights` table with project associations

### 🔍 Semantic Search with RAG
- Generates 384-dimensional vector embeddings using OpenAI
- Stores embeddings in `meeting_embeddings` table
- Enables similarity search across meeting content
- Supports project-filtered searches

### 💬 Interactive Chat Interface
- Natural language Q&A about meetings and projects
- Retrieves actual meeting content and details
- Shows action items, risks, decisions with specific names and dates
- Fallback to keyword search if semantic search fails

## 🗄️ Database Schema

### Tables Used:
- **meetings** - Main meeting records with metadata
- **meeting_embeddings** - Vector embeddings (384d) for semantic search
- **ai_insights** - Categorized insights with meeting/project names
- **projects** - Project definitions with keywords and aliases
- **contacts** - Meeting participants

### Storage:
- **Bucket**: `meetings`
- **Path**: `transcripts/{fireflies_id}.md`

## 📁 Project Structure

```
project_manager_rag/
├── complete_sync_pipeline.py     # Main sync orchestrator
├── chat.py                       # Interactive chat interface
├── insights_generator.py         # AI insights extraction
├── embeddings_generator.py        # Vector embeddings
├── upload_transcripts_to_storage.py  # Storage uploader
├── fireflies_client.py          # Fireflies API client
├── meeting_intelligence.py       # AI analysis module
├── supabase_client_updated.py   # Database interface
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment template
├── sql_scripts/                  # Database setup scripts
│   └── add_name_columns_to_insights.sql
├── docs/                         # Full documentation
└── logs/                         # Execution logs
```

## 🔧 Environment Variables

Required in `.env`:
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Database Connection
DATABASE_URL=postgresql://user:pass@host:5432/db
# OR
POSTGRES_HOST=db.your-project.supabase.co
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=postgres

# Fireflies
FIREFLIES_API_KEY=your_fireflies_key
```

## 📈 Current Statistics

- **Total Meetings**: 295
- **Meetings with Projects**: 249
- **Total Insights**: 230
- **Meetings with Embeddings**: 292

### Insight Breakdown:
- Risks: 32
- Action Items: 23
- Opportunities: 23
- Strategic: 14
- Technical: 13
- Decisions: 6

## 🔄 Automated Sync

For production, set up a cron job:
```bash
# Add to crontab for hourly execution
0 * * * * cd /path/to/project && python complete_sync_pipeline.py
```

Or use the built-in scheduler:
```python
from complete_sync_pipeline import AutomatedSyncScheduler

scheduler = AutomatedSyncScheduler()
scheduler.start(interval_hours=1)  # Runs every hour
```

## 🛠️ Troubleshooting

### Common Issues:

1. **"OPENAI_API_KEY not found"**
   - Ensure `.env` file exists with valid API key

2. **Model Access Errors**
   - Verify API key has GPT-4 access
   - Fallback to gpt-3.5-turbo if needed

3. **Embedding Dimension Mismatch**
   - System uses 384 dimensions
   - Ensure `dimensions=384` parameter is set

4. **Chat Not Finding Meetings**
   - Verify embeddings exist: `SELECT COUNT(*) FROM meeting_embeddings;`
   - Check meetings have content: `SELECT COUNT(*) FROM meetings WHERE summary IS NOT NULL;`

## 📝 SQL Scripts

Located in `sql_scripts/`:
- **add_name_columns_to_insights.sql** - Adds meeting_name and project_name columns with auto-population triggers

## 🔗 Dependencies

See `requirements.txt`:
- openai>=1.0.0
- supabase>=2.0.0
- python-dotenv
- pydantic
- asyncio
- numpy
- fuzzywuzzy

## 📚 Full Documentation

For complete system documentation including database schema details, API integrations, and advanced configuration, see `docs/DOCUMENTATION.md`

## 🚨 Important Notes

- Always use environment variables for API keys
- Never commit `.env` files to version control
- Ensure Supabase has pgvector extension enabled
- Meeting sync fetches minimum 20 meetings per run
- Insights are generated only for meetings with content

## 💡 Example Chat Sessions

```bash
💬 You: What are the urgent action items?
🤖 Answer: Nick Jepson needs to review and approve the utility vault valve submittal...

💬 You: Show me risks for Goodwill Bloomington
🤖 Answer: ADA compliance and public sidewalk improvements are required...

💬 You: Who needs to do what?
🤖 Answer: Jack Curtin needs to install flashing and caulking...
```

## 🎯 Next Steps

- [ ] Implement real-time sync webhooks
- [ ] Add project dashboard views
- [ ] Build insight resolution workflow
- [ ] Create meeting summary notifications
- [ ] Add team collaboration features