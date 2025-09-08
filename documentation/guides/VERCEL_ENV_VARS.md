# Environment Variables for Vercel Deployment

Copy these environment variables to your Vercel project settings:

## Required Core Variables

### OpenAI Integration
```
OPENAI_API_KEY=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
```

### Supabase Integration (CRITICAL)
```
NEXT_PUBLIC_SUPABASE_URL=https://lgveqfnpkxvzbnnwuled.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTQxNjYsImV4cCI6MjA3MDgzMDE2Nn0.g56kDPUokoJpWY7vXd3GTMXpOc4WFOU0hDVWfGMZtO8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA
DATABASE_URL=postgresql://postgres:Alleatogroup2025!@db.lgveqfnpkxvzbnnwuled.supabase.co:5432/postgres
```

### Worker Integration
```
NEXT_PUBLIC_WORKER_URL=https://pm-rag-sep-1.megan-d14.workers.dev
```

## Optional API Keys (for enhanced features)

### V0 & AI Gateway
```
V0_API_KEY=v1:j27MrGKqvwlFUVcsYQ3HkrLx:yEuXYPT6ud13bKhu45U9usyu
AI_GATEWAY_KEY=hwuw515hn1KdALy4Duvd1IKo
```

### MCP Tools (optional)
```
FIREFLIES_API_KEY=1d590920-152d-408b-a829-14489ef07538
SERPAPI_API_KEY=1ed0325b1c43f3b69fd1959c7ec59c719ea1055334677b4d4fcd1eed7b27f570
TAVILY_API_KEY=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
APOLLO_API_KEY=N2IgYlwx86_Jn1kiyN45gQ
GEMINI_API_KEY=AIzaSyD8zPnedOpqLam1BsSsVgjDiiB30tR1FFs
GITHUB_TOKEN=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
```

### Notion Integration (optional)
```
NOTION_API_KEY=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
NOTION_DATABASE_ID=18fee3c6d9968192a666fe6b55e99f52
```

### Cloudflare (optional)
```
CLOUDFLARE_D1_API_TOKEN=GqmS3WJHA69Prddovzvrjmpf_IZ1kfkFrS9SrNIz
CLOUDFLARE_ACCOUNT_ID=d1416265449d2a0bae41c45c791270ec
```

## Deployment Notes

1. **CRITICAL**: The Supabase variables are essential for the app to function
2. **OpenAI API Key**: Required for AI chat functionality
3. **Worker URL**: Required for PM RAG functionality
4. **Optional keys**: Can be added later if you need those specific features

## Security Notes

⚠️ **IMPORTANT**: These are the actual production keys from your `.env.local`. 
Make sure to:
1. Set them as environment variables in Vercel (not in code)
2. Consider rotating keys after deployment
3. Use different keys for staging vs production if needed