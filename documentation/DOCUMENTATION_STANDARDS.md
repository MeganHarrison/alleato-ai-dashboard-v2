# Documentation Standards

## Overview
This document defines the documentation standards for the Alleato AI Dashboard project. All documentation must follow these guidelines to ensure consistency, maintainability, and clarity.

## Documentation Structure

### 1. Root README.md
The root README.md must always contain:
- **Project Title & Description**: Clear, concise overview
- **Quick Start Guide**: Installation and setup in <5 steps
- **Current File Tree**: Updated with each major change
- **Feature Overview**: List of all major features
- **Pages Directory**: Complete list of pages with descriptions
- **Technology Stack**: All major technologies used
- **Environment Variables**: Required and optional configurations
- **Development Commands**: All available scripts
- **Testing Strategy**: How to run tests
- **Deployment Guide**: Production deployment steps
- **Contributing Guidelines**: How to contribute
- **License Information**

### 2. Page Documentation
Every page in the app must have documentation that includes:
- **Purpose**: What the page does and why it exists
- **Route**: The URL path to access the page
- **Features**: List of functionality available
- **Dependencies**: External services or APIs required
- **Data Sources**: Tables, APIs, or services it connects to
- **User Permissions**: Who can access this page
- **Known Issues**: Any current limitations or bugs

### 3. RAG System Documentation
All RAG (Retrieval-Augmented Generation) implementations must document:

#### Required Specifications
- **Embedding Model**: Exact model name and version
  - Example: `text-embedding-3-small` (OpenAI)
- **Dimensions**: Vector dimension size
  - Example: `1536` dimensions
- **Chunking Strategy**:
  - Chunk size (characters/tokens)
  - Overlap size
  - Separator pattern
  - Example: `1000 chars, 200 char overlap, split on paragraphs`
- **Vector Database**: Storage solution used
  - Example: `Supabase pgvector`
- **Similarity Metric**: How vectors are compared
  - Example: `Cosine similarity`
- **Retrieval Strategy**: How results are fetched
  - Example: `Top-K with threshold 0.7`

#### Suggested Improvements
Each RAG implementation should include:
- Performance optimizations
- Accuracy improvements
- Scaling considerations
- Cost reduction strategies

### 4. API Documentation
All API endpoints must document:
- **Endpoint Path**: Full route
- **Method**: GET, POST, PUT, DELETE, etc.
- **Authentication**: Required auth method
- **Request Body**: Schema with examples
- **Response Format**: Schema with examples
- **Error Codes**: Possible error responses
- **Rate Limits**: Any throttling applied

### 5. Component Documentation
Reusable components must include:
- **Props Interface**: TypeScript interface
- **Usage Examples**: Code snippets
- **Styling**: Customization options
- **Animation Patterns**: Framer Motion configurations if applicable
- **Events**: Emitted events or callbacks
- **Error Handling**: Error boundary usage
- **Accessibility**: ARIA requirements
- **Performance**: Loading states and optimization notes

## Documentation Files

### Required Documentation Files
```
project/
├── README.md                    # Main project documentation
├── DOCUMENTATION_STANDARDS.md   # This file
├── CHANGELOG.md                 # Version history
├── CONTRIBUTING.md              # Contribution guidelines
├── LICENSE                      # License information
├── docs/
│   ├── ARCHITECTURE.md         # System architecture
│   ├── API.md                   # API documentation
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── PAGES.md                 # All pages documentation
│   ├── RAG_SYSTEMS.md           # RAG implementations
│   └── TROUBLESHOOTING.md       # Common issues & solutions
```

### Documentation Update Triggers
Documentation must be updated when:
- New pages are added
- New features are implemented
- RAG systems are added or modified
- API endpoints change
- Major dependencies are updated
- Breaking changes occur
- Bug fixes affect user-facing features

## Code Documentation

### TypeScript/JavaScript
```typescript
/**
 * Brief description of the function
 * @param {string} param1 - Description of param1
 * @param {number} param2 - Description of param2
 * @returns {Promise<Result>} Description of return value
 * @throws {Error} When the operation fails
 * @example
 * const result = await functionName('value', 123);
 */
```

### React Components
```tsx
/**
 * ComponentName - Brief description
 * 
 * @component
 * @example
 * <ComponentName prop1="value" prop2={123} />
 */
interface ComponentNameProps {
  /** Description of prop1 */
  prop1: string;
  /** Description of prop2 */
  prop2?: number;
}
```

