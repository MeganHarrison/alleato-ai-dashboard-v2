"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Flag,
  MoreVertical,
  Plus,
  Filter,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
// Remove server action import

interface ActionItem {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high"
  status: "open" | "resolved"
  createdAt: Date
  projectName?: string
}

export function ActionCommandCenter() {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const response = await fetch('/api/insights/projects')
        if (!response.ok) {
          throw new Error('Failed to fetch insights')
        }
        
        const insights = await response.json()
        
        // Filter for actionable insights (high priority unresolved items)
        const actionableInsights: ActionItem[] = insights
          .filter((insight: unknown) => 
            insight.resolved === 0 && 
            (insight.severity === 'high' || insight.insight_type === 'action')
          )
          .slice(0, 8)
          .map((insight: unknown) => ({
            id: insight.id.toString(),
            title: insight.title,
            description: insight.description,
            severity: insight.severity || 'medium',
            status: insight.resolved ? 'resolved' : 'open',
            createdAt: new Date(insight.created_at),
            projectName: insight.projects?.[0]?.name || 'Unknown Project'
          }))

        setActions(actionableInsights)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching action items:', error)
        setIsLoading(false)
      }
    }

    fetchActions()
  }, [])

  const getPriorityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      default: return 'text-blue-600'
    }
  }

  const getPriorityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      default: return 'default'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded w-16"></div>
                  <div className="h-5 bg-muted rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">No action items</h3>
            <p className="text-sm text-muted-foreground">
              High-priority action items from insights will appear here
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
          <Target className="h-5 w-5" />
          Action Items
          <Badge variant="secondary" className="ml-auto">
            {actions.filter(a => a.status === 'open').length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.id}
              className="p-3 border rounded-lg hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {action.status === 'resolved' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground leading-tight mb-1">
                    {action.title}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {action.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant={getPriorityBadge(action.severity)}>
                      {action.severity}
                    </Badge>
                    
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {action.createdAt.toLocaleDateString()}
                    </span>
                    
                    {action.projectName && (
                      <span className="text-muted-foreground">
                        • {action.projectName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Showing {actions.length} high-priority items
          </p>
        </div>
      </CardContent>
    </Card>
  )
}