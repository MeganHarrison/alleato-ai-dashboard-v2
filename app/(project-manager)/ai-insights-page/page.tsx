import { ChatInterface } from "@/components/chat/ChatInterface";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { 
  AlertTriangle, 
  CheckCircle, 
  ListTodo, 
  FileText,
  Users,
  Clock
} from 'lucide-react';

interface InsightWithDetails {
  id: string;
  project_id: number | null;
  insight_type: string;
  title: string;
  description: string;
  severity?: string;
  assignee?: string;
  due_date?: string;
  financial_impact?: string;
  created_at: string;
  meeting_date?: string;
  meeting_name?: string;
  document_id?: string;
  projects?: {
    id: number;
    name: string | null;
  } | null;
}

// Insight type configuration with colors and labels
const insightTypeConfig = {
  action_item: {
    icon: ListTodo,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    label: 'Task'
  },
  decision: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50 border-green-200',
    label: 'Decision'
  },
  risk: {
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50 border-red-200',
    label: 'Risk'
  },
  fact: {
    icon: FileText,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    label: 'Fact'
  },
  stakeholder_feedback: {
    icon: Users,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    label: 'Feedback'
  },
  timeline_change: {
    icon: Clock,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    label: 'Timeline'
  }
};

const getInsightConfig = (type: string) => {
  return insightTypeConfig[type as keyof typeof insightTypeConfig] || {
    icon: FileText,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    label: type.charAt(0).toUpperCase() + type.slice(1)
  };
};

const getSeverityBadge = (severity?: string) => {
  if (!severity) return null;
  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  };
  return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export default async function AiInsightsPage() {
  const supabase = await createClient();
  
  // Fetch insights with all relevant details
  const { data: insights, error } = await supabase
    .from("ai_insights")
    .select(`
      id, 
      project_id, 
      insight_type, 
      title, 
      description, 
      severity,
      assignee,
      due_date,
      financial_impact,
      created_at,
      meeting_date,
      meeting_name,
      document_id,
      projects(id, name)
    `)
    .order("meeting_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ai_insights:", error);
  }

  // Cast to proper type
  const typedInsights = (insights || []) as InsightWithDetails[];

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {typedInsights.length} insights from meetings and documents
        </p>
      </div>

      {typedInsights.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No insights available.
        </p>
      ) : (
        <div className="space-y-1">
          {typedInsights.map((insight) => {
            const config = getInsightConfig(insight.insight_type);
            const Icon = config.icon;
            const displayDate = insight.meeting_date || insight.created_at;
            
            return (
              <div 
                key={insight.id} 
                className="group hover:bg-muted/30 transition-colors border-b last:border-0"
              >
                <div className="py-3 px-2">
                  {/* Main row */}
                  <div className="flex items-start gap-3">
                    {/* Icon and Type */}
                    <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                      <div className={`p-1.5 rounded border ${config.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
                        {config.label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {/* Title and Description on same line when possible */}
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h3 className="font-medium text-sm">{insight.title}</h3>
                            <span className="text-sm text-muted-foreground">
                              {insight.description}
                            </span>
                          </div>
                          
                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {insight.projects?.name && (
                              <span className="font-medium text-foreground">
                                {insight.projects.name}
                              </span>
                            )}
                            
                            {insight.meeting_name && (
                              <>
                                <span className="text-muted-foreground/40">•</span>
                                <span>{insight.meeting_name}</span>
                              </>
                            )}
                            
                            {insight.assignee && (
                              <>
                                <span className="text-muted-foreground/40">•</span>
                                <span>→ {insight.assignee}</span>
                              </>
                            )}
                            
                            {insight.due_date && (
                              <>
                                <span className="text-muted-foreground/40">•</span>
                                <span>Due: {format(new Date(insight.due_date), 'MMM d')}</span>
                              </>
                            )}
                            
                            {insight.financial_impact && (
                              <>
                                <span className="text-muted-foreground/40">•</span>
                                <span>${insight.financial_impact}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right side: Severity and Date */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {insight.severity && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getSeverityBadge(insight.severity)}`}>
                              {insight.severity}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(displayDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-8 border-t mt-8">
        <ChatInterface />
      </div>
    </div>
  );
}