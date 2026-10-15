# Troubleshooting Guide

## Table of Contents
- [Quick Diagnostics](#quick-diagnostics)
- [Common Deployment Issues](#common-deployment-issues)
- [Authentication Problems](#authentication-problems)
- [Database Connection Issues](#database-connection-issues)
- [AI Integration Problems](#ai-integration-problems)
- [Performance Issues](#performance-issues)
- [Mobile & Responsive Issues](#mobile--responsive-issues)
- [Build & Development Issues](#build--development-issues)
- [API Route Problems](#api-route-problems)
- [Environment Variable Issues](#environment-variable-issues)

## Quick Diagnostics

### Health Check Commands
```bash
# Run comprehensive application validation
node scripts/utilities/validate-app.js

# Check environment variables
node scripts/utilities/validate-env.js

# Verify database connections
node scripts/database/verify-ai-sdk5-tables.js

# Test AI API connections
node -e "
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
client.models.list().then(() => console.log('✅ OpenAI connected')).catch(e => console.log('❌ OpenAI failed:', e.message));
"

# Check Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('chats').select('count').limit(1).then(() => console.log('✅ Supabase connected')).catch(e => console.log('❌ Supabase failed:', e.message));
"
```

### Application Status Dashboard
```bash
# Check application health endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/check-chat-tables
curl http://localhost:3000/api/rag/stats
```

### Log Monitoring
```bash
# Development logs
tail -f .next/trace

# Vercel deployment logs
vercel logs

# Railway deployment logs
railway logs
```

## Common Deployment Issues

### Issue: Build Failures
**Symptoms:**
- Next.js build fails during deployment
- TypeScript compilation errors
- Memory limit exceeded during build

**Solutions:**
```bash
# 1. Check TypeScript errors locally
npm run typecheck

# 2. Fix type errors
# Common fixes needed:
# - Replace JSX.Element with ReactElement
# - Add missing type imports
# - Fix any types with proper typing

# 3. Increase memory limit for build
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# 4. Enable build optimizations in next.config.mjs
export default {
  experimental: {
    optimizeServerReact: false,
    workerThreads: false,
    cpus: 1,
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.minimize = true;
    }
    return config;
  }
}
```

### Issue: Deployment Timeouts
**Symptoms:**
- Vercel deployment times out after 10 minutes
- Railway deployment fails with timeout

**Solutions:**
```bash
# 1. Reduce bundle size
npm run build -- --analyze

# 2. Enable code splitting
# In next.config.mjs:
webpack: (config, { isServer, dev }) => {
  if (!dev && !isServer) {
    config.optimization.splitChunks = {
      chunks: 'all',
      maxSize: 244000,
    };
  }
  return config;
}

# 3. Use dynamic imports for large components
const LargeComponent = dynamic(() => import('./LargeComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

### Issue: Environment Variables Not Loading
**Symptoms:**
- API keys undefined in production
- Database connections failing

**Solutions:**
```bash
# 1. Verify environment variables in deployment platform
vercel env ls  # For Vercel
railway variables  # For Railway

# 2. Check variable names (common mistakes)
# ❌ Wrong: SUPABASE_URL
# ✅ Correct: NEXT_PUBLIC_SUPABASE_URL

# 3. Verify .env.local is not deployed
# Add to .gitignore if not already there
echo ".env.local" >> .gitignore

# 4. Test environment loading
node -e "console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing')"
```

## Authentication Problems

### Issue: Auth Pages Return 404
**Symptoms:**
- `/auth/signin` returns 404 error
- Users redirected to non-existent auth pages

**Solutions:**
```bash
# 1. Create missing auth pages
mkdir -p app/auth/signin app/auth/signup

# 2. Create signin page (app/auth/signin/page.tsx)
cat > app/auth/signin/page.tsx << 'EOF'
'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSignIn}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
EOF

# 3. Create signup page (app/auth/signup/page.tsx)
# Similar structure to signin page

# 4. Update middleware to handle auth routes
```

### Issue: Session Not Persisting
**Symptoms:**
- Users logged out on page refresh
- Session expires immediately

**Solutions:**
```typescript
// 1. Check Supabase client configuration
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          if (typeof document !== 'undefined') {
            return getCookie(name);
          }
        },
        set: (name: string, value: string, options: any) => {
          if (typeof document !== 'undefined') {
            setCookie(name, value, options);
          }
        },
        remove: (name: string, options: any) => {
          if (typeof document !== 'undefined') {
            deleteCookie(name, options);
          }
        },
      },
    }
  );
}

// 2. Check middleware configuration
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}
```

## Database Connection Issues

### Issue: Supabase Connection Timeout
**Symptoms:**
- Database queries hanging or timing out
- "Connection pool exhausted" errors

**Solutions:**
```typescript
// 1. Optimize Supabase client usage
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
      // Add connection pooling
      db: {
        schema: 'public',
      },
      global: {
        headers: { 'x-my-custom-header': 'my-app-name' },
      },
    }
  );
}

// 2. Add connection retry logic
export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

// 3. Use connection pooling environment variables
// Add to environment:
# DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=20
# SUPABASE_POOLER_URL=postgresql://user:pass@pooler.host:5432/db
```

### Issue: Row Level Security Errors
**Symptoms:**
- "Permission denied" errors on database queries
- Users can't access their own data

**Solutions:**
```sql
-- 1. Check RLS policies in Supabase dashboard
-- Go to: Database > Policies

-- 2. Create missing RLS policies
-- Example for chats table:
CREATE POLICY "Users can view own chats" ON chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats" ON chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON chats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON chats
    FOR DELETE USING (auth.uid() = user_id);

-- 3. For public data (like FM Global documents):
CREATE POLICY "Public read access" ON fm_global_figures
    FOR SELECT USING (true);

-- 4. Service role queries (bypass RLS)
-- In server-side code, ensure using service role key:
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role bypasses RLS
);
```

### Issue: Migration Failures
**Symptoms:**
- Database tables don't exist
- Schema mismatches

**Solutions:**
```bash
# 1. Run migrations manually
# Copy SQL from supabase/migrations/ and run in Supabase SQL editor

