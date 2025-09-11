"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Activity,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Loader2,
  RefreshCw,
  Server,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface WorkerStats {
  meetings: {
    total: number;
    withChunks: number;
    withEmbeddings: number;
    withInsights: number;
    lastProcessed: string | null;
    recentlyProcessed: number;
  };
  insights: {
    total: number;
    byType: Record<string, number>;
    lastGenerated: string | null;
    withProjects: number;
    withoutProjects: number;
  };
  projects: {
    total: number;
    withMeetings: number;
    active: number;
  };
  processing: {
    vectorizationQueue: number;
    insightQueue: number;
    lastRun: string | null;
    averageProcessingTime: number;
  };
}

interface ActionResult {
  success: boolean;
  message: string;
  details?: unknown;
  timestamp: string;
}

export default function RAGDashboard() {
  const supabase = createClientComponentClient();
  const [stats, setStats] = useState<WorkerStats | null>(null);
  const [loading] = useState($2);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<ActionResult[]>([]);
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [workerHealth, setWorkerHealth] = useState<
    "healthy" | "degraded" | "offline"
  >("offline");
  const [autoRefresh] = useState($2);
  // Worker URL - update this based on environment
  const WORKER_URL =
    process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:57097";

  // Fetch stats from database
  const fetchStats = useCallback(async () => {
    try {
      // Get meeting stats
      const { data: meetings, error: meetingsError } = await supabase
        .from("meetings")
        .select("id, created_at, project_id");

      const { data: chunks } = await supabase
        .from("meeting_chunks")
        .select("meeting_id");

      const { data: embeddings } = await supabase
        .from("meeting_embeddings")
        .select("meeting_id");

      const { data: insights } = await supabase.from("ai_insights").select("*");

      const { data: projects } = await supabase.from("projects").select("*");

      // Calculate stats
      const uniqueChunkMeetings = new Set(
        chunks?.map((c) => c.meeting_id) || []
      );
      const uniqueEmbeddingMeetings = new Set(
        embeddings?.map((e) => e.meeting_id) || []
      );
      const uniqueInsightMeetings = new Set(
        insights?.map((i) => i.meeting_id) || []
      );

      // Count insights by type
      const insightsByType: Record<string, number> = {};
      insights?.forEach((insight) => {
        insightsByType[insight.insight_type] =
          (insightsByType[insight.insight_type] || 0) + 1;
      });

      // Recent processing (last 24 hours)
      const oneDayAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const recentMeetings =
        meetings?.filter((m) => m.created_at > oneDayAgo).length || 0;
      const recentInsights =
        insights?.filter((i) => i.created_at > oneDayAgo) || [];

      const newStats: WorkerStats = {
        meetings: {
          total: meetings?.length || 0,
          withChunks: uniqueChunkMeetings.size,
          withEmbeddings: uniqueEmbeddingMeetings.size,
          withInsights: uniqueInsightMeetings.size,
          lastProcessed: meetings?.[0]?.created_at || null,
          recentlyProcessed: recentMeetings,
        },
        insights: {
          total: insights?.length || 0,
          byType: insightsByType,
          lastGenerated: recentInsights[0]?.created_at || null,
          withProjects: insights?.filter((i) => i.project_id).length || 0,
          withoutProjects: insights?.filter((i) => !i.project_id).length || 0,
        },
        projects: {
          total: projects?.length || 0,
          withMeetings:
            projects?.filter((p) =>
              meetings?.some((m) => m.project_id === p.id)
            ).length || 0,
          active: projects?.filter((p) => p.state === "active").length || 0,
        },
        processing: {
          vectorizationQueue:
            meetings?.filter((m) => !uniqueEmbeddingMeetings.has(m.id))
              .length || 0,
          insightQueue:
            meetings?.filter((m) => !uniqueInsightMeetings.has(m.id)).length ||
            0,
          lastRun: null,
          averageProcessingTime: 0,
        },
      };

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Check worker health
  const checkWorkerHealth = useCallback(async () => {
    try {
      const response = await fetch(`${WORKER_URL}/health`);
      if (response.ok) {
        setWorkerHealth("healthy");
      } else {
        setWorkerHealth("degraded");
      }
    } catch (error) {
      setWorkerHealth("offline");
    }
  }, [WORKER_URL]);

  // Trigger worker actions
  const triggerAction = async (action: string, meetingId?: string) => {
    setProcessing((prev) => ({ ...prev, [action]: true }));

    const result: ActionResult = {
      success: false,
      message: "",
      timestamp: new Date().toISOString(),
    };

    try {
      const endpoint = "";
      const method = "POST";
      let body: unknown = {};

      switch (action) {
        case "vectorize-all":
          endpoint = "/vectorize/batch";
          const { data: meetingsToVectorize } = await supabase
            .from("meetings")
            .select("id")
            .is("project_id", null);
          body = { meetingIds: meetingsToVectorize?.map((m) => m.id) || [] };
          break;

        case "vectorize-single":
          endpoint = `/vectorize/meeting/${meetingId}`;
          break;

        case "insights-all":
          endpoint = "/insights/batch";
          const { data: meetingsForInsights } = await supabase
            .from("meetings")
            .select("id");
          body = { meetingIds: meetingsForInsights?.map((m) => m.id) || [] };
          break;

        case "insights-single":
          endpoint = `/insights/meeting/${meetingId}`;
          body = { auto_assign_project: true };
          break;

        case "assign-projects":
          const { data: unassignedMeetings } = await supabase
            .from("meetings")
            .select("id")
            .is("project_id", null);

          const assigned = 0;
          for (const meeting of unassignedMeetings || []) {
            const response = await fetch(
              `${WORKER_URL}/project/assign/${meeting.id}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              }
            );
            if (response.ok) {
              const data = await response.json();
              if (data.projectId) assigned++;
            }
          }
          result.success = true;
          result.message = `Assigned ${assigned} meetings to projects`;
          result.details = { assigned, total: unassignedMeetings?.length || 0 };
          break;

        case "health-check":
          endpoint = "/health";
          method = "GET";
          break;

        case "process-recent":
          // Process meetings from last 7 days
          const sevenDaysAgo = new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString();
          const { data: recentMeetings } = await supabase
            .from("meetings")
            .select("id")
            .gt("created_at", sevenDaysAgo);

          const processed = 0;
          for (const meeting of recentMeetings || []) {
            // Assign project
            const assignResponse = await fetch(
              `${WORKER_URL}/project/assign/${meeting.id}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              }
            );

            // Generate insights
            const insightResponse = await fetch(
              `${WORKER_URL}/insights/meeting/${meeting.id}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              }
            );

            if (insightResponse.ok) processed++;
          }
          result.success = true;
          result.message = `Processed ${processed} recent meetings`;
          result.details = { processed, total: recentMeetings?.length || 0 };
          break;
      }

      if (endpoint && !result.success) {
        const response = await fetch(`${WORKER_URL}${endpoint}`, {
          method,
          headers:
            method === "POST"
              ? { "Content-Type": "application/json" }
              : undefined,
          body: method === "POST" ? JSON.stringify(body) : undefined,
        });

        result.success = response.ok;
        const data = response.ok
          ? await response.json()
          : await response.text();
        result.message = response.ok
          ? `Successfully triggered ${action}`
          : `Failed: ${data}`;
        result.details = data;
      }
    } catch (error) {
      result.success = false;
      result.message = `Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }

    setProcessing((prev) => ({ ...prev, [action]: false }));
    setResults((prev) => [result, ...prev].slice(0, 10));

    // Refresh stats after action
    setTimeout(fetchStats, 2000);

    return result;
  };

  // Auto refresh
  useEffect(() => {
    fetchStats();
    checkWorkerHealth();

    const interval = autoRefresh
      ? setInterval(() => {
          fetchStats();
          checkWorkerHealth();
        }, 10000)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchStats, checkWorkerHealth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Todays Stats</h1>
          <p className="text-muted-foreground">
            Monitor and control the Project Management RAG system
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={
              workerHealth === "healthy"
                ? "default"
                : workerHealth === "degraded"
                ? "secondary"
                : "destructive"
            }
          >
            <Server className="h-3 w-3 mr-1" />
            Worker: {workerHealth}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            {autoRefresh ? "Auto-refreshing" : "Auto-refresh off"}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Todays Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.meetings.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.meetings.recentlyProcessed || 0} in last 24h
            </p>
            <Progress
              value={
                ((stats?.meetings.withInsights || 0) /
                  (stats?.meetings.total || 1)) *
                100
              }
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.meetings.withInsights || 0} with insights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.insights.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.insights.withProjects || 0} mapped to projects
            </p>
            <div className="mt-2 space-y-1">
              {Object.entries(stats?.insights.byType || {})
                .slice(0, 3)
                .map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="capitalize">{type}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.projects.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.projects.withMeetings || 0} with meetings
            </p>
            <Progress
              value={
                ((stats?.projects.withMeetings || 0) /
                  (stats?.projects.total || 1)) *
                100
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Processing Queue
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.processing.vectorizationQueue || 0) +
                (stats?.processing.insightQueue || 0)}
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Need Vectorization:</span>
                <span className="font-medium">
                  {stats?.processing.vectorizationQueue || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Need Insights:</span>
                <span className="font-medium">
                  {stats?.processing.insightQueue || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panels */}
      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="actions">Insights</TabsTrigger>
          <TabsTrigger value="batch">Meetings</TabsTrigger>
          <TabsTrigger value="results">Chat</TabsTrigger>
          <TabsTrigger value="analytics">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Health Check</CardTitle>
                <CardDescription>Verify worker is responding</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => triggerAction("health-check")}
                  disabled={processing["health-check"]}
                >
                  {processing["health-check"] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  Check Health
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Process Recent Meetings
                </CardTitle>
                <CardDescription>
                  Process meetings from last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => triggerAction("process-recent")}
                  disabled={processing["process-recent"]}
                >
                  {processing["process-recent"] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Process Recent
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assign Projects</CardTitle>
                <CardDescription>
                  Match unassigned meetings to projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => triggerAction("assign-projects")}
                  disabled={processing["assign-projects"]}
                >
                  {processing["assign-projects"] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Assign Projects
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Vectorization</CardTitle>
                <CardDescription>
                  Generate embeddings for meeting chunks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Meetings without embeddings:</span>
                    <Badge variant="outline">
                      {stats?.processing.vectorizationQueue || 0}
                    </Badge>
                  </div>
                  <Progress
                    value={
                      ((stats?.meetings.withEmbeddings || 0) /
                        (stats?.meetings.total || 1)) *
                      100
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => triggerAction("vectorize-all")}
                  disabled={
                    processing["vectorize-all"] ||
                    stats?.processing.vectorizationQueue === 0
                  }
                >
                  {processing["vectorize-all"] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Vectorize All Pending
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insight Generation</CardTitle>
                <CardDescription>
                  Extract insights from meetings using GPT-5
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Meetings without insights:</span>
                    <Badge variant="outline">
                      {stats?.processing.insightQueue || 0}
                    </Badge>
                  </div>
                  <Progress
                    value={
                      ((stats?.meetings.withInsights || 0) /
                        (stats?.meetings.total || 1)) *
                      100
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => triggerAction("insights-all")}
                  disabled={
                    processing["insights-all"] ||
                    stats?.processing.insightQueue === 0
                  }
                >
                  {processing["insights-all"] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate All Insights
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Actions</CardTitle>
              <CardDescription>Last 10 worker operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No actions triggered yet
                  </p>
                ) : (
                  results.map((result, index) => (
                    <Alert
                      key={index}
                      variant={result.success ? "default" : "destructive"}
                    >
                      <div className="flex items-start gap-2">
                        {result.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div className="flex-1">
                          <AlertDescription className="text-sm">
                            {result.message}
                          </AlertDescription>
                          {result.details && (
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Processing Metrics</CardTitle>
                <CardDescription>System performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Vectorization Coverage</span>
                      <span className="text-sm font-medium">
                        {Math.round(
                          ((stats?.meetings.withEmbeddings || 0) /
                            (stats?.meetings.total || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        ((stats?.meetings.withEmbeddings || 0) /
                          (stats?.meetings.total || 1)) *
                        100
                      }
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Insight Coverage</span>
                      <span className="text-sm font-medium">
                        {Math.round(
                          ((stats?.meetings.withInsights || 0) /
                            (stats?.meetings.total || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        ((stats?.meetings.withInsights || 0) /
                          (stats?.meetings.total || 1)) *
                        100
                      }
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Project Assignment</span>
                      <span className="text-sm font-medium">
                        {Math.round(
                          ((stats?.insights.withProjects || 0) /
                            (stats?.insights.total || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        ((stats?.insights.withProjects || 0) /
                          (stats?.insights.total || 1)) *
                        100
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insight Distribution</CardTitle>
                <CardDescription>Breakdown by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats?.insights.byType || {}).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{count}</span>
                          <Progress
                            value={(count / (stats?.insights.total || 1)) * 100}
                            className="w-20"
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Meeting:</span>
              <span className="font-medium">
                {stats?.meetings.lastProcessed
                  ? new Date(stats.meetings.lastProcessed).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Insight:</span>
              <span className="font-medium">
                {stats?.insights.lastGenerated
                  ? new Date(stats.insights.lastGenerated).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">24h Activity:</span>
              <span className="font-medium">
                {stats?.meetings.recentlyProcessed || 0} meetings
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
