"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  FolderOpen
} from "lucide-react"
import { cn } from "@/lib/utils"
// Remove server action import

interface Metric {
  label: string
  value: string | number
  change: number
  trend: "up" | "down" | "neutral"
  icon: React.ElementType
  description?: string
}

export function HeroMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/insights/metrics')
        if (!response.ok) {
          throw new Error('Failed to fetch metrics')
        }
        
        const data = await response.json()
        
        // Calculate trends (simplified - in real app, compare with previous period)
        const meetingsTrend = data.recentTrend.meetings > 5 ? "up" : data.recentTrend.meetings < 2 ? "down" : "neutral"
        const insightsTrend = data.recentTrend.insights > 10 ? "up" : data.recentTrend.insights < 5 ? "down" : "neutral"
        
        const realMetrics: Metric[] = [
          {
            label: "Total Meetings",
            value: data.totalMeetings,
            change: data.recentTrend.meetings,
            trend: meetingsTrend,
            icon: Activity,
            description: "Meetings analyzed"
          },
          {
            label: "AI Insights",
            value: data.totalInsights,
            change: data.recentTrend.insights,
            trend: insightsTrend,
            icon: Zap,
            description: "Generated insights"
          },
          {
            label: "Active Projects",
            value: data.activeProjects,
            change: 0,
            trend: "neutral",
            icon: FolderOpen,
            description: "Projects in progress"
          },
          {
            label: "High Priority",
            value: data.pendingActions,
            change: -2,
            trend: "down",
            icon: AlertTriangle,
            description: "High priority items"
          },
          {
            label: "Engagement",
            value: `${data.averageEngagement}%`,
            change: 3,
            trend: "up",
            icon: Users,
            description: "Team engagement"
          }
        ]
        
        setMetrics(realMetrics)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching metrics:', error)
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  const getTrendIcon = (trend: "up" | "down" | "neutral", change: number) => {
    if (trend === "up" && change > 0) {
      return <TrendingUp className="h-4 w-4 text-emerald-600" />
    } else if (trend === "down" && change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        
        return (
          <Card 
            key={index}
            className="p-6 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-muted rounded-lg">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              {metric.change !== 0 && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend, metric.change)}
                  <span className={cn(
                    "text-xs font-medium",
                    metric.change > 0 ? "text-emerald-600" : "text-red-500"
                  )}>
                    {metric.change > 0 ? "+" : ""}{metric.change}
                  </span>
                </div>
              )}
            </div>
            
            <div>
              <p className="text-2xl font-bold text-foreground mb-1">{metric.value}</p>
              <p className="text-sm font-medium text-foreground mb-1">{metric.label}</p>
              {metric.description && (
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}