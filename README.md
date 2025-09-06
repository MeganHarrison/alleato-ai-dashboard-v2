# Alleato AI

An enterprise-grade AI-powered business intelligence platform combining advanced RAG systems, meeting intelligence, project management, and multi-agent orchestration.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys (see Environment Variables section)
# ⚠️ IMPORTANT: Rotate any exposed API keys before deployment

# Validate application health
node scripts/debug/validate-app.js

# Run development server
pnpm dev

# Open http://localhost:3000
```

### ⚠️ Known Setup Issues

Before running the application, be aware of these critical issues:

2. **Build Configuration**: TypeScript/ESLint checks are currently disabled
3. **Security**: Review .env.local for exposed API keys

See the [Known Issues](#known-issues) section for full details and fixes.

## Current File Tree

```
alleato-ai-dashboard/
├── agents/                      # AI agent implementations
│   ├── claude-desktop-openai-rag-pm/
│   ├── rag_agent/              # Pydantic AI RAG agent
│   ├── ultimate-pm-agent/      # Project management agent
│   └── workers/                # Cloudflare Workers
├── app/                        # Next.js App Router
│   ├── (asrs)/                # FM Global ASRS pages
│   ├── (pages)/               # Main application pages
│   ├── (tables)/              # Database table views
│   ├── actions/               # Server actions
│   └── api/                   # API routes
├── components/                 # React components
│   ├── ai-elements/           # AI chat components
│   ├── ai-sdk5/               # AI SDK v5 components
│   ├── fm834/                 # FM Global components
│   └── ui/                    # shadcn/ui components
├── lib/                       # Core libraries
│   ├── ai-sdk5/               # AI SDK utilities
│   ├── rag/                   # RAG system utilities
│   ├── supabase/              # Supabase clients
│   └── vector/                # Vector store utilities
├── workers/                   # Cloudflare Workers
│   ├── rag-api/               # RAG API worker
│   ├── rag-search/            # Search worker
│   └── rag-vectorizer/        # Vectorization worker
├── documentation/             # Project documentation
├── supabase/                  # Supabase configuration
└── tests/                     # Test suites
```

## Complete File Inventory

### Server Actions (`/app/actions/`) - 24 Files

**Project Management Actions:**
- `dashboard-actions.ts` - Dashboard-specific project queries (active, current projects)
- `project-actions.ts` - Complete CRUD operations for projects with form handling

**Meeting Management Actions:**
- `meeting-actions.ts` - Complete meeting CRUD with project associations
- `meeting-embedding-actions.ts` - Vector search for meeting transcripts using RAG
- `meeting-embedding-actions-simple.ts` - Fallback meeting search without vector similarity
- `meeting-embedding-fixed.ts` - Fixed version of meeting search with both vector and full-text
- `meeting-insights-actions.ts` - AI-generated meeting analysis and insights

**AI & Chat Actions:**
- `strategist-agent-actions.ts` - Main business strategist AI agent with meeting context
- `ai-actions.ts` - General AI-powered data operations and table queries
- `pm-chat-actions.ts` - Project manager specialized chat functionality
- `chat-history-actions.ts` - Persistent chat conversation management

**Data Management Actions:**
- `clients-actions.ts` - Client/customer management CRUD operations
- `employees-actions.ts` - Employee data management and table operations
- `companies-actions.ts` - Company/organization management
- `contacts-actions.ts` - Contact information management
- `documents-actions.ts` - Document repository operations
- `customer-actions.ts` - Customer-specific operations

**Specialized Actions:**
- `agent-orchestrator.ts` - Multi-agent coordination system
- `document-embedding-actions.ts` - Document processing and vectorization
- `documentation-agent-actions.ts` - Documentation processing agent
- `documentation-rag-actions.ts` - Documentation RAG system
- `notion-agent-actions.ts` - Notion integration agent
- `webhook-actions.ts` - Webhook processing and management
- `meeting-d1-actions.ts` - Cloudflare D1 meeting operations
- `meeting-search-direct.ts` - Direct meeting search implementation

### API Routes (`/app/api/`) - 33 Routes

**Core Chat & AI Routes:**
- `chat/route.ts` - Main AI-powered chat with RAG integration (streaming)
- `pm-chat/route.ts` - Project manager specialized chat assistant
- `meeting-intelligence/chat/route.ts` - Meeting-focused AI conversations
- `citation/route.ts` - Citation management for persistent chat

**RAG (Retrieval Augmented Generation) System:**
- `rag/chat/route.ts` - Document-based RAG chat interface
- `rag/documents/route.ts` - Document management (GET, POST, DELETE)
- `rag/documents/[id]/route.ts` - Individual document operations
- `rag/documents/upload/route.ts` - Document upload for processing
- `rag/search/route.ts` - Search through processed documents
- `rag/stats/route.ts` - RAG system statistics and health
- `rag/vectorize/[documentId]/route.ts` - Document vectorization processing
- `rag/vectorize/status/[jobId]/route.ts` - Vectorization job status

**FM Global & Domain-Specific Routes:**
- `fm-global-rag/route.ts` - FM Global documentation RAG system
- `fm-rag/route.ts` - Alternative FM documentation interface  
- `fm-docs/search/route.ts` - Direct FM document search
- `fm-optimize/route.ts` - FM Global optimization recommendations

**Project Manager Assistant Routes:**
- `pm-rag/chat/route.ts` - PM with RAG integration
- `pm-rag/chat-demo/route.ts` - Demo version of PM RAG chat
- `pm-rag/insights/route.ts` - Project management insights
- `pm-rag/insights/[id]/resolve/route.ts` - Mark insights as resolved
- `pm-assistant-gpt5/route.ts` - Advanced PM assistant with latest model
- `pm-rag-worker/route.ts` - Background PM RAG processing

**System & Utility Routes:**
- `cron/vectorize-meetings/route.ts` - Meeting vectorization job (manual/cron)
- `populate-meeting-chunks/route.ts` - Meeting data population utility
- `vector/route.ts` - Generic vector operations and testing
- `d1/route.ts` - Cloudflare D1 database operations
- `check-chat-tables/route.ts` - Database health check
- `supabase-proxy/[...path]/route.ts` - Supabase management API proxy

**AI & Processing Routes:**
- `ai/sql/route.ts` - AI-powered SQL query generation
- `orchestrate/route.ts` - Multi-agent coordination endpoint
- `weather/route.tsx` - Weather tool demo for testing
- `chat5/route.ts` - Alternative chat interface implementation

**Webhook & Integration Routes:**
- `webhooks/fireflies/route.ts` - Fireflies.ai meeting transcript webhooks

### Key Directories

**Components (`/components/`) - 50+ Files:**
- Core UI components with shadcn/ui integration
- AI chat interfaces and streaming components  
- Data tables with inline editing capabilities
- Form components with validation
- Project and meeting management interfaces

**Libraries (`/lib/`) - 20+ Files:**
- RAG system utilities and services
- AI SDK 5 integrations and tools
- Supabase client configurations
- Vector store utilities
- Database query helpers

**Documentation (`/documentation/`) - 3 Files:**
- `API_ROUTES.md` - Complete API documentation
- `SERVER_ACTIONS.md` - Server actions reference
- Additional documentation files as needed

### Middleware & Configuration

**Middleware Protection:**
Routes bypassing authentication: `/api/chat`, `/api/d1`, `/api/vector`, `/api/fm-global-rag`, `/api/fm-rag`, `/api/fm-optimize`, `/api/pm-assistant-gpt5`, `/api/rag`, `/api/pm-rag`

**Type Safety:**
- Database types auto-generated from Supabase
- AI SDK 5 types for streaming and tools
- Zod schemas for validation

### Recent Cleanup Actions

**Files Removed:**
- `employees-actions-test.ts` - Unused test implementation
- `create-test-projects.ts` - Test utility no longer needed
- `meeting-embedding-simple.ts` - Duplicate/obsolete implementation
- `strategist-agent-working.ts` - Experimental version
- `strategist-agent-fixed.ts` - Duplicate implementation  
- `strategist-agent-actions-openrouter.ts` - OpenRouter-specific version
- `chat/route-with-tools.ts` - Duplicate chat implementation

**API Routes Removed:**
- `create-chat-history-table/` - Database setup utility
- `create-customers-table/` - Database setup utility
- `create-projects-table/` - Database setup utility
- `create-companies-table/` - Database setup utility
- `populate-meeting-chunks-mock/` - Mock data utility

**Headers Added:**
All remaining server actions and API routes now include comprehensive header documentation explaining purpose, functionality, dependencies, usage, and connections.

## Pages Directory

### Core Application Pages

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Main dashboard with navigation |
| **Chat** | `/chat` | AI chat interface with streaming responses |
| **PM Assistant** | `/pm-assistant` | Project management AI assistant |
| **Projects Dashboard** | `/projects-dashboard` | Project overview and management |
| **Meeting Intelligence** | `/meeting-intelligence` | Meeting transcription and analysis |
| **Team Chat** | `/team-chat` | Collaborative team messaging |
| **RAG System** | `/rag-system` | Document management and retrieval |
| **Diagnostic** | `/diagnostic` | System health and debugging |

### Data Management Pages

| Page | Route | Description |
|------|-------|-------------|
| **Employees** | `/employees` | Employee database management |
| **Projects** | `/projects/[id]` | Individual project details |
| **Clients** | `/clients` | Client relationship management |
| **Documents** | `/documents` | Document repository |
| **Meetings DB** | `/meetings-db` | Meeting records database |

### FM Global ASRS Pages

| Page | Route | Description |
|------|-------|-------------|
| **FM 8-34 Docs** | `/fm-8-34` | FM Global documentation viewer |
| **FM Chat** | `/fm-chat` | FM Global RAG chat interface |
| **ASRS Design** | `/asrs-design` | ASRS system design tools |
| **ASRS Form** | `/asrs-form` | ASRS configuration forms |

### Utility Pages

| Page | Route | Description |
|------|-------|-------------|
| **Settings** | `/settings` | User preferences and configuration |
| **Profile** | `/profile` | User profile management |
| **Calendar** | `/calendar` | Event and meeting calendar |
| **Sitemap** | `/sitemap` | Application navigation map |

## RAG System Implementations

### 1. Main RAG System (`/lib/rag/`)

**Specifications:**
- **Embedding Model**: `text-embedding-3-small` (OpenAI)
- **Dimensions**: 1536
- **Chunking Strategy**: 
  - Chunk size: 1000 characters
  - Overlap: 200 characters
  - Separator: Double newline (`\n\n`)
- **Vector Database**: Supabase pgvector
- **Similarity Metric**: Cosine similarity
- **Retrieval**: Top-K with threshold 0.7

**Suggested Improvements:**
- Implement semantic chunking based on document structure
- Add hybrid search (vector + keyword)
- Implement query expansion for better recall
- Add caching layer for frequently accessed embeddings

### 2. Meeting Intelligence RAG (`/app/actions/meeting-embedding-actions.ts`)

**Specifications:**
- **Embedding Model**: `text-embedding-3-small` (OpenAI)
- **Dimensions**: 1536
- **Chunking Strategy**: Time-based segments from transcripts
- **Vector Database**: Supabase pgvector
- **Tables**: `meeting_chunks`, `meeting_embeddings`

**Suggested Improvements:**
- Add speaker diarization for better context
- Implement topic modeling for meeting segments
- Add temporal relevance scoring
- Create meeting summary embeddings

### 3. FM Global RAG (`/agents/workers/worker-fm-global-vectorizer/`)

**Specifications:**
- **Embedding Model**: `text-embedding-ada-002` (OpenAI)
- **Dimensions**: 1536
- **Chunking Strategy**: Section-based from PDF extraction
- **Processing**: Batch processing with queue system
- **Storage**: Cloudflare R2 + Supabase

**Suggested Improvements:**
- Upgrade to `text-embedding-3-small` for better performance
- Implement hierarchical chunking for nested sections
- Add metadata extraction from tables and figures
- Implement incremental updates for document changes

### 4. Cloudflare Workers RAG (`/workers/rag-vectorizer/`)

**Specifications:**
- **Embedding Model**: Configurable (OpenAI)
- **Batch Size**: 100 texts per request
- **Rate Limiting**: Exponential backoff
- **Queue System**: Cloudflare Queues

**Suggested Improvements:**
- Add support for multiple embedding providers
- Implement parallel processing for large documents
- Add compression for vector storage
- Implement vector quantization for cost reduction

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Animations**: Framer Motion (v12.23.12)
- **State Management**: React Server Components + Hooks
- **Error Handling**: React Error Boundaries

### AI & ML
- **AI SDK**: Vercel AI SDK v5
- **LLM Providers**: OpenAI, Anthropic, Groq
- **Embeddings**: OpenAI text-embedding-3-small
- **Agent Framework**: Pydantic AI
- **Vector Search**: pgvector

### Backend
- **Database**: Supabase (PostgreSQL)
- **Edge Functions**: Cloudflare Workers
- **Storage**: Supabase Storage, Cloudflare R2
- **Authentication**: Supabase Auth
- **ORM**: Drizzle ORM

### Infrastructure
- **Deployment**: Vercel
- **CDN**: Cloudflare
- **Monitoring**: Built-in diagnostics
- **Testing**: Playwright, Vitest

## Environment Variables

### Required
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Authentication
AUTH_SECRET=your-auth-secret

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional
```bash
# Additional AI Providers
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk-...

