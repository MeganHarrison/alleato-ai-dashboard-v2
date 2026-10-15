import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Insights by Project | Dashboard',
  description: 'View AI insights grouped by project',
};

interface ProjectInsight {
  id: string;
  description: string;
  insight_type: string;
  severity?: string;
  created_at: string;
  document_id?: string;
  meeting_id?: string;
  source_meetings?: string;
  meeting_name?: string;
}

interface Project {
  id: string;
  name: string;
  phase?: string;
  insights: ProjectInsight[];
}

export default async function InsightsByProjectPage() {
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
    .order('created_at', { ascending: false });
  
  if (insightsError) {
    console.error('Error fetching insights:', insightsError);
  }

  // Group insights by project
  const projectsMap = new Map<string, Project>();
  const unassignedInsights: ProjectInsight[] = [];

  allInsights?.forEach(insight => {
    const project = insight.projects;
    
    if (project) {
      if (!projectsMap.has(project.id)) {
        projectsMap.set(project.id, {
          id: project.id,
          name: project.name,
          phase: project.phase,
          insights: []
        });
      }
      projectsMap.get(project.id)!.insights.push({
        id: insight.id,
        description: insight.description,
        insight_type: insight.insight_type,
        severity: insight.severity,
        created_at: insight.created_at,
        document_id: insight.document_id,
        meeting_id: insight.meeting_id,
        source_meetings: insight.source_meetings,
        meeting_name: insight.meeting_name
      });
    } else {
      // Insights without a project
      unassignedInsights.push({
        id: insight.id,
        description: insight.description,
        insight_type: insight.insight_type,
        severity: insight.severity,
        created_at: insight.created_at,
        document_id: insight.document_id,
        meeting_id: insight.meeting_id,
        source_meetings: insight.source_meetings,
        meeting_name: insight.meeting_name
      });
    }
  });

  const projects = Array.from(projectsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  // Helper function to parse JSON descriptions
  const parseDescription = (description: string) => {
    if (typeof description === 'string' && description.startsWith('{')) {
      try {
        const parsed = JSON.parse(description);
        return parsed.item || parsed.description || parsed.content || description;
      } catch {
        return description;
      }
    }
    return description;
  };

  // Helper function to get severity color
  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get insight type color
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'risk': return 'bg-red-50 border-red-200 text-red-900';
      case 'opportunity': return 'bg-green-50 border-green-200 text-green-900';
      case 'action_item': return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'key_point': return 'bg-purple-50 border-purple-200 text-purple-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Insights by Project</h1>
          <p className="text-muted-foreground">
            AI-generated insights organized by project
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{allInsights?.length || 0}</div>
          <p className="text-sm text-muted-foreground">Total Insights</p>
        </div>
      </div>

      {/* Projects with Insights */}
      {projects.map(project => (
        <div key={project.id} className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{project.name}</h2>
              {project.phase && (
                <p className="text-sm text-muted-foreground">Phase: {project.phase}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {project.insights.length} insights
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            {project.insights.map(insight => (
              <div 
                key={insight.id} 
                className={`border rounded-lg p-4 ${getTypeColor(insight.insight_type)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-white/50">
                      {insight.insight_type.replace('_', ' ').toUpperCase()}
                    </span>
                    {insight.severity && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(insight.severity)}`}>
                        {insight.severity.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(insight.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm mb-2">
                  {parseDescription(insight.description)}
                </p>

                {(insight.meeting_name || insight.source_meetings) && (
                  <p className="text-xs text-gray-600">
                    Source: {insight.meeting_name || insight.source_meetings}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Unassigned Insights */}
      {unassignedInsights.length > 0 && (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Unassigned Insights</h2>
              <p className="text-sm text-muted-foreground">Insights not linked to any project</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                {unassignedInsights.length} insights
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            {unassignedInsights.map(insight => (
              <div 
                key={insight.id} 
                className={`border rounded-lg p-4 ${getTypeColor(insight.insight_type)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-white/50">
                      {insight.insight_type.replace('_', ' ').toUpperCase()}
                    </span>
                    {insight.severity && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(insight.severity)}`}>
                        {insight.severity.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(insight.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm mb-2">
                  {parseDescription(insight.description)}
                </p>

                {(insight.meeting_name || insight.source_meetings) && (
                  <p className="text-xs text-gray-600">
                    Source: {insight.meeting_name || insight.source_meetings}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && unassignedInsights.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No insights found</h3>
          <p className="text-gray-500">No AI insights have been generated yet.</p>
        </div>
      )}
    </div>
  );
}