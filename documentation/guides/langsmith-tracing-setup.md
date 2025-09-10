# LangSmith Tracing Setup Guide

This guide explains how to use LangSmith tracing for observability in the FM Global RAG application.

## Overview

LangSmith provides comprehensive observability for LLM applications, enabling you to:
- Trace entire RAG pipelines from retrieval to generation
- Monitor performance metrics and latency
- Collect user feedback
- Debug issues in production
- A/B test different models and prompts

## Setup Instructions

### 1. Get LangSmith API Keys

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Create an account or sign in
3. Navigate to Settings → API Keys
4. Create a new API key and save it

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Enable tracing (set to false for production if not needed)
LANGSMITH_TRACING=true

# Your LangSmith API key
LANGSMITH_API_KEY=your-api-key-here

# Project name for organizing traces
LANGSMITH_PROJECT=fm-global-rag

# Your workspace ID (found in LangSmith settings)
LANGSMITH_WORKSPACE_ID=your-workspace-id

# Optional: Custom API endpoint (defaults to https://api.smith.langchain.com)
# LANGSMITH_API_URL=https://api.smith.langchain.com

# Application metadata
DEPLOYMENT_ENV=development  # or staging, production
APP_VERSION=1.0.0
```

### 3. Verify Setup

Check if tracing is working by visiting: http://localhost:3000/api/fm-global

The response should include:
```json
{
  "status": "healthy",
  "tracing": "enabled",
  "project": "fm-global-rag"
}
```

## Using Tracing in Development

### Viewing Traces

1. Make a request to the FM Global Expert chat
2. Go to [smith.langchain.com](https://smith.langchain.com)
3. Select your project (fm-global-rag)
4. You'll see traces for:
   - Complete RAG pipeline
   - Railway API calls
   - OpenAI fallback calls
   - Individual retrieval and generation steps

### Understanding Trace Structure

Each trace contains:
- **Input/Output**: The messages sent and received
- **Latency**: Time taken for each step
- **Metadata**: Environment, version, user ID, session ID
- **Error Details**: If something went wrong

## Collecting User Feedback

### Frontend Implementation

When a user provides feedback (thumbs up/down):

```typescript
// The API returns a runId with each response
const response = await fetch('/api/fm-global', {
  method: 'POST',
  body: JSON.stringify({ messages })
});
const data = await response.json();
const runId = data.runId;

// Submit feedback
await fetch('/api/feedback', {
  method: 'POST',
  body: JSON.stringify({
    runId: runId,
    score: 1.0,  // 1.0 for positive, 0.0 for negative
    comment: "Optional user comment",
    key: "user-score"  // or "accuracy", "helpfulness", etc.
  })
});
```

### Viewing Feedback

1. In LangSmith, click on any trace
2. Go to the "Metadata" tab
3. You'll see all feedback associated with that run

## Monitoring in Production

### Key Metrics to Track

1. **Response Time**: Monitor p50, p95, p99 latencies
2. **Error Rate**: Track failures and timeouts
3. **Token Usage**: Monitor costs across different models
4. **User Satisfaction**: Analyze feedback scores

### Setting Up Alerts

In LangSmith:
1. Go to your project → Monitor tab
2. Set up alerts for:
   - High latency (>5 seconds)
   - Error rate >5%
   - Low feedback scores

## A/B Testing

### Testing Different Models

The system logs metadata about which model/endpoint was used:

```typescript
// Metadata automatically logged:
{
  "llm_provider": "openai" | "railway",
  "model": "gpt-4-turbo",
  "endpoint": "railway" | "openai-fallback",
  "fallback": true | false
}
```

To compare performance:
1. Go to Monitor tab in LangSmith
2. Click "Metadata" dropdown
3. Select "llm_provider" or "model"
4. View charts grouped by your selection

## Performance Optimization

### Disable Tracing in Production

For maximum performance, you can disable tracing:

```bash
LANGSMITH_TRACING=false
```

The application automatically:
- Skips all tracing overhead when disabled
- Uses streaming responses for better UX
- Falls back gracefully without affecting functionality

### Selective Tracing

You can also enable tracing only for specific users or sessions by checking conditions in your code:

```typescript
// Only trace for specific users or random sampling
const shouldTrace = userId === 'test-user' || Math.random() < 0.1;
process.env.LANGSMITH_TRACING = shouldTrace ? 'true' : 'false';
```

## Debugging Issues

### Common Problems

1. **No traces appearing**: 
   - Check LANGSMITH_API_KEY is correct
   - Verify LANGSMITH_TRACING=true
   - Check network connectivity to smith.langchain.com

2. **Missing metadata**:
   - Ensure all environment variables are set
   - Check that sessionId and userId are being passed

3. **High latency**:
   - Consider disabling tracing for some requests
   - Use sampling to reduce trace volume

### Debug Mode

Enable debug logging:

```typescript
// In your API route
console.log('Tracing enabled:', isTracingEnabled);
console.log('Project:', process.env.LANGSMITH_PROJECT);
console.log('Metadata:', getTraceMetadata());
```

## Best Practices

1. **Use meaningful trace names**: Make it easy to identify what each trace does
2. **Add relevant metadata**: Include user IDs, session IDs, feature flags
3. **Track business metrics**: Not just technical metrics, but user outcomes
4. **Regular review**: Weekly review of traces to identify issues
5. **Clean up old traces**: Archive or delete old development traces

## Security Considerations

1. **Never log sensitive data**: No passwords, API keys, or PII in traces
2. **Use environment-specific projects**: Separate dev/staging/prod
3. **Restrict API key access**: Use read-only keys where possible
4. **Regular key rotation**: Rotate LangSmith API keys quarterly

## Support

For issues with:
- **LangSmith**: Check [docs.smith.langchain.com](https://docs.smith.langchain.com)
- **This implementation**: Create an issue in the repository
- **API errors**: Check the health endpoint first