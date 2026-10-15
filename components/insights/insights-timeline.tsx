"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Filter,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  CheckCircle,
  Clock,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
// Remove server action import

interface TimelineInsight {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high"
  type: string
  createdAt: Date
  projectName?: string
}

const typeIcons = {
  decision: Target,
  risk: AlertTriangle,
  opportunity: Lightbulb,
  action: CheckCircle,
  milestone: TrendingUp,
  default: Sparkles
}

const severityColors = {
  high: "border-red-200 bg-red-50",
  medium: "border-yellow-200 bg-yellow-50",
  low: "border-blue-200 bg-blue-50"
}

export function InsightsTimeline() {
  const [insights, setInsights] = useState<TimelineInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/insights/projects')
        if (!response.ok) {
          throw new Error('Failed to fetch insights')
        }
        
        const data = await response.json()
        
        const timelineInsights: TimelineInsight[] = data.map((insight: unknown) => ({
          id: insight.id.toString(),
          title: insight.title,
          description: insight.description,
          severity: insight.severity || 'medium',
          type: insight.insight_type || 'default',
          createdAt: new Date(insight.created_at),
          projectName: insight.projects?.[0]?.name || 'Unknown Project'
        }))

        setInsights(timelineInsights.slice(0, 10)) // Show latest 10
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching insights:', error)
        setIsLoading(false)
      }
    }

    fetchInsights()
  }, [])

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'default'
    }
    return variants[severity as keyof typeof variants] || 'default'
  }

  const getTypeIcon = (type: string) => {
    const Icon = typeIcons[type as keyof typeof typeIcons] || typeIcons.default
    return Icon
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recent Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full mb-1"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recent Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">No insights yet</h3>
            <p className="text-sm text-muted-foreground">
              AI insights from your meetings will appear here
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
          <Sparkles className="h-5 w-5" />
          Recent Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = getTypeIcon(insight.type)
            const isLast = index === insights.length - 1

            return (
              <div key={insight.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                )}
                
                <div className="flex gap-3">
                  {/* Timeline dot with icon */}
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-foreground leading-tight">
                        {insight.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getSeverityBadge(insight.severity)}>
                          {insight.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {insight.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {insight.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>{insight.projectName}</span>
                      {insight.type && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{insight.type}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {insights.length >= 10 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" className="w-full">
              View All Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}