# 2. Check migration status
node scripts/database/verify-ai-sdk5-tables.js

# 3. Create missing tables
node scripts/database/setup-ai-sdk5-simple.js

# 4. Fix common table issues
-- Enable required extensions:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create missing indexes:
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_meeting_chunks_embedding ON meeting_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## AI Integration Problems

### Issue: OpenAI API Errors
**Symptoms:**
- "Invalid API key" errors
- Rate limit exceeded errors
- Model not found errors

**Solutions:**
```bash
# 1. Verify API key format
node -e "
const key = process.env.OPENAI_API_KEY;
if (!key) console.log('❌ API key missing');
else if (!key.startsWith('sk-')) console.log('❌ Invalid key format');
else console.log('✅ API key format valid');
"

# 2. Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  | jq '.data[0].id'

# 3. Handle rate limits
// In your API routes:
import { RateLimiter } from '@/lib/ai/rate-limiter';

const rateLimiter = new RateLimiter();

export async function POST(req: Request) {
  const userId = 'user-id'; // Get from auth
  
  if (!(await rateLimiter.checkLimit(userId, 50, 60000))) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  // Proceed with API call...
}

# 4. Update to latest models
// Replace deprecated models:
// gpt-4 → gpt-4o
// text-embedding-ada-002 → text-embedding-3-small
```

### Issue: RAG System Not Working
**Symptoms:**
- No relevant documents retrieved
- Poor answer quality
- Vector search failing

**Solutions:**
```bash
# 1. Check vector database setup
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.rpc('match_documents', { query_embedding: new Array(1536).fill(0.1), match_count: 1 })
  .then(r => console.log('✅ Vector search working:', r.data?.length))
  .catch(e => console.log('❌ Vector search failed:', e.message));
"

# 2. Verify embeddings exist
SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL;

# 3. Check embedding dimensions
SELECT vector_dims(embedding) as dimensions FROM document_chunks LIMIT 1;

# 4. Re-vectorize documents if needed
npm run vectorize:all

# 5. Test similarity threshold
-- Lower threshold for more results:
SELECT * FROM match_documents('[0.1, 0.2, ...]', 0.5, 10); -- 0.5 instead of 0.7
```

### Issue: Streaming Responses Not Working
**Symptoms:**
- Chat responses appear all at once
- No streaming indicators
- Response timeouts

**Solutions:**
```typescript
// 1. Verify streaming implementation
// app/api/chat/route.ts
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    stream: true, // Ensure streaming is enabled
  });
  
  return result.toAIStreamResponse(); // Use AI SDK response
}

// 2. Check client-side streaming
// components/chat.tsx
import { useChat } from 'ai/react';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    streamMode: 'text', // Enable text streaming
  });
  
  // Render streaming messages...
}

// 3. Debug network requests
// Check browser network tab for:
// - text/plain; charset=utf-8 content type
// - Transfer-Encoding: chunked header
```

