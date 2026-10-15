import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        created_at,
        duration,
        participants
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching meeting analytics:', error);
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(meetings || []);
  } catch (error) {
    console.error('Error in meetings API:', error);
    return NextResponse.json([], { status: 500 });
  }
}