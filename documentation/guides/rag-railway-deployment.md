# RAG Agent Railway Deployment Configuration

## Overview

The RAG chat interface in this project is configured to work with multiple deployment platforms including Railway, Render, and custom deployments. The system automatically detects and uses the appropriate endpoint based on environment variables.

## Configuration

### Environment Variables

Configure your RAG API endpoint by setting one of these environment variables in your `.env.local` file:

```bash
# For Railway deployment
RAILWAY_RAG_API_URL=https://your-app.railway.app

# For Render deployment (default fallback)
RAG_API_URL=https://rag-agent-pm.onrender.com

# For custom deployment
RAG_API_URL=https://your-custom-rag-api.com
```

### Priority Order

The system checks for endpoints in this order:
1. `RAG_API_URL` - Primary configuration
2. `RAILWAY_RAG_API_URL` - Railway-specific configuration
3. `NEXT_PUBLIC_RAG_API_URL` - Public endpoint configuration
4. Default: `https://rag-agent-pm.onrender.com`

## Deploying RAG Agent to Railway

### Step 1: Prepare the RAG Agent

1. Navigate to the RAG agent directory:
   ```bash
   cd alleato-rag-agents/rag-agent-pm
   ```

2. Ensure all dependencies are listed in `requirements.txt`

3. Create a `railway.json` file (if not exists):
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "python app.py",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

### Step 2: Deploy to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize Railway project:
   ```bash
   railway init
   ```

4. Set environment variables in Railway:
   ```bash
   railway variables set DATABASE_URL="your_postgres_url"
   railway variables set LLM_API_KEY="your_openai_key"
   railway variables set LLM_PROVIDER="openai"
   railway variables set LLM_MODEL="gpt-4"
   ```

5. Deploy:
   ```bash
   railway up
   ```

6. Get your deployment URL:
   ```bash
   railway open
   ```

### Step 3: Configure the Dashboard

1. Copy your Railway deployment URL
2. Add it to your `.env.local`:
   ```bash
   RAILWAY_RAG_API_URL=https://your-app.railway.app
   ```
3. Restart your Next.js development server

## Features

### Connection Status Indicator

The RAG chat interface displays real-time connection status:
- **Green checkmark**: Connected and healthy
- **Orange alert**: Service offline or unreachable
- **Spinner**: Checking connection status

The status automatically updates every 30 seconds and shows whether you're connected to Railway, Render, or a custom endpoint.

### Health Check Endpoint

The proxy API includes a health check endpoint that verifies:
- API availability
- LLM configuration
- Vector store connection
- Model information

Access it at: `GET /api/rag-proxy`

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your Railway app's CORS settings include your frontend URL
   - Update `app.py` in the RAG agent to include your domain

2. **Timeout Errors**
   - Railway free tier may have cold start delays
   - The proxy includes a 60-second timeout to handle this
   - Consider upgrading to a paid tier for better performance

3. **Connection Failed**
   - Verify environment variables are set correctly
   - Check Railway logs: `railway logs`
   - Test the endpoint directly: `curl https://your-app.railway.app/health`

## Testing

### Local Testing
1. Start the RAG API locally:
   ```bash
   cd alleato-rag-agents/rag-agent-pm
   python app.py
   ```

2. Set local environment:
   ```bash
   RAG_API_URL=http://localhost:8000
   ```

3. Test the chat interface at `http://localhost:3000/rag-chat`

### Production Testing
1. Verify the health endpoint:
   ```bash
   curl https://your-app.railway.app/health
   ```

2. Check the proxy health:
   ```bash
   curl http://localhost:3000/api/rag-proxy
   ```

3. Test a chat message through the interface

## Security Considerations

- Never commit API keys or sensitive URLs to version control
- Use environment variables for all configuration
- Implement rate limiting if needed
- Consider adding authentication for production use

## Performance Optimization

- Railway paid tiers eliminate cold starts
- Implement caching for frequently accessed data
- Use connection pooling for database connections
- Monitor usage with Railway's built-in metrics