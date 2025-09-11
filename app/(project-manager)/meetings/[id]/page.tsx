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
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface MeetingDocument {
  id: string;
  title: string | null;
  content: string | null;
  summary: string | null;
  meeting_date: string | null;
  duration_minutes: number | null;
  participants: string[] | null;
  keywords: string[] | null;
  action_items: string[] | null;
  topics_discussed: string[] | null;
  sentiment_scores: any;
  speaker_analytics: any;
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

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const meetingId = params.id as string;

  useEffect(() => {
    if (meetingId) {
      loadMeeting();
    }
  }, [meetingId]);

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

      setMeeting(meetingData as unknown as MeetingDocument);
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
    <div className="space-y-6 p-2 sm:p-4 md:p-6 w-[95%] sm:w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {meeting.title || "Untitled Meeting"}
            </h1>
            <p className="text-muted-foreground">
              Meeting transcript and details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Meeting Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {meeting.meeting_date && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {format(new Date(meeting.meeting_date), 'MMM d')}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(meeting.meeting_date), 'yyyy')}
              </p>
            </CardContent>
          </Card>
        )}

        {meeting.duration_minutes && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meeting.duration_minutes}min</div>
              <p className="text-xs text-muted-foreground">
                {Math.floor(meeting.duration_minutes / 60)}h {meeting.duration_minutes % 60}m
              </p>
            </CardContent>
          </Card>
        )}

        {meeting.participants && meeting.participants.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meeting.participants.length}</div>
              <p className="text-xs text-muted-foreground">attendees</p>
            </CardContent>
          </Card>
        )}

        {meeting.project && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold truncate">
                {meeting.project.name || "Unnamed Project"}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="transcript" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="summary">Summary & Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transcript" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Full Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.content ? (
                <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                  <div className="whitespace-pre-wrap text-sm font-mono">
                    {meeting.content}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No transcript content available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary */}
            {meeting.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Meeting Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{meeting.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            {meeting.participants && meeting.participants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {meeting.participants.map((participant, index) => (
                      <Badge key={index} variant="secondary">
                        {participant}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Items */}
            {meeting.action_items && meeting.action_items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {meeting.action_items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Keywords/Topics */}
            {meeting.keywords && meeting.keywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tags className="h-5 w-5" />
                    Keywords & Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {meeting.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Analysis */}
            {sentimentData && (
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Positive</span>
                      <span>{sentimentData.positive}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${sentimentData.positive}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Neutral</span>
                      <span>{sentimentData.neutral}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-gray-600 h-2 rounded-full" 
                        style={{ width: `${sentimentData.neutral}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Negative</span>
                      <span>{sentimentData.negative}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${sentimentData.negative}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Speaker Analytics */}
            {meeting.speaker_analytics && (
              <Card>
                <CardHeader>
                  <CardTitle>Speaker Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <pre className="text-xs">
                      {JSON.stringify(meeting.speaker_analytics, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Topics Discussed */}
            {meeting.topics_discussed && meeting.topics_discussed.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Topics Discussed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {meeting.topics_discussed.map((topic, index) => (
                      <Badge key={index} variant="secondary" className="justify-start">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}