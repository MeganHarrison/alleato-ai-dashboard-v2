"use client"

import { ReactElement, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Download, Upload, Zap, Brain, RefreshCw, CheckCircle, AlertCircle, Loader2, Clock, Users } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface ProcessingStatus {
  type: "idle" | "loading" | "success" | "error"
  message?: string
  details?: unknown
}

interface DocumentStatus {
  id: string
  title: string
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  processed_at?: string
  error?: string
}

interface RecentTranscript {
  id: string
  title: string | null
  date: string
  duration_minutes: number | null
  participants: string[] | null
  fireflies_id: string | null
  created_at: string | null
  processed_at: string | null
}

export default function RAGVectorizationAdmin(): ReactElement {
  const { toast } = useToast()
  const [firefliesStatus, setFirefliesStatus] = useState<ProcessingStatus>({ type: "idle" })
  const [vectorizeStatus, setVectorizeStatus] = useState<ProcessingStatus>({ type: "idle" })
  const [insightsStatus, setInsightsStatus] = useState<ProcessingStatus>({ type: "idle" })
  const [manualUploadStatus, setManualUploadStatus] = useState<ProcessingStatus>({ type: "idle" })
  const [pendingDocuments, setPendingDocuments] = useState<DocumentStatus[]>([])
  const [syncedTranscripts, setSyncedTranscripts] = useState<number>(0)
  const [selectedDateRange, setSelectedDateRange] = useState({ start: "", end: "" })
  const [manualText, setManualText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [recentTranscripts, setRecentTranscripts] = useState<RecentTranscript[]>([])

  // Load initial data on mount
  useEffect(() => {
    fetchSyncStatus()
    fetchRecentTranscripts()
    fetchPendingDocuments()
  }, [])

  // Fetch sync status
  const fetchSyncStatus = async (): Promise<void> => {
    try {
      const response = await fetch("/api/fireflies/auto-sync")
      const data = await response.json()
      if (response.ok && data.success) {
        setLastSyncTime(data.lastSync)
      }
    } catch (error) {
      console.error("Failed to fetch sync status:", error)
    }
  }

  // Fetch recent transcripts
  const fetchRecentTranscripts = async (): Promise<void> => {
    try {
      const response = await fetch("/api/documents/recent?limit=10")
      const data = await response.json()
      if (response.ok && data.success) {
        setRecentTranscripts(data.documents || [])
      }
    } catch (error) {
      console.error("Failed to fetch recent transcripts:", error)
    }
  }

  // Sync Fireflies transcripts
  const handleFirefliesSync = async (): Promise<void> => {
    setFirefliesStatus({ type: "loading", message: "Connecting to Fireflies API..." })
    
    try {
      // Call the Cloudflare Worker directly
      const response = await fetch("https://worker-alleato-fireflies-rag.megan-d14.workers.dev/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: selectedDateRange.start || selectedDateRange.end ? 50 : 10
        })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to sync transcripts")
      }

      const syncedCount = data.processed || 0
      const failedCount = data.failed || 0
      
      setSyncedTranscripts(syncedCount)
      
      // Build detailed message with meeting titles if available
      let message = `Successfully synced ${syncedCount} transcript${syncedCount !== 1 ? 's' : ''}`
      if (failedCount > 0) {
        message += ` (${failedCount} failed)`
      }
      
      // Show errors if any
      const details = { ...data }
      if (data.errors && data.errors.length > 0) {
        details.failedTranscripts = data.errors.map((e: unknown) => ({
          id: (e as {transcript_id: string}).transcript_id,
          error: (e as {error: string}).error
        }))
      }
      
      setFirefliesStatus({
        type: syncedCount > 0 ? "success" : failedCount > 0 ? "error" : "success",
        message: message,
        details: details
      })
      
      // Show toast notification with details
      if (syncedCount > 0) {
        toast({
          title: "✅ Fireflies Sync Complete",
          description: (
            <div className="space-y-2">
              <p>{message}</p>
              <p className="text-sm text-muted-foreground">
                The transcripts have been saved to the documents table with summaries, action items, and bullet points.
              </p>
            </div>
          ),
          duration: 5000,
        })
      } else if (failedCount > 0) {
        toast({
          title: "⚠️ Sync Completed with Errors",
          description: `Failed to sync ${failedCount} transcript${failedCount !== 1 ? 's' : ''}. Check the details for more information.`,
          variant: "destructive",
          duration: 5000,
        })
      }
      
      
      // Refresh sync status and recent transcripts after a short delay
      setTimeout(() => {
        fetchSyncStatus()
        fetchRecentTranscripts()
      }, 1000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sync transcripts"
      setFirefliesStatus({
        type: "error",
        message: errorMessage
      })
      
      toast({
        title: "❌ Fireflies Sync Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  // Get pending documents
  const fetchPendingDocuments = async (): Promise<void> => {
    try {
      const response = await fetch("/api/documents/pending")
      const data = await response.json()
      
      if (response.ok) {
        setPendingDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("Failed to fetch pending documents:", error)
    }
  }

  // Trigger vectorization for pending documents
  const handleVectorization = async (): Promise<void> => {
    setVectorizeStatus({ type: "loading", message: "Starting vectorization process..." })
    
    try {
      await fetchPendingDocuments()
      
      const response = await fetch("/api/vectorize/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: pendingDocuments.map(d => d.id)
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Vectorization failed")
      }

      setVectorizeStatus({
        type: "success",
        message: `Vectorization started for ${data.documentsQueued} documents`,
        details: data
      })
      
      // Refresh pending documents
      setTimeout(fetchPendingDocuments, 2000)
    } catch (error) {
      setVectorizeStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to start vectorization"
      })
    }
  }

  // Generate insights from vectorized documents
  const handleInsightsGeneration = async (): Promise<void> => {
    setInsightsStatus({ type: "loading", message: "Fetching recent documents for insights..." })
    
    try {
      // First, get recent documents to generate insights from
      const documentsResponse = await fetch("/api/documents/recent?limit=10")
      if (!documentsResponse.ok) {
        throw new Error("Failed to fetch recent documents")
      }
      
      const documentsData = await documentsResponse.json()
      const documentIds = documentsData.documents?.map((doc: unknown) => (doc as {id: string}).id) || []
      
      if (documentIds.length === 0) {
        throw new Error("No recent documents found to generate insights from")
      }

      setInsightsStatus({ type: "loading", message: "Generating AI insights..." })

      const response = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: documentIds
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate insights")
      }

      setInsightsStatus({
        type: "success",
        message: `Generated insights for ${documentIds.length} documents`,
        details: data
      })
    } catch (error) {
      setInsightsStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to generate insights"
      })
    }
  }

  // Manual document upload
  const handleManualUpload = async (): Promise<void> => {
    if (!manualText && !selectedFile) {
      setManualUploadStatus({
        type: "error",
        message: "Please provide text or select a file to upload"
      })
      return
    }

    setManualUploadStatus({ type: "loading", message: "Uploading document..." })
    
    try {
      const formData = new FormData()
      
      if (selectedFile) {
        formData.append("file", selectedFile)
        formData.append("title", selectedFile.name)
      } else {
        formData.append("text", manualText)
        formData.append("title", "Manual Document Upload")
      }
      
      formData.append("date", new Date().toISOString())

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setManualUploadStatus({
        type: "success",
        message: "Document uploaded successfully",
        details: data
      })
      
      // Clear form
      setManualText("")
      setSelectedFile(null)
      
      // Refresh pending documents
      fetchPendingDocuments()
    } catch (error) {
      setManualUploadStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to upload document"
      })
    }
  }

  const getStatusIcon = (status: ProcessingStatus["type"]): ReactElement => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">RAG Vectorization Admin</h1>
        <p className="text-muted-foreground">
          Manage document ingestion, vectorization, and AI insights generation
        </p>
      </div>

      <Tabs defaultValue="fireflies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fireflies">
            <Download className="mr-2 h-4 w-4" />
            Fireflies Sync
          </TabsTrigger>
          <TabsTrigger value="vectorize">
            <Zap className="mr-2 h-4 w-4" />
            Vectorization
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="mr-2 h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Upload className="mr-2 h-4 w-4" />
            Manual Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fireflies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Fireflies Transcripts</CardTitle>
              <CardDescription>
                Download and process meeting transcripts from Fireflies.ai
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date (Optional)</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={selectedDateRange.start}
                    onChange={(e) => setSelectedDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date (Optional)</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={selectedDateRange.end}
                    onChange={(e) => setSelectedDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>

              <Button
                onClick={handleFirefliesSync}
                disabled={firefliesStatus.type === "loading"}
                className="w-full"
              >
                {firefliesStatus.type === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing Fireflies...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Fireflies Transcripts (Manual)
                  </>
                )}
              </Button>

              {firefliesStatus.type !== "idle" && (
                <Alert>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(firefliesStatus.type)}
                    <AlertDescription>{firefliesStatus.message}</AlertDescription>
                  </div>
                </Alert>
              )}

              {syncedTranscripts > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Transcripts Synced</p>
                  <p className="text-2xl font-bold">{syncedTranscripts}</p>
                </div>
              )}

              {/* Last Sync Time */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Last Sync</p>
                  <p className="text-xs text-blue-700">
                    {lastSyncTime 
                      ? `${formatDistanceToNow(new Date(lastSyncTime))} ago (${format(new Date(lastSyncTime), "MMM d, yyyy h:mm a")})`
                      : "No automatic sync has been run yet"
                    }
                  </p>
                </div>
              </div>

              {/* Recent Transcripts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Recent Transcripts</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchRecentTranscripts}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {recentTranscripts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No recent transcripts found
                    </p>
                  ) : (
                    recentTranscripts.map((transcript) => (
                      <div
                        key={transcript.id}
                        className="flex items-start justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {transcript.title || `Meeting from ${format(new Date(transcript.date), "MMM d, yyyy")}`}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {transcript.duration_minutes ? `${transcript.duration_minutes}m` : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {transcript.participants ? transcript.participants.length : 0} participants
                            </span>
                            <span>
                              {format(new Date(transcript.date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={transcript.processed_at ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {transcript.processed_at ? "Processed" : "Pending"}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">What gets exported:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Meeting metadata (title, date, duration, participants)</li>
                    <li>• AI-generated summaries and keywords</li>
                    <li>• Action items and key discussion points</li>
                    <li>• Full transcript with speaker identification</li>
                    <li>• Meeting outline and chapter breakdowns</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/30">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Automatic Sync (Every 30 minutes)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Set up automatic Fireflies sync to run every 30 minutes:
                  </p>
                  <div className="bg-black text-green-400 p-2 rounded text-xs font-mono">
                    # Option 1: Run as daemon<br />
                    pnpm run auto-sync:daemon<br /><br />
                    # Option 2: Set up cron job<br />
                    */30 * * * * cd /path/to/project && pnpm run auto-sync:fireflies
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vectorize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Vectorization</CardTitle>
              <CardDescription>
                Process documents and generate vector embeddings for RAG
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Pending Documents</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchPendingDocuments}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {pendingDocuments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No pending documents
                    </p>
                  ) : (
                    pendingDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Created {format(new Date(doc.created_at), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                        <Badge
                          variant={
                            doc.status === "completed" ? "default" :
                            doc.status === "processing" ? "secondary" :
                            doc.status === "failed" ? "destructive" :
                            "outline"
                          }
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Button
                onClick={handleVectorization}
                disabled={vectorizeStatus.type === "loading" || pendingDocuments.length === 0}
                className="w-full"
              >
                {vectorizeStatus.type === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Vectorization
                  </>
                )}
              </Button>

              {vectorizeStatus.type !== "idle" && (
                <Alert>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(vectorizeStatus.type)}
                    <AlertDescription>{vectorizeStatus.message}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Vectorization Process:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Documents are chunked into semantic segments</li>
                  <li>• Each chunk is embedded using OpenAI text-embedding-3-large</li>
                  <li>• Vectors are stored in Supabase with pgvector</li>
                  <li>• Enables semantic search and RAG capabilities</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights Generation</CardTitle>
              <CardDescription>
                Generate intelligent insights from vectorized documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Select defaultValue="meeting">
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting Transcripts</SelectItem>
                    <SelectItem value="document">General Documents</SelectItem>
                    <SelectItem value="all">All Types</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleInsightsGeneration}
                  disabled={insightsStatus.type === "loading"}
                  className="w-full"
                >
                  {insightsStatus.type === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Insights...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate AI Insights
                    </>
                  )}
                </Button>

                {insightsStatus.type !== "idle" && (
                  <Alert>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(insightsStatus.type)}
                      <AlertDescription>{insightsStatus.message}</AlertDescription>
                    </div>
                  </Alert>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Insights Generation:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Analyzes patterns across multiple documents</li>
                    <li>• Identifies key themes and trends</li>
                    <li>• Generates actionable recommendations</li>
                    <li>• Creates brief and detailed summaries</li>
                    <li>• Links insights to source documents</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Document Upload</CardTitle>
              <CardDescription>
                Upload text or files directly for processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Upload File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".txt,.md,.pdf,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="text-input">Paste Text</Label>
                  <Textarea
                    id="text-input"
                    placeholder="Paste your document text here..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleManualUpload}
                  disabled={manualUploadStatus.type === "loading" || (!manualText && !selectedFile)}
                  className="w-full"
                >
                  {manualUploadStatus.type === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>

                {manualUploadStatus.type !== "idle" && (
                  <Alert>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(manualUploadStatus.type)}
                      <AlertDescription>{manualUploadStatus.message}</AlertDescription>
                    </div>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}