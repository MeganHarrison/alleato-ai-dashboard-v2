# Pydantic AI AgentRunResult Fix Documentation

## Problem Summary
When using Pydantic AI agents, the chat endpoint fails with:
```
'AgentRunResult' object has no attribute 'data'
```

Additionally, responses may contain unwanted wrapper text like:
```
AgentRunResult(output='actual response here')
```

## Root Cause
Pydantic AI's `agent.run()` method returns an `AgentRunResult` object. The structure and attributes of this object can vary between versions and configurations:
- Sometimes has `.data` attribute (string)
- Sometimes has `.response` attribute
- Sometimes has `.output` attribute
- String representation includes wrapper text

## Solution

### Correct Implementation Pattern

```python
# In any FastAPI endpoint using Pydantic AI agents:
from pydantic_ai import Agent

async def chat_endpoint(query):
    agent = your_agent_instance()
    result = await agent.run(prompt, deps=deps)
    
    # CORRECT: Safe extraction with fallback chain
    if hasattr(result, 'data'):
        response_text = result.data  # Direct access, no conversion needed
    elif hasattr(result, 'response'):
        response_text = str(result.response)
    elif hasattr(result, 'output'):
        response_text = str(result.output)
    else:
        # Last resort - extract from string representation
        result_str = str(result)
        if "output='" in result_str or 'output="' in result_str:
            import re
            match = re.search(r"output=['\"](.+?)['\"]", result_str, re.DOTALL)
            if match:
                response_text = match.group(1)
            else:
                response_text = result_str
        else:
            response_text = result_str
    
    return {"response": response_text}
```

### For Streaming Endpoints

```python
async with agent.iter(prompt, deps=deps) as run:
    async for node in run:
        if Agent.is_tool_call_node(node):
            # Safe tool name extraction
            tool_name = None
            if hasattr(node, 'data') and hasattr(node.data, 'tool_name'):
                tool_name = node.data.tool_name
            elif hasattr(node, 'tool_name'):
                tool_name = node.tool_name
                
        elif Agent.is_model_response_node(node):
            # Safe content extraction
            content = None
            if hasattr(node, 'data') and hasattr(node.data, 'content'):
                content = node.data.content
            elif hasattr(node, 'content'):
                content = node.content
            else:
                content = str(node)
```

## Common Mistakes to Avoid

### ❌ DON'T: Direct attribute access
```python
# This will fail if structure changes
response_text = result.data  # AttributeError possible
response_text = result.response  # AttributeError possible
```

### ❌ DON'T: Convert entire result to string first
```python
# This includes the wrapper
response_text = str(result)  # Returns "AgentRunResult(output='...')"
```

### ❌ DON'T: Assume consistent structure
```python
# Different Pydantic AI versions may differ
response_text = result.output  # May not exist
```

## Testing the Fix

### Quick Test Script
```python
#!/usr/bin/env python3
import asyncio
from your_app import chat_endpoint, FMGlobalQuery

async def test():
    query = FMGlobalQuery(query="Test query")
    response = await chat_endpoint(query)
    
    # Check for clean response
    assert "AgentRunResult" not in response.response
    print("✅ Response is clean:", response.response[:100])

asyncio.run(test())
```

### Verification Checklist
- [ ] No `AttributeError` on `.data`, `.response`, or `.output`
- [ ] Response doesn't contain `AgentRunResult(` wrapper
- [ ] Works with both sync and streaming endpoints
- [ ] Handles edge cases gracefully

## Deployment Notes

### Railway/Render Deployment
After fixing, ensure the deployment:
1. Has latest code from GitHub
2. Restarts to pick up changes
3. Test health endpoint first: `/health`
4. Test chat endpoint: `/chat`

### Environment Variables
No special environment variables needed for this fix.

## Files Affected
When this issue occurs, check these files:
- `/rag_agent/api/fm_global_app.py` - Main chat endpoints
- `/rag_agent/api/app.py` - General RAG endpoints
- Any file with `agent.run()` calls

## Prevention
1. Always use the safe extraction pattern above
2. Test with actual Pydantic AI agent responses
3. Include this pattern in code reviews
4. Add unit tests for response extraction

## Related Issues
- Pydantic AI version compatibility
- FastAPI response serialization
- JSON encoding of complex objects

## Last Updated
- Date: 2025-09-09
- Fixed in commits: 
  - `1c6c06f` - Initial fix for AttributeError
  - `177d76e` - Improved extraction without wrapper
- Deployed to: Railway (fm-global-asrs-expert-production-afb0.up.railway.app)