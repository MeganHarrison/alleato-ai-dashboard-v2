import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const insightType = searchParams.get('type');
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    let query = supabase
      .from('ai_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (projectId && projectId !== 'all') {
      query = query.eq('project_id', projectId);
    }
    if (insightType && insightType !== 'all') {
      query = query.eq('insight_type', insightType);
    }
    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true' ? 1 : 0);
    }

    const { data: insights, error } = await query;

    if (error) {
      console.error('Error fetching insights:', error);
      return NextResponse.json(
        { error: 'Failed to fetch insights' },
        { status: 500 }
      );
    }

    // Get unique projects for filtering
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, description');

    return NextResponse.json({
      insights: insights || [],
      projects: projects || [],
      total: insights?.length || 0,
    });
  } catch (error) {
    console.error('Error in insights API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}