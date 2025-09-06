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

interface Insight {
  id: string
  type: "decision" | "risk" | "opportunity" | "action" | "milestone"
  title: string
  description: string
  source: {
    meetingTitle: string
    date: Date
    participants: string[]
  }
  confidence: number
  impact: "high" | "medium" | "low"
  timestamp: Date
  relatedInsights: string[]
  suggestedActions: string[]
  tags: string[]
}

export function InsightsTimeline() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([])
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching insights data
    const fetchInsights = async () => {
      const mockInsights: Insight[] = [
        {
          id: "1",
          type: "decision",
          title: "Approved Q2 Budget Allocation",
          description: "Team agreed to allocate 40% of Q2 budget to marketing initiatives, with focus on digital channels and influencer partnerships.",
          source: {
            meetingTitle: "Q2 Planning Session",
            date: new Date("2024-01-20T10:00:00"),
            participants: ["John S.", "Sarah M.", "Mike R."]
          },
          confidence: 95,
          impact: "high",
          timestamp: new Date("2024-01-20T11:30:00"),
          relatedInsights: ["2", "3"],
          suggestedActions: ["Create detailed budget breakdown", "Schedule vendor meetings"],
          tags: ["budget", "marketing", "q2-planning"]
        },
        {
          id: "2",
          type: "risk",
          title: "Resource Availability Concern",
          description: "Three key team members mentioned potential conflicts with other projects in late February, which could impact delivery timeline.",
          source: {
            meetingTitle: "Sprint Planning",
            date: new Date("2024-01-19T14:00:00"),
            participants: ["Dev Team", "PM"]
          },
          confidence: 87,
          impact: "high",
          timestamp: new Date("2024-01-19T15:00:00"),
          relatedInsights: ["1"],
          suggestedActions: ["Review resource allocation", "Consider hiring contractors"],
          tags: ["resources", "timeline", "risk"]
        },
        {
          id: "3",
          type: "opportunity",
          title: "Partnership Opportunity with TechCorp",
          description: "Discussion revealed potential for strategic partnership with TechCorp for API integration, could accelerate development by 3 weeks.",
          source: {
            meetingTitle: "Stakeholder Review",
            date: new Date("2024-01-19T09:00:00"),
            participants: ["Executive Team"]
          },
          confidence: 78,
          impact: "medium",
          timestamp: new Date("2024-01-19T10:30:00"),
          relatedInsights: [],
          suggestedActions: ["Draft partnership proposal", "Schedule exploratory meeting"],
          tags: ["partnership", "integration", "opportunity"]
        },
        {
          id: "4",
          type: "milestone",
          title: "Beta Launch Successfully Completed",
          description: "Beta version launched with 500 initial users. Early feedback is overwhelmingly positive with 4.5/5 average rating.",
          source: {
            meetingTitle: "Launch Retrospective",
            date: new Date("2024-01-18T16:00:00"),
            participants: ["Product Team", "QA Team"]
          },
          confidence: 100,
          impact: "high",
          timestamp: new Date("2024-01-18T17:00:00"),
          relatedInsights: ["5"],
          suggestedActions: ["Prepare scaling plan", "Document learnings"],
          tags: ["milestone", "launch", "beta"]
        },
        {
          id: "5",
          type: "action",
          title: "Implement User Feedback System",
          description: "Team decided to implement automated feedback collection system based on beta user suggestions.",
          source: {
            meetingTitle: "Product Planning",
            date: new Date("2024-01-18T11:00:00"),
            participants: ["Product Team"]
          },
          confidence: 92,
          impact: "medium",
          timestamp: new Date("2024-01-18T12:00:00"),
          relatedInsights: ["4"],
          suggestedActions: ["Create feedback form", "Set up analytics dashboard"],
          tags: ["feedback", "product", "action-item"]
        }
      ]
      
      setInsights(mockInsights)
      setFilteredInsights(mockInsights)
      setIsLoading(false)
    }

    fetchInsights()
  }, [])

  useEffect(() => {
    if (selectedType === "all") {
      setFilteredInsights(insights)
    } else {
      setFilteredInsights(insights.filter(i => i.type === selectedType))
    }
  }, [selectedType, insights])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "decision":
        return <Target className="h-4 w-4" />
      case "risk":
        return <AlertTriangle className="h-4 w-4" />
      case "opportunity":
        return <Lightbulb className="h-4 w-4" />
      case "milestone":
        return <CheckCircle className="h-4 w-4" />
      case "action":
        return <Clock className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "decision":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "risk":
        return "bg-red-100 text-red-700 border-red-200"
      case "opportunity":
        return "bg-green-100 text-green-700 border-green-200"
      case "milestone":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "action":
        return "bg-orange-100 text-orange-700 border-orange-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const typeFilters = [
    { value: "all", label: "All Insights" },
    { value: "decision", label: "Decisions" },
    { value: "risk", label: "Risks" },
    { value: "opportunity", label: "Opportunities" },
    { value: "milestone", label: "Milestones" },
    { value: "action", label: "Actions" }
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-xl">AI Insights Timeline</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1 bg-white"
            >
              {typeFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto">
          {filteredInsights.map((insight, index) => (
            <div
              key={insight.id}
              className={cn(
                "relative p-4 border-b hover:bg-gray-50 transition-colors",
                index === 0 && "border-t"
              )}
            >
              {/* Timeline Line */}
              {index < filteredInsights.length - 1 && (
                <div className="absolute left-8 top-12 bottom-0 w-0.5 bg-gray-200" />
              )}

              <div className="flex gap-4">
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white z-10",
                  getTypeColor(insight.type)
                )}>
                  {getTypeIcon(insight.type)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant="outline" className={cn("text-xs", getTypeColor(insight.type))}>
                          {insight.type}
                        </Badge>
                        <div className={cn("w-2 h-2 rounded-full", getImpactColor(insight.impact))} 
                             title={`${insight.impact} impact`} />
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {insight.source.meetingTitle}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(insight.timestamp).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      Confidence: {insight.confidence}%
                    </span>
                  </div>

                  {/* Suggested Actions */}
                  {insight.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {insight.suggestedActions.map((action, idx) => (
                        <Button key={idx} variant="outline" size="sm" className="text-xs">
                          {action}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Bookmark">
                      <Bookmark className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Share">
                      <Share2 className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    {insight.relatedInsights.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{insight.relatedInsights.length} related
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}