## Performance Issues

### Issue: Slow Page Load Times
**Symptoms:**
- Pages take >5 seconds to load
- High Time to First Byte (TTFB)
- Poor Lighthouse scores

**Solutions:**
```bash
# 1. Analyze bundle size
npm run build -- --analyze

# 2. Implement code splitting
// Use dynamic imports:
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
});

# 3. Optimize images
// next.config.mjs
images: {
  unoptimized: false, // Enable optimization
  formats: ['image/webp', 'image/avif'],
  minimumCacheTTL: 60,
}

# 4. Add caching headers
// next.config.mjs
headers: async () => [
  {
    source: '/api/(.*)',
    headers: [
      {
        key: 'Cache-Control',
        value: 's-maxage=60, stale-while-revalidate'
      }
    ]
  }
]

# 5. Database query optimization
-- Add missing indexes:
CREATE INDEX CONCURRENTLY idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX CONCURRENTLY idx_chats_user_id ON chats(user_id);
```

### Issue: Memory Leaks
**Symptoms:**
- Application crashes with out of memory errors
- Gradually increasing memory usage
- Vercel function timeouts

**Solutions:**
```typescript
// 1. Fix memory leaks in components
useEffect(() => {
  const interval = setInterval(() => {
    // Some repeated action
  }, 1000);
  
  // Always cleanup:
  return () => clearInterval(interval);
}, []);

// 2. Optimize vector operations
// Batch process embeddings instead of loading all at once:
export async function processDocumentsInBatches(documents: any[], batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    const batchResults = await processBatch(batch);
    results.push(...batchResults);
    
    // Allow garbage collection between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// 3. Implement proper connection pooling
// Use connection limits in database client configuration
```

## Mobile & Responsive Issues

### Issue: Mobile Layout Broken
**Symptoms:**
- Elements overlapping on mobile
- Horizontal scrolling on mobile
- Touch targets too small

**Solutions:**
```css
/* 1. Fix viewport meta tag */
/* In app/layout.tsx: */
<meta name="viewport" content="width=device-width, initial-scale=1" />

/* 2. Add responsive debugging */
.debug-breakpoint::before {
  content: 'xs';
  @apply sm:hidden;
}
.debug-breakpoint::before {
  content: 'sm';
  @apply hidden sm:block md:hidden;
}

/* 3. Fix common mobile issues */
.mobile-fix {
  @apply touch-manipulation; /* Optimize touch */
  @apply min-h-[44px]; /* Minimum touch target */
  @apply text-base; /* Prevent iOS zoom */
  @apply break-words; /* Prevent overflow */
}

/* 4. Use proper responsive classes */
<div className="
  flex flex-col sm:flex-row 
  space-y-4 sm:space-y-0 sm:space-x-4
  p-4 sm:p-6 lg:p-8
">
```

### Issue: PWA Not Installing
**Symptoms:**
- No install prompt on mobile
- PWA features not working
- Service worker errors

**Solutions:**
```bash
# 1. Check manifest.json
curl http://localhost:3000/manifest.json

# 2. Verify PWA requirements
# - HTTPS in production ✓
# - Manifest.json with required fields ✓
# - Service worker registered ✓
# - Icons in multiple sizes ✓

# 3. Debug service worker
# Chrome DevTools > Application > Service Workers

# 4. Update PWA configuration
// next.config.mjs
import withPWA from 'next-pwa';

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});
```

## Build & Development Issues

### Issue: TypeScript Compilation Errors
**Symptoms:**
- Build failing with type errors
- IDE showing TypeScript errors
- Incorrect type definitions

**Solutions:**
```bash
# 1. Update TypeScript configuration
# tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    // Add missing options:
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}

# 2. Fix common type issues
// ❌ Wrong:
function Component(): JSX.Element {
  return <div />;
}

// ✅ Correct:
import { ReactElement } from 'react';
function Component(): ReactElement {
  return <div />;
}

# 3. Update Supabase types
npm run update-types

# 4. Fix any types
// Instead of 'any', use proper typing:
interface APIResponse<T> {
  data: T;
  error?: string;
}
```

### Issue: ESLint Configuration Errors
**Symptoms:**
- Lint errors preventing build
- Conflicting ESLint rules
- Performance warnings in development

