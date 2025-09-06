# Enhanced Fireflies Sync Documentation

## Overview

The enhanced Fireflies sync system provides comprehensive transcript synchronization with improved metadata extraction and storage in Supabase.

## Features

### Enhanced Metadata Extraction
- **Meeting Type Detection**: Automatically categorizes meetings (daily standup, planning, retrospective, etc.)
- **Attendee Information**: Captures detailed attendee data including names and emails
- **Topic Extraction**: Identifies and timestamps discussion topics
- **Action Items**: Extracts and stores action items separately
- **Keywords & Tags**: Automatically extracts relevant keywords
- **Word Count**: Tracks total words for analytics
- **Speaker Analytics**: Counts unique speakers and participation

### Storage Structure
- **Storage Bucket**: `meetings` (Supabase Storage)
- **Database Table**: `meetings` (PostgreSQL)
- **File Format**: Enhanced Markdown with structured sections

### Enhanced Markdown Format
Each transcript is saved with:
1. Meeting Information header
2. Summary section with overview, outline, and key points
3. Action items list
4. Topics with timestamps
5. Full transcript with speaker attribution
6. Metadata footer

## Setup

### 1. Environment Variables
Create or update `.env.local` with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
FIREFLIES_API_KEY=your_fireflies_api_key
OPENAI_API_KEY=your_openai_api_key (optional for future enhancements)
```

### 2. Check Database Structure
Run this to verify/create the meetings table:
```bash
npm run check:meetings-table
```

This will:
- Check if the meetings table exists
- Verify all required columns are present
- Provide SQL to add missing columns
- Check if the meetings storage bucket exists

### 3. Required Table Structure
The meetings table should have these columns:
```sql
- id (TEXT PRIMARY KEY)
- fireflies_id (TEXT UNIQUE)
- title (TEXT)
- date (TIMESTAMPTZ)
- duration_minutes (INTEGER)
- participants (TEXT[])
- speaker_count (INTEGER)
- transcript_url (TEXT)
- storage_url (TEXT)
- organizer_email (TEXT)
- meeting_type (TEXT)
- meeting_attendees (JSONB)
- topics (JSONB)
- summary (JSONB)
- total_words (INTEGER)
- has_action_items (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- synced_at (TIMESTAMPTZ)
```

## Usage

### Run Enhanced Sync
```bash
npm run sync:fireflies-enhanced
```

This will:
1. Fetch up to 50 recent transcripts from Fireflies
2. Check which ones already exist in the database
3. Download full transcript details for new ones
4. Extract enhanced metadata
5. Format as enhanced markdown
6. Upload to Supabase Storage (meetings bucket)
7. Save metadata to meetings table
8. Skip duplicates automatically

### Output
The script provides detailed progress:
```
🚀 Starting enhanced Fireflies sync...
📋 Fetching transcript list from Fireflies...
Found 25 transcripts

🔍 Checking existing meetings in database...
Found 10 existing meetings

📄 Processing: Daily Standup - Team Alpha
   ID: abc123def456
   📥 Fetching full transcript details...
   📊 Extracted metadata (1250 words, 4 speakers)
   📤 Uploading to storage...
   💾 Saving to database...
   ✅ Successfully processed
```

### Summary Report
After sync completes:
```
============================================================
📊 SYNC SUMMARY
============================================================
✅ Processed: 15
⏭️  Skipped: 10
❌ Failed: 0
```

## Manual Deployment

To manually run the sync on demand:

1. **Check table structure first**:
   ```bash
   npm run check:meetings-table
   ```

2. **Run the enhanced sync**:
   ```bash
   npm run sync:fireflies-enhanced
   ```

3. **Monitor progress** in the console output

4. **Verify in Supabase**:
   - Check the `meetings` table for new records
   - Check the `meetings` storage bucket for markdown files

## Scheduling (Optional)

To run automatically, you can:

1. **Use a cron job** (Linux/Mac):
   ```bash
   # Add to crontab (runs daily at 2 AM)
   0 2 * * * cd /path/to/project && npm run sync:fireflies-enhanced
   ```

2. **Use GitHub Actions**:
   ```yaml
   name: Sync Fireflies
   on:
     schedule:
       - cron: '0 2 * * *'
     workflow_dispatch:
   
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
         - run: npm install
         - run: npm run sync:fireflies-enhanced
           env:
             FIREFLIES_API_KEY: ${{ secrets.FIREFLIES_API_KEY }}
             SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
   ```

3. **Use Supabase Edge Functions** (deploy as scheduled function)

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure all required env vars are set in `.env.local`

2. **"Error accessing meetings table"**
   - Run `npm run check:meetings-table` to create the table
   - Check Supabase connection and credentials

3. **"Fireflies API error"**
   - Verify your Fireflies API key is valid
   - Check Fireflies API status

4. **"Storage upload failed"**
   - Ensure the `meetings` bucket exists
   - Check storage permissions in Supabase

### Debug Mode

For detailed logging, modify the script:
```javascript
// Add at the top of enhanced-fireflies-sync.js
const DEBUG = true;
```

## Data Flow

```
Fireflies API
     ↓
Fetch Transcripts
     ↓
Check Duplicates
     ↓
Get Full Details
     ↓
Extract Metadata ──→ Enhanced Fields
     ↓                 - Meeting type
Format Markdown       - Attendees
     ↓                 - Topics
Upload to Storage     - Action items
     ↓                 - Keywords
Save to Database
     ↓
Complete ✓
```

## Future Enhancements

Potential improvements:
- Vector embeddings for semantic search
- OpenAI-powered summarization
- Automatic project assignment
- Email notifications for action items
- Webhook support for real-time sync
- Batch processing for large volumes
- Incremental sync based on last sync date

## Support

For issues or questions:
1. Check this documentation
2. Review the script logs
3. Check Supabase logs
4. Contact the development team