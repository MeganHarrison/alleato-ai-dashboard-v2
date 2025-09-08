# Pages Documentation

Complete documentation for all pages in the Alleato AI Dashboard application.

## Core Application Pages

### Home Page
- **Route**: `/`
- **File**: `app/page.tsx`
- **Purpose**: Main landing page and dashboard entry point
- **Features**:
  - Navigation to all major sections
  - Quick access cards for common tasks
  - User authentication status
  - Recent activity overview
- **Dependencies**: Supabase Auth
- **Data Sources**: User profile, activity logs
- **User Permissions**: Public (auth for personalized content)
- **Known Issues**: None

### AI Insights Dashboard
- **Route**: `/ai-insights`
- **File**: `app/(dashboard)/ai-insights/page.tsx`
- **Purpose**: Executive-level AI-powered insights and analytics dashboard
- **Features**:
  - Key insights with priority levels (high/medium/low)
  - AI-generated project insights with confidence scores
  - Real-time project status tracking (at-risk/attention/on-track)
  - Today's meetings with AI-extracted insights
  - Interactive tab navigation (today/week/projects)
  - Executive statistics header (high priority items, actions, meetings, risks)
  - Priority-based color coding and visual indicators
- **Dependencies**: AI SDK, Meeting Intelligence, Project Management
- **Data Sources**: Projects, meetings, AI-generated insights
- **User Permissions**: Authenticated executives and project managers
- **Technical Details**:
  - Client-side React component with TypeScript
  - Uses cn utility for conditional styling
  - Responsive grid layout (lg:grid-cols-[1fr_280px])
  - Mock data structure with extensible interfaces
  - Priority-based visual indicators and confidence percentages
- **Data Structures**:
  ```typescript
  interface Insight {
    id: string;
    type: 'action' | 'risk' | 'decision' | 'question' | 'update';
    priority: 'high' | 'medium' | 'low';
    confidence: number;
    text: string;
    project: string;
    meta: string[];
  }
  ```
- **Known Issues**: Currently uses mock data, needs backend integration

### Chat Interface
- **Route**: `/chat`
- **File**: `app/chat/page.tsx`
- **Purpose**: AI-powered chat interface with streaming responses
- **Features**:
  - Real-time streaming responses
  - Conversation history
  - Code syntax highlighting
  - Weather widget integration
- **Dependencies**: OpenAI API, Vercel AI SDK v5
- **Data Sources**: Chat history database
- **User Permissions**: Authenticated users
- **Known Issues**: Hydration warnings in dev mode

### PM Assistant
- **Route**: `/pm-assistant`
- **File**: `app/pm-assistant/page.tsx`
- **Purpose**: Project management AI assistant
- **Features**:
  - Project analysis and recommendations
  - Task prioritization
  - Resource allocation suggestions
  - Timeline optimization
- **Dependencies**: OpenAI API, Supabase
- **Data Sources**: Projects table, meetings data
- **User Permissions**: Authenticated users with project access
- **Known Issues**: None

### Projects Dashboard
- **Route**: `/projects-dashboard`
- **File**: `app/(pages)/projects-dashboard/page.tsx`
- **Purpose**: Comprehensive project overview and management
- **Features**:
  - Project cards with status
  - Timeline visualization
  - Resource allocation view
  - Quick actions menu
- **Dependencies**: Supabase
- **Data Sources**: Projects, employees, meetings tables
- **User Permissions**: Authenticated users
- **Known Issues**: None

### Meeting Intelligence
- **Route**: `/meeting-intelligence`
- **File**: `app/(pages)/meeting-intelligence/page.tsx`
- **Purpose**: Meeting transcription analysis and insights
- **Features**:
  - Meeting upload and processing
  - Transcript search
  - Action item extraction
  - Sentiment analysis
- **Dependencies**: OpenAI embeddings, Fireflies API
- **Data Sources**: meeting_chunks, meeting_embeddings tables
- **User Permissions**: Authenticated users
- **Known Issues**: Processing timeout for large files

### Team Chat
- **Route**: `/team-chat`
- **File**: `app/(pages)/team-chat/page.tsx`
- **Purpose**: Real-time team collaboration chat
- **Features**:
  - Real-time messaging
  - File sharing
  - Channel management
  - Presence indicators
- **Dependencies**: Supabase Realtime
- **Data Sources**: Chat messages, user presence
- **User Permissions**: Team members only
- **Known Issues**: None

### RAG System
- **Route**: `/rag-system`
- **File**: `app/(pages)/rag-system/page.tsx`
- **Purpose**: Document management and retrieval system
- **Features**:
  - Document upload
  - Vectorization status
  - Search interface
  - Analytics dashboard
- **Sub-pages**:
  - `/rag-system/documents` - Document management
  - `/rag-system/chat` - RAG-powered chat
  - `/rag-system/stats` - System statistics
- **Dependencies**: OpenAI embeddings, Cloudflare Workers
- **Data Sources**: Documents, embeddings tables
- **User Permissions**: Authenticated users
- **Known Issues**: Rate limiting on embeddings API