**Solutions:**
```javascript
// eslint.config.js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable problematic rules:
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
      
      // Add project-specific rules:
      "no-console": ["warn", { "allow": ["warn", "error"] }],
    },
  },
];

export default eslintConfig;
```

### Issue: Development Server Issues
**Symptoms:**
- Hot reload not working
- Development server crashing
- Port conflicts

**Solutions:**
```bash
# 1. Clear Next.js cache
rm -rf .next
npm run dev

# 2. Check port availability
lsof -ti:3000 | xargs kill -9  # Kill process using port 3000
npm run dev -- --port 3001    # Use different port

# 3. Fix hot reload issues
# next.config.mjs
export default {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

# 4. Increase Node.js memory limit
NODE_OPTIONS='--max-old-space-size=4096' npm run dev
```

## API Route Problems

### Issue: API Routes Returning 500 Errors
**Symptoms:**
- Internal server errors on API calls
- No response from API endpoints
- CORS errors

**Solutions:**
```typescript
// 1. Add proper error handling
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    if (!body.query) {
      return new Response('Query required', { status: 400 });
    }
    
    // Process request...
    const result = await processQuery(body.query);
    
    return Response.json(result);
  } catch (error) {
    console.error('API Error:', error);
    
    // Return proper error response
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 2. Add CORS headers
export async function POST(req: Request) {
  // ... request processing
  
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// 3. Handle OPTIONS requests
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

### Issue: Middleware Blocking API Routes
**Symptoms:**
- API routes redirecting to auth
- Middleware interfering with functionality

**Solutions:**
```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes that should be public
  const publicApiRoutes = [
    '/api/chat',
    '/api/fm-global',
    '/api/rag',
    '/api/health'
  ];
  
  if (publicApiRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Continue with auth checks for other routes...
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

## Environment Variable Issues

### Issue: Variables Not Loading
**Symptoms:**
- process.env.VARIABLE_NAME returns undefined
- Different behavior between development and production

**Solutions:**
```bash
# 1. Check variable naming
# Client-side variables MUST start with NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_URL=https://...  # ✅ Available in browser
SUPABASE_SERVICE_ROLE_KEY=...         # ✅ Server-side only

# 2. Verify .env.local format
# No spaces around the equals sign
API_KEY=sk-1234567890  # ✅ Correct
API_KEY = sk-1234567890  # ❌ Wrong

# 3. Check deployment platform variables
vercel env ls
railway variables

# 4. Debug variable loading
// Create a debug API route: app/api/debug-env/route.ts
export async function GET() {
  return Response.json({
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}
```

### Issue: Environment Variable Security
**Symptoms:**
- API keys exposed in browser
- Security warnings in production

**Solutions:**
```bash
# 1. Audit exposed variables
# Check browser DevTools > Sources > Page for any exposed keys

# 2. Proper variable classification
# ✅ Public (NEXT_PUBLIC_):
NEXT_PUBLIC_APP_URL=https://myapp.com
NEXT_PUBLIC_SUPABASE_URL=https://...

# ✅ Private (no prefix):
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...

# 3. Rotate compromised keys immediately
# - Generate new API keys
# - Update in deployment platform
# - Remove from git history if committed

# 4. Add environment validation
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

export const env = envSchema.parse(process.env);
```

---

## Emergency Procedures

### Complete System Reset
```bash
# 1. Stop all services
pkill -f "next"
pkill -f "vercel"

# 2. Clean all caches
rm -rf .next node_modules .vercel
npm cache clean --force

# 3. Fresh install
npm install

# 4. Reset database (if needed)
# Backup first!
pg_dump $DATABASE_URL > backup.sql
# Then reset tables via Supabase dashboard

# 5. Re-deploy
npm run build
vercel --prod
```

### Rollback Deployment
```bash
# Vercel rollback
vercel rollback [deployment-url]

# Railway rollback
railway rollback [deployment-id]

# Manual rollback
git revert HEAD
git push origin main
```

### Contact Support
If issues persist after trying these solutions:

1. **Check GitHub Issues** - Search for similar problems
2. **Create Detailed Bug Report** - Include error logs, environment details
3. **Emergency Contact** - For critical production issues

**Support Channels:**
- GitHub Issues: Create issue with [BUG] prefix
- Documentation: Check `/documentation` folder for updates
- Community: Discord/Slack for community support

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Next Review**: March 2025