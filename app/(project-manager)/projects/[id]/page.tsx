import { getProjectMeetingInsights } from "@/app/actions/meeting-insights-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectInsights } from "@/lib/actions/project-documents-actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";
import { createServerClient } from "@supabase/ssr";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DocumentsTable } from "./DocumentsTable";

export const dynamic = "force-dynamic";

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

  // Get documents for this project - documents table HAS a project_id column!
  const { data: projectDocuments } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", parseInt(id))
    .order("date", { ascending: false });

  // Use the documents directly - no transformation needed
  const uniqueDocuments = projectDocuments || [];

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

  const { project, documents, projectInsights, aiInsights, meetingInsights } =
    data;

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

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
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
    <div className="min-h-screen">
      {/* Modern Header Section */}
      <div>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl pb-4 font-medium text-gray-900">
                {project.name || `Project ${project.id}`}
              </h1>
              <h4 className="text-sm text-gray-600">
                Client:{" "}
                <span className="font-medium text-gray-900">
                  {project.client ||
                    project.clients?.name ||
                    "No client assigned"}
                </span>
              </h4>
              {project["job number"] && (
                <p className="mt-1 text-sm text-gray-600">
                  Job Number:{" "}
                  <span className="font-medium text-gray-900">
                    {project["job number"]}
                  </span>
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

          {/* Two Column Layout for Summary and Details - Even Width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-6">
            {/* Summary Column - 50% width */}
            <div>
              {project.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Project Summary
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}
            </div>

            {/* Details Column - 50% width */}
            <div className="bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Project Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Start Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(project["start date"])}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Est Revenue:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(project["est revenue"])}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Est Profit:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(project["est profit"])}
                  </span>
                </div>
                {project["est completion date"] && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      Est Completion:
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(project["est completion date"])}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Summary and Details - Even Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-6">
        {/* Summary Column - 50% width */}
        <div>
          {/* Activity Feed */}
          <Card className="lg:col-span-4 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold tracking-[0.1em] uppercase">
                Project Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h6>Meeting Name: Sep 5, 2025</h6>
              <div className="pt-4 space-y-4 max-h-80 overflow-y-auto">
                {[
                  {
                    time: "25/06/2025 09:29",
                    user: "Sarah Chen",
                    action: "completed project milestone in",
                    location: "Berlin Office",
                    target: null,
                  },
                  {
                    time: "25/06/2025 08:12",
                    user: "Marcus Rivera",
                    action: "delivered client presentation in",
                    location: "Cairo Branch",
                    target: null,
                  },
                  {
                    time: "24/06/2025 22:55",
                    user: "Elena Volkov",
                    action: "lost connection during meeting in",
                    location: "Havana Office",
                    target: null,
                  },
                  {
                    time: "24/06/2025 21:33",
                    user: "James Park",
                    action: "initiated research project in",
                    location: "Tokyo Hub",
                    target: null,
                  },
                  {
                    time: "24/06/2025 19:45",
                    user: "Alex Thompson",
                    action: "updated security protocols in",
                    location: "Moscow Center",
                    target: "Data Systems",
                  },
                ].map((log, index) => (
                  <div
                    key={index}
                    className="border-l-2 border-amber-400/50 pl-4 p-3 rounded-r-lg transition-all duration-200"
                  >
                    <div className="text-xs mb-1">{log.time}</div>
                    <div className="text-sm leading-relaxed">
                      <span className="text-brand font-medium">{log.user}</span>{" "}
                      {log.action} <span>{log.location}</span>
                      {log.target && (
                        <span>
                          {" "}
                          with{" "}
                          <span className="text-amber-400 font-medium">
                            {log.target}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Column - 50% width */}
        <div className="p-2">
          <div className="mx-auto sm:px-2 lg:px-2 py-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg text-gray-900">Meetings</h2>
              <Badge variant="secondary" className="rounded-full">
                {documents.length}
              </Badge>
            </div>
            <div className="p-6">
              <DocumentsTable documents={documents} projectId={parseInt(id)} />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Insights Section */}
      {(safeInsights.length > 0 ||
        projectInsights.length > 0 ||
        aiInsights.length > 0) && (
        <div className="space-y-6">
          {/* AI-Generated Insights */}
          {aiInsights.length > 0 && (
            <div>
              <div className="px-6 py-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-medium text-gray-900">
                    Project Insights
                  </h3>
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
                    {/* First Row: Title, Type, and Priority */}
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900">
                        {insight.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {insight.insight_type && (
                          <Badge
                            variant="outline"
                            className="capitalize text-xs"
                          >
                            {insight.insight_type}
                          </Badge>
                        )}
                        {insight.severity && (
                          <Badge
                            className={cn(
                              "text-xs",
                              insight.severity === "high" &&
                                "bg-red-100 text-red-700",
                              insight.severity === "medium" &&
                                "bg-yellow-100 text-yellow-700",
                              insight.severity === "low" &&
                                "bg-green-100 text-green-700"
                            )}
                          >
                            {insight.severity}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Second Row: Summary/Description */}
                    <p className="text-sm text-gray-600">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
