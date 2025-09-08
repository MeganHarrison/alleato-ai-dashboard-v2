import { getProjectMeetingInsights } from "@/app/actions/meeting-insights-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProjectDocuments,
  getProjectInsights,
} from "@/lib/actions/project-documents-actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";
import { createServerClient } from "@supabase/ssr";
import { format } from "date-fns";
import {
  AlertCircle,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Lightbulb,
  MapPin,
  MessageSquare,
  Users,
  XCircle,
  TrendingUp,
  Activity,
  BarChart3,
} from "lucide-react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// Modern Document Card Component
function ModernDocumentCard({ document }: { document: any }) {
  const getDocumentIcon = (type: string | null) => {
    if (!type) return <FileText className="h-4 w-4 text-gray-400" />;
    const lowerType = type.toLowerCase();
    if (lowerType.includes('meeting')) return <MessageSquare className="h-4 w-4 text-blue-500" />;
    if (lowerType.includes('report')) return <FileText className="h-4 w-4 text-green-500" />;
    if (lowerType.includes('contract')) return <FileText className="h-4 w-4 text-purple-500" />;
    if (lowerType.includes('proposal')) return <FileText className="h-4 w-4 text-orange-500" />;
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  const extractTitle = (document: any) => {
    if (document.metadata && typeof document.metadata === "object") {
      if ("title" in document.metadata) return (document.metadata as any).title;
      if ("filename" in document.metadata) return (document.metadata as any).filename;
      if ("name" in document.metadata) return (document.metadata as any).name;
    }
    
    if (document.content) {
      const firstLine = document.content.split("\n")[0];
      if (firstLine && firstLine.length <= 100) {
        return firstLine;
      }
      return document.content.slice(0, 50) + (document.content.length > 50 ? "..." : "");
    }
    
    return `Document #${document.id}`;
  };

  const extractDate = (document: any) => {
    if (document.metadata && typeof document.metadata === "object") {
      const metadata = document.metadata as any;
      if (metadata.date) return metadata.date;
      if (metadata.created_at) return metadata.created_at;
      if (metadata.meeting_date) return metadata.meeting_date;
    }
    return null;
  };

  return (
    <div className="group relative bg-gray-50 hover:bg-white rounded-xl p-5 transition-all hover:shadow-lg cursor-pointer border border-gray-100 hover:border-gray-200">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
          {getDocumentIcon(document.document_type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {extractTitle(document)}
          </h4>
          
          {extractDate(document) && (
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(extractDate(document)), "MMM d, yyyy")}
            </p>
          )}
          
          {document.content && (
            <p className="mt-2 text-xs text-gray-600 line-clamp-2">
              {document.content.slice(0, 100)}
              {document.content.length > 100 ? "..." : ""}
            </p>
          )}
        </div>
      </div>
      
      {document.metadata && typeof document.metadata === "object" && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          {"file_size" in document.metadata && (
            <span className="flex items-center gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              {Math.round((document.metadata as any).file_size / 1024)} KB
            </span>
          )}
          {"duration_minutes" in document.metadata && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(document.metadata as any).duration_minutes} min
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface Insight {
  type: "risk" | "action_item" | "decision" | "question" | "highlight";
  status?: "pending" | "completed";
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
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `
      *,
      clients (
        id,
        name,
        status
      )
    `
    )
    .eq("id", parseInt(id))
    .single();

  if (projectError || !project) {
    console.error("Project query error:", projectError);
    return null;
  }

  // Get documents for this project - using documents table instead of meetings
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", parseInt(id))
    .order("id", { ascending: false });

  // Get additional documents using the action (may include different filtering)
  const documentsResult = await getProjectDocuments(parseInt(id));
  const additionalDocuments = documentsResult.success ? documentsResult.documents : [];

  // Merge and deduplicate documents
  const allDocuments = [...(documents || []), ...additionalDocuments];
  const uniqueDocuments = Array.from(new Map(allDocuments.map(doc => [doc.id, doc])).values());

  // Get insights for this project (both project_insights and ai_insights)
  const insightsResult = await getProjectInsights(parseInt(id));
  const projectInsights = insightsResult.success
    ? insightsResult.projectInsights
    : [];
  const aiInsights = insightsResult.success ? insightsResult.aiInsights : [];

  // Get meeting insights for this project
  const meetingInsightsResult = await getProjectMeetingInsights();
  const meetingInsights = meetingInsightsResult.success
    ? meetingInsightsResult.insights
    : [];

  return {
    project,
    documents: uniqueDocuments,
    projectInsights,
    aiInsights,
    meetingInsights,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProjectDetails(id);

  if (!data) {
    notFound();
  }

  const {
    project,
    documents,
    projectInsights,
    aiInsights,
    meetingInsights,
  } = data;

  // Calculate insight summary from meeting insights
  const safeInsights = meetingInsights || [];
  const insightStats = {
    total: safeInsights.length + projectInsights.length + aiInsights.length,
    risks:
      safeInsights.filter((i: Insight) => i.type === "risk").length +
      aiInsights.filter((i) => i.insight_type === "risk").length,
    actions: safeInsights.filter((i: Insight) => i.type === "action_item")
      .length,
    decisions: safeInsights.filter((i: Insight) => i.type === "decision")
      .length,
    pendingActions: safeInsights.filter(
      (i: Insight) =>
        i.type === "action_item" && (!i.status || i.status === "pending")
    ).length,
    projectInsights: projectInsights.length,
    aiInsights: aiInsights.length,
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPhaseColor = (phase: string | null) => {
    if (!phase) return "bg-gray-100 text-gray-700";
    const lowerPhase = phase.toLowerCase();
    if (lowerPhase.includes("planning")) return "bg-blue-100 text-blue-700";
    if (lowerPhase.includes("development") || lowerPhase.includes("progress"))
      return "bg-purple-100 text-purple-700";
    if (lowerPhase.includes("testing")) return "bg-orange-100 text-orange-700";
    if (lowerPhase.includes("complete") || lowerPhase.includes("done"))
      return "bg-green-100 text-green-700";
    if (lowerPhase.includes("hold") || lowerPhase.includes("pause"))
      return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status: string) => {
    if (status === "completed")
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "in-progress")
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const getRiskColor = (level: string) => {
    if (level === "high") return "text-red-600 bg-red-50";
    if (level === "medium") return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-light text-gray-900">
                {project.name || `Project ${project.id}`}
              </h1>
              {project["job number"] && (
                <p className="mt-2 text-sm text-gray-500">
                  Job #{project["job number"]}
                </p>
              )}
            </div>
            <Badge 
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full",
                getPhaseColor(project.phase)
              )}
            >
              {project.phase || "Not Started"}
            </Badge>
          </div>
          
          {project.description && (
            <p className="mt-4 text-gray-600 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Minimalist Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Revenue Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(project["est revenue"])}
            </div>
            {project["est profit"] && (
              <p className="text-sm text-gray-500 mt-2">
                <span className="text-green-600 font-medium">{formatCurrency(project["est profit"])}</span> profit
              </p>
            )}
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</span>
            </div>
            <div className="space-y-1">
              {project["start date"] && (
                <p className="text-sm">
                  <span className="text-gray-500">Start:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {format(new Date(project["start date"]), "MMM d, yyyy")}
                  </span>
                </p>
              )}
              {project["est completion"] && (
                <p className="text-sm">
                  <span className="text-gray-500">End:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {format(new Date(project["est completion"]), "MMM d, yyyy")}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {project.address || "Not specified"}
            </p>
            {project.state && (
              <p className="text-sm text-gray-500 mt-1">
                {project.state}
              </p>
            )}
          </div>

          {/* Client Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Client</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {project.clients?.name || "Direct Client"}
            </p>
            {project.clients?.status && (
              <Badge variant="outline" className="mt-2 text-xs capitalize">
                {project.clients.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Project Intelligence Summary - Modern Design */}
        {insightStats.total > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Brain className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">Project Intelligence</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {insightStats.actions}
                  </div>
                  <div className="text-sm text-gray-500">
                    Action Items
                  </div>
                  {insightStats.pendingActions > 0 && (
                    <div className="text-xs text-orange-600 mt-1 font-medium">
                      {insightStats.pendingActions} pending
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {insightStats.risks}
                  </div>
                  <div className="text-sm text-gray-500">
                    Risks
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                    <Lightbulb className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {insightStats.decisions}
                  </div>
                  <div className="text-sm text-gray-500">
                    Decisions
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {documents.length}
                  </div>
                  <div className="text-sm text-gray-500">
                    Documents
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Section - Modern Design */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">
                  Project Documents
                </h2>
                <Badge variant="secondary" className="rounded-full">
                  {documents.length}
                </Badge>
              </div>
            </div>
          </div>
          <div className="p-6">
            {documents.length > 0 ? (
              <div className="space-y-6">
                {/* Group documents by type */}
                {(() => {
                  const meetingDocs = documents.filter(doc => 
                    doc.document_type === 'meeting' || 
                    (doc.metadata && typeof doc.metadata === 'object' && 
                     'type' in doc.metadata && (doc.metadata as any).type === 'meeting')
                  );
                  const otherDocs = documents.filter(doc => 
                    doc.document_type !== 'meeting' && 
                    !(doc.metadata && typeof doc.metadata === 'object' && 
                      'type' in doc.metadata && (doc.metadata as any).type === 'meeting')
                  );

                  return (
                    <>
                      {meetingDocs.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <h3 className="text-sm font-medium text-gray-700">
                              Meeting Documents
                            </h3>
                            <Badge variant="outline" className="text-xs rounded-full">
                              {meetingDocs.length}
                            </Badge>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {meetingDocs.map((document) => (
                              <ModernDocumentCard key={document.id} document={document} />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {otherDocs.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <h3 className="text-sm font-medium text-gray-700">
                              Other Documents
                            </h3>
                            <Badge variant="outline" className="text-xs rounded-full">
                              {otherDocs.length}
                            </Badge>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {otherDocs.map((document) => (
                              <ModernDocumentCard key={document.id} document={document} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  No documents associated with this project yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modern Insights Section */}
        {(safeInsights.length > 0 || projectInsights.length > 0 || aiInsights.length > 0) && (
          <div className="space-y-6">
            <h2 className="text-xl font-light text-gray-900">Project Insights</h2>
            
            {/* AI-Generated Insights */}
            {aiInsights.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <h3 className="text-md font-medium text-gray-900">AI-Generated Insights</h3>
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {aiInsights.length}
                    </Badge>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {aiInsights.slice(0, 5).map((insight) => (
                    <div
                      key={insight.id}
                      className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {insight.insight_type && (
                              <Badge variant="outline" className="capitalize text-xs">
                                {insight.insight_type}
                              </Badge>
                            )}
                            {insight.severity && (
                              <Badge
                                className={cn(
                                  "text-xs",
                                  insight.severity === "high" && "bg-red-100 text-red-700",
                                  insight.severity === "medium" && "bg-yellow-100 text-yellow-700",
                                  insight.severity === "low" && "bg-green-100 text-green-700"
                                )}
                              >
                                {insight.severity}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-sm text-gray-900 mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {insight.description}
                          </p>
                          {insight.confidence_score && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="text-xs text-gray-500">
                                Confidence: {Math.round(insight.confidence_score * 100)}%
                              </div>
                              <div className="flex-1 max-w-[100px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                  style={{ width: `${insight.confidence_score * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modern Timeline Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-medium text-gray-900">Project Timeline</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-8 top-8 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {[
                  { date: "2024-01-15", event: "Project kickoff", status: "completed" },
                  { date: "2024-02-01", event: "Requirements finalized", status: "completed" },
                  { date: "2024-03-15", event: "Phase 1 complete", status: "completed" },
                  { date: "2024-04-30", event: "Phase 2 delivery", status: "in-progress" },
                  { date: "2024-06-01", event: "Final delivery", status: "upcoming" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white rounded-full border-2 border-gray-200">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 pt-4">
                      <p className="font-medium text-gray-900">{item.event}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(item.date), "MMMM d, yyyy")}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize text-xs",
                        item.status === "completed" && "bg-green-50 text-green-700 border-green-200",
                        item.status === "in-progress" && "bg-blue-50 text-blue-700 border-blue-200",
                        item.status === "upcoming" && "bg-gray-50 text-gray-700 border-gray-200"
                      )}
                    >
                      {item.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}