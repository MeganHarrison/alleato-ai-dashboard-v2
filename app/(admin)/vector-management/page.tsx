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
import {
  AlertCircle,
  CheckCircle,
  Database,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Document {
  id: string;
  title: string;
  document_type: string;
  project_name: string;
  content_length: number;
  chunk_count: number;
  status:
    | "unprocessed"
    | "completed"
    | "partially_embedded"
    | "insufficient_content";
  created_at: string;
}

interface VectorizationStats {
  total_documents: number;
  documents_with_content: number;
  documents_processed: number;
  documents_unprocessed: number;
  total_chunks: number;
  chunks_with_embeddings: number;
  processing_percentage: number;
}

interface VectorizationResult {
  success: boolean;
  documentsFound: number;
  documentsProcessed: number;
  successes: number;
  failures: number;
  results: Array<{
    documentId: string;
    title: string;
    success: boolean;
    chunksCreated?: number;
    error?: string;
  }>;
}

export default function VectorizationDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<VectorizationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<VectorizationResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load vectorization status
      const statusResponse = await fetch("/api/vectorization/status");
      if (!statusResponse.ok) throw new Error("Failed to load status");

      const statusData = await statusResponse.json();
      setDocuments(statusData.documents || []);
      setStats(statusData.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const triggerVectorization = async (documentId?: string, dryRun = false) => {
    setProcessing(true);
    setError(null);
    setLastResult(null);

    try {
      const response = await fetch("/api/vectorize/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          dryRun,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: VectorizationResult = await response.json();
      setLastResult(result);

      if (!dryRun && result.success) {
        // Reload data to show updated status
        await loadData();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to trigger vectorization"
      );
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "unprocessed":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "partially_embedded":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "insufficient_content":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      unprocessed: "bg-yellow-100 text-yellow-800",
      partially_embedded: "bg-orange-100 text-orange-800",
      insufficient_content: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge
        variant="secondary"
        className={
          variants[status as keyof typeof variants] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vectorization Management</h1>
          <p className="text-gray-600 mt-1">
            Manage document embeddings and vector search setup
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => loadData()}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Documents
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_documents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.documents_with_content} with content
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.documents_processed}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.processing_percentage?.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unprocessed</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.documents_unprocessed}
              </div>
              <p className="text-xs text-muted-foreground">
                Need vectorization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Chunks
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_chunks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.chunks_with_embeddings} with embeddings
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Vectorization Actions</CardTitle>
          <CardDescription>
            Trigger embedding generation for unprocessed documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => triggerVectorization(undefined, true)}
              disabled={processing}
              variant="outline"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Preview (Dry Run)
            </Button>

            <Button
              onClick={() => triggerVectorization()}
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Process All Unprocessed
            </Button>
          </div>

          {lastResult && (
            <Alert
              className={
                lastResult.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">
                    Processing Result:{" "}
                    {lastResult.success ? "Success" : "Failed"}
                  </div>
                  <div className="text-sm">
                    Found: {lastResult.documentsFound} documents | Processed:{" "}
                    {lastResult.documentsProcessed} | Successes:{" "}
                    {lastResult.successes} | Failures: {lastResult.failures}
                  </div>
                  {lastResult.failures > 0 && (
                    <div className="text-sm text-red-600">
                      Failed documents:
                      <ul className="mt-1 ml-4">
                        {lastResult.results
                          .filter((r) => !r.success)
                          .map((r) => (
                            <li key={r.documentId}>
                              {r.title}: {r.error}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Document Status</CardTitle>
          <CardDescription>
            Current vectorization status for all documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents found
            </div>
          ) : (
            <div className="space-y-2">
              {documents.slice(0, 20).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getStatusIcon(doc.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="text-sm text-gray-500">
                        {doc.project_name && (
                          <span className="mr-3">{doc.project_name}</span>
                        )}
                        <span className="mr-3">{doc.document_type}</span>
                        <span>
                          {(doc.content_length / 1000).toFixed(1)}k chars
                        </span>
                        {doc.chunk_count > 0 && (
                          <span className="ml-3">{doc.chunk_count} chunks</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(doc.status)}
                    {doc.status === "unprocessed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerVectorization(doc.id)}
                        disabled={processing}
                      >
                        Process
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {documents.length > 20 && (
                <div className="text-center py-4 text-gray-500">
                  Showing first 20 documents of {documents.length} total
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