### Diagnostic
- **Route**: `/diagnostic`
- **File**: `app/(pages)/diagnostic/page.tsx`
- **Purpose**: System health monitoring and debugging
- **Features**:
  - API status checks
  - Database connectivity
  - Worker health monitoring
  - Error logs viewer
- **Dependencies**: All system services
- **Data Sources**: System logs, health endpoints
- **User Permissions**: Admin only
- **Known Issues**: None

## Data Management Pages

### Employees
- **Route**: `/employees`
- **File**: `app/(tables)/employees/page.tsx`
- **Purpose**: Employee database management
- **Features**:
  - Employee CRUD operations
  - Search and filtering
  - Bulk import/export
  - Role management
- **Dependencies**: Supabase
- **Data Sources**: Employees table
- **User Permissions**: HR and Admin users
- **Known Issues**: None

### Projects Detail
- **Route**: `/projects/[id]`
- **File**: `app/(tables)/projects/[id]/page.tsx`
- **Purpose**: Individual project detailed view
- **Features**:
  - Project information editing
  - Meeting associations
  - Team member management
  - Timeline and milestones
- **Dependencies**: Supabase
- **Data Sources**: Projects, meetings, employees tables
- **User Permissions**: Project members and admins
- **Known Issues**: None

### Clients
- **Route**: `/clients`
- **File**: `app/(tables)/clients/page.tsx`
- **Purpose**: Client relationship management
- **Features**:
  - Client profiles
  - Contact information
  - Project associations
  - Communication history
- **Sub-pages**:
  - `/clients/companies` - Company profiles
- **Dependencies**: Supabase
- **Data Sources**: Clients, companies tables
- **User Permissions**: Sales and account managers
- **Known Issues**: None

### Documents
- **Route**: `/documents`
- **File**: `app/(tables)/documents/page.tsx`
- **Purpose**: Central document repository
- **Features**:
  - Document upload/download
  - Version control
  - Access permissions
  - Search functionality
- **Sub-pages**:
  - `/documents/upload-documents` - Bulk upload interface
- **Dependencies**: Supabase Storage
- **Data Sources**: Documents table, storage buckets
- **User Permissions**: Authenticated users
- **Known Issues**: Large file upload timeout

### Contacts
- **Route**: `/contacts`
- **File**: `app/(tables)/contacts/page.tsx`
- **Purpose**: Contact database management
- **Features**:
  - Contact CRUD operations
  - Company associations
  - Communication tracking
  - Import/export
- **Dependencies**: Supabase
- **Data Sources**: Contacts table
- **User Permissions**: Authenticated users
- **Known Issues**: None

## FM Global ASRS Pages

### FM 8-34 Documentation
- **Route**: `/fm-8-34`
- **File**: `app/(asrs)/fm-8-34/page.tsx`
- **Purpose**: FM Global 8-34 documentation viewer
- **Features**:
  - Section navigation
  - Table viewer
  - Search functionality
  - PDF export
- **Sub-pages**:
  - `/fm-8-34/[slug]` - Individual section view
  - `/fm-8-34/tables` - Tables and figures
- **Dependencies**: FM Global data files
- **Data Sources**: Static JSON/JSONL files
- **User Permissions**: Licensed users
- **Known Issues**: None

### FM Chat
- **Route**: `/fm-chat`
- **File**: `app/(asrs)/fm-chat/page.tsx`
- **Purpose**: FM Global RAG-powered chat interface
- **Features**:
  - Document-specific Q&A
  - Citation links
  - Context-aware responses
  - Export conversations
- **Dependencies**: OpenAI, FM Global vectorized data
- **Data Sources**: FM embeddings, documents
- **User Permissions**: Licensed users
- **Known Issues**: None

### ASRS Design
- **Route**: `/asrs-design`
- **File**: `app/(asrs)/asrs-design/page.tsx`
- **Purpose**: ASRS system design and configuration
- **Features**:
  - Visual design tools
  - Configuration wizard
  - Compliance checking
  - Export specifications
- **Dependencies**: FM Global standards
- **Data Sources**: ASRS configurations table
- **User Permissions**: Engineers and designers
- **Known Issues**: None

### ASRS Form
- **Route**: `/asrs-form`
- **File**: `app/(asrs)/asrs-form/page.tsx`
- **Purpose**: ASRS configuration form builder
- **Features**:
  - Dynamic form generation
  - Validation rules
  - Save/load configurations
  - PDF generation
- **Dependencies**: React Hook Form
- **Data Sources**: Form templates, configurations
- **User Permissions**: Authenticated users
- **Known Issues**: None

## Utility Pages

### Settings
- **Route**: `/settings`
- **File**: `app/(pages)/settings/page.tsx`
- **Purpose**: User preferences and application settings
- **Features**:
  - Profile settings
  - Notification preferences
  - API key management
  - Theme selection
- **Dependencies**: Supabase Auth
- **Data Sources**: User preferences table
- **User Permissions**: Authenticated users
- **Known Issues**: None

