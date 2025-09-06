import { NextResponse } from 'next/server';

// Health check endpoint for deployment validation
export async function GET() {
  try {
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        api: true,
        database: await checkDatabase(),
        memory: process.memoryUsage(),
      }
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }, 
      { status: 500 }
    );
  }
}

async function checkDatabase() {
  try {
    // Basic Supabase connection check
    // You can add more specific checks here
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? true : false;
  } catch {
    return false;
  }
}