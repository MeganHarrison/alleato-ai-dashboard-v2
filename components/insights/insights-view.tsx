'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InsightGeneratorButton } from './insight-generator-button';
import { 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  ListTodo, 
  TrendingUp,
  FileText,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

interface Insight {
  id: string;
  document_id?: string;
  meeting_id?: string;
  project_id?: number;
  insight_type: string;
  title: string;
  description: string;
  severity?: string;
  assignee?: string;
  due_date?: string;
  financial_impact?: string;
  metadata?: unknown;
  created_at: string;
  document?: {
    id: string;
    title: string;
    source: string;
    created_at: string;
  };
  documents?: {
    title: string;
    source: string;
    created_at: string;
  };
  projects?: {
    id: number;
    name: string;
    phase?: string;
  };
}

interface InsightsViewProps {
  insights: Insight[];
  documentsWithoutInsights: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
  stats: Record<string, number>;
  severityStats?: Record<string, number>;
  totalInsights?: number;
}

const insightTypeConfig = {
  action_item: {
    icon: ListTodo,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    label: 'Action Item'
  },
  decision: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    label: 'Decision'
  },
  risk: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    label: 'Risk'
  },
  fact: {
    icon: FileText,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    label: 'Fact'
  },
  stakeholder_feedback: {
    icon: HelpCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    label: 'Feedback'
  },
  timeline_change: {
    icon: TrendingUp,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    label: 'Timeline'
  },
  question: {
    icon: HelpCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    label: 'Question'
  },
  topic: {
    icon: TrendingUp,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    label: 'Key Topic'
  },
  opportunity: {
    icon: Sparkles,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    label: 'Opportunity'
  },
  strategic: {
    icon: TrendingUp,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    label: 'Strategic'
  },
  technical: {
    icon: FileText,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    label: 'Technical'
  },
  default: {
    icon: FileText,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    label: 'Insight'
  }
};

export function InsightsView({ insights, documentsWithoutInsights, stats, severityStats, totalInsights }: InsightsViewProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const filteredInsights = selectedType === 'all' 
    ? insights 
    : insights.filter(i => i.insight_type === selectedType);

  const getInsightConfig = (type: string) => {
    return insightTypeConfig[type as keyof typeof insightTypeConfig] || insightTypeConfig.default;
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Object.entries(insightTypeConfig).filter(([key]) => key !== 'default').map(([key, config]) => (
            <Card key={key} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedType(key)}>
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                  <config.icon className={`w-5 h-5 ${config.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats[key] || 0}</div>
                <p className="text-xs text-muted-foreground">{config.label}s</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Severity Distribution */}
        {severityStats && Object.keys(severityStats).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Severity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {Object.entries(severityStats).map(([severity, count]) => (
                  <div key={severity} className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(severity)}>{severity}</Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Documents Without Insights */}
      {documentsWithoutInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents Pending Analysis</CardTitle>
            <CardDescription>
              {documentsWithoutInsights.length} documents are ready for insight generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-4">
                {documentsWithoutInsights.slice(0, 5).map(doc => (
                  <Badge 
                    key={doc.id} 
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedDocuments(prev => 
                        prev.includes(doc.id) 
                          ? prev.filter(id => id !== doc.id)
                          : [...prev, doc.id]
                      );
                    }}
                  >
                    {selectedDocuments.includes(doc.id) && '✓ '}
                    {doc.title}
                  </Badge>
                ))}
                {documentsWithoutInsights.length > 5 && (
                  <Badge variant="secondary">
                    +{documentsWithoutInsights.length - 5} more
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <InsightGeneratorButton
                  documentIds={selectedDocuments.length > 0 ? selectedDocuments : documentsWithoutInsights.map(d => d.id)}
                  onComplete={() => window.location.reload()}
                  variant="default"
                />
                <Button
                  variant="outline"
                  onClick={() => setSelectedDocuments(documentsWithoutInsights.map(d => d.id))}
                >
                  Select All
                </Button>
                {selectedDocuments.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedDocuments([])}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Insights</CardTitle>
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="action_item">Actions</TabsTrigger>
                <TabsTrigger value="decision">Decisions</TabsTrigger>
                <TabsTrigger value="risk">Risks</TabsTrigger>
                <TabsTrigger value="fact">Facts</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInsights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No insights found</p>
                {documentsWithoutInsights.length > 0 && (
                  <p className="text-sm mt-2">Generate insights from your documents to get started</p>
                )}
              </div>
            ) : (
              filteredInsights.map((insight) => {
                const config = getInsightConfig(insight.insight_type);
                return (
                  <div key={insight.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0 mt-1`}>
                        <config.icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{insight.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {insight.description}
                            </p>
                          </div>
                          {insight.severity && (
                            <Badge variant={getSeverityColor(insight.severity)} className="ml-2">
                              {insight.severity}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {insight.projects && (
                            <Badge variant="secondary" className="text-xs">
                              Project: {insight.projects.name}
                            </Badge>
                          )}
                          {(insight.document || insight.documents) && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {insight.document?.title || insight.documents?.title || 'No document'}
                            </span>
                          )}
                          <span>{format(new Date(insight.created_at), 'MMM d, yyyy')}</span>
                        </div>

                        {(insight.assignee || insight.due_date || insight.metadata) && (
                          <div className="mt-2 space-y-1">
                            {(insight.assignee || insight.metadata?.assignee) && (
                              <p className="text-xs">
                                <span className="font-medium">Assigned to:</span> {insight.assignee || insight.metadata.assignee}
                              </p>
                            )}
                            {(insight.due_date || insight.metadata?.due_date) && (
                              <p className="text-xs">
                                <span className="font-medium">Due:</span> {format(new Date(insight.due_date || insight.metadata.due_date), 'MMM d, yyyy')}
                              </p>
                            )}
                            {insight.financial_impact && (
                              <p className="text-xs">
                                <span className="font-medium">Financial Impact:</span> {insight.financial_impact}
                              </p>
                            )}
                            {insight.metadata?.context && (
                              <p className="text-xs italic text-muted-foreground">
                                "{insight.metadata.context}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}