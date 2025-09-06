import { notFound } from "next/navigation"
import { format } from "date-fns"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database.types"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  Briefcase,
  FileText,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Lightbulb,
  Brain
} from "lucide-react"
import { getProjectMeetingInsights } from "@/app/actions/meeting-insights-actions"

export const dynamic = "force-dynamic"

interface Insight {
  type: 'risk' | 'action_item' | 'decision' | 'question' | 'highlight';
  status?: 'pending' | 'completed';
  insight_id?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  action_required?: boolean;
  content?: string;
  meeting_title?: string;
  meeting_date?: string;
  assigned_to?: string;
  [key: string]: unknown;
}

async function getProjectDetails(id: string) {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  })
  
  // Get project details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`
      *,
      clients (
        id,
        name,
        status
      )
    `)
    .eq("id", parseInt(id))
    .single()

  if (projectError || !project) {
    console.error('Project query error:', projectError)
    return null
  }

  // Get associated meetings with insights
  const { data: meetings } = await supabase
    .from("meetings")
    .select("*")
    .eq("project_id", parseInt(id))
    .order("date", { ascending: false })

  // Get documents for this project (from documents table)
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .order("id", { ascending: false })

  // Get meeting insights for this project
  const insightsResult = await getProjectMeetingInsights()
  const insights = insightsResult.success ? insightsResult.insights : []

  return { project, meetings: meetings || [], documents: documents || [], insights }
}

// Placeholder data for demonstration
const PLACEHOLDER_DATA = {
  timeline: [
    { date: "2024-01-15", event: "Project kickoff", status: "completed" },
    { date: "2024-02-01", event: "Requirements finalized", status: "completed" },
    { date: "2024-03-15", event: "Phase 1 complete", status: "completed" },
    { date: "2024-04-30", event: "Phase 2 delivery", status: "in-progress" },
    { date: "2024-06-01", event: "Final delivery", status: "upcoming" },
  ],
  team: [
    { name: "John Smith", role: "Project Manager" },
    { name: "Sarah Johnson", role: "Lead Developer" },
    { name: "Mike Chen", role: "UX Designer" },
    { name: "Emily Davis", role: "QA Engineer" },
  ],
  milestones: [
    { name: "Foundation", progress: 100, status: "completed" },
    { name: "Core Development", progress: 75, status: "in-progress" },
    { name: "Testing & QA", progress: 30, status: "in-progress" },
    { name: "Deployment", progress: 0, status: "upcoming" },
  ],
  risks: [
    { level: "high", description: "Resource availability during Q2" },
    { level: "medium", description: "Third-party API integration delays" },
    { level: "low", description: "Minor scope adjustments needed" },
  ]
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getProjectDetails(id)
  
  if (!data) {
    notFound()
  }

  const { project, meetings, documents, insights } = data

  // Calculate insight summary
  const safeInsights = insights || [];
  const insightStats = {
    total: safeInsights.length,
    risks: safeInsights.filter((i: Insight) => i.type === 'risk').length,
    actions: safeInsights.filter((i: Insight) => i.type === 'action_item').length,
    decisions: safeInsights.filter((i: Insight) => i.type === 'decision').length,
    pendingActions: safeInsights.filter((i: Insight) => i.type === 'action_item' && (!i.status || i.status === 'pending')).length
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPhaseColor = (phase: string | null) => {
    if (!phase) return "bg-gray-100 text-gray-700"
    const lowerPhase = phase.toLowerCase()
    if (lowerPhase.includes("planning")) return "bg-brand-100 text-brand-700"
    if (lowerPhase.includes("development") || lowerPhase.includes("progress")) return "bg-purple-100 text-purple-700"
    if (lowerPhase.includes("testing")) return "bg-orange-100 text-orange-700"
    if (lowerPhase.includes("complete") || lowerPhase.includes("done")) return "bg-green-100 text-green-700"
    if (lowerPhase.includes("hold") || lowerPhase.includes("pause")) return "bg-yellow-100 text-yellow-700"
    return "bg-gray-100 text-gray-700"
  }

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (status === "in-progress") return <AlertCircle className="h-4 w-4 text-brand-500" />
    return <XCircle className="h-4 w-4 text-gray-400" />
  }

  const getRiskColor = (level: string) => {
    if (level === "high") return "text-red-600 bg-red-50"
    if (level === "medium") return "text-yellow-600 bg-yellow-50"
    return "text-green-600 bg-green-50"
  }

  return (
    <div className="flex flex-col gap-8 w-[90%] mx-auto">
      <PageHeader
        title={project.name || `Project ${project.id}`}
        description={project.description || "Project details and information"}
      />

      {/* Project Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getPhaseColor(project.phase)}>
              {project.phase || "Not Started"}
            </Badge>
            {project["job number"] && (
              <p className="text-xs text-muted-foreground mt-2">
                Job #{project["job number"]}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(project["est revenue"])}</div>
            {project["est profit"] && (
              <p className="text-xs text-muted-foreground mt-1">
                Profit: {formatCurrency(project["est profit"])}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {project["start date"] && (
                <p className="text-sm">
                  Start: {format(new Date(project["start date"]), "MMM d, yyyy")}
                </p>
              )}
              {project["est completion"] && (
                <p className="text-sm">
                  Est: {format(new Date(project["est completion"]), "MMM d, yyyy")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {project.address || "No address"}
            </p>
            {project.state && (
              <p className="text-xs text-muted-foreground mt-1">
                {project.state}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meeting Intelligence Card */}
      {insightStats.total > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand-500" />
              <CardTitle>Meeting Intelligence Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-600">{insightStats.actions}</div>
                <div className="text-sm text-muted-foreground">Action Items</div>
                <div className="text-xs text-red-500">{insightStats.pendingActions} pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{insightStats.risks}</div>
                <div className="text-sm text-muted-foreground">Risks Identified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{insightStats.decisions}</div>
                <div className="text-sm text-muted-foreground">Decisions Made</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{meetings.length}</div>
                <div className="text-sm text-muted-foreground">Total Meetings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="meetings" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        {/* Meeting Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Meeting Insights ({safeInsights.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {safeInsights.length > 0 ? (
                <div className="space-y-4">
                  {safeInsights.slice(0, 10).map((insight: Insight, index: number) => (
                    <div key={insight.insight_id || index} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {insight.type === 'risk' && <AlertCircle className="h-4 w-4 text-red-500" />}
                            {insight.type === 'action_item' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {insight.type === 'decision' && <FileText className="h-4 w-4 text-brand-500" />}
                            {insight.type === 'question' && <MessageSquare className="h-4 w-4 text-yellow-500" />}
                            {insight.type === 'highlight' && <Lightbulb className="h-4 w-4 text-purple-500" />}
                            <Badge variant="outline" className="capitalize">
                              {insight.type.replace('_', ' ')}
                            </Badge>
                            {insight.priority && (
                              <Badge variant={
                                insight.priority === 'high' ? 'destructive' : 
                                insight.priority === 'medium' ? 'default' : 'secondary'
                              }>
                                {insight.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mb-2">{insight.content}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>From: {insight.meeting_title}</span>
                            <span>{insight.meeting_date ? format(new Date(insight.meeting_date), "MMM d, yyyy") : 'Unknown date'}</span>
                            {insight.assigned_to && (
                              <span>Assigned: {insight.assigned_to}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {safeInsights.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... and {safeInsights.length - 10} more insights
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No insights generated yet. Meeting intelligence will appear here once meetings are processed.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Meetings ({meetings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {meetings.length > 0 ? (
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-start justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{meeting.title || "Untitled Meeting"}</h4>
                          {meeting.category && (
                            <Badge variant="secondary" className="text-xs">
                              {meeting.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(meeting.date), "MMM d, yyyy")}
                          </span>
                          {meeting.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {meeting.duration_minutes} min
                            </span>
                          )}
                        </div>
                        {meeting.summary && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {meeting.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No meetings recorded for this project yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PLACEHOLDER_DATA.timeline.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <p className="font-medium">{item.event}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.date), "MMMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {item.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {PLACEHOLDER_DATA.team.map((member, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PLACEHOLDER_DATA.milestones.map((milestone, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{milestone.name}</span>
                        <Badge variant={milestone.status === "completed" ? "default" : "secondary"}>
                          {milestone.status.replace("-", " ")}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">{milestone.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PLACEHOLDER_DATA.risks.map((risk, index) => (
                  <div key={index} className={cn(
                    "p-3 rounded-lg border",
                    getRiskColor(risk.level)
                  )}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {risk.level} risk
                      </Badge>
                      <p className="text-sm">{risk.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}