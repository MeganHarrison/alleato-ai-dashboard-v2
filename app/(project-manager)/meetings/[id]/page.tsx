"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckSquare,
  Tags,
  MessageSquare,
  ExternalLink,
  Download,
  Loader2,
  Lightbulb,
  ListTodo,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface MeetingDocument {
  id: string;
  title: string | null;
  content: string | null;
  summary: string | null;
  metadata: unknown;
  meeting_date: string | null;
  duration_minutes: number | null;
  participants: string[] | null;
  keywords: string[] | null;
  action_items: string[] | null;
  topics_discussed: string[] | null;
  sentiment_scores: unknown;
  speaker_analytics: unknown;
  fireflies_link: string | null;
  audio_url: string | null;
  video_url: string | null;
  transcript_url: string | null;
  project_id: number | null;
  project?: {
    id: number;
    name: string | null;
  };
}

interface AIInsight {
  id: number;
  insight_type: string;
  severity: string;
  title: string;
  description: string;
  confidence_score: number;
  status: string;
  created_at: string;
}

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingDocument | null>(null);
  const [actualTranscript, setActualTranscript] = useState<string | null>(null);
  const [transcriptLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [insightsLoading] = useState(false);
  const [relatedMeetings, setRelatedMeetings] = useState<MeetingDocument[]>([]);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const meetingId = params.id as string;

  useEffect(() => {
    if (meetingId) {
      loadMeeting();
    }
  }, [meetingId]);

  const fetchActualTranscript = async (meeting: MeetingDocument) => {
    try {
      setTranscriptLoading(true);
      
      // Check if metadata contains storage_bucket_path
      const metadata = meeting.metadata;
      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata);
      }
      
      if (metadata?.storage_bucket_path) {
        console.log('Fetching transcript from:', metadata.storage_bucket_path);
        const response = await fetch(metadata.storage_bucket_path);
        if (response.ok) {
          const transcriptContent = await response.text();
          
          // Extract the actual transcript section (after "## Transcript")
          const transcriptMatch = transcriptContent.match(/## Transcript\s*\n([\s\S]*)/i);
          if (transcriptMatch) {
            setActualTranscript(transcriptMatch[1].trim());
          } else {
            // If no transcript section, use the whole content
            setActualTranscript(transcriptContent);
          }
        } else {
          console.error('Failed to fetch transcript:', response.status);
        }
      }
    } catch (error) {
      console.error('Error fetching actual transcript:', error);
    } finally {
      setTranscriptLoading(false);
    }
  };

  const fetchMeetingInsights = async (documentId: string) => {
    try {
      setInsightsLoading(true);
      
      if (!supabase) {
        throw new Error("Database connection not available");
      }
      
      const { data: insightsData, error: insightsError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });
      
      if (insightsError) {
        console.error('Error loading insights:', insightsError);
      } else {
        setInsights(insightsData || []);
        console.log('📊 Loaded insights:', insightsData?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching meeting insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchRelatedMeetings = async (projectId: number, currentMeetingId: string) => {
    try {
      if (!supabase) return;
      
      const { data: relatedData, error: relatedError } = await supabase
        .from('documents')
        .select('id, title, date, created_at')
        .eq('project_id', projectId)
        .neq('id', currentMeetingId)
        .order('date', { ascending: false })
        .limit(5);
      
      if (relatedError) {
        console.error('Error loading related meetings:', relatedError);
      } else {
        setRelatedMeetings((relatedData || []) as MeetingDocument[]);
        console.log('🔗 Loaded related meetings:', relatedData?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching related meetings:', error);
    }
  };

  const loadMeeting = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error("Database connection not available");
      }

      const { data: meetingData, error: meetingError } = await supabase
        .from('documents')
        .select(`
          *,
          project:projects(id, name)
        `)
        .eq('id', meetingId)
        .single();

      if (meetingError) {
        console.error("Error loading meeting:", meetingError);
        throw new Error(meetingError.message || "Failed to load meeting");
      }

      if (!meetingData) {
        throw new Error("Meeting not found");
      }

      const meeting = meetingData as unknown as MeetingDocument;
      console.log('📄 Meeting data loaded:', {
        participants: meeting.participants,
        participantCount: meeting.participants?.length
      });
      setMeeting(meeting);
      
      // Fetch actual transcript if available in metadata
      await fetchActualTranscript(meeting);
      
      // Fetch insights for this meeting
      await fetchMeetingInsights(meeting.id);
      
      // Fetch related meetings if there's a project
      if (meeting.project_id) {
        await fetchRelatedMeetings(meeting.project_id, meeting.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error in loadMeeting:", error);
      setError(errorMessage);
      toast.error("Failed to load meeting", {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!meeting?.content) {
      toast.error("No transcript content available");
      return;
    }

    const blob = new Blob([meeting.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title || 'meeting'}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Transcript downloaded successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading meeting...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Meeting</h3>
          <p>{error}</p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Meeting Not Found</h3>
          <p className="text-muted-foreground">The requested meeting could not be found.</p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const sentimentData = meeting.sentiment_scores ? {
    positive: meeting.sentiment_scores.positive_pct || 0,
    negative: meeting.sentiment_scores.negative_pct || 0,
    neutral: meeting.sentiment_scores.neutral_pct || 0,
  } : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>
          <div className="flex items-center gap-3">
            {meeting.fireflies_link && (
              <Button variant="outline" size="sm" asChild>
                <a href={meeting.fireflies_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Fireflies
                </a>
              </Button>
            )}
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        
        {/* Title and Meeting Info */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {meeting.title || "Untitled Meeting"}
          </h1>
          
          {/* Meeting Details Row */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            {meeting.project && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Project:</span>
                <a 
                  href={`/projects/${meeting.project.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {meeting.project.name || "Unnamed Project"}
                </a>
              </div>
            )}
            
            {meeting.meeting_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(meeting.meeting_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            
            {meeting.duration_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{meeting.duration_minutes}min</span>
              </div>
            )}
            
            {meeting.participants && meeting.participants.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{meeting.participants.length} participants</span>
              </div>
            )}
          </div>
          
          {/* Participants */}
          {meeting.participants && meeting.participants.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Participants</h3>
              <div className="flex flex-wrap gap-2">
                {meeting.participants.slice(0, 8).map((participant, index) => {
                  // Clean up participant email/name
                  const cleanParticipant = participant.includes('@') 
                    ? participant.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : participant;
                  return (
                    <span key={index} className="text-sm bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
                      {cleanParticipant}
                    </span>
                  );
                })}
                {meeting.participants.length > 8 && (
                  <span className="text-sm text-muted-foreground px-2 py-1">
                    +{meeting.participants.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Insights, Summary, Action Items */}
          <div className="space-y-6">
            <Tabs defaultValue="insights" className="space-y-4">
              <TabsList className="bg-transparent border-0 shadow-none p-0 h-auto">
                <TabsTrigger value="insights" className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none border-0 rounded-md px-4 py-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="summary" className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none border-0 rounded-md px-4 py-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="actions" className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none border-0 rounded-md px-4 py-2 flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Actions
                </TabsTrigger>
              </TabsList>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Meeting Insights</h3>
                  {insights.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">
                      {insights.length}
                    </span>
                  )}
                </div>
                {insightsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm">Loading insights...</span>
                  </div>
                ) : insights.length > 0 ? (
                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto space-y-3">
                    {insights.map((insight) => (
                      <div key={insight.id} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className={
                            `text-xs px-2 py-1 rounded capitalize ${
                              insight.severity === 'critical' 
                                ? 'bg-red-100 text-red-700' 
                                : insight.severity === 'high' 
                                ? 'bg-orange-100 text-orange-700' 
                                : 'bg-slate-200 text-slate-700'
                            }`
                          }>
                            {insight.insight_type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(insight.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm mb-2 leading-tight">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {insight.description}
                        </p>
                        {insight.confidence_score && (
                          <div className="mt-3 pt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Confidence</span>
                              <span className="text-xs font-medium">
                                {(insight.confidence_score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1">
                              <div 
                                className="bg-slate-500 h-1 rounded-full transition-all" 
                                style={{ width: `${insight.confidence_score * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No insights available</p>
                  </div>
                )}
              </TabsContent>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4">
                <h3 className="text-base font-semibold">Meeting Summary</h3>
                {meeting.summary ? (
                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                    <div className="text-sm leading-relaxed space-y-3 bg-slate-50 rounded-lg p-4">
                      {meeting.summary.split('\n').filter(line => line.trim()).map((line, index) => {
                        // Handle bullet points
                        if (line.trim().startsWith('- ')) {
                          return (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                              <span className="text-foreground/90">{line.replace(/^- /, '')}</span>
                            </div>
                          );
                        }
                        // Handle regular paragraphs
                        return <p key={index} className="text-foreground/90">{line}</p>;
                      })}
                    </div>

                    {/* Keywords/Topics */}
                    {meeting.keywords && Array.isArray(meeting.keywords) && meeting.keywords.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Keywords & Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {meeting.keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No summary available</p>
                  </div>
                )}
              </TabsContent>

              {/* Action Items Tab */}
              <TabsContent value="actions" className="space-y-4">
                <h3 className="text-base font-semibold">Action Items</h3>
                {meeting.action_items && Array.isArray(meeting.action_items) && meeting.action_items.length > 0 ? (
                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                    <div className="space-y-3">
                      {meeting.action_items.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
                          <CheckSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No action items available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Related Meetings Section */}
            {relatedMeetings.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Related Meetings</h3>
                <div className="space-y-2">
                  {relatedMeetings.map((relatedMeeting) => (
                    <a
                      key={relatedMeeting.id}
                      href={`/meetings/${relatedMeeting.id}`}
                      className="block bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-foreground">
                        {relatedMeeting.title || 'Untitled Meeting'}
                      </div>
                      {relatedMeeting.meeting_date && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(relatedMeeting.meeting_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Transcript */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Conversation Transcript</h3>
            {transcriptLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Loading transcript...</span>
              </div>
            ) : actualTranscript ? (
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-slate-50 rounded-lg p-4">
                  {actualTranscript}
                </div>
              </div>
            ) : meeting.content ? (
              <div className="space-y-3">
                <div className="text-xs bg-amber-50 text-amber-800 p-3 rounded-md">
                  <strong>Note:</strong> Showing summary content - full transcript may not be available.
                </div>
                <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed bg-slate-50 rounded-lg p-4">
                    {meeting.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No transcript available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}