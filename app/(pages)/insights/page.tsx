import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { InsightsView } from '@/components/insights/insights-view';

export const metadata: Metadata = {
  title: 'AI Insights | Dashboard',
  description: 'View AI-generated insights from documents and meetings',
};

export default async function InsightsPage() {
  const supabase = await createClient();

  // Fetch recent insights
  const { data: insights } = await supabase
    .from('ai_insights')
    .select(`
      *,
      documents(title, source, created_at),
      projects(name, phase)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch documents that need insights
  const { data: documentsWithoutInsights } = await supabase
    .from('documents')
    .select('id, title, created_at')
    .eq('processing_status', 'completed')
    .order('created_at', { ascending: false });

  // Get insight counts by type
  const { data: insightStats } = await supabase
    .from('ai_insights')
    .select('insight_type')
    .order('insight_type');

  const stats = insightStats?.reduce((acc, curr) => {
    acc[curr.insight_type] = (acc[curr.insight_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Insights</h1>
        <p className="text-muted-foreground">
          View and generate AI-powered insights from your documents
        </p>
      </div>

      <InsightsView
        insights={insights || []}
        documentsWithoutInsights={documentsWithoutInsights || []}
        stats={stats}
      />
    </div>
  );
}