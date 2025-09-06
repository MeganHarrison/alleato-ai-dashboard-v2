# Fireflies API Agent

Complete API reference for the Fireflies-Supabase RAG Worker with examples and response schemas.

## Base URL

```
https://worker-alleato-fireflies-rag.[your-subdomain].workers.dev
```

## Authentication

Currently, the API uses IP-based rate limiting. No API keys are required for public endpoints.

**Rate Limits:**
- 100 requests per 60 seconds per IP address
- Rate limit headers included in all responses

## Response Headers

All responses include:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693584000000
Access-Control-Allow-Origin: *
Content-Type: application/json
```

---

## Documentation
Fireflies Documentation: https://docs.fireflies.ai/llms-full.txt

## Endpoints

### 1. Health Check
Check if the service is running and get version information.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-28T02:30:00.000Z",
  "version": "2.0.0"
}
```

**Status Codes:**
- `200`: Service is healthy
- `500`: Service is unhealthy

---

### 2. Sync Transcripts

Sync meeting transcripts from Fireflies.ai. Can be triggered manually or via cron schedule.

**Request:**
```http
POST /api/sync
Content-Type: application/json

{
  "limit": 10,                    // Optional: Max transcripts to sync (default: 50)
  "startDate": "2025-08-01",      // Optional: ISO date string
  "endDate": "2025-08-28",        // Optional: ISO date string
  "force": false                  // Optional: Re-process already synced transcripts
}
```

**Response:**
```json
{
  "success": true,
  "processed": 8,
  "failed": 2,
  "errors": [
    {
      "transcript_id": "01K374MAQ92EM6Z9BVXT12AT7W",
      "error": "Database connection failed"
    }
  ],
  "duration": 15234  // Processing time in milliseconds
}
```

**Status Codes:**
- `200`: Sync completed (may have partial failures)
- `400`: Invalid request parameters
- `429`: Rate limit exceeded
- `500`: Internal server error

**Example: Sync Last 7 Days**
```javascript
const response = await fetch('https://your-worker.workers.dev/api/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    limit: 100,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
});
```

---

### 3. Semantic Search

Search for relevant meeting content using natural language queries.

**Request:**
```http
POST /api/search
Content-Type: application/json

{
  "query": "action items for mobile app",  // Required: Search query
  "options": {                            // Optional: Search filters
    "limit": 10,                          // Max results (default: 10, max: 100)
    "threshold": 0.7,                     // Similarity threshold 0-1 (default: 0.5)
    "department": "Engineering",          // Filter by department
    "project": "Mobile App",              // Filter by project
    "speaker": "John Doe",                // Filter by speaker
    "startDate": "2025-08-01",           // Date range start
    "endDate": "2025-08-28",             // Date range end
    "meetingType": "standup",            // Filter by meeting type
    "includeMetadata": true              // Include full meeting metadata
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "chunkId": 456,
      "transcriptId": "01K374MAQ92EM6Z9BVXT12AT7W",
      "text": "The main action items for the mobile app are: 1) Complete UI redesign by Friday, 2) Fix the login bug reported by QA...",
      "speaker": "Jane Smith",
      "startTime": 245.5,
      "endTime": 289.3,
      "similarity": 0.892,
      "conversationThread": "thread_002",
      "metadata": {
        "meetingTitle": "Mobile Team Standup",
        "meetingDate": "2025-08-15T14:00:00Z",
        "duration": 1800,
        "participants": ["Jane Smith", "John Doe", "Alice Johnson"],
        "department": "Engineering",
        "project": "Mobile App",
        "keywords": ["mobile", "UI", "bug fix", "release"],
        "fileUrl": "https://lgveqfnpkxvzbnnwuled.supabase.co/storage/v1/object/public/meetings/transcripts/01K374MAQ92EM6Z9BVXT12AT7W.md"
      }
    }
  ],
  "totalResults": 1,
  "queryEmbeddingCached": false,
  "searchDuration": 234  // milliseconds
}
```

**Status Codes:**
- `200`: Search completed successfully
- `400`: Missing or invalid query
- `429`: Rate limit exceeded
- `500`: Internal server error

**Example: Search with Filters**
```javascript
const response = await fetch('https://your-worker.workers.dev/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "budget discussion",
    options: {
      department: "Finance",
      threshold: 0.8,
      limit: 5,
      startDate: "2025-08-01"
    }
  })
});
```

---

### 4. Process Single Transcript

Process a specific transcript by ID. Useful for reprocessing or testing.

