# Server Actions Documentation

This document provides a comprehensive overview of all server actions in the application, organized by domain.

## Overview

Server actions are used throughout the application to handle database operations, AI integrations, and business logic. They follow Next.js 13+ server action patterns with "use server" directive.

## Project Management Actions

### `/app/actions/project-actions.ts`
**Purpose**: Complete CRUD operations for projects
**Key Functions**:
- `getProjects()` - Fetch all projects with error handling
- `createProject(formData)` - Create new project from form data  
- `updateProject(id, formData)` - Update existing project
- `deleteProject(id)` - Delete project
- `updateProjectField(id, field, value)` - Update single field for inline editing

**Usage**: Project management tables, forms, and components
**Dependencies**: Supabase client, Next.js cache revalidation

### `/app/actions/dashboard-actions.ts`
**Purpose**: Dashboard-specific filtered project queries
**Key Functions**:
- `getProjects()` - Projects excluding Complete/Completed status
- `getCurrentProjects()` - Only projects with "Current" phase (limit 20)
- `getProjectById(id)` - Single project lookup

**Usage**: Main dashboard display
**Dependencies**: Supabase client

## Meeting Management Actions

### `/app/actions/meeting-actions.ts`
**Purpose**: Complete meeting management with project associations
**Key Functions**:
- `getMeetings()` - Fetch meetings with project info
- `createMeeting(formData)` - Create new meeting
- `updateMeeting(id, data)` - Update meeting details
- `deleteMeeting(id)` - Delete meeting with cleanup
- `getMeetingsByProject(projectId)` - Filter meetings by project

**Usage**: Meeting tables, forms, project details
**Dependencies**: Supabase service client (bypasses RLS), Next.js revalidation

### `/app/actions/meeting-embedding-actions.ts`
**Purpose**: Vector search for meeting transcripts using RAG
**Key Functions**:
- `queryMeetingChunks(embedding, matchCount, threshold, projectFilter)` - Vector similarity search

**Usage**: AI chat systems for meeting context retrieval
**Dependencies**: Supabase service client, vector search functions

### `/app/actions/meeting-embedding-actions-simple.ts`
**Purpose**: Fallback meeting search without vector similarity
**Key Functions**:
- `queryMeetingChunksSimple(embedding, matchCount, threshold)` - Basic meeting chunk retrieval

**Usage**: Backup for when vector search fails
**Dependencies**: Supabase service client

## AI & Chat Actions

### `/app/actions/strategist-agent-actions.ts`
**Purpose**: Main business strategist AI agent
**Key Functions**:
- `askStrategistAgent(message, history)` - Process business queries with meeting context

**Usage**: Business chat interface
**Dependencies**: OpenAI API, meeting embedding search

### `/app/actions/ai-actions.ts`
**Purpose**: General AI-powered data operations
**Key Functions**:
- `askAI(message)` - General AI query processing
- `getTableData(tableName)` - AI-assisted table data retrieval

**Usage**: AI chat components, data tables
**Dependencies**: AI services

### `/app/actions/pm-chat-actions.ts`
**Purpose**: Project manager chat functionality
**Key Functions**:
- `sendPMMessage(message)` - Process project management queries

**Usage**: PM assistant interfaces
**Dependencies**: AI services

## Data Management Actions

### `/app/actions/clients-actions.ts`
**Purpose**: Client/customer management
**Key Functions**:
- `getClients()` - Fetch all clients
- `updateClient(id, data)` - Update client information
- `deleteClient(id)` - Delete client record

**Usage**: Client management tables
**Dependencies**: Supabase client

### `/app/actions/employees-actions.ts`
**Purpose**: Employee data management
**Key Functions**:
- `getEmployees()` - Fetch employee records
- `updateEmployee(id, data)` - Update employee details
- `deleteEmployee(id)` - Remove employee

**Usage**: Employee management interfaces
**Dependencies**: Supabase client

### `/app/actions/companies-actions.ts`
**Purpose**: Company/organization management
**Key Functions**:
- `getCompanies()` - List all companies
- `createCompany(data)` - Add new company

**Usage**: Company management tables
**Dependencies**: Supabase client

## Chat & History Actions

### `/app/actions/chat-history-actions.ts`
**Purpose**: Persistent chat conversation management
**Key Functions**:
- `getChatHistory(conversationId)` - Load conversation messages
- `saveChatMessage(message)` - Store new message
- `clearChatHistory(conversationId)` - Delete conversation
- `getChatSessions()` - List all conversations
- `createChatSession(type, title)` - Start new conversation

**Usage**: Chat interfaces with persistence
**Dependencies**: Supabase client

## Specialized Actions

### `/app/actions/meeting-insights-actions.ts`
**Purpose**: AI-generated meeting analysis and insights
**Key Functions**:
- `generateMeetingInsights(meetingId)` - Generate insights for single meeting
- `bulkGenerateInsights()` - Process multiple meetings
- `getAllMeetingInsightsFromMeetings()` - Retrieve all insights
- `getProjectMeetingInsights(projectId)` - Project-specific insights

**Usage**: Meeting intelligence features
**Dependencies**: AI services, Supabase client

### `/app/actions/document-embedding-actions.ts`
**Purpose**: Document processing and vectorization
**Key Functions**:
- Document upload and processing functions

**Usage**: Document RAG systems
**Dependencies**: Vector database, AI embeddings

### `/app/actions/agent-orchestrator.ts`
**Purpose**: Multi-agent coordination system
**Key Functions**:
- `orchestrate()` - Coordinate multiple AI agents
- `orchestrateAndAggregate()` - Combine agent responses

**Usage**: Complex AI workflows
**Dependencies**: Multiple AI services

## Usage Patterns

### Common Import Pattern
```typescript
import { functionName } from "@/app/actions/file-name"
```

### Error Handling
Most actions return either:
- Success object: `{ success: true, data: result }`
- Error object: `{ success: false, error: message }`

### Cache Revalidation
Actions that modify data typically call:
```typescript
revalidatePath("/relevant-path")
```

## Database Dependencies

- **Supabase Client**: Standard client with RLS
- **Supabase Service Client**: Bypasses RLS for system operations
- **Type Safety**: All actions use generated database types

## Security Notes

- Server actions run on the server and handle authentication
- RLS policies enforced unless using service client
- Input validation should be handled at the action level
- Sensitive operations use service client with appropriate permissions

---

*This documentation is auto-generated and should be updated when server actions are modified.*