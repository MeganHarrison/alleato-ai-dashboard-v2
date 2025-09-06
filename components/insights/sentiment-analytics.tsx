"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  MessageSquare,
  AlertTriangle,
  Smile,
  Frown,
  Meh
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SentimentData {
  overallScore: number
  trend: "up" | "down" | "stable"
  trendValue: number
  weeklyData: {
    day: string
    score: number
  }[]
  topicSentiment: {
    topic: string
    score: number
    mentions: number
  }[]
  participationData: {
    name: string
    speakingTime: number
    sentiment: number
  }[]
  alerts: {
    type: "warning" | "info"
    message: string
  }[]
}

export function SentimentAnalytics() {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching sentiment data
    const fetchSentimentData = async () => {
      const mockData: SentimentData = {
        overallScore: 72,
        trend: "up",
        trendValue: 5.2,
        weeklyData: [
          { day: "Mon", score: 68 },
          { day: "Tue", score: 70 },
          { day: "Wed", score: 65 },
          { day: "Thu", score: 74 },
          { day: "Fri", score: 72 },
        ],
        topicSentiment: [
          { topic: "Project Timeline", score: 45, mentions: 23 },
          { topic: "Team Collaboration", score: 85, mentions: 18 },
          { topic: "Budget Planning", score: 62, mentions: 15 },
          { topic: "Technical Challenges", score: 38, mentions: 12 },
          { topic: "Customer Feedback", score: 92, mentions: 8 },
        ],
        participationData: [
          { name: "John S.", speakingTime: 35, sentiment: 78 },
          { name: "Sarah M.", speakingTime: 28, sentiment: 82 },
          { name: "Mike R.", speakingTime: 22, sentiment: 65 },
          { name: "Emily D.", speakingTime: 15, sentiment: 70 },
        ],
        alerts: [
          { type: "warning", message: "Negative sentiment trend detected for 'Technical Challenges'" },
          { type: "info", message: "Team engagement up 12% this week" },
        ]
      }
      
      setSentimentData(mockData)
      setIsLoading(false)
    }

    fetchSentimentData()
  }, [])

  const getSentimentIcon = (score: number) => {
    if (score >= 70) return <Smile className="h-5 w-5 text-green-500" />
    if (score >= 40) return <Meh className="h-5 w-5 text-yellow-500" />
    return <Frown className="h-5 w-5 text-red-500" />
  }

  const getSentimentColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-50"
    if (score >= 40) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sentiment & Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sentimentData) return null

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Sentiment & Engagement</CardTitle>
          <Badge variant="outline" className="text-xs">
            Live Analysis
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Overall Sentiment Gauge */}
        <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Overall Mood</span>
            <div className="flex items-center gap-2">
              {getTrendIcon(sentimentData.trend)}
              <span className={cn(
                "text-xs font-medium",
                sentimentData.trend === "up" ? "text-green-500" : "text-red-500"
              )}>
                {sentimentData.trendValue > 0 ? "+" : ""}{sentimentData.trendValue}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getSentimentIcon(sentimentData.overallScore)}
              <div>
                <p className="text-2xl font-bold">{sentimentData.overallScore}%</p>
                <p className="text-xs text-muted-foreground">Positive sentiment</p>
              </div>
            </div>
            
            {/* Mini bar chart for weekly trend */}
            <div className="flex items-end gap-1">
              {sentimentData.weeklyData.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div 
                    className={cn(
                      "w-6 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t",
                      "transition-all duration-300 hover:opacity-80"
                    )}
                    style={{ height: `${day.score * 0.5}px` }}
                    title={`${day.day}: ${day.score}%`}
                  />
                  <span className="text-xs text-muted-foreground mt-1">{day.day[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Topic Sentiment */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Topic Sentiment</p>
          {sentimentData.topicSentiment.slice(0, 3).map((topic, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{topic.topic}</span>
                  <Badge variant="secondary" className="text-xs">
                    {topic.mentions} mentions
                  </Badge>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      topic.score >= 70 ? "bg-green-500" :
                      topic.score >= 40 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${topic.score}%` }}
                  />
                </div>
              </div>
              <span className={cn(
                "ml-3 text-sm font-medium px-2 py-1 rounded",
                getSentimentColor(topic.score)
              )}>
                {topic.score}%
              </span>
            </div>
          ))}
        </div>

        {/* Participation Matrix */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Team Participation</p>
          <div className="grid grid-cols-2 gap-2">
            {sentimentData.participationData.map((person, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{person.name}</span>
                  <span className="text-xs text-muted-foreground">{person.speakingTime}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${person.speakingTime}%` }}
                    />
                  </div>
                  {getSentimentIcon(person.sentiment)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {sentimentData.alerts.length > 0 && (
          <div className="space-y-2">
            {sentimentData.alerts.map((alert, idx) => (
              <div 
                key={idx}
                className={cn(
                  "p-2 rounded-lg text-xs flex items-start gap-2",
                  alert.type === "warning" 
                    ? "bg-red-50 text-red-700 border border-red-200" 
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                )}
              >
                {alert.type === "warning" ? (
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                ) : (
                  <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                )}
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}