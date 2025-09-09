# RAG Agent Common Issues & Solutions

## Overview
This guide documents common issues encountered with RAG agents (PM and FM Global) and their solutions.

## 1. Pydantic AI AgentRunResult Issues

### Problem
When deploying Pydantic AI agents to Railway/Render, you may encounter:
```
'AgentRunResult' object has no attribute 'data'
```

Or responses containing unwanted wrappers:
```
AgentRunResult(output='your actual response text')
```

### Root Cause
Pydantic AI's `agent.run()` returns an `AgentRunResult` object with varying structures across versions.

### Solution
Use this safe extraction pattern in all endpoints:

```python
# After: result = await agent.run(prompt, deps=deps)

if hasattr(result, 'data'):
    response_text = result.data  # Most common
elif hasattr(result, 'response'):
    response_text = str(result.response)
elif hasattr(result, 'output'):
    response_text = str(result.output)
else:
    # Fallback extraction from string
    result_str = str(result)
    # Extract actual content from wrapper if present
```

### Files to Check
- FM Global: `/alleato-rag-agents/rag-agent-fmglobal/rag_agent/api/fm_global_app.py`
- PM RAG: `/alleato-rag-agents/rag-agent-pm/app.py`

### Verification
```bash
# Test locally before deploying
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}' | jq .response

# Should NOT contain "AgentRunResult("
```

## 2. Railway/Render Deployment Issues

### Cold Start Timeouts
**Problem:** First request after inactivity times out

**Solution:**
1. Implement 60-second timeout in proxy routes
2. Add retry logic in frontend
3. Consider upgrading from free tier

### Environment Variables
**Problem:** Chat works locally but fails on Railway

**Check these in Railway dashboard:**
```
LLM_API_KEY=sk-...
DATABASE_URL=postgresql://...
LLM_PROVIDER=openai
LLM_MODEL=gpt-4
```

## 3. Integration Issues

### CORS Errors
**Problem:** Frontend can't connect to RAG endpoint

**Solution:** Add your domain to CORS middleware:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-domain.com",  # Add this
    ],
)
```

### Proxy Route Configuration
**Problem:** RAG endpoints not accessible

**Solution:** Use environment variables:
```javascript
// In .env.local
RAILWAY_RAG_API_URL=https://your-railway-app.railway.app
FM_GLOBAL_RAILWAY_API_URL=https://fm-global.railway.app

// In proxy route
const API_URL = process.env.RAILWAY_RAG_API_URL || 'fallback-url';
```

## 4. Database/Vector Store Issues

### Embedding Dimension Mismatch
**Error:** `invalid input for query argument $1: [array] (expected str, got list)`

**Cause:** Passing embedding array where string expected

**Solution:** Check SQL function signatures match code

### Vector Store Not Connected
**Health Check Shows:** `"vector_store": false`

**Solution:**
1. Verify DATABASE_URL is set
2. Check PGVector extension installed
3. Review connection pooling in dependencies

## 5. Quick Debugging Commands

```bash
# Check if RAG agent is healthy
curl https://your-endpoint.railway.app/health

# Test chat endpoint
curl -X POST https://your-endpoint.railway.app/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}' | jq .

# Check local before deploying
python test_agent_pipeline.py

# View Railway logs
railway logs

# Check recent fixes
git log --oneline | grep -i fix
```

## 6. Testing Checklist

Before deploying any RAG agent:

- [ ] Test locally with actual queries
- [ ] Verify response has no wrapper text
- [ ] Check health endpoint works
- [ ] Confirm environment variables set
- [ ] Test through proxy route
- [ ] Verify CORS configured
- [ ] Check fallback mechanism works

## 7. File Structure Reference

```
/alleato-rag-agents/
├── rag-agent-fmglobal/
│   ├── rag_agent/api/fm_global_app.py  # Main endpoints
│   ├── start_server.py                  # Entry point
│   └── TROUBLESHOOTING.md              # Specific issues
├── rag-agent-pm/
│   ├── app.py                          # Main endpoints
│   └── start_server.py                 # Entry point
```

## 8. Known Working Configurations

### FM Global RAG
- Endpoint: `fm-global-asrs-expert-production-afb0.up.railway.app`
- Fixed in commits: `1c6c06f`, `177d76e`
- Uses fallback to OpenAI GPT-4 if unavailable

### PM RAG
- Endpoint: `rag-agent-api-production.up.railway.app`
- Database issues may need separate fixing

## Prevention

1. **Always use safe attribute access** - Never assume object structure
2. **Test responses locally** - Check for wrapper text
3. **Document fixes immediately** - Update this guide
4. **Use fallback patterns** - Primary + backup system
5. **Monitor health endpoints** - Set up alerts

## Additional Resources

- Technical details: `/documentation/technical/pydantic-ai-agentrunresult-fix.md`
- FM Global specific: `/alleato-rag-agents/rag-agent-fmglobal/TROUBLESHOOTING.md`
- Railway deployment: `/documentation/guides/rag-railway-deployment.md`

## Last Updated
- Date: 2025-09-09
- Author: Claude Code & Megan Harrison
- Status: Both RAG agents operational with documented fixes