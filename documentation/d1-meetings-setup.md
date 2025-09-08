# Cloudflare D1 Meetings Page Setup

## Overview
The meetings-d1 page provides an interface to manage meeting records stored in a Cloudflare D1 database. This is an alternative to the Supabase-based meetings-db page.

## Files Created
- `/app/(pages)/meetings-d1/page.tsx` - Main page component
- `/app/api/d1/route.ts` - API route for D1 operations
- `/app/actions/meeting-d1-actions.ts` - Server actions for D1
- `/scripts/d1-schema.sql` - SQL schema for the alleato table
- `/scripts/test-d1-meetings.js` - Test script

## Setup Instructions

### 1. Configure Environment Variables
Add the following to your `.env.local` file:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_D1_API_TOKEN=your_api_token_here
```

To get these values:
1. Log in to Cloudflare Dashboard
2. Go to your account settings to find your Account ID
3. Create an API token with D1 edit permissions

### 2. Create the D1 Database Table
The database ID is already configured: `fc7c9a6d-ca65-4768-b3f9-07ec5afb38c5`

Run the schema using Wrangler CLI:
```bash
wrangler d1 execute meetings --file=./scripts/d1-schema.sql --remote
```

Or manually through Cloudflare Dashboard:
1. Navigate to Workers & Pages → D1
2. Select your database (ID: fc7c9a6d-ca65-4768-b3f9-07ec5afb38c5)
3. Go to Console tab
4. Execute the SQL from `/scripts/d1-schema.sql`

### 3. Access the Page
Visit: http://localhost:3000/meetings-d1

## Features
- View all meetings from Cloudflare D1
- Add new meetings
- Edit existing meetings inline
- Delete meetings
- Same UI as the Supabase meetings page

## API Endpoints
- `GET /api/d1?action=list` - Fetch all meetings
- `POST /api/d1` with body:
  - `{ action: "create", data: {...} }` - Create meeting
  - `{ action: "update", data: {...} }` - Update meeting
  - `{ action: "delete", data: { id } }` - Delete meeting

## Table Structure
The `meetings` table has the following columns:
- `id` - Auto-incrementing primary key
- `title` - Meeting title
- `date` - Meeting date
- `participants` - JSON array of participant names
- `summary` - Meeting summary
- `action_items` - JSON array of action items
- `project_id` - Associated project ID
- `project_name` - Project name
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Testing
Run the test script to verify setup:
```bash
node scripts/test-d1-meetings.js
```

## Troubleshooting

### "Cloudflare credentials not configured"
- Ensure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_D1_API_TOKEN are set in .env.local

### "Failed to query D1: Not found"
- Verify the database ID is correct
- Check that your API token has D1 permissions
- Ensure the account ID matches your Cloudflare account

### "Table meetings does not exist"
- Run the schema SQL to create the table
- Check you're targeting the correct database

## Notes
- The page bypasses authentication for testing (configured in middleware)
- Data is fetched directly from Cloudflare D1 REST API
- JSON fields (participants, action_items) are stored as text in SQLite