# Cloudflare Workers
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...

# Meeting Intelligence
FIREFLIES_API_KEY=...

# Documentation Agent (v0.dev)
documentation_agent_key=...
```

## Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript type checking

# Database
pnpm update-types     # Generate Supabase types
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database

# Testing & Validation
pnpm test             # Run all tests
pnpm test:e2e         # Run Playwright tests
pnpm test:e2e:ui      # Run Playwright tests with UI
pnpm test:e2e:debug   # Run Playwright tests in debug mode
pnpm validate         # Run lint, test, and e2e tests
node scripts/debug/validate-app.js  # Validate application health

# RAG System
pnpm setup:rag        # Setup RAG system tables
pnpm vectorize:batch  # Batch vectorize documents
pnpm vectorize:all    # Vectorize all documents

# Fireflies Integration
pnpm sync:fireflies   # Sync Fireflies transcripts
pnpm sync:fireflies-meetings  # Sync to meetings table
pnpm sync:fireflies-complete  # Complete Fireflies sync

# Workers
pnpm workers:dev      # Start workers locally
pnpm workers:deploy   # Deploy to Cloudflare
```

## Testing Strategy

### Automated Testing Results
**Last Test Run**: September 1, 2025  
**Success Rate**: 75% (27/36 tests passing)  
**Status**: 🟡 Good (with critical fixes needed)

