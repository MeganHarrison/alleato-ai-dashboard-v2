"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  ExternalLink,
  ChevronRight,
  User,
  MessageSquare,
  TrendingUp,
  Hash,
  Target,
  CheckCircle2,
  HelpCircle,
  ListTodo,
  CalendarClock,
  BarChart3,
  Smile,
  Meh,
  Frown,
  Mic,
  ArrowLeft
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database.types"

type Meeting = Database["public"]["Tables"]["meetings"]["Row"] & {
  // Extended fields from Fireflies sync
  keywords?: string[] | null
  action_items?: string[] | null
  topics_discussed?: string[] | null
  meeting_type?: string | null
  sentiment_scores?: {
    positive_pct?: number
    neutral_pct?: number
    negative_pct?: number
  } | null
  speaker_analytics?: Array<{
    speaker_id: string
    name: string
    duration_pct: number
    word_count: number
    questions: number
    words_per_minute: number
  }> | null
  questions_asked?: Array<{
    text: string
    speaker: string
    timestamp: number
  }> | null
  tasks_mentioned?: Array<{
    text: string
    speaker: string
    timestamp: number
  }> | null
  metrics_discussed?: Array<{
    text: string
    speaker: string
    timestamp: number
  }> | null
  dates_mentioned?: Array<{
    text: string
    speaker: string
    timestamp: number
  }> | null
  transcript_url?: string | null
  audio_url?: string | null
  video_url?: string | null
  meeting_link?: string | null
  host_email?: string | null
}

interface MeetingDetailsEnhancedProps {
  meeting: Meeting
  onBack: () => void
}