**Request:**
```http
POST /api/process
Content-Type: application/json

{
  "transcriptId": "01K374MAQ92EM6Z9BVXT12AT7W",  // Required
  "options": {                                    // Optional
    "maxChunkSize": 500,
    "overlap": 50,
    "bySpeaker": true,
    "force": false  // Reprocess even if already processed
  }
}
```

**Response:**
```json
{
  "success": true,
  "transcriptId": "01K374MAQ92EM6Z9BVXT12AT7W",
  "chunksCreated": 42,
  "embeddingsGenerated": 42,
  "fileUrl": "https://lgveqfnpkxvzbnnwuled.supabase.co/storage/v1/object/public/meetings/transcripts/01K374MAQ92EM6Z9BVXT12AT7W.md",
  "metadata": {
    "title": "Weekly Team Sync",
    "date": "2025-08-28T15:00:00Z",
    "duration": 2700,
    "participants": ["John Doe", "Jane Smith"],
    "keywords": ["planning", "roadmap", "Q4"],
    "actionItems": ["Review PRD", "Schedule design review"]
  },
  "processingTime": 3456  // milliseconds
}
```

**Status Codes:**
- `200`: Processing completed successfully
- `400`: Invalid transcript ID
- `404`: Transcript not found in Fireflies
- `429`: Rate limit exceeded
- `500`: Processing error

---

### 5. Get Analytics

Get system statistics and usage analytics.

**Request:**
```http
GET /api/analytics
```

**Response:**
```json
{
  "meetings": {
    "total": 234,
    "lastWeek": 18,
    "lastMonth": 67,
    "byDepartment": {
      "Engineering": 89,
      "Product": 45,
      "Sales": 56,
      "Marketing": 44
    },
    "byMeetingType": {
      "standup": 120,
      "review": 45,
      "planning": 32,
      "other": 37
    }
  },
  "chunks": {
    "total": 8934,
    "averagePerMeeting": 38.2,
    "withSpeaker": 7823,
    "withThread": 5234
  },
  "storage": {
    "filesCount": 234,
    "totalSize": "458.3 MB",
    "averageFileSize": "1.96 MB"
  },
  "processing": {
    "lastSync": "2025-08-28T02:00:00Z",
    "lastSyncDuration": 45678,
    "lastSyncProcessed": 15,
    "lastSyncFailed": 2,
    "averageProcessingTime": 2345
  },
  "search": {
    "totalSearches": 1234,
    "averageResponseTime": 156,
    "cacheHitRate": 0.73
  },
  "system": {
    "version": "2.0.0",
    "uptime": 864000,
    "kvCacheEntries": 567
  }
}
```

**Status Codes:**
- `200`: Analytics retrieved successfully
- `429`: Rate limit exceeded
- `500`: Internal server error

---

### 6. Fireflies Webhook

Endpoint for receiving Fireflies webhook events. Requires webhook secret configuration.

**Request:**
```http
POST /webhook/fireflies
Content-Type: application/json
X-Fireflies-Signature: sha256=a1b2c3d4e5...

{
  "event": "meeting.completed",
  "timestamp": "2025-08-28T16:30:00Z",
  "data": {
    "transcriptId": "01K374MAQ92EM6Z9BVXT12AT7W",
    "meetingId": "meeting_123",
    "title": "Product Planning",
    "duration": 3600
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed",
  "action": "transcript_queued_for_processing"
}
```

**Status Codes:**
- `200`: Webhook processed successfully
- `401`: Invalid signature
- `400`: Invalid webhook payload
- `500`: Processing error

**Webhook Events Supported:**
- `meeting.completed` - Triggered when meeting transcription is complete
- `meeting.updated` - Triggered when meeting is edited
- `meeting.deleted` - Triggered when meeting is deleted

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error context
  }
}
```

**Common Error Codes:**
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INVALID_REQUEST` - Malformed request body
- `TRANSCRIPT_NOT_FOUND` - Transcript ID doesn't exist
- `DATABASE_ERROR` - Database operation failed
- `EMBEDDING_ERROR` - Failed to generate embeddings
- `STORAGE_ERROR` - File storage operation failed

---

## Caching

The API implements several caching strategies:

1. **Embedding Cache**: Generated embeddings are cached for 1 hour
2. **Processed Transcript Cache**: Tracks processed transcripts to avoid reprocessing
3. **Search Result Cache**: Frequent queries are cached for 15 minutes

Cache headers:
```http
X-Cache-Status: HIT|MISS
X-Cache-Key: [sha256_hash]
```

---

## Webhooks Configuration

To set up webhooks in Fireflies:

