'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface InsightsMetrics {
  totalMeetings: number;
  totalInsights: number;
  activeProjects: number;
  pendingActions: number;
  averageEngagement: number;
  recentTrend: {
    meetings: number;
    insights: number;
  };
}

export async function getInsightsMetrics(): Promise<InsightsMetrics> {
  try {
    // Get total meetings count
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('id, created_at', { count: 'exact' });

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
    }

    // Get total insights count
    const { data: insights, error: insightsError } = await supabase
      .from('ai_insights')
      .select('id, created_at, resolved, severity', { count: 'exact' });

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
    }

    // Get active projects count
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id', { count: 'exact' })
      .neq('status', 'completed');

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }

    // Get recent data for trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentMeetings } = await supabase
      .from('meetings')
      .select('id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { data: recentInsights } = await supabase
      .from('ai_insights')
      .select('id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      totalMeetings: meetings?.length || 0,
      totalInsights: insights?.length || 0,
      activeProjects: projects?.length || 0,
      pendingActions: insights?.filter(insight => 
        insight.resolved === 0 && insight.severity === 'high'
      ).length || 0,
      averageEngagement: 85, // Placeholder - could be calculated from meeting data
      recentTrend: {
        meetings: recentMeetings?.length || 0,
        insights: recentInsights?.length || 0,
      }
    };
  } catch (error) {
    console.error('Error in getInsightsMetrics:', error);
    return {
      totalMeetings: 0,
      totalInsights: 0,
      activeProjects: 0,
      pendingActions: 0,
      averageEngagement: 0,
      recentTrend: {
        meetings: 0,
        insights: 0,
      }
    };
  }
}

export async function getProjectInsights() {
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
      .limit(20);

    if (error) {
      console.error('Error fetching project insights:', error);
      return [];
    }

    return insights || [];
  } catch (error) {
    console.error('Error in getProjectInsights:', error);
    return [];
  }
}

export async function getMeetingAnalytics() {
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
      .limit(10);

    if (error) {
      console.error('Error fetching meeting analytics:', error);
      return [];
    }

    return meetings || [];
  } catch (error) {
    console.error('Error in getMeetingAnalytics:', error);
    return [];
  }
}