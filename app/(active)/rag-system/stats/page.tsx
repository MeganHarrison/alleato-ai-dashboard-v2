// RAG System Statistics Dashboard

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Database,
  HardDrive,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { SystemStats } from "@/lib/rag/types";
import { format } from "date-fns";

export default function RagStatsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/rag/stats");
      if (!response.ok) throw new Error("Failed to fetch statistics");

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive">
                {error || "No statistics available"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const documentCompletionRate =
    stats.documents.total > 0
      ? ((stats.documents.completed / stats.documents.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="px-4 py-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Document Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documents.total}</div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-green-600">
                  {stats.documents.completed}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing</span>
                <span className="font-medium text-yellow-600">
                  {stats.documents.processing}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Failed</span>
                <span className="font-medium text-red-600">
                  {stats.documents.failed}
                </span>
              </div>
            </div>
            <Progress
              value={parseFloat(documentCompletionRate)}
              className="mt-4"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {documentCompletionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        {/* Vector Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vector Database
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.vectors.total_chunks}
            </div>
            <p className="text-xs text-muted-foreground">
              Total chunks indexed
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Embeddings</span>
                <span className="font-medium">
                  {stats.vectors.total_embeddings}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dimensions</span>
                <Badge variant="secondary">
                  {stats.vectors.embedding_dimension}D
                </Badge>
              </div>
            </div>
            {stats.vectors.last_processed && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Last processed:{" "}
                    {format(
                      new Date(stats.vectors.last_processed),
                      "MMM d, h:mm a"
                    )}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                stats.storage.total_size_mb ||
                stats.storage.documents_size_mb + stats.storage.vectors_size_mb
              ).toFixed(1)}{" "}
              MB
            </div>
            <p className="text-xs text-muted-foreground">Total storage used</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Documents</span>
                <span className="font-medium">
                  {stats.storage.documents_size_mb.toFixed(1)} MB
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vectors</span>
                <span className="font-medium">
                  {stats.storage.vectors_size_mb.toFixed(1)} MB
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex gap-1 h-2">
                <div
                  className="bg-blue-500 rounded-l"
                  style={{
                    width: `${
                      (stats.storage.documents_size_mb /
                        (stats.storage.documents_size_mb +
                          stats.storage.vectors_size_mb)) *
                      100
                    }%`,
                  }}
                />
                <div className="bg-purple-500 rounded-r flex-1" />
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded" />
                  <span className="text-xs">Docs</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded" />
                  <span className="text-xs">Vectors</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Metrics</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.usage.queries_today}
            </div>
            <p className="text-xs text-muted-foreground">Queries today</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">This month</span>
                <span className="font-medium">
                  {stats.usage.queries_this_month}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg response</span>
                <Badge variant="secondary">
                  {stats.usage.avg_response_time_ms}ms
                </Badge>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                {stats.usage.avg_response_time_ms < 500 ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      Excellent performance
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">
                      Normal performance
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Overall RAG system status and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Document Processing</span>
                </div>
                <Badge variant="default">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Vector Search</span>
                </div>
                <Badge variant="default">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Chat API</span>
                </div>
                <Badge variant="default">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stats.storage.total_size_mb > 1000 ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span>Storage Capacity</span>
                </div>
                <Badge
                  variant={
                    stats.storage.total_size_mb > 1000 ? "secondary" : "default"
                  }
                >
                  {stats.storage.total_size_mb > 1000 ? "High Usage" : "Normal"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Document Processing Rate
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {documentCompletionRate}%
                  </span>
                </div>
                <Progress value={parseFloat(documentCompletionRate)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Query Volume</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.min(
                      100,
                      (stats.usage.queries_today / 100) * 100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (stats.usage.queries_today / 100) * 100)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Response Speed</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.max(
                      0,
                      100 - stats.usage.avg_response_time_ms / 10
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <Progress
                  value={Math.max(
                    0,
                    100 - stats.usage.avg_response_time_ms / 10
                  )}
                  className={
                    stats.usage.avg_response_time_ms < 500
                      ? ""
                      : "bg-yellow-100"
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
