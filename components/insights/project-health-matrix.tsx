"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Activity, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  MoreVertical,
  Eye,
  FileText,
  Calendar,
  FolderOpen
} from "lucide-react"
import { cn } from "@/lib/utils"
// Remove server action import

interface ProjectHealth {
  id: string
  projectName: string
  insightCount: number
  lastActivity: Date
  healthScore: number
  riskLevel: "low" | "medium" | "high"
  status: string
  insights: {
    severity: string
    title: string
  }[]
}

export function ProjectHealthMatrix() {
  const [projects, setProjects] = useState<ProjectHealth[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProjectHealth = async () => {
      try {
        const response = await fetch('/api/insights/projects')
        if (!response.ok) {
          throw new Error('Failed to fetch project insights')
        }
        
        const insights = await response.json()
        
        // Group insights by project
        const projectMap = new Map()
        
        insights.forEach((insight: unknown) => {
          if (insight.projects && insight.projects.length > 0) {
            const project = insight.projects[0]
            const projectId = project.id.toString()
            
            if (!projectMap.has(projectId)) {
              projectMap.set(projectId, {
                id: projectId,
                projectName: project.name || 'Untitled Project',
                insightCount: 0,
                lastActivity: new Date(insight.created_at),
                insights: [],
                status: project.status || 'active'
              })
            }
            
            const projectData = projectMap.get(projectId)
            projectData.insightCount += 1
            projectData.insights.push({
              severity: insight.severity || 'medium',
              title: insight.title
            })
            
            // Update last activity if this insight is more recent
            const insightDate = new Date(insight.created_at)
            if (insightDate > projectData.lastActivity) {
              projectData.lastActivity = insightDate
            }
          }
        })

        // Convert map to array and calculate health scores
        const projectsArray: ProjectHealth[] = Array.from(projectMap.values()).map(project => {
          const highRisks = project.insights.filter((i: unknown) => i.severity === 'high').length
          const mediumRisks = project.insights.filter((i: unknown) => i.severity === 'medium').length
          
          // Simple health score calculation
          const healthScore = Math.max(20, 100 - (highRisks * 20) - (mediumRisks * 10))
          
          const riskLevel = highRisks > 2 ? 'high' : mediumRisks > 3 ? 'medium' : 'low'

          return {
            ...project,
            healthScore,
            riskLevel
          }
        })

        setProjects(projectsArray.slice(0, 6)) // Show top 6 projects
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching project health:', error)
        setIsLoading(false)
      }
    }

    fetchProjectHealth()
  }, [])

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
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
            <FolderOpen className="h-5 w-5" />
            Project Health Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project Health Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">No project data available</h3>
            <p className="text-sm text-muted-foreground">
              Project insights will appear here once meetings are analyzed
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
          <FolderOpen className="h-5 w-5" />
          Project Health Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-4 border rounded-lg hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {project.projectName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {project.insightCount} insights
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {project.lastActivity.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRiskBadgeVariant(project.riskLevel)}>
                    {project.riskLevel} risk
                  </Badge>
                  <span className={cn(
                    "text-sm font-medium",
                    getHealthColor(project.healthScore)
                  )}>
                    {project.healthScore}%
                  </span>
                </div>
              </div>

              <Progress 
                value={project.healthScore} 
                className="h-2 mb-3"
              />

              {project.insights.length > 0 && (
                <div className="space-y-1">
                  {project.insights.slice(0, 2).map((insight, index) => (
                    <p key={index} className="text-xs text-muted-foreground">
                      • {insight.title}
                    </p>
                  ))}
                  {project.insights.length > 2 && (
                    <p className="text-xs text-muted-foreground font-medium">
                      +{project.insights.length - 2} more insights
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}