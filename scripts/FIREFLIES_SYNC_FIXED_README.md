# Fireflies Sync Script - Fixed Version

## Overview
This is the working version of the Fireflies sync script that successfully syncs meeting transcripts from Fireflies.ai to your Supabase documents table.

## What Was Fixed

### API Field Validation
Through systematic testing (`test-fireflies-api.js`), we identified which Fireflies GraphQL fields actually work:

**Working Fields:**
- Basic fields: title, id, date, duration, participants
- URLs: transcript_url, audio_url, video_url
- Meeting attendees with displayName, email, name
- Host/organizer emails
- User info (name, email)
- Summary fields: action_items, keywords, outline, overview, shorthand_bullet
- Sentences with speaker_id and AI filters (sentiment, task, question)
- Analytics: sentiments (positive/neutral/negative percentages)
- Analytics: speakers with duration

**Non-Working Fields (Removed):**
- `notes` field in summary
- `topics` object
- `questions` object in analytics
- `soundbites` array
- `meeting_link` field

### Data Type Handling
Fixed issues where some fields can be either strings or arrays:
- `shorthand_bullet` - can be string or array
- `action_items` - can be string or array  
- `keywords` - can be string or array
- `outline` - can be string or array

### Database Schema
Removed the `type` field which doesn't exist in the documents table.

## Usage

### Basic Usage
```bash
node scripts/fireflies-sync-fixed.js
```

### With Environment Variables in .env.local
Create or update `.env.local` with:
```
FIREFLIES_API_KEY=your-api-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Command Line Options
```bash
# Sync all transcripts (up to 50)
node scripts/fireflies-sync-fixed.js

# The script will:
# 1. Fetch up to 50 transcripts from Fireflies
# 2. Skip any that are already synced
# 3. Process each new transcript with full metadata
# 4. Save to the documents table
```

## What Gets Synced

Each transcript is saved with:
- **Content**: Full formatted transcript with speaker identification
- **Summary**: Overview, key points, action items, outline
- **Analytics**: Sentiment analysis, speaker statistics
- **Metadata**: All meeting details, participants, URLs, extracted questions/tasks
- **Unique ID**: Uses fireflies_id to prevent duplicates

## Results

The script successfully:
- ✅ Fetches transcripts without API errors
- ✅ Handles various data formats (string vs array)
- ✅ Extracts comprehensive meeting intelligence
- ✅ Saves to Supabase documents table
- ✅ Prevents duplicate syncing
- ✅ Provides detailed progress and error reporting

## Next Steps

After syncing, run the vectorization script to generate embeddings:
```bash
node scripts/vectorize-all-documents.js
```

This will enable semantic search across all your meeting transcripts.

## Troubleshooting

If you encounter issues:

1. **Authentication Errors**: Check your API keys in .env.local
2. **Database Errors**: Ensure your Supabase service role key has proper permissions
3. **API Errors**: The script now uses only validated fields, but if Fireflies changes their API, run `test-fireflies-api.js` to re-validate

## File Locations

- Main script: `/scripts/fireflies-sync-fixed.js`
- API tester: `/scripts/test-fireflies-api.js` 
- Environment config: `/.env.local`
- This documentation: `/scripts/FIREFLIES_SYNC_FIXED_README.md`