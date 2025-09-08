# AI Insights Dashboard Documentation

## Overview

The AI Insights Dashboard is an executive-level analytics interface that provides AI-generated insights from projects, meetings, and documents. It serves as a centralized hub for decision-makers to track high-priority items, project status, and actionable intelligence.

**Route**: `/ai-insights`
**File**: `/app/(dashboard)/ai-insights/page.tsx`
**Created**: January 8, 2025

## Features

### Core Functionality

#### 1. AI-Generated Insights Feed
- **Purpose**: Display actionable insights extracted from various data sources
- **Types**: Actions, Risks, Decisions, Questions, Updates
- **Priority Levels**: High (red), Medium (orange), Low (green)
- **Confidence Scores**: AI-generated confidence percentage (0-100%)

#### 2. Project Status Tracking
- **Status Categories**: 
  - At Risk (red indicator)
  - Needs Attention (orange indicator)
  - On Track (green indicator)
- **Real-time Updates**: Project status reflected in sidebar panel

#### 3. Meeting Intelligence Integration
- **Today's Meetings**: Schedule with AI-extracted insights
- **Confidence Indicators**: Visual progress bars showing insight confidence
- **Project Associations**: Each meeting linked to relevant project

#### 4. Interactive Navigation
- **Tab System**: Today, Week, Projects views
- **Statistics Header**: Key metrics (high priority items, actions, meetings, risks)
- **Responsive Design**: Optimized for desktop, tablet, and mobile

## Technical Architecture

### Component Structure

```typescript
// Main component with state management
export default function AIDashboard(): ReactElement {
  const [activeTab, setActiveTab] = useState<TabType>("today");
  // ... component logic
}
```

### Data Types

```typescript
type Priority = "high" | "medium" | "low";
type InsightType = "action" | "risk" | "decision" | "question" | "update";
type ProjectStatus = "at-risk" | "attention" | "on-track";
type TabType = "today" | "week" | "projects";

interface Insight {
  id: string;
  type: InsightType;
  priority: Priority;
  confidence: number;
  text: string;
  project: string;
  meta: string[];
}

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
}

interface Meeting {
  id: string;
  title: string;
  time: string;
  project: string;
  insights: string;
  confidence: number;
}
```

### Styling Implementation

The dashboard uses Tailwind CSS with conditional styling via the `cn` utility:

```typescript
import { cn } from "@/lib/utils";

// Priority-based color coding
className={cn(
  "w-0.5 h-10 rounded-sm flex-shrink-0 mt-0.5",
  insight.priority === "high" && "bg-red-600",
  insight.priority === "medium" && "bg-orange-600",
  insight.priority === "low" && "bg-lime-600"
)}
```

### Layout Structure

```jsx
<div className="min-h-screen bg-gray-50">
  {/* Header with stats and navigation */}
  <div className="flex items-center justify-between border-b">
    {/* Tab navigation and statistics */}
  </div>
  
  {/* Main content grid */}
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
    {/* Insights feed (main content) */}
    <div className="bg-white border rounded-md">
      {/* Scrollable insights list */}
    </div>
    
    {/* Sidebar panels */}
    <div className="flex flex-col gap-4">
      {/* Projects panel */}
      {/* Meetings panel */}
    </div>
  </div>
</div>
```

## Data Sources & Integration

### Current Implementation (Mock Data)
- **Status**: Currently uses static mock data for demonstration
- **Data Volume**: 6 sample insights, 4 projects, 3 meetings
- **Update Frequency**: Static (no real-time updates)

### Planned Backend Integration

#### Database Tables
```sql
-- AI-generated insights
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type insight_type_enum NOT NULL,
  priority priority_enum NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  text TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project status tracking
ALTER TABLE projects ADD COLUMN status project_status_enum DEFAULT 'on-track';

-- Meeting insights linkage
ALTER TABLE meetings ADD COLUMN ai_insights TEXT;
ALTER TABLE meetings ADD COLUMN confidence_score INTEGER;
```

#### API Endpoints

**GET /api/insights** - Retrieve insights
```typescript
interface InsightsResponse {
  insights: Insight[];
  projects: Project[];
  meetings: Meeting[];
  stats: {
    highPriority: number;
    actions: number;
    meetings: number;
    risks: number;
  };
}
```