export function MeetingDetailsEnhanced({ meeting, onBack }: MeetingDetailsEnhancedProps) {
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    }
    return `${mins}m`
  }

  const getSentimentIcon = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch(sentiment) {
      case 'positive': return <Smile className="h-4 w-4 text-green-600" />
      case 'neutral': return <Meh className="h-4 w-4 text-yellow-600" />
      case 'negative': return <Frown className="h-4 w-4 text-red-600" />
    }
  }

  const getDominantSentiment = () => {
    if (!meeting.sentiment_scores) return null
    const scores = meeting.sentiment_scores
    const max = Math.max(
      scores.positive_pct || 0,
      scores.neutral_pct || 0,
      scores.negative_pct || 0
    )
    if (max === scores.positive_pct) return 'positive'
    if (max === scores.neutral_pct) return 'neutral'
    return 'negative'
  }

  const dominantSentiment = getDominantSentiment()

  return (
    <div className="space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Meeting Title and Basic Info */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {meeting.title || "Untitled Meeting"}
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(meeting.meeting_date || meeting.date), "MMM d, yyyy")}
          </div>
          {meeting.duration_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(meeting.duration_minutes)}
            </div>
          )}
          {meeting.meeting_type && (
            <Badge variant="outline">{meeting.meeting_type}</Badge>
          )}
          {dominantSentiment && (
            <div className="flex items-center gap-1">
              {getSentimentIcon(dominantSentiment)}
              <span className="capitalize">{dominantSentiment}</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Tabs for organized content */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="participants">People</TabsTrigger>
          <TabsTrigger value="resources">Links</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[400px] mt-4">
          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4 pr-4">
            {/* Keywords */}
            {meeting.keywords && meeting.keywords.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {meeting.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Text */}
            {meeting.summary && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Summary
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {meeting.summary}
                </p>
              </div>
            )}

            {/* Topics Discussed */}
            {meeting.topics_discussed && meeting.topics_discussed.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Topics Discussed
                </h4>
                <ul className="space-y-1">
                  {meeting.topics_discussed.map((topic, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {meeting.action_items && meeting.action_items.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Action Items
                  <Badge variant="secondary" className="ml-auto">
                    {meeting.action_items.length}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {meeting.action_items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-secondary/50 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="text-sm flex-1">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4 pr-4">
            {/* Sentiment Analysis */}
            {meeting.sentiment_scores && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Sentiment Analysis
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smile className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Positive</span>
                      </div>
                      <span className="text-sm font-medium">
                        {meeting.sentiment_scores.positive_pct?.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={meeting.sentiment_scores.positive_pct || 0} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Meh className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Neutral</span>
                      </div>
                      <span className="text-sm font-medium">
                        {meeting.sentiment_scores.neutral_pct?.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={meeting.sentiment_scores.neutral_pct || 0} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Frown className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Negative</span>
                      </div>
                      <span className="text-sm font-medium">
                        {meeting.sentiment_scores.negative_pct?.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={meeting.sentiment_scores.negative_pct || 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Questions Asked */}
            {meeting.questions_asked && meeting.questions_asked.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Questions Asked
                  <Badge variant="secondary" className="ml-auto">
                    {meeting.questions_asked.length}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {meeting.questions_asked.slice(0, 5).map((q, idx) => (
                    <div key={idx} className="p-2 bg-secondary/50 rounded-lg">
                      <p className="text-sm">{q.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">— {q.speaker}</p>
                    </div>
                  ))}
                  {meeting.questions_asked.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{meeting.questions_asked.length - 5} more questions
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tasks Mentioned */}
            {meeting.tasks_mentioned && meeting.tasks_mentioned.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Tasks Mentioned
                  <Badge variant="secondary" className="ml-auto">
                    {meeting.tasks_mentioned.length}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {meeting.tasks_mentioned.slice(0, 5).map((t, idx) => (
                    <div key={idx} className="p-2 bg-secondary/50 rounded-lg">
                      <p className="text-sm">{t.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">— {t.speaker}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dates Mentioned */}
            {meeting.dates_mentioned && meeting.dates_mentioned.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Important Dates
                </h4>
                <div className="space-y-1">
                  {meeting.dates_mentioned.slice(0, 3).map((d, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">
                      • {d.text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-4 pr-4">
            {/* Participants List */}
            {meeting.participants && meeting.participants.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participants ({meeting.participants.length})
                </h4>
                <div className="space-y-2">
                  {meeting.participants.map((participant, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
                    >
                      <User className="h-4 w-4" />
                      <span className="text-sm">{participant}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speaker Analytics */}
            {meeting.speaker_analytics && meeting.speaker_analytics.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Speaker Statistics
                </h4>
                <div className="space-y-3">
                  {meeting.speaker_analytics.map((speaker, idx) => (
                    <div key={idx} className="p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{speaker.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(speaker.duration_pct)}% talk time
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="block">Words</span>
                          <span className="font-medium text-foreground">
                            {speaker.word_count.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="block">Questions</span>
                          <span className="font-medium text-foreground">
                            {speaker.questions}
                          </span>
                        </div>
                        <div>
                          <span className="block">WPM</span>
                          <span className="font-medium text-foreground">
                            {speaker.words_per_minute}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={speaker.duration_pct} 
                        className="h-1.5 mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Host Information */}
            {meeting.host_email && (
              <div>
                <h4 className="font-semibold mb-2">Host</h4>
                <p className="text-sm text-muted-foreground">{meeting.host_email}</p>
              </div>
            )}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-3 pr-4">
            {meeting.transcript_url && (
              <a
                href={meeting.transcript_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">View in Fireflies</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </a>
            )}
            
            {meeting.meeting_link && (
              <a
                href={meeting.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Meeting Link</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </a>
            )}

            {meeting.audio_url && (
              <a
                href={meeting.audio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <Mic className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Audio Recording</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </a>
            )}

            {meeting.video_url && (
              <a
                href={meeting.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <FileText className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Video Recording</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </a>
            )}

            {meeting.storage_path && (
              <a
                href={`/api/storage/meetings/${meeting.storage_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Download Transcript</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </a>
            )}

            {!meeting.transcript_url && !meeting.meeting_link && !meeting.audio_url && !meeting.video_url && !meeting.storage_path && (
              <div className="text-center py-8 text-muted-foreground">
                <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No external resources available</p>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}