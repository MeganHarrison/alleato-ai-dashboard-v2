# Vercel Deployment Guide

## Prerequisites
- Vercel account (free tier works)
- Vercel CLI installed (`npm i -g vercel`)
- Environment variables ready

## Step 1: Prepare Environment Variables

Copy these to Vercel Dashboard > Settings > Environment Variables:

```bash
# Required
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Railway Integration
RAILWAY_FM_GLOBAL_URL=https://fm-global-asrs-expert-production.up.railway.app
RAILWAY_ASRS_RAG=fm-global-asrs-expert-production-afb0.up.railway.app

# Optional
FIREFLIES_API_KEY=...
LANGSMITH_API_KEY=...
LANGSMITH_PROJECT=fm-global-rag
LANGSMITH_TRACING=true
```

## Step 2: Deploy via CLI

### Option A: Deploy to Production
```bash
vercel --prod
```

### Option B: Preview Deployment
```bash
vercel
```

## Step 3: Deploy via GitHub (Recommended)

1. Push your code to GitHub:
```bash
git add -A
git commit -m "Ready for Vercel deployment"
git push origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure:
   - Framework Preset: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

6. Add environment variables in Vercel dashboard
7. Click "Deploy"

## Step 4: Post-Deployment

### Verify Endpoints
```bash
# Check FM Global Expert
curl https://your-app.vercel.app/api/fm-global

# Check PM Assistant
curl https://your-app.vercel.app/api/pm-rag-fallback
```

### Monitor Logs
- Go to Vercel Dashboard > Functions
- Check for any errors
- Monitor response times

## Common Issues & Solutions

### Build Fails
**Issue**: `Cannot find module for page: /_document`
**Solution**: Already fixed by adding `app/not-found.tsx`

**Issue**: Import errors in chat page
**Solution**: Already fixed by commenting out missing components

### Runtime Errors
**Issue**: API routes return 500
**Solution**: Check environment variables are set in Vercel

**Issue**: Supabase connection fails
**Solution**: Verify service role key is correct

### Performance Issues
**Issue**: Cold starts are slow
**Solution**: Upgrade to Vercel Pro for better performance

## Build Configuration

The project uses these optimizations in `vercel.json`:
- Max duration: 30 seconds for API routes
- Memory: 1GB for functions
- Region: US East (iad1)
- Node options: 7GB heap size for builds

## Monitoring

1. **Vercel Analytics**: Automatic with deployment
2. **Function Logs**: Available in dashboard
3. **Error Tracking**: Set up Sentry (optional)

## Domains

### Custom Domain Setup
1. Go to Settings > Domains
2. Add your domain
3. Update DNS records as instructed
4. SSL certificate auto-provisioned

### Automatic Deployments
- Main branch: Production
- Other branches: Preview deployments
- Pull requests: Automatic preview URLs

## Environment Management

### Development
```bash
# .env.local
NODE_ENV=development
```

### Production
```bash
# Set in Vercel Dashboard
NODE_ENV=production
```

## Rollback

If deployment fails:
1. Go to Vercel Dashboard > Deployments
2. Find last working deployment
3. Click "..." menu > "Promote to Production"

## Cost Considerations

### Free Tier Includes
- 100GB bandwidth
- 100GB-hours for serverless functions
- Unlimited deployments

### When to Upgrade
- Need more than 10 second function timeout
- Want dedicated support
- Need team collaboration features

## Quick Deploy Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy with specific environment
vercel --prod --env NODE_ENV=production

# Link to existing project
vercel link

# Pull environment variables
vercel env pull
```

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Troubleshooting Guide](https://vercel.com/docs/troubleshooting)

---

**Last Updated**: January 2025
**Status**: Ready for deployment