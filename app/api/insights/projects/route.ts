import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: insights, error } = await supabase
      .from('ai_insights')
      .select(`
        *,
        projects:project_id (
          id,
          name,
          status
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching project insights:', error);
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(insights || []);
  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json([], { status: 500 });
  }
}