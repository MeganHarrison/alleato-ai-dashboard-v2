"use client"

import { useState, type ReactElement } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

interface DiagnosticStatus {
  status: "checking" | "success" | "error" | "warning";
  error?: string;
  user?: string;
  count?: number;
  details?: string;
  message?: string;
  code?: string;
  hint?: string;
  resultsFound?: number;
  functionExists?: boolean;
  sampleResult?: {
    hasChunkText: boolean;
    hasSimilarity: boolean;
    similarity: number;
  } | null;
  rowCount?: number;
  hasEmbeddings?: boolean;
  hasTranscripts?: boolean;
  sampleChunk?: {
    hasContent: boolean;
    hasEmbedding: boolean;
    contentLength: number;
    chunkType: string | null;
  } | null;
}

interface DiagnosticResults {
  supabaseConnection?: DiagnosticStatus;
  meetingChunksTable?: DiagnosticStatus;
  embeddingData?: DiagnosticStatus;
  searchFunction?: DiagnosticStatus;
  meetingInsights?: DiagnosticStatus;
  vectorSearch?: DiagnosticStatus;
  conversationsTable?: DiagnosticStatus;
  conversationHistoryTable?: DiagnosticStatus;
  meetingsTable?: DiagnosticStatus;
  openAIKey?: DiagnosticStatus;
  generalError?: DiagnosticStatus;
}

