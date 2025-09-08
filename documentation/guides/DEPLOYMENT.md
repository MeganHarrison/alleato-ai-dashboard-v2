# Vercel Deployment Instructions

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your GitHub repository connected to Vercel
3. Environment variables configured

## Required Environment Variables

Add these in your Vercel project settings under Settings → Environment Variables:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=your_openai_api_key

# Optional Services
FIREFLIES_API_KEY=your_fireflies_api_key
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install --production=false`
5. Add environment variables (see above)
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Option 3: Deploy via GitHub Integration

1. Push your code to GitHub:
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

2. Vercel will automatically deploy when changes are pushed to the main branch

## Build Configuration

The project includes a `vercel.json` file with optimized settings:
- Memory limit: 1024MB for API routes
- Max duration: 30 seconds for functions
- Region: iad1 (US East)
- Build memory optimization enabled

## Post-Deployment Steps

1. **Verify Deployment**
   - Visit your deployed URL
   - Check that all pages load correctly
   - Test the AI chat features

2. **Set up Database**
   - Ensure your Supabase database has all required tables
   - Run any necessary migrations

3. **Configure Domain (Optional)**
   - Go to Settings → Domains in your Vercel project
   - Add your custom domain
   - Update DNS settings as instructed

## Troubleshooting

### Build Failures

If the build fails due to dependency issues:

1. Clear cache and redeploy:
```bash
vercel --force
```

2. Or in Vercel Dashboard:
   - Go to Settings → Functions
   - Click "Redeploy" with "Clear Cache" option

### Zod/AI SDK Compatibility Issues

The project includes a pre-build script that fixes Zod compatibility:
- The `scripts/fix-zod-imports.js` runs automatically before build
- This creates the necessary alias for Zod v4 compatibility

### Memory Issues

If you encounter memory errors:
1. The project is configured with increased memory limits
2. NODE_OPTIONS is set to use 4GB during build
3. Consider upgrading your Vercel plan if issues persist

### Environment Variable Issues

- Double-check all required variables are set
- Ensure there are no trailing spaces in values
- Use the Vercel dashboard to verify variables are loaded

## Monitoring

After deployment:
1. Check Vercel Dashboard → Functions tab for any errors
2. Monitor the Logs tab for runtime issues
3. Set up alerts in Vercel for function errors

## Support

For deployment issues:
- Check Vercel Status: https://vercel-status.com
- Vercel Documentation: https://vercel.com/docs
- GitHub Issues: Create an issue in your repository

## Important Notes

1. **API Keys Security**: Never commit API keys to your repository
2. **Database URLs**: Ensure your database allows connections from Vercel's IP ranges
3. **Build Time**: Initial builds may take 5-10 minutes
4. **Function Regions**: API routes run in the iad1 region by default

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] OpenAI API key valid and has credits
- [ ] Supabase project is active
- [ ] GitHub repository connected
- [ ] Build succeeds locally with `pnpm build`
- [ ] No sensitive data in codebase

---

Last updated: September 2025