### Animation Documentation
When documenting components with Framer Motion animations:
```tsx
/**
 * AnimatedCard - Card component with hover animations
 * 
 * @component
 * @example
 * <AnimatedCard>Content</AnimatedCard>
 * 
 * @animations
 * - Hover: Lifts card 2px with brand shadow
 * - Entry: Fade in with slide up (300ms)
 * - Exit: Fade out (200ms)
 */
```

### Error Boundary Usage
Document error boundary integration:
```tsx
/**
 * DataTable - Table component with error boundary protection
 * 
 * @component  
 * @errorBoundary Uses ErrorBoundary with SimpleErrorFallback
 * @example
 * <ErrorBoundary fallback={SimpleErrorFallback}>
 *   <DataTable data={tableData} />
 * </ErrorBoundary>
 */
```

## Markdown Standards

### Headers
- Use # for main title (one per file)
- Use ## for major sections
- Use ### for subsections
- Use #### sparingly for sub-subsections

### Lists
- Use `-` for unordered lists
- Use `1.` for ordered lists
- Indent with 2 spaces for nested lists

### Code Blocks
Always specify the language:
```bash
npm install
```

```typescript
const example = "code";
```

### Links
- Use descriptive link text: `[Documentation](./docs/README.md)`
- Avoid: `[Click here](./docs/README.md)`

### Tables
Use for structured data:
| Feature | Status | Description |
|---------|--------|-------------|
| Auth    | ✅     | Complete    |
| RAG     | 🚧     | In Progress |

## Version Control

### Commit Messages
When updating documentation:
```
docs: Update README with new RAG specifications
docs: Add page documentation for meeting-intelligence
docs: Fix broken links in API documentation
```

### Branch Naming
- `docs/update-readme`
- `docs/add-rag-specs`
- `docs/fix-api-docs`

## Application Health Standards

### Pre-Deployment Validation
Every deployment must pass these validation checks:

#### Critical System Health
- [ ] **Authentication System**: All auth flows working
- [ ] **Database Connections**: Supabase client and server connections active
- [ ] **API Integrations**: External APIs responding correctly
- [ ] **Build Process**: TypeScript and ESLint checks enabled and passing
- [ ] **Security**: No exposed API keys in version control

#### UI/UX Standards Compliance
- [ ] **Brand Consistency**: #DB802D color usage throughout
- [ ] **Responsive Design**: Mobile, tablet, desktop layouts tested
- [ ] **Error Boundaries**: All critical components wrapped
- [ ] **Loading States**: Skeleton components or spinners implemented
- [ ] **Animation Performance**: Smooth 60fps animations

#### Performance Benchmarks
- [ ] **Page Load Times**: <4 seconds on all major pages
- [ ] **Bundle Size**: Code splitting active
- [ ] **Memory Usage**: No memory leaks in browser tools
- [ ] **Accessibility**: Basic ARIA compliance verified

#### Testing Requirements
- [ ] **E2E Tests**: >75% pass rate
- [ ] **Component Tests**: Critical user flows covered
- [ ] **Cross-browser**: Chrome, Firefox, Safari tested
- [ ] **Mobile Testing**: iOS and Android compatibility

## Validation Checklist

Before committing documentation:
- [ ] Spell check completed
- [ ] Links verified (no 404s)
- [ ] Code examples tested
- [ ] Formatting consistent
- [ ] Table of contents updated
- [ ] Version numbers current
- [ ] Environment variables documented
- [ ] File tree accurate
- [ ] **Animation examples**: Framer Motion code snippets validated
- [ ] **Error handling**: Error boundary usage documented
- [ ] **Security notes**: API key handling mentioned
- [ ] **Performance notes**: Loading states documented

## Maintenance Schedule

### Daily
- Update file tree if structure changed
- Document new features added

### Weekly
- Review and update page descriptions
- Verify all links still work
- Update known issues section

### Monthly
- Full documentation review
- Update architecture diagrams
- Refresh performance metrics
- Update suggested improvements

## Tools & Resources

### Recommended Tools
- **Markdown Preview**: VS Code Markdown Preview Enhanced
- **Link Checker**: markdown-link-check
- **Spell Check**: cspell
- **Diagram Creation**: Mermaid, Draw.io
- **API Documentation**: OpenAPI/Swagger

### Templates
See `/docs/templates/` for:
- Page documentation template
- API endpoint template
- Component documentation template
- RAG system template

## Contact
For documentation questions or suggestions, create an issue with the `documentation` label.