### E2E Testing (Playwright)
- ✅ Page navigation tests
- 🔴 User authentication flows (blocked by missing auth pages)
- ✅ RAG system integration
- 🔴 Meeting intelligence features (auth-dependent)
- ✅ Project management workflows

### UI/UX Validation
- ✅ **Design Consistency**: Professional brand implementation (#DB802D)
- ✅ **Responsive Design**: Works across desktop/tablet/mobile
- ✅ **Component Library**: shadcn/ui properly integrated
- ✅ **Navigation**: Intuitive sidebar and breadcrumbs
- ✅ **Loading States**: Skeleton components and empty states
- ✅ **Error Handling**: Error boundary components active

### Performance Testing
- ✅ **Load Times**: 1-4 seconds across pages
- ✅ **Bundle Size**: Next.js code splitting active
- ✅ **Memory Usage**: No memory leaks detected
- ✅ **Accessibility**: Basic ARIA compliance verified

### Integration Testing
- ✅ **Supabase**: Database connection and middleware working
- ✅ **Next.js**: App Router functioning correctly
- 🔴 **Authentication**: Critical failure - missing auth pages
- 🟡 **External APIs**: Not fully tested

### Unit Testing
- Component testing with React Testing Library
- API route testing
- Utility function testing
- AI tool validation

### Manual Testing
- AI response quality
- Vector search accuracy
- Real-time collaboration
- Cross-browser compatibility

## Deployment Guide

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Set Node.js version to 20.x
4. Deploy with `pnpm build`

### Cloudflare Workers
1. Configure wrangler.toml
2. Set secrets with `wrangler secret`
3. Deploy with `pnpm workers:deploy`

### Supabase Setup
1. Create new Supabase project
2. Run migrations in `/supabase/migrations`
3. Configure Row Level Security
4. Set up storage buckets

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow documentation standards (see DOCUMENTATION_STANDARDS.md)
4. Write tests for new features
5. Update README if needed
6. Create Pull Request

## Known Issues

### Critical Issues (Requires Immediate Attention)
- 🔴 **Missing Authentication Pages**: `/auth/signin` and `/auth/signup` pages return 404
- 🔴 **Authentication Flow Broken**: Meeting Intelligence and other protected pages redirect to non-existent auth pages
- 🔴 **Build Configuration**: TypeScript and ESLint checks disabled in next.config.mjs

### Medium Priority Issues
- 🟡 **Security**: Exposed API keys in .env.local (rotate immediately)
- 🟡 **Performance**: Unoptimized images causing loading warnings
- 🟡 **Architecture**: Some component files exceed 500 lines
- 🟡 **Database**: Missing indexes on frequently queried tables

### Minor Issues
- Hydration warnings in development mode (React 19 canary)
- Rate limiting on OpenAI embeddings API
- Large document processing timeout in Workers
- Meeting transcription accuracy varies with audio quality

## Recent Major Improvements

### UI/UX Enhancements (✅ Completed)
- **Framer Motion Integration**: Smooth animations and transitions throughout the application
- **Brand Consistency**: Professional implementation of brand color (#DB802D)
- **Component Enhancements**: 
  - Enhanced sidebar with collapsible sections and animations
  - Improved project cards with progress bars and hover effects
  - Professional loading states with skeleton components
  - Enhanced section cards with gradient backgrounds
- **Error Handling**: Comprehensive error boundary implementation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Code Quality & Debugging (✅ Completed)
- **Error Boundary Component**: Professional error handling with retry functionality
- **Application Validation Script**: Health check utility for critical files and components
- **Component Structure**: Improved organization and separation of concerns
- **Development Tools**: Enhanced debugging and validation workflows

### Critical Issues Identified (⚠️ Requires Action)
- **Authentication System**: Missing signin/signup pages causing 404 redirects
- **Security**: API keys exposure requiring immediate rotation
- **Build Configuration**: TypeScript and ESLint checks disabled
- **Performance**: Unoptimized images and large components

## Immediate Action Items

### Critical Priority (Next 24 Hours)
1. **Create Authentication Pages**
   ```bash
   mkdir -p app/(pages)/auth/signin app/(pages)/auth/signup
   # Implement Supabase auth forms
   ```

2. **Rotate Exposed API Keys**
   - Generate new OpenAI API key
   - Update Supabase keys if exposed
   - Remove keys from .env.local history

3. **Enable Build Checks**
   ```javascript
   // In next.config.mjs
   typescript: {
     ignoreBuildErrors: false, // Change from true
   },
   eslint: {
     ignoreDuringBuilds: false, // Change from true
   },
   ```

### High Priority (Next Week)
1. **Component Size Optimization**: Break down large components (>500 lines)
2. **Image Optimization**: Add proper width/height attributes
3. **Database Indexing**: Add indexes for frequently queried tables
4. **Cross-browser Testing**: Verify Firefox and Safari compatibility

## Roadmap

### Q1 2025
- [x] ~~Multi-agent UI system~~ ✅ Completed
- [x] ~~Professional error handling~~ ✅ Completed  
- [x] ~~Animation framework integration~~ ✅ Completed
- [ ] Authentication system completion
- [ ] Advanced analytics dashboard
- [ ] Voice-to-text meeting features

### Q2 2025
- [ ] Real-time collaboration
- [ ] Custom AI model fine-tuning
- [ ] Automated workflow builder
- [ ] Enterprise SSO integration

## License

Proprietary - Alleato Group © 2025

## Support

For support, documentation, or questions:
- Create an issue in GitHub
- Check documentation in `/documentation`
- Review DOCUMENTATION_STANDARDS.md for guidelines

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintained By**: Alleato AI Team