1. Go to Fireflies Settings → Integrations → Webhooks
2. Add webhook URL: `https://your-worker.workers.dev/webhook/fireflies`
3. Select events to subscribe to
4. Copy the webhook secret
5. Set secret in worker: `npx wrangler secret put FIREFLIES_WEBHOOK_SECRET`

---

## Rate Limiting

Rate limits are applied per IP address:

- **Default**: 100 requests per 60 seconds
- **Search endpoint**: 50 requests per 60 seconds
- **Sync endpoint**: 10 requests per 60 seconds

When rate limited, the API returns:

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 45  // seconds
}
```

---

## Pagination

For endpoints that return lists, pagination is handled via limit/offset:

```json
{
  "limit": 20,    // Items per page
  "offset": 40    // Skip first 40 items
}
```

Note: The current implementation doesn't support pagination for search results. Consider implementing cursor-based pagination for large result sets.

---

## Testing

### cURL Examples

**Health Check:**
```bash
curl https://your-worker.workers.dev/api/health
```

**Search:**
```bash
curl -X POST https://your-worker.workers.dev/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "quarterly goals"}'
```

**Sync with Limit:**
```bash
curl -X POST https://your-worker.workers.dev/api/sync \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

### JavaScript/TypeScript Client Example

```typescript
class FirefliesRAGClient {
  constructor(private baseUrl: string) {}

  async search(query: string, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, options })
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async sync(options = {}) {
    const response = await fetch(`${this.baseUrl}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    
    return response.json();
  }

  async getAnalytics() {
    const response = await fetch(`${this.baseUrl}/api/analytics`);
    return response.json();
  }
}

// Usage
const client = new FirefliesRAGClient('https://your-worker.workers.dev');
const results = await client.search('action items from last week');
```


## Transcript Query
The transcript query is designed to fetch details associated with a specific transcript ID.

```
query Transcript($transcriptId: String!) {
  transcript(id: $transcriptId) {
    id
    dateString
    privacy
    analytics {
      sentiments {
        negative_pct
        neutral_pct
        positive_pct
      }
      categories {
        questions
        date_times
        metrics
        tasks
      }
      speakers {
        speaker_id
        name
        duration
        word_count
        longest_monologue
        monologues_count
        filler_words
        questions
        duration_pct
        words_per_minute
      }
    }
    speakers {
      id
      name
    }
    sentences {
      index
      speaker_name
      speaker_id
      text
      raw_text
      start_time
      end_time
      ai_filters {
        task
        pricing
        metric
        question
        date_and_time
        text_cleanup
        sentiment
      }
    }
    title
    host_email
    organizer_email
    calendar_id
    user {
      user_id
      email
      name
      num_transcripts
      recent_meeting
      minutes_consumed
      is_admin
      integrations
    }
    fireflies_users
    participants
    date
    transcript_url
    audio_url
    video_url
    duration
    meeting_attendees {
      displayName
      email
      phoneNumber
      name
      location
    }
    summary {
      keywords
      action_items
      outline
      shorthand_bullet
      overview
      bullet_gist
      gist
      short_summary
      short_overview
      meeting_type
      topics_discussed
      transcript_chapters
    }
    cal_id
    calendar_type
    meeting_info {
      fred_joined
      silent_meeting
      summary_status
    }
    apps_preview {
      outputs {
        transcript_id
        user_id
        app_id
        created_at
        title
        prompt
        response
      }
    }
    meeting_link
  }
}
```

### Usage

```
const axios = require('axios');

const url = 'https://api.fireflies.ai/graphql';
const headers = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer your_api_key'
};
const data = {
  query: 'query Transcript($transcriptId: String!) { transcript(id: $transcriptId) { title id } }',
  variables: { transcriptId: 'your_transcript_id' }
};

