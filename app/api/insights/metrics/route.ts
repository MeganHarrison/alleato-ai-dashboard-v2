import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get total meetings count
    const { data: meetings, error: meetingsError, count: meetingsCount } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true });

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
    }

    // Get total insights count
    const { data: insights, error: insightsError, count: insightsCount } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true });

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
    }

    // Get active projects count
    const { data: projects, error: projectsError, count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }

    // Get recent data for trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentMeetings, count: recentMeetingsCount } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { data: recentInsights, count: recentInsightsCount } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { data: highPriorityItems, count: highPriorityCount } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'high')
      .eq('resolved', 0);

    return NextResponse.json({
      totalMeetings: meetingsCount || 0,
      totalInsights: insightsCount || 0,
      activeProjects: projectsCount || 0,
      pendingActions: highPriorityCount || 0,
      averageEngagement: 85, // Placeholder - could be calculated from meeting data
      recentTrend: {
        meetings: recentMeetingsCount || 0,
        insights: recentInsightsCount || 0,
      }
    });
  } catch (error) {
    console.error('Error in metrics API:', error);
    return NextResponse.json({
      totalMeetings: 0,
      totalInsights: 0,
      activeProjects: 0,
      pendingActions: 0,
      averageEngagement: 0,
      recentTrend: {
        meetings: 0,
        insights: 0,
      }
    }, { status: 500 });
  }
}