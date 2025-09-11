import { z } from 'zod';

// Environment schema for required variables
const envSchema = z.object({
  // Railway API endpoints
  RAILWAY_PM_RAG: z.string().url().optional(),
  RAILWAY_ASRS_RAG: z.string().url().optional(),
  RAILWAY_PM_VECTORS: z.string().url().optional(),
  
  // Public Railway endpoints (for client-side)
  NEXT_PUBLIC_RAILWAY_PM_RAG: z.string().url().optional(),
  NEXT_PUBLIC_RAILWAY_ASRS_RAG: z.string().url().optional(),
  NEXT_PUBLIC_RAILWAY_PM_VECTORS: z.string().url().optional(),
  
  // Alternative endpoint names
  RAILWAY_RAG_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_RAILWAY_RAG_API_URL: z.string().url().optional(),
  
  // Required variables
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Valid Supabase URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
});

type EnvVars = z.infer<typeof envSchema>;

/**
 * Validates environment variables and provides helpful error messages
 */
export function validateEnvVars(): EnvVars {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment Variable Validation Failed:');
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      
      // Provide specific guidance for missing Railway URLs
      const missingRailwayVars = error.issues.filter((err: any) => 
        err.path[0]?.toString().includes('RAILWAY')
      );
      
      if (missingRailwayVars.length > 0) {
        console.warn('\n⚠️  Railway API endpoints not configured:');
        console.warn('   This is OK if you\'re using local fallback modes.');
        console.warn('   To use Railway APIs, set these environment variables:');
        console.warn('   - RAILWAY_PM_RAG=https://your-pm-rag-endpoint.up.railway.app');
        console.warn('   - RAILWAY_ASRS_RAG=https://your-asrs-rag-endpoint.up.railway.app');
        console.warn('   - RAILWAY_PM_VECTORS=https://your-vectors-endpoint.up.railway.app\n');
      }
    }
    
    throw new Error('Environment validation failed');
  }
}

/**
 * Get Railway PM RAG endpoint with validation
 */
export function getRailwayPMRagEndpoint(): string | null {
  const endpoints = [
    process.env.RAILWAY_PM_RAG,
    process.env.RAILWAY_RAG_API_URL,
    process.env.NEXT_PUBLIC_RAILWAY_PM_RAG,
    process.env.NEXT_PUBLIC_RAILWAY_RAG_API_URL
  ].filter(Boolean);
  
  if (endpoints.length === 0) {
    console.warn('⚠️ No Railway PM RAG endpoint configured');
    return null;
  }
  
  if (endpoints.length > 1) {
    console.warn(`⚠️ Multiple Railway PM RAG endpoints found: ${endpoints.join(', ')}`);
    console.warn(`   Using: ${endpoints[0]}`);
  }
  
  return endpoints[0]!;
}

/**
 * Get Railway ASRS RAG endpoint with validation  
 */
export function getRailwayASRSRagEndpoint(): string | null {
  const endpoints = [
    process.env.RAILWAY_ASRS_RAG,
    process.env.NEXT_PUBLIC_RAILWAY_ASRS_RAG
  ].filter(Boolean);
  
  if (endpoints.length === 0) {
    console.warn('⚠️ No Railway ASRS RAG endpoint configured');
    return null;
  }
  
  return endpoints[0]!;
}

/**
 * Check if all required Railway endpoints are configured
 */
export function checkRailwayConfiguration() {
  const pmEndpoint = getRailwayPMRagEndpoint();
  const asrsEndpoint = getRailwayASRSRagEndpoint();
  
  console.log('\n🚂 Railway Configuration Status:');
  console.log('================================');
  console.log(`PM RAG Endpoint: ${pmEndpoint || '❌ Not configured'}`);
  console.log(`ASRS RAG Endpoint: ${asrsEndpoint || '❌ Not configured'}`);
  
  if (!pmEndpoint && !asrsEndpoint) {
    console.warn('\n⚠️  No Railway endpoints configured - using local fallback modes only');
  }
  
  return {
    pm_rag: pmEndpoint,
    asrs_rag: asrsEndpoint,
    has_railway_config: !!(pmEndpoint || asrsEndpoint)
  };
}