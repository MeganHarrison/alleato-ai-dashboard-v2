# Meeting Intelligence System - Setup Guide

## ✅ Current Status

### What's Working:
- ✅ All database tables created (meetings, embeddings, insights, associations, queue)
- ✅ 281 meetings already in the meetings table
- ✅ Migration scripts successfully applied

### What Needs Setup:
1. **Storage Bucket** - Create "meetings" bucket in Supabase dashboard
2. **SQL Functions** - May need to be recreated separately
3. **Environment Variable** - Add CRON_SECRET for automated processing

## 📋 Quick Setup Steps

### 1. Create Storage Bucket (Required)
Go to your Supabase Dashboard > Storage and create a new bucket:
- Name: `meetings`
- Public: Yes (or configure RLS policies)
- File size limit: 50MB
- Allowed MIME types: text/*, application/pdf

### 2. Fix SQL Functions
The functions might not have been created properly. Run this in SQL Editor:

```sql
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Then run the contents of:
-- 1. /supabase/migrations/20250829_meeting_vectorization_system.sql (functions section)
-- 2. /supabase/migrations/20250829_meeting_statistics_function.sql
```

### 3. Add Environment Variable
Add to your `.env.local`:
```
CRON_SECRET=your-secret-key-here
```

### 4. Enable pg_cron (for automated processing)
In Supabase Dashboard > Database > Extensions:
- Find `pg_cron` and enable it

## 🚀 How to Use

### Option 1: Upload via UI
1. Navigate to `/meeting-intelligence`
2. Click the "Upload" tab
3. Either:
   - Upload a .txt/.md file with transcript
   - Or paste transcript text directly
4. Fill in metadata (optional)
5. Click "Upload & Process"

### Option 2: Direct Storage Upload
1. Go to Supabase Dashboard > Storage > meetings bucket
2. Upload transcript files directly
3. They'll be processed automatically every 30 minutes

### Option 3: Manual Processing Trigger
Visit (while logged in):
```
http://localhost:3000/api/cron/vectorize-meetings
```

## 📊 Using the System

### AI Chat
- Ask questions about meetings: "What risks were identified this week?"
- Track action items: "Show me all pending action items"
- Get summaries: "Summarize the product meetings from last month"

### Meetings Table
- View all processed meetings
- Filter by project or search by participant
- Click to view transcript or Fireflies link

### Project Integration
- Meeting insights automatically appear on project pages
- Shows relevant action items, risks, and decisions

## 🔧 Troubleshooting

### "No embeddings found"
- Meetings need to be vectorized first
- Check if meetings are in the vectorization queue
- Trigger manual processing via the API

### "Storage bucket error"
- Create the bucket manually in Supabase Dashboard
- Ensure proper RLS policies or make it public

### "Functions not found"
- Re-run the SQL migrations
- Check that vector extension is enabled

## 📈 Monitoring

Check system status:
```bash
node scripts/test-meeting-system.js
```

View processing queue:
```sql
SELECT * FROM meeting_vectorization_queue 
WHERE status = 'pending'
ORDER BY created_at;
```

View recent meetings:
```sql
SELECT id, title, meeting_date, vectorized_at 
FROM meetings 
ORDER BY meeting_date DESC 
LIMIT 10;
```

## 🎯 Sample Meeting Transcript Format

For best results, format transcripts like this:

```markdown
Title: Product Planning Meeting
Date: 2024-08-28
Duration: 60 minutes
Participants: John Doe, Jane Smith, Bob Johnson
Meeting ID: FF123456
Meeting Link: https://app.fireflies.ai/view/...

## Transcript

John Doe: Let's discuss the Q3 roadmap...
Jane Smith: I think we should prioritize the API integration...
[conversation continues...]

## Action Items
- John to create API specification by Friday
- Jane to review customer feedback

## Decisions
- Approved Q3 roadmap with API as priority
- Delayed feature X to Q4
```

The system will automatically extract metadata, generate embeddings, and identify insights!