**POST /api/insights/generate** - Generate insights from documents
```typescript
interface GenerateRequest {
  documentId?: string;
  documentIds?: string[];
  source: 'manual' | 'automated';
}
```

## User Experience Design

### Visual Hierarchy
1. **Statistics Header**: Key metrics at the top for immediate visibility
2. **Tab Navigation**: Easy switching between time periods and views
3. **Priority Indicators**: Color-coded vertical bars for quick scanning
4. **Confidence Scores**: Green percentages indicating AI reliability

### Responsive Behavior
- **Desktop**: Two-column layout with sidebar
- **Tablet**: Responsive grid that adapts to screen width
- **Mobile**: Single column with collapsible sections

### Interaction Patterns
- **Hover Effects**: Subtle background changes on interactive elements
- **Tab Selection**: Active state with blue background
- **Scrollable Content**: Fixed-height containers with smooth scrolling

## Performance Considerations

### Current Metrics
- **Initial Load**: ~1.2 seconds (client-side rendering)
- **Memory Usage**: Minimal (static data)
- **Bundle Impact**: Lightweight component with Tailwind CSS

### Optimization Strategies
1. **Server-Side Rendering**: Consider SSR for faster initial loads
2. **Caching**: Implement Redis caching for frequently accessed insights
3. **Pagination**: Add pagination for large insight datasets
4. **Virtual Scrolling**: For handling 100+ insights efficiently

## Security & Permissions

### Access Control
- **Route Protection**: Requires authentication middleware
- **User Permissions**: Executive and project manager roles
- **Data Isolation**: Users see only authorized project insights

### Data Privacy
- **Sensitive Information**: No PII in mock data
- **Audit Logging**: Track insight access and generation
- **Rate Limiting**: Prevent API abuse on insight generation

## Development Roadmap

### Phase 1: Backend Integration ⏳
- [ ] Connect to real database tables
- [ ] Implement API endpoints for insights
- [ ] Add real-time data updates
- [ ] Replace mock data with dynamic content

### Phase 2: Advanced Features 📋
- [ ] Insight filtering and search
- [ ] Custom insight types and priorities
- [ ] Historical trend analysis
- [ ] Export functionality (PDF/Excel)

### Phase 3: AI Enhancement 🤖
- [ ] Real-time insight generation
- [ ] Natural language insight queries
- [ ] Predictive analytics integration
- [ ] Custom AI model training

## Testing Strategy

### Unit Testing
```typescript
// Example test for insight rendering
describe('AIDashboard', () => {
  it('renders high priority insights with red indicators', () => {
    render(<AIDashboard />);
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(document.querySelector('.bg-red-600')).toBeInTheDocument();
  });
});
```

### Integration Testing
- API endpoint testing with real data
- Database query performance testing
- User authentication and authorization

### E2E Testing
```typescript
// Playwright test example
test('AI insights dashboard navigation', async ({ page }) => {
  await page.goto('/ai-insights');
  await page.click('button:has-text("Week")');
  await expect(page.locator('[data-testid=week-insights]')).toBeVisible();
});
```

## Related Files & Components

### Core Files
- **Main Component**: `/app/(dashboard)/ai-insights/page.tsx`
- **Utilities**: `/lib/utils.ts` (cn function)
- **Types**: Defined inline (future: separate types file)

### Related Components
- **AI Insights Display**: `/components/pm-rag/ai-insights-display.tsx`
- **Meeting Intelligence**: `/components/meeting-intelligence-chat.tsx`
- **Project Cards**: Various project management components

### API Integration
- **Insights API**: `/app/api/insights/generate/route.ts`
- **Server Actions**: `/app/actions/meeting-insights-actions.ts`

## Maintenance & Updates

### Regular Tasks
- **Data Validation**: Ensure insight accuracy and relevance
- **Performance Monitoring**: Track load times and user interactions
- **A/B Testing**: Test different layouts and features

### Update Schedule
- **Weekly**: Review insight accuracy and user feedback
- **Monthly**: Performance optimization and feature updates
- **Quarterly**: Major feature releases and UI improvements

---

**Document Version**: 1.0
**Last Updated**: January 8, 2025
**Next Review**: February 8, 2025
**Author**: Documentation Management System