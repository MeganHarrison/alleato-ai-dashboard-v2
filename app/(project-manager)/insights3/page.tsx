import { getAllMeetingInsightsFromMeetings } from "@/app/actions/meeting-insights-actions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Target, HelpCircle, TrendingUp } from "lucide-react"

const insightTypeConfig = {
  risk: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50", label: "Risk" },
  action_item: { icon: CheckCircle2, color: "text-blue-600", bgColor: "bg-blue-50", label: "Action Item" },
  decision: { icon: Target, color: "text-purple-600", bgColor: "bg-purple-50", label: "Decision" },
  question: { icon: HelpCircle, color: "text-amber-600", bgColor: "bg-amber-50", label: "Question" },
  highlight: { icon: Info, color: "text-green-600", bgColor: "bg-green-50", label: "Highlight" },
  blocker: { icon: AlertTriangle, color: "text-red-700", bgColor: "bg-red-100", label: "Blocker" },
  update: { icon: TrendingUp, color: "text-indigo-600", bgColor: "bg-indigo-50", label: "Update" }
}

const priorityConfig = {
  high: { color: "destructive", label: "High" },
  medium: { color: "secondary", label: "Medium" },
  low: { color: "outline", label: "Low" }
}

export default async function MeetingInsightsPage() {
  const { insights } = await getAllMeetingInsightsFromMeetings()

  // Group insights by project
  const safeInsights = Array.isArray(insights) ? insights : [];
  const insightsByProject = safeInsights.reduce((acc: unknown, insight: unknown) => {
    const projectName = insight.project?.name || "No Project"
    if (!acc[projectName]) {
      acc[projectName] = {
        project: insight.project,
        insights: []
      }
    }
    acc[projectName].insights.push(insight)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-3xl font-semibold">Meeting Insights</h1>
        <p className="text-muted-foreground mt-2">
          AI-generated insights from all meetings, organized by project
        </p>
      </div>

      <div className="px-4 lg:px-6 space-y-8">
        {Object.keys(insightsByProject).length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                No meeting insights found. Insights will appear here after meetings are processed.
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(insightsByProject).map(([projectName, projectData]: unknown) => (
            <div key={projectName} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{projectName}</h2>
                {projectData.project && (
                  <div className="flex gap-2">
                    <Badge variant="outline">{projectData.project.phase}</Badge>
                    {projectData.project.category && (
                      <Badge variant="secondary">{projectData.project.category}</Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projectData.insights.map((insight: unknown) => {
                  const typeConfig = insightTypeConfig[insight.type as keyof typeof insightTypeConfig] || insightTypeConfig.update
                  const priorityBadge = insight.priority ? priorityConfig[insight.priority as keyof typeof priorityConfig] : null
                  const Icon = typeConfig.icon

                  return (
                    <Card key={insight.insight_id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${typeConfig.bgColor}`}>
                              <Icon className={`h-4 w-4 ${typeConfig.color}`} />
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {typeConfig.label}
                            </Badge>
                          </div>
                          {priorityBadge && (
                            <Badge variant={priorityBadge.color as any} className="text-xs">
                              {priorityBadge.label}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm">{insight.content}</p>
                        
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Meeting</span>
                            <span className="text-xs font-medium">{insight.meeting_title}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(insight.meeting_date).toLocaleDateString()}
                            </span>
                            {insight.assigned_to && (
                              <span className="text-xs font-medium">
                                → {insight.assigned_to}
                              </span>
                            )}
                          </div>

                          {insight.due_date && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">Due:</span>
                              <span className="text-xs font-medium">
                                {new Date(insight.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}