export default function DiagnosticPage(): ReactElement {
  const [results, setResults] = useState<DiagnosticResults>({})
  const [isRunning, setIsRunning] = useState(false)
  const supabase = createClient()

  const runDiagnostics = async (): Promise<void> => {
    setIsRunning(true)
    const diagnostics: DiagnosticResults = {}

    try {
      // Check for Supabase client availability
      if (!supabase) {
        diagnostics.supabaseConnection = { status: "error", error: "Supabase client could not be created. Check environment variables." }
        setResults(diagnostics)
        setIsRunning(false)
        return
      }

      // Check 1: Can we connect to Supabase?
      diagnostics.supabaseConnection = { status: "checking" }
      const { data: authData, error: authError } = await supabase.auth.getUser()
      diagnostics.supabaseConnection = authError 
        ? { status: "error", error: authError.message }
        : { status: "success", user: authData?.user?.email || "Anonymous" }

      // Check 2: Does meeting_chunks table exist and have data?
      diagnostics.meetingChunksTable = { status: "checking" }
      const { data: chunks, error: chunksError, count } = await supabase
        .from("meeting_chunks")
        .select("id, content, embedding, meeting_id, chunk_type", { count: "exact" })
        .limit(5)
      
      if (chunksError) {
        diagnostics.meetingChunksTable = { status: "error", error: chunksError.message, code: chunksError.code }
      } else {
        const hasEmbeddings = chunks && chunks.length > 0 && chunks.some(c => c.embedding !== null)
        diagnostics.meetingChunksTable = { 
          status: count && count > 0 ? "success" : "warning", 
          rowCount: count || 0,
          hasEmbeddings,
          sampleChunk: chunks && chunks[0] ? {
            hasContent: !!chunks[0].content,
            hasEmbedding: !!chunks[0].embedding,
            contentLength: chunks[0].content?.length || 0,
            chunkType: chunks[0].chunk_type
          } : null
        }
      }

      // Check 3: Does search_meeting_chunks function exist?
      diagnostics.searchFunction = { status: "checking" }
      try {
        // Create a simple test embedding - must match the dimension of your embeddings
        const testEmbedding = new Array(1536).fill(0).map(() => Math.random() * 0.1)
        const embeddingString = `[${testEmbedding.join(",")}]`
        
        // Use all 4 parameters as defined in the migration
        const { data: searchData, error: searchError } = await supabase.rpc("search_meeting_chunks", {
          query_embedding: embeddingString,
          match_threshold: 0.0,  // Very low threshold for testing
          match_count: 2,
          project_filter: undefined   // Optional parameter
        })

        if (searchError) {
          diagnostics.searchFunction = { 
            status: "error", 
            error: searchError.message,
            code: searchError.code,
            hint: searchError.hint || "Check if the function exists in the database"
          }
        } else {
          diagnostics.searchFunction = { 
            status: "success", 
            resultsFound: searchData?.length || 0,
            functionExists: true,
            sampleResult: searchData && searchData[0] ? {
              hasChunkText: !!searchData[0].chunk_text,
              hasSimilarity: typeof searchData[0].similarity === 'number',
              similarity: searchData[0].similarity
            } : null
          }
        }
      } catch (err) {
        diagnostics.searchFunction = { 
          status: "error", 
          error: err instanceof Error ? err.message : 'Unknown error occurred',
          hint: "The RPC function might not exist or has different parameters"
        }
      }

      // Check 4: Does conversations table exist?
      diagnostics.conversationsTable = { status: "checking" }
      const { error: convsError, count: convsCount } = await supabase
        .from("chats")
        .select("*", { count: "exact", head: true })
      
      diagnostics.conversationsTable = convsError
        ? { status: "error", error: convsError.message, code: convsError.code }
        : { status: "success", rowCount: convsCount || 0 }

      // Check 5: Does conversation_history table exist?
      diagnostics.conversationHistoryTable = { status: "checking" }
      const { error: historyError, count: historyCount } = await supabase
        .from("ai_sdk5_chats")
        .select("*", { count: "exact", head: true })
      
      diagnostics.conversationHistoryTable = historyError
        ? { status: "error", error: historyError.message, code: historyError.code }
        : { status: "success", rowCount: historyCount || 0 }

      // Check 6: Check meetings table (source of chunks)
      diagnostics.meetingsTable = { status: "checking" }
      const { data: meetings, error: meetingsError, count: meetingsCount } = await supabase
        .from("meetings")
        .select("id, title", { count: "exact" })
        .limit(1)
      
      if (meetingsError) {
        diagnostics.meetingsTable = { status: "error", error: meetingsError.message, code: meetingsError.code }
      } else {
        diagnostics.meetingsTable = { 
          status: meetingsCount && meetingsCount > 0 ? "success" : "warning", 
          rowCount: meetingsCount || 0,
          hasTranscripts: meetings && meetings[0] && !!meetings[0].title
        }
      }

      // Check 7: Test OpenAI API key
      diagnostics.openAIKey = { status: "checking" }
      try {
        const response = await fetch('/api/test-openai')
        const data = await response.json()
        diagnostics.openAIKey = data.success 
          ? { status: "success", message: "OpenAI API key is configured" }
          : { status: "error", error: data.error || "OpenAI API key not configured" }
      } catch {
        diagnostics.openAIKey = { status: "warning", message: "Could not verify OpenAI API key" }
      }

    } catch (error) {
      diagnostics.generalError = { status: "error", error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }

    setResults(diagnostics)
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "success": return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error": return <XCircle className="h-5 w-5 text-red-600" />
      case "warning": return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default: return <Loader2 className="h-5 w-5 animate-spin" />
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case "success": return "border-green-200 bg-green-50"
      case "error": return "border-red-200 bg-red-50"
      case "warning": return "border-yellow-200 bg-yellow-50"
      default: return "border-gray-200"
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Vector Database & Chat System Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runDiagnostics} disabled={isRunning} className="mb-6">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              "Run Diagnostics"
            )}
          </Button>

          {Object.keys(results).length > 0 && (
            <div className="space-y-4">
              {Object.entries(results).map(([key, value]: [string, DiagnosticStatus]) => (
                <div key={key} className={`border rounded-lg p-4 ${getStatusColor(value.status)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(value.status)}
                        <h3 className="font-semibold">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                      </div>
                      
                      {value.error && (
                        <div className="text-red-600 text-sm mt-2">
                          <strong>Error:</strong> {value.error}
                          {value.code && <span className="ml-2">(Code: {value.code})</span>}
                        </div>
                      )}
                      
                      {value.hint && (
                        <div className="text-amber-600 text-sm mt-1">
                          <strong>Hint:</strong> {value.hint}
                        </div>
                      )}
                      
                      {value.message && (
                        <div className="text-sm mt-2">{value.message}</div>
                      )}
                      
                      {value.rowCount !== undefined && (
                        <div className="text-sm mt-2">
                          <strong>Row Count:</strong> {value.rowCount}
                          {value.rowCount === 0 && (
                            <span className="text-amber-600 ml-2">(No data found - this might be the issue!)</span>
                          )}
                        </div>
                      )}
                      
                      {value.hasEmbeddings !== undefined && (
                        <div className="text-sm mt-1">
                          <strong>Has Embeddings:</strong> {value.hasEmbeddings ? "Yes ✓" : "No ✗"}
                          {!value.hasEmbeddings && (
                            <span className="text-red-600 ml-2">(Embeddings are required for vector search!)</span>
                          )}
                        </div>
                      )}
                      
                      {value.hasTranscripts !== undefined && (
                        <div className="text-sm mt-1">
                          <strong>Has Transcripts:</strong> {value.hasTranscripts ? "Yes ✓" : "No ✗"}
                        </div>
                      )}
                      
                      {value.user && (
                        <div className="text-sm mt-1">
                          <strong>User:</strong> {value.user}
                        </div>
                      )}
                      
                      {value.functionExists !== undefined && (
                        <div className="text-sm mt-1">
                          <strong>Function Exists:</strong> {value.functionExists ? "Yes ✓" : "No ✗"}
                        </div>
                      )}
                      
                      {value.resultsFound !== undefined && (
                        <div className="text-sm mt-1">
                          <strong>Search Results Found:</strong> {value.resultsFound}
                        </div>
                      )}
                      
                      {value.sampleChunk && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">Sample Chunk Info</summary>
                          <div className="mt-2 text-xs bg-white/50 p-2 rounded">
                            <div>Has Content: {value.sampleChunk.hasContent ? "Yes" : "No"}</div>
                            <div>Has Embedding: {value.sampleChunk.hasEmbedding ? "Yes" : "No"}</div>
                            <div>Content Length: {value.sampleChunk.contentLength} chars</div>
                            <div>Chunk Type: {value.sampleChunk.chunkType || "Not specified"}</div>
                          </div>
                        </details>
                      )}
                      
                      {value.sampleResult && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">Sample Search Result</summary>
                          <div className="mt-2 text-xs bg-white/50 p-2 rounded">
                            <div>Has Chunk Text: {value.sampleResult.hasChunkText ? "Yes" : "No"}</div>
                            <div>Has Similarity Score: {value.sampleResult.hasSimilarity ? "Yes" : "No"}</div>
                            <div>Similarity: {value.sampleResult.similarity?.toFixed(4) || "N/A"}</div>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {Object.keys(results).length > 0 && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-2">Diagnosis Summary</h3>
              <div className="text-sm space-y-1">
                {results.meetingChunksTable?.rowCount === 0 && (
                  <div className="text-red-600">• No data in meeting_chunks table - you need to populate this table with embeddings</div>
                )}
                {results.meetingChunksTable?.hasEmbeddings === false && (
                  <div className="text-red-600">• Meeting chunks exist but have no embeddings - embeddings are required for vector search</div>
                )}
                {results.searchFunction?.status === "error" && (
                  <div className="text-red-600">• search_meeting_chunks function is not working - check if it exists in the database</div>
                )}
                {results.meetingsTable?.rowCount === 0 && (
                  <div className="text-amber-600">• No meetings found - you may need to create meetings first</div>
                )}
                {results.openAIKey?.status === "error" && (
                  <div className="text-red-600">• OpenAI API key issue - needed for generating embeddings</div>
                )}
                {((results.meetingChunksTable?.rowCount ?? 0) > 0 && 
                  results.meetingChunksTable?.hasEmbeddings && 
                  results.searchFunction?.status === "success") && (
                  <div className="text-green-600">• All systems operational - vector search should be working</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}