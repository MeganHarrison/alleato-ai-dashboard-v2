# AI Insights Table Structure Documentation

## Overview
The `ai_insights` table stores AI-generated insights extracted from meetings and documents. It has evolved over multiple migrations and now includes comprehensive fields for tracking various types of insights with duplicate prevention mechanisms.

## Complete Column Structure

### Core Identity Fields
- **id** (number/SERIAL): Primary key, auto-incrementing integer
- **document_id** (string/UUID): Reference to the document this insight is from
- **meeting_id** (string/UUID, nullable): Legacy field, being phased out in favor of document_id
- **project_id** (number, nullable): Reference to the associated project

### Content Fields
- **title** (string, **REQUIRED**): Brief title of the insight
- **description** (string, **REQUIRED**): Detailed description of the insight
- **insight_type** (string, nullable): Type of insight with CHECK constraint
  - Valid values: `'risk'`, `'opportunity'`, `'decision'`, `'action_item'`, `'strategic'`, `'technical'`
- **severity** (string, nullable): Severity level with CHECK constraint
  - Valid values: `'critical'`, `'high'`, `'medium'`, `'low'`

### Metadata Fields
- **meeting_name** (string, nullable): Name of the meeting (legacy)
- **project_name** (string, nullable): Name of the project
- **source_meetings** (string, nullable): JSON array of meeting IDs this insight references
- **confidence_score** (number, nullable): AI confidence score (0.0 to 1.0)
- **resolved** (number, nullable): Resolution status (0 = unresolved, 1 = resolved)
- **status** (string): Current status of the insight (e.g., 'open', 'closed')

### Assignment & Timeline Fields
- **assigned_to** (string, nullable): Person assigned to this insight
- **assignee** (string, nullable): Alternative assignee field
- **due_date** (timestamp, nullable): Due date for action items
- **resolved_at** (timestamp, nullable): When the insight was resolved

### Impact Analysis Fields
- **business_impact** (text, nullable): Description of business impact
- **financial_impact** (number, nullable): Financial impact in dollars
- **timeline_impact_days** (number, nullable): Impact on timeline in days
- **stakeholders_affected** (text array, nullable): List of affected stakeholders
- **cross_project_impact** (text, nullable): Impact on other projects

### Supporting Data Fields
- **dependencies** (JSON array): List of dependencies
- **exact_quotes** (JSON array): Exact quotes from meetings supporting this insight
- **numerical_data** (JSON array): Numerical data extracted
- **urgency_indicators** (text, nullable): Indicators of urgency
- **metadata** (JSON object): Additional metadata

### System Fields
- **created_at** (timestamp): When the insight was created (default: NOW())
- **content_hash** (string, nullable): MD5 hash for duplicate prevention (auto-generated)

## Constraints

### CHECK Constraints
1. **insight_type**: Must be one of the valid types listed above
2. **severity**: Must be one of the valid severity levels
3. **confidence_score**: Must be between 0.0 and 1.0
4. **resolved**: Must be 0 or 1

### Foreign Key Constraints
- **meeting_id** → meetings(id) ON DELETE CASCADE
- **project_id** → projects(id) ON DELETE SET NULL
- **document_id** → documents(id) ON DELETE CASCADE (if configured)

### Unique Constraints
- **content_hash**: Ensures no duplicate insights with same meeting_id + insight_type + normalized title

## Triggers

1. **set_insight_hash** (BEFORE INSERT OR UPDATE)
   - Generates content_hash using MD5(meeting_id + insight_type + normalized_title)
   - Prevents duplicate insights

2. **ai_insights_before_insert** (BEFORE INSERT)
   - Validates required fields
   - Sets default values for resolved (0) and confidence_score (0.5)

3. **update_ai_insights_updated_at** (BEFORE UPDATE)
   - Updates the updated_at timestamp (if column exists)

## Required vs Optional Fields

### Required Fields (NOT NULL)
- **title**: Must always have a title
- **description**: Must always have a description

### Optional but Recommended
- **insight_type**: Should be specified for proper categorization
- **severity**: Important for prioritization
- **project_id**: Helps with project association
- **confidence_score**: Indicates AI confidence level

### All Other Fields
All other fields are optional and can be NULL.

## Default Values
- **id**: Auto-incremented
- **resolved**: Defaults to 0 (unresolved)
- **created_at**: Defaults to current timestamp
- **confidence_score**: Defaults to 0.5 (via trigger)
- **metadata**: Defaults to empty object {}
- **dependencies**: Defaults to empty array []

## Best Practices for Insertion

### Minimal Valid Insert
```sql
INSERT INTO ai_insights (title, description) 
VALUES ('Sample Title', 'Sample Description');
```

### Recommended Insert
```sql
INSERT INTO ai_insights (
  title,
  description,
  insight_type,
  severity,
  project_id,
  confidence_score,
  source_meetings
) VALUES (
  'Budget Overrun Risk',
  'Project may exceed budget by 20% due to material costs',
  'risk',
  'high',
  58,
  0.85,
  '["meeting-id-1", "meeting-id-2"]'
);
```

### Complete Insert with All Fields
```sql
INSERT INTO ai_insights (
  title,
  description,
  insight_type,
  severity,
  project_id,
  document_id,
  confidence_score,
  source_meetings,
  status,
  business_impact,
  financial_impact,
  timeline_impact_days,
  stakeholders_affected,
  exact_quotes,
  numerical_data,
  urgency_indicators,
  metadata
) VALUES (
  'Critical Decision: Vendor Selection',
  'Team decided to select Vendor A for construction materials',
  'decision',
  'critical',
  58,
  '9c92288d-e0bf-4db4-8877-dd12fa321589',
  0.95,
  '["01K4B7WDZXYFF3KRAZB8BDTPQS"]',
  'open',
  'Major impact on project timeline and budget',
  150000,
  30,
  '["Project Manager", "CFO", "Construction Team"]',
  '[{"quote": "We need to finalize vendor by Friday", "speaker": "PM"}]',
  '[{"metric": "cost_savings", "value": 150000}]',
  'Deadline approaching, competitors interested',
  '{"category": "procurement", "priority": 1}'
);
```

## Common Errors and Solutions

### Error: Duplicate key value violates unique constraint
**Cause**: Trying to insert an insight with the same meeting_id + insight_type + title combination
**Solution**: Check if insight already exists or use a different title

### Error: Value too long for type character varying
**Cause**: Title or other string fields exceed maximum length
**Solution**: Truncate or summarize the content

### Error: Invalid input value for enum
**Cause**: Using invalid value for insight_type or severity
**Solution**: Use only the valid values listed above

## Migration History
1. Initial table created with basic fields
2. Added duplicate prevention with content_hash
3. Added business impact fields
4. Transitioned from meeting_id to document_id
5. Added comprehensive metadata and impact tracking fields

## Current Statistics
- Total rows: ~2100 insights
- Most common type: Decisions and action items
- Average confidence score: 0.85-0.92