axios
  .post(url, data, { headers: headers })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
  ```

### Response

  ```
  {
  "data": {
    "transcript": {
      "title": "Weekly sync",
      "id": "transcript-id",
    }
  }
}
```

## Bite
Querying bite details. The bite query is designed to fetch details associated with a specific bite ID.
​
### Arguments
​
id
IDrequired
Unique identifier of the bite
​
Schema: Fields available to the Bite query
​
### Usage Example

```
query Bite($biteId: ID!) {
  bite(id: $biteId) {
    transcript_id
    name
    id
    thumbnail
    preview
    status
    summary
    user_id
    start_time
    end_time
    summary_status
    media_type
    created_at
    created_from {
      description
      duration
      id
      name
      type
    }
    captions {
      end_time
      index
      speaker_id
      speaker_name
      start_time
      text
    }
    sources {
      src
      type
    }
    privacies
    user {
      first_name
      last_name
      picture
      name
      id
    }
  }
}
```

## Mutation: Update Meeting Title
Use the API to update meeting titles

The updateMeetingTitle mutation allows for updating the title of a meeting transcript. This operation requires admin privileges within the team.
​
### Arguments
​
input
UpdateMeetingTitleInputrequired
The new title to be assigned to the meeting / transcript.
​
### Usage Example
To update a meeting title, provide the transcript ID and the new title as arguments to the mutation. Here’s an example of how this mutation could be used:
```
mutation UpdateMeetingTitle($input: UpdateMeetingTitleInput!) {
  updateMeetingTitle(input: $input) {
    title
  }
}
```

## Webhooks - Webhook events for the Fireflies.ai API

​
### Overview
Webhooks enable your application to set up event based notifications. In this section, you’ll learn how to configure webhooks to receive updates from Fireflies.
​
### Events supported
The webhooks support the following events:
Transcription complete: Triggers when a meeting has been processed and the transcript is ready for viewing
Fireflies sends webhook notifications as POST requests to your specified endpoint. Each request contains a JSON payload with information about the event that occurred.
​
### Saving a webhook
Follow the instructions below to save a webhook URL that sends notifications for all subscribed events. This webhook will only be fired for meetings that you own.
1. Visit the Fireflies.ai dashboard settings
2. Navigate to the Developer settings tab
3. Enter a valid https URL in the webhooks field and save
You may test your webhook using the upload audio API or by uploading through the dashboard at app.fireflies.ai/upload
​
### Upload audio webhook
You can also include a webhook URL as part of an upload audio request. This is different from the saved webhook as it will only send notifications for that singular audio upload request.

### Webhook Authentication

Webhook authentication ensures that incoming webhook requests are securely verified before processing. This allows consumers to trust that webhook events originate from a secure and verified source.
​
### How It Works
Each webhook request sent from the server includes an x-hub-signature header containing a SHA-256 HMAC signature of the request payload. This signature is generated using a secret key known only to the server and your application.
When the consumer receives a webhook, they can use the signature provided in the x-hub-signature header to verify that the request has not been tampered with. This is done by computing their own HMAC signature using the shared secret key and comparing it to the signature included in the header.
​
### Saving a secret
Go to the settings page at app.fireflies.ai/settings
Navigate to the Developer Settings tab
You can either:
Enter a custom secret key of 16-32 characters in the input field
Click on the refresh button to generate a random secret key
Click Save to ensure the secret gets updated
Make sure to store this secret key securely, as it will be used to authenticate incoming webhook requests
​
### Verifying the Signature
Receive the Webhook:
Each request will include the payload and an x-hub-signature header
Verify the Signature:
Compute the HMAC SHA-256 signature using the payload and the shared secret key
Compare the computed signature to the x-hub-signature header value
If they match, the request is verified as authentic. If they do not match, treat the request with caution or reject it
By verifying webhook signatures, consumers can ensure that webhook events received are secure and have not been altered during transmission
​
### See it in action
To see webhook authentication in action, you can view an example at Fireflies.ai Verifying Webhook Requests. This example demonstrates how to receive a webhook, compute the HMAC SHA-256 signature, and verify it against the x-hub-signature header to ensure the request’s authenticity.
​
## Webhook Schema
​
meetingId
Stringrequired
Identifier for the meeting / transcript that the webhook has triggered for. MeetingId and TranscriptId are used interchangeably for the Fireflies.ai Platform.
​
eventType
String
Name of the event type that has been fired against the webhook
​
clientReferenceId
ID
Custom identifier set by the user during upload. You may use this to identify your uploads in your events.
​
Example Payload

{
    "meetingId": "ASxwZxCstx",
    "eventType": "Transcription completed",
    "clientReferenceId": "be582c46-4ac9-4565-9ba6-6ab4264496a8"
}
​
```
const axios = require('axios');

const url = 'https://api.fireflies.ai/graphql';
const headers = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer your_api_key'
};
```

```
const input = {
  url: 'https://url_to_the_audio_file',
  title: 'title of the file',
  webhook: 'https://url_for_the_webhook'
};
const data = {
  query: `       mutation($input: AudioUploadInput) {
        uploadAudio(input: $input) {
          success
          title
          message
        }
      }
    `,
  variables: { input }
};
```

```
axios
  .post(url, data, { headers: headers })
  .then(result => {
    console.log(result.data);
  })
  .catch(e => {
    console.log(JSON.stringify(e));
  });
​```