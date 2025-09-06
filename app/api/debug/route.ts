import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== DEBUG ENDPOINT CALLED ===');
  
  const envCheck = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
        startsWith: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20)
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
        startsWith: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)
      },
      OPENAI_API_KEY: {
        exists: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length
      }
    },
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || key.includes('OPENAI')
    )
  };
  
  console.log('Environment check:', JSON.stringify(envCheck, null, 2));
  
  // Try to import and initialize Supabase
  let supabaseTest = { error: null, success: false };
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Try a simple query
    const { data, error } = await supabase
      .from('fm_global_tables')
      .select('count')
      .single();
    
    supabaseTest = {
      success: !error,
      error: (error as any)?.message || null,
    } as any;
    
  } catch (error) {
    supabaseTest = {
      success: false,
      error: (error as any)?.message || 'Unknown error'
    };
  }
  
  return NextResponse.json({
    ...envCheck,
    supabaseTest
  });
}