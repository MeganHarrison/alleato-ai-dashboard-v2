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
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectHealth {
  id: string
  projectName: string
  meetingCount: number
  lastActivity: Date
  healthScore: number
  riskFactors: string[]
  momentum: "accelerating" | "steady" | "slowing"
  topInsights: {
    type: "decision" | "risk" | "milestone"
    text: string
  }[]
  completion: number
}

export function ProjectHealthMatrix() {
  const [projects, setProjects] = useState<ProjectHealth[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  useEffect(() => {
    // Simulate fetching project health data
    const fetchProjectHealth = async () => {
      const mockProjects: ProjectHealth[] = [
        {
          id: "1",
          projectName: "Website Redesign",
          meetingCount: 12,
          lastActivity: new Date("2024-01-18"),
          healthScore: 85,
          riskFactors: ["Timeline tight"],
          momentum: "accelerating",
          topInsights: [
            { type: "decision", text: "Approved new design mockups" },
            { type: "milestone", text: "Completed user research phase" },
            { type: "risk", text: "Resource availability concern for Q2" }
          ],
          completion: 65
        },
        {
          id: "2",
          projectName: "Mobile App Launch",
          meetingCount: 8,
          lastActivity: new Date("2024-01-19"),
          healthScore: 92,
          riskFactors: [],
          momentum: "steady",
          topInsights: [
            { type: "milestone", text: "Beta testing started" },
            { type: "decision", text: "Launch date set for March 1st" },
            { type: "decision", text: "Marketing campaign approved" }
          ],
          completion: 78
        },
        {
          id: "3",
          projectName: "Data Migration",
          meetingCount: 15,
          lastActivity: new Date("2024-01-17"),
          healthScore: 68,
          riskFactors: ["Technical debt", "Vendor delays"],
          momentum: "slowing",
          topInsights: [
            { type: "risk", text: "API integration issues identified" },
            { type: "risk", text: "Timeline may slip by 2 weeks" },
            { type: "decision", text: "Additional resources allocated" }
          ],
          completion: 45
        },
        {
          id: "4",
          projectName: "Customer Portal",
          meetingCount: 6,
          lastActivity: new Date("2024-01-20"),
          healthScore: 78,
          riskFactors: ["Scope creep"],
          momentum: "steady",
          topInsights: [
            { type: "milestone", text: "UI/UX design finalized" },
            { type: "decision", text: "Authentication method selected" },
            { type: "risk", text: "Budget review needed" }
          ],
          completion: 55
        }
      ]
      
      setProjects(mockProjects)
      setIsLoading(false)
    }

    fetchProjectHealth()
  }, [])

  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getHealthGradient = (score: number) => {
    if (score >= 80) return "from-green-50 to-emerald-50 border-green-200"
    if (score >= 60) return "from-yellow-50 to-orange-50 border-yellow-200"
    return "from-red-50 to-pink-50 border-red-200"
  }

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case "accelerating":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "slowing":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "decision":
        return "🎯"
      case "risk":
        return "⚠️"
      case "milestone":
        return "🏆"
      default:
        return "💡"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Health Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Project Health Matrix</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {projects.length} Active Projects
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer",
                "hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br",
                getHealthGradient(project.healthScore),
                selectedProject === project.id && "ring-2 ring-purple-500"
              )}
              onClick={() => setSelectedProject(project.id === selectedProject ? null : project.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {project.projectName}
                    {getMomentumIcon(project.momentum)}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {project.meetingCount} meetings
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(project.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button className="p-1 hover:bg-white rounded transition-colors">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* Health Score */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Health Score</span>
                  <span className="text-sm font-bold">{project.healthScore}%</span>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-500", getHealthColor(project.healthScore))}
                    style={{ width: `${project.healthScore}%` }}
                  />
                </div>
              </div>

              {/* Completion Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Completion</span>
                  <span className="text-sm font-medium">{project.completion}%</span>
                </div>
                <Progress value={project.completion} className="h-1" />
              </div>

              {/* Risk Factors */}
              {project.riskFactors.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.riskFactors.map((risk, idx) => (
                    <Badge key={idx} variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {risk}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Top Insights - Show when selected */}
              {selectedProject === project.id && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Latest Insights
                  </p>
                  {project.topInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span>{getInsightIcon(insight.type)}</span>
                      <span className="flex-1">{insight.text}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 px-3 py-1 text-xs bg-white border rounded hover:bg-gray-50 transition-colors">
                      <Eye className="h-3 w-3 inline mr-1" />
                      View Details
                    </button>
                    <button className="flex-1 px-3 py-1 text-xs bg-white border rounded hover:bg-gray-50 transition-colors">
                      <FileText className="h-3 w-3 inline mr-1" />
                      Generate Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}