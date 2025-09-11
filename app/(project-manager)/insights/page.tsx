import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { InsightsView } from '@/components/insights/insights-view';

export const metadata: Metadata = {
  title: 'AI Insights | Dashboard',
  description: 'View AI-generated insights from documents and meetings',
};

export default async function InsightsPage() {
  const supabase = await createClient();

  // Fetch all insights with project information
  const { data: allInsights, error: insightsError } = await supabase
    .from('ai_insights')
    .select(`
      *,
      projects!ai_insights_project_id_fkey (
        id,
        name,
        phase
      )
    `)
    .order('created_at', { ascending: false })
    .limit(500);  // Increased limit to get more insights
  
  if (insightsError) {
    console.error('Error fetching insights:', insightsError);
  }

  console.log('Fetched insights count:', allInsights?.length || 0);
  if (allInsights && allInsights.length > 0) {
    console.log('Sample insight:', allInsights[0]);
  }

  // Fetch documents for insights that have document_id
  const documentIds = [...new Set(allInsights?.map(i => i.document_id).filter(Boolean) || [])];
  let documentsMap = new Map();
  
  if (documentIds.length > 0) {
    const { data: documents } = await supabase
      .from('documents')
      .select('id, title, created_at')
      .in('id', documentIds);
    
    documents?.forEach(doc => {
      documentsMap.set(doc.id, doc);
    });
  }

  // Process insights - parse JSON description if needed
  const insights = allInsights?.map(insight => {
    // Parse description if it's a JSON string
    let parsedDescription = insight.description;
    let metadata = {};
    
    if (typeof insight.description === 'string' && insight.description.startsWith('{')) {
      try {
        const parsed = JSON.parse(insight.description);
        parsedDescription = parsed.item || parsed.description || parsed.content || insight.description;
        metadata = parsed;
      } catch (e) {
        // Keep original if parsing fails
        parsedDescription = insight.description;
      }
    }
    
    // Get document info if available
    const documentInfo = insight.document_id ? documentsMap.get(insight.document_id) : null;
    
    return {
      ...insight,
      description: parsedDescription,
      metadata: metadata,
      document: documentInfo ? {
        id: documentInfo.id,
        title: documentInfo.title,
        source: 'Document',
        created_at: documentInfo.created_at
      } : {
        id: insight.document_id || insight.meeting_id || '',
        title: insight.meeting_name || 'Untitled',
        source: insight.source_meetings || 'Unknown',
        created_at: insight.created_at
      }
    };
  }) || [];

  // Get documents that have insights (either via meeting_id or document_id)
  const { data: insightDocIds } = await supabase
    .from('ai_insights')
    .select('meeting_id, document_id');

  const processedDocIds = new Set([
    ...(insightDocIds?.map(i => i.meeting_id).filter(Boolean) || []),
    ...(insightDocIds?.map(i => i.document_id).filter(Boolean) || [])
  ]);

  // Fetch documents that need insights
  const { data: allDocuments } = await supabase
    .from('documents')
    .select('id, title, created_at, processing_status')
    .or('processing_status.eq.completed,processing_status.eq.pending')
    .order('created_at', { ascending: false });

  const documentsWithoutInsights = allDocuments?.filter(
    doc => !processedDocIds.has(doc.id)
  ) || [];

  // Get comprehensive insight statistics
  const { data: insightStats } = await supabase
    .from('ai_insights')
    .select('insight_type, severity');

  const stats = insightStats?.reduce((acc, curr) => {
    // Count by type
    acc.byType[curr.insight_type] = (acc.byType[curr.insight_type] || 0) + 1;
    // Count by severity
    if (curr.severity) {
      acc.bySeverity[curr.severity] = (acc.bySeverity[curr.severity] || 0) + 1;
    }
    acc.total++;
    return acc;
  }, { 
    byType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    total: 0
  }) || { byType: {}, bySeverity: {}, total: 0 };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground">
            View and generate AI-powered insights from your documents
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-sm text-muted-foreground">Total Insights</p>
        </div>
      </div>

      <InsightsView
        insights={insights}
        documentsWithoutInsights={documentsWithoutInsights}
        stats={stats.byType}
        severityStats={stats.bySeverity}
        totalInsights={stats.total}
      />
    </div>
  );
}