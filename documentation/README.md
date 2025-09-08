# Documentation Structure

This directory contains all project documentation organized by type.

## Directory Structure

### `/technical`
Technical specifications, architecture decisions, and system design documents.
- Architecture Decision Records (ADRs)
- Technical specifications
- System design documents
- Performance analyses

### `/guides`
How-to guides, tutorials, and developer onboarding materials.
- Getting started guides
- Development workflows
- Best practices
- Troubleshooting guides

### `/api`
API documentation and integration guides.
- Endpoint documentation
- Authentication guides
- Rate limiting information
- Example requests/responses

### `/meetings`
Meeting notes, decisions, and action items.
- Sprint retrospectives
- Architecture reviews
- Decision logs
- Planning documents

### `/changes`
Change logs, migration guides, and release notes.
- Migration guides
- Breaking changes
- Release notes
- Reorganization documentation

## File Naming Conventions

- **Date-based docs**: `YYYY-MM-DD-description.md`
- **Version-based**: `v1.2.3-feature-name.md`
- **General docs**: `kebab-case-descriptive-name.md`

## Best Practices

1. **Always document in the appropriate subfolder**
2. **Use clear, descriptive file names**
3. **Include dates for time-sensitive documentation**
4. **Keep documentation close to the code it describes**
5. **Update documentation as part of feature development**

## Key Documentation Files

### Core Application Features
- [API Routes Documentation](./API_ROUTES.md) - Comprehensive API endpoint reference
- [Pages Documentation](./PAGES.md) - Complete page structure and features
- [Server Actions Documentation](./SERVER_ACTIONS.md) - Server-side functionality
- [AI Insights Dashboard](./AI-INSIGHTS-DASHBOARD.md) - Executive insights interface

### Technical Implementation
- [RAG Systems Documentation](./RAG_SYSTEMS.md) - Retrieval-augmented generation setup
- [AI SDK Integration](./AI-SDK-COMPREHENSIVE-GUIDE.md) - AI SDK v5 implementation
- [Meeting Intelligence Setup](./MEETING-INTELLIGENCE-SETUP.md) - Meeting processing system
- [Supabase Types](./SUPABASE-TYPES.md) - Database schema and types

### Setup & Deployment
- [Cloudflare Workers](./CLOUDFLARE_WORKERS_DOCUMENTATION.md) - Worker deployment and configuration
- [Environment Variables](./guides/VERCEL_ENV_VARS.md) - Configuration setup
- [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md) - Production deployment

### Project Management
- [Latest Reorganization](./changes/REORGANIZATION-2025-09-03.md) - Recent restructuring
- [Documentation Standards](./DOCUMENTATION_STANDARDS.md) - Writing guidelines
- [Comprehensive Validation Report](./COMPREHENSIVE_VALIDATION_REPORT.md) - System status

## Quick Links

- [Latest Reorganization](./changes/REORGANIZATION-2025-09-03.md)
- [AI Insights Dashboard](./AI-INSIGHTS-DASHBOARD.md)
- [API Documentation](./API_ROUTES.md)
- [Pages Overview](./PAGES.md)