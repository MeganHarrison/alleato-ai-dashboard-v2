# Vercel Deployment OOM Fix Guide

## Problem
The Vercel deployment was failing with an Out of Memory (OOM) error during the build process, specifically when generating static pages (failing at 44/90 pages).

## Root Causes
1. **Large static generation**: 90+ pages being statically generated at build time
2. **Heavy data loading**: Loading 882KB JSONL files during static generation
3. **Memory-intensive webpack configuration**: No optimization for limited memory environments
4. **Concurrent processing**: Multiple pages being built simultaneously

## Solutions Implemented

### 1. Next.js Configuration Optimizations (`next.config.mjs`)

```javascript
// Memory optimizations added:
experimental: {
  optimizeServerReact: false,  // Reduce server-side React overhead
  ppr: false,                   // Disable partial prerendering
  workerThreads: false,         // Disable worker threads
  cpus: 1,                      // Limit to single CPU to reduce memory
}
```

### 2. Webpack Memory Optimizations

```javascript
// Aggressive chunk splitting for production
splitChunks: {
  chunks: 'all',
  maxSize: 200000,  // Smaller chunks (200KB max)
  // Separate caching groups for better memory management
}

// Reduce Terser parallel processing
minimizer.options.parallel = 1
```

### 3. Dynamic Rendering for Heavy Pages

Disabled static generation for data-heavy pages:

```typescript
// app/(asrs)/fm-8-34/[slug]/page.tsx
export const dynamic = 'force-dynamic';
// Commented out generateStaticParams()
```

### 4. Vercel Build Environment (`vercel.json`)

```json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=7168",
      "NEXT_TELEMETRY_DISABLED": "1",
      "NEXT_SHARP_PATH": "/tmp/node_modules/sharp"
    }
  }
}
```

## Deployment Steps

1. **Commit the changes**:
   ```bash
   git add next.config.mjs vercel.json app/(asrs)/fm-8-34/\[slug\]/page.tsx
   git commit -m "fix: Optimize build for Vercel memory constraints"
   ```

2. **Push to deployment branch**:
   ```bash
   git push origin deployment-optimizations
   ```

3. **Monitor Vercel build**:
   - Check build logs in Vercel dashboard
   - Verify memory usage stays under 8GB limit
   - Ensure all pages build successfully

## Additional Optimizations (if needed)

If the build still fails, consider:

1. **Further reduce static generation**:
   - Add `export const dynamic = 'force-dynamic'` to more pages
   - Use ISR (Incremental Static Regeneration) instead

2. **Optimize data loading**:
   - Implement pagination for large datasets
   - Use streaming for JSONL files
   - Cache processed data

3. **Split the application**:
   - Consider monorepo with separate deployments
   - Use edge functions for heavy computations

## Monitoring

After successful deployment:

1. **Check performance**:
   - Monitor server response times
   - Verify dynamic pages load correctly
   - Test all critical user paths

2. **Memory usage**:
   - Monitor runtime memory usage
   - Check for memory leaks
   - Optimize based on usage patterns

## Rollback Plan

If issues occur after deployment:

1. Revert to previous configuration:
   ```bash
   git revert HEAD
   git push origin deployment-optimizations
   ```

2. Or restore static generation selectively:
   - Re-enable generateStaticParams() for critical pages only
   - Keep memory optimizations in place

## Long-term Solutions

1. **Implement proper caching strategy**:
   - Use Redis/Upstash for data caching
   - Implement stale-while-revalidate patterns

2. **Optimize data pipeline**:
   - Pre-process and store optimized data
   - Use CDN for static assets
   - Implement proper database indexing

3. **Consider infrastructure upgrade**:
   - Vercel Pro/Enterprise for more resources
   - Self-hosted solution with more memory
   - Edge runtime for lighter pages

## Contact

For deployment issues, contact the DevOps team or check the Vercel status page.