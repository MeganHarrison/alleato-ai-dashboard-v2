import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const documentType = searchParams.get('type') || null;

    // Query recent documents from meetings table (which contains Fireflies data)
    const query = supabase
      .from('meetings')
      .select(`
        id,
        title,
        date,
        duration_minutes,
        participants,
        fireflies_id,
        created_at,
        processed_at,
        processing_status
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (documentType) {
      query = query.eq('category', documentType);
    }

    // Only get successfully processed documents
    query = query.eq('processing_status', 'completed');

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      documents: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Error fetching recent documents:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recent documents' 
      },
      { status: 500 }
    );
  }
}