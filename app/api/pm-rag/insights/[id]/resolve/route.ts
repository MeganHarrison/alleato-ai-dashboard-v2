import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const insightId = params.id;

    // Update the insight to mark it as resolved
    const { data, error } = await supabase
      .from('ai_insights')
      .update({ resolved: 1 })
      .eq('id', insightId)
      .select()
      .single();

    if (error) {
      console.error('Error resolving insight:', error);
      return NextResponse.json(
        { error: 'Failed to resolve insight' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      insight: data,
    });
  } catch (error) {
    console.error('Error in resolve insight API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}