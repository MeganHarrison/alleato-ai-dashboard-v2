"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Smile,
  Meh,
  Frown,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
// Remove server action import

interface SentimentData {
  overall: number
  positive: number
  neutral: number
  negative: number
  trend: "up" | "down" | "stable"
  recentMeetings: {
    title: string
    date: Date
    sentiment: number
    participants: number
  }[]
}

export function SentimentAnalytics() {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const response = await fetch('/api/insights/meetings')
        if (!response.ok) {
          throw new Error('Failed to fetch meetings')
        }
        
        const meetings = await response.json()
        
        // Calculate mock sentiment scores (in real app, this would come from NLP analysis)
        const mockSentiment: SentimentData = {
          overall: 75, // Mock overall sentiment score
          positive: 65,
          neutral: 25,
          negative: 10,
          trend: "up",
          recentMeetings: meetings.slice(0, 5).map((meeting: unknown) => ({
            title: meeting.title || 'Meeting',
            date: new Date(meeting.created_at),
            sentiment: Math.floor(Math.random() * 40) + 60, // Mock sentiment 60-100
            participants: meeting.participants ? meeting.participants.length : Math.floor(Math.random() * 8) + 3
          }))
        }

        setSentiment(mockSentiment)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching sentiment data:', error)
        setIsLoading(false)
      }
    }

    fetchSentiment()
  }, [])

  const getSentimentIcon = (score: number) => {
    if (score >= 70) return <Smile className="h-4 w-4 text-emerald-600" />
    if (score >= 40) return <Meh className="h-4 w-4 text-yellow-600" />
    return <Frown className="h-4 w-4 text-red-600" />
  }

  const getSentimentColor = (score: number) => {
    if (score >= 70) return "text-emerald-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="h-8 bg-muted rounded w-16 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-24 mx-auto animate-pulse"></div>
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                  <div className="h-2 bg-muted rounded w-24 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sentiment || sentiment.recentMeetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">No sentiment data</h3>
            <p className="text-sm text-muted-foreground">
              Sentiment analysis will appear here once meetings are processed
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Sentiment Score */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getSentimentIcon(sentiment.overall)}
            <span className={cn("text-2xl font-bold", getSentimentColor(sentiment.overall))}>
              {sentiment.overall}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Overall Team Sentiment</p>
        </div>

        {/* Sentiment Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground flex items-center gap-2">
              <Smile className="h-3 w-3 text-emerald-600" />
              Positive
            </span>
            <div className="flex items-center gap-2">
              <Progress value={sentiment.positive} className="w-16 h-2" />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {sentiment.positive}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground flex items-center gap-2">
              <Meh className="h-3 w-3 text-yellow-600" />
              Neutral
            </span>
            <div className="flex items-center gap-2">
              <Progress value={sentiment.neutral} className="w-16 h-2" />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {sentiment.neutral}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground flex items-center gap-2">
              <Frown className="h-3 w-3 text-red-600" />
              Negative
            </span>
            <div className="flex items-center gap-2">
              <Progress value={sentiment.negative} className="w-16 h-2" />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {sentiment.negative}%
              </span>
            </div>
          </div>
        </div>

        {/* Recent Meetings */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Recent Meetings</h4>
          <div className="space-y-2">
            {sentiment.recentMeetings.slice(0, 4).map((meeting, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {meeting.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{meeting.date.toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{meeting.participants} people</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {getSentimentIcon(meeting.sentiment)}
                  <span className={cn("text-xs font-medium", getSentimentColor(meeting.sentiment))}>
                    {meeting.sentiment}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}