### Profile
- **Route**: `/profile`
- **File**: `app/(pages)/profile/page.tsx`
- **Purpose**: User profile management
- **Features**:
  - Profile information editing
  - Avatar upload
  - Password change
  - Activity history
- **Dependencies**: Supabase Auth, Storage
- **Data Sources**: User profile, activity logs
- **User Permissions**: Authenticated users (own profile)
- **Known Issues**: None

### Calendar
- **Route**: `/calendar`
- **File**: `app/(pages)/calendar/page.tsx`
- **Purpose**: Event and meeting calendar
- **Features**:
  - Meeting scheduling
  - Event management
  - Team availability
  - Integration with meetings
- **Dependencies**: Calendar libraries
- **Data Sources**: Meetings, events tables
- **User Permissions**: Authenticated users
- **Known Issues**: None

### Sitemap
- **Route**: `/sitemap`
- **File**: `app/(pages)/sitemap/page.tsx`
- **Purpose**: Application navigation map
- **Features**:
  - Full site structure
  - Quick navigation
  - Search functionality
  - Access indicators
- **Dependencies**: None
- **Data Sources**: Route configuration
- **User Permissions**: Public
- **Known Issues**: None

## Authentication Pages

### Login
- **Route**: `/auth/login`
- **File**: `app/auth/login/page.tsx`
- **Purpose**: User authentication
- **Features**:
  - Email/password login
  - OAuth providers
  - Remember me
  - Password reset link
- **Dependencies**: Supabase Auth
- **Data Sources**: Auth database
- **User Permissions**: Public
- **Known Issues**: None

### Sign Up
- **Route**: `/auth/sign-up`
- **File**: `app/auth/sign-up/page.tsx`
- **Purpose**: New user registration
- **Features**:
  - Registration form
  - Email verification
  - Terms acceptance
  - OAuth options
- **Dependencies**: Supabase Auth
- **Data Sources**: Auth database
- **User Permissions**: Public
- **Known Issues**: None

### Forgot Password
- **Route**: `/auth/forgot-password`
- **File**: `app/auth/forgot-password/page.tsx`
- **Purpose**: Password recovery
- **Features**:
  - Email verification
  - Reset link generation
  - Security questions
- **Dependencies**: Supabase Auth
- **Data Sources**: Auth database
- **User Permissions**: Public
- **Known Issues**: None

## Development & Testing Pages

### Test Vector Search
- **Route**: `/test-vector-search`
- **File**: `app/(pages)/test-vector-search/page.tsx`
- **Purpose**: Vector search testing interface
- **Features**:
  - Query testing
  - Similarity scoring
  - Performance metrics
  - Debug output
- **Dependencies**: Vector store
- **Data Sources**: Embeddings tables
- **User Permissions**: Developers only
- **Known Issues**: Development only

### Create Test Data
- **Route**: `/create-test-data`
- **File**: `app/(pages)/create-test-data/page.tsx`
- **Purpose**: Generate test data for development
- **Features**:
  - Bulk data generation
  - Seed database
  - Clear test data
  - Export fixtures
- **Dependencies**: All database tables
- **Data Sources**: All tables
- **User Permissions**: Developers only
- **Known Issues**: Development only

## Navigation Structure

```
/
├── Core Features
│   ├── /ai-insights
│   ├── /chat
│   ├── /pm-assistant
│   ├── /projects-dashboard
│   ├── /meeting-intelligence
│   ├── /team-chat
│   └── /rag-system
├── Data Management
│   ├── /employees
│   ├── /projects/[id]
│   ├── /clients
│   ├── /documents
│   └── /contacts
├── FM Global
│   ├── /fm-8-34
│   ├── /fm-chat
│   ├── /asrs-design
│   └── /asrs-form
├── User
│   ├── /profile
│   ├── /settings
│   └── /calendar
└── Auth
    ├── /auth/login
    ├── /auth/sign-up
    └── /auth/forgot-password
```

## Access Control Matrix

| Page Category | Public | Authenticated | Team Member | Admin |
|--------------|--------|---------------|-------------|-------|
| Home | View | Full | Full | Full |
| Core Features | - | View/Use | Full | Full |
| Data Management | - | Read | Read/Write | Full |
| FM Global | - | - | View | Full |
| User Pages | - | Own Profile | Own Profile | All |
| Auth Pages | Full | - | - | - |
| Diagnostic | - | - | - | Full |

## Performance Metrics

| Page | Load Time Target | Current | Status |
|------|-----------------|---------|--------|
| Home | <1s | 0.8s | ✅ |
| AI Insights Dashboard | <2s | 1.2s | ✅ |
| Chat | <2s | 1.5s | ✅ |
| PM Assistant | <2s | 1.8s | ✅ |
| Meeting Intelligence | <3s | 2.5s | ✅ |
| RAG System | <2s | 2.2s | ⚠️ |
| Documents | <2s | 1.9s | ✅ |

## Update History

- **2025-01-01**: Initial documentation created
- **2025-01-08**: Added AI Insights Dashboard page documentation
- **Latest Review**: 2025-01-08
- **Next Review**: 2025-02-01