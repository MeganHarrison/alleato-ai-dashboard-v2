# FM Global Railway Integration Documentation

## Overview
All FM Global ASRS-related functionality is powered by a Railway-deployed expert system that specializes in FM Global 8-34 sprinkler requirements.

## Railway Endpoint
**Production URL**: `https://fm-global-asrs-expert-production-afb0.up.railway.app`

This Railway deployment provides:
- Expert knowledge of FM Global 8-34 requirements
- Figure and table identification
- Sprinkler system design recommendations
- Cost estimation capabilities
- Compliance validation

## Integration Points

### 1. Main FM Global API (`/api/fm-global`)
- **Purpose**: General FM Global expert chat interface
- **Railway Integration**: Primary endpoint with OpenAI fallback
- **Usage**: Chat interface, expert Q&A

### 2. Form Submission API (`/api/fm-global/form`)
- **Purpose**: Process structured form data for ASRS requirements
- **Railway Integration**: Converts form data to expert prompts
- **Usage**: FM Global requirements form

## How It Works

### Architecture Flow
```
User Input → API Route → Railway Expert → Response Parsing → Formatted Output
                ↓ (if Railway fails)
            OpenAI Fallback
```

### Form to Railway Flow
1. **User fills form** with ASRS configuration details
2. **Form API** converts data to structured prompt
3. **Railway expert** analyzes requirements
4. **Parser extracts** figures, tables, costs
5. **Response formatted** for display

## Form Data Processing

### Input Structure
```typescript
{
  asrs_type: 'Shuttle' | 'Mini-Load' | 'Horizontal Carousel',
  container_type: 'Closed-Top' | 'Open-Top' | 'Mixed',
  rack_depth_ft: number,
  rack_spacing_ft: number,
  ceiling_height_ft: number,
  storage_height_ft: number,
  commodity_type: string[],
  system_type: 'wet' | 'dry' | 'both'
}
```

### Prompt Generation
The form data is converted to a comprehensive prompt:
```
I need FM Global 8-34 ASRS sprinkler system requirements for:
- ASRS Type: [type]
- Container: [container_type]
- Dimensions: [rack_depth x spacing x height]
- Commodities: [types]

Please provide:
1. Applicable figures and tables
2. Protection scheme required
3. Sprinkler count and spacing
4. Cost estimate breakdown
5. Optimization opportunities
```

### Response Parsing
The Railway response is parsed to extract:
- **Figures**: Regex match for "Figure X.X"
- **Tables**: Regex match for "Table X.X"
- **Protection Scheme**: Keywords like "ceiling-only", "in-rack"
- **Costs**: Dollar amounts and breakdowns
- **Sprinkler Count**: Numeric extraction

## Cost Estimation Logic

### Component Breakdown
- **Sprinklers**: 25% of total cost
- **Piping**: 30% of total cost
- **Labor**: 35% of total cost
- **Equipment**: 10% of total cost

### Calculation Factors
- Base rate: 1 sprinkler per 100 sq ft
- In-rack adjustment: +50% sprinklers for open-top
- Commodity adjustment: +50% for high-hazard plastics

## Fallback Behavior

When Railway is unavailable:
1. **OpenAI GPT-4** provides expert analysis
2. **Basic calculations** based on form inputs
3. **Conservative estimates** for safety margin

## Environment Configuration

Required environment variables:
```bash
# Railway endpoint (primary)
RAILWAY_FM_GLOBAL_URL=https://fm-global-asrs-expert-production-afb0.up.railway.app
RAILWAY_ASRS_RAG=fm-global-asrs-expert-production-afb0.up.railway.app

# OpenAI (fallback)
OPENAI_API_KEY=sk-...
```

## Testing the Integration

### Test Form Submission
```bash
curl -X POST http://localhost:3000/api/fm-global/form \
  -H "Content-Type: application/json" \
  -d '{
    "asrs_type": "Shuttle",
    "container_type": "Closed-Top",
    "rack_depth_ft": 6,
    "ceiling_height_ft": 30,
    "commodity_type": ["Class III"]
  }'
```

### Expected Response
```json
{
  "success": true,
  "specification": {
    "applicableFigures": ["Figure 12", "Figure 13"],
    "applicableTables": ["Table 8"],
    "sprinklerCount": 150,
    "protectionScheme": "Ceiling-Only Protection",
    "inRackProtection": {
      "required": false,
      "count": 0
    },
    "costEstimate": {
      "total": 125000,
      "sprinklers": { "count": 150, "total": 31250 },
      "piping": { "feet": 2250, "total": 37500 },
      "labor": { "hours": 300, "total": 43750 },
      "equipment": { "total": 12500 }
    }
  },
  "submissionId": "ASRS-1234567890"
}
```

## Optimization Opportunities

The system automatically identifies:
1. **Container changes** - Closed vs open-top impact
2. **Height optimization** - Staying under thresholds
3. **Spacing adjustments** - Aisle width impacts
4. **System type selection** - Wet vs dry trade-offs

## Monitoring & Debugging

### Health Checks
```bash
# Check Railway status
curl https://fm-global-asrs-expert-production-afb0.up.railway.app/health

# Check form API
curl http://localhost:3000/api/fm-global/form
```

### Common Issues
| Issue | Cause | Solution |
|-------|-------|----------|
| Timeout | Railway cold start | Retry or use fallback |
| No figures found | Parsing issue | Check response format |
| High cost estimate | Complex configuration | Review optimization suggestions |

## Future Enhancements

### Planned Improvements
1. **Caching** - Store common configurations
2. **Batch processing** - Multiple designs at once
3. **Visual diagrams** - Show sprinkler layouts
4. **Detailed reports** - PDF generation
5. **Historical tracking** - Save past designs

### Railway Scaling
- Current: Single instance
- Future: Auto-scaling based on load
- Consider: Edge deployment for latency

## Support

For issues with:
- **Railway endpoint**: Check deployment logs
- **Form processing**: Review form validation
- **Cost calculations**: Verify input parameters
- **Response parsing**: Check Railway output format

---

*This integration ensures all FM Global ASRS functionality leverages the specialized Railway expert system for accurate, compliant sprinkler system design.*