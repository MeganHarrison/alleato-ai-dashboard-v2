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
  Filter
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionItem {
  id: string
  title: string
  assignee: {
    name: string
    initials: string
  }
  dueDate: Date
  priority: "high" | "medium" | "low"
  status: "todo" | "in-progress" | "blocked" | "done"
  source: {
    meeting: string
    date: Date
  }
  blockers?: string[]
  dependencies?: string[]
}

export function ActionCommandCenter() {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [filter, setFilter] = useState<"all" | "my-actions" | "overdue" | "this-week">("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching action items
    const fetchActions = async () => {
      const mockActions: ActionItem[] = [
        {
          id: "1",
          title: "Review and approve marketing budget proposal",
          assignee: { name: "John Smith", initials: "JS" },
          dueDate: new Date("2024-01-25"),
          priority: "high",
          status: "todo",
          source: { meeting: "Q2 Planning", date: new Date("2024-01-20") }
        },
        {
          id: "2",
          title: "Schedule vendor meetings for Q2",
          assignee: { name: "Sarah Miller", initials: "SM" },
          dueDate: new Date("2024-01-23"),
          priority: "medium",
          status: "in-progress",
          source: { meeting: "Vendor Review", date: new Date("2024-01-19") }
        },
        {
          id: "3",
          title: "Complete API integration documentation",
          assignee: { name: "Mike Chen", initials: "MC" },
          dueDate: new Date("2024-01-22"),
          priority: "high",
          status: "blocked",
          source: { meeting: "Tech Sync", date: new Date("2024-01-18") },
          blockers: ["Waiting for API credentials"]
        },
        {
          id: "4",
          title: "Send beta feedback survey to users",
          assignee: { name: "Emily Davis", initials: "ED" },
          dueDate: new Date("2024-01-21"),
          priority: "low",
          status: "done",
          source: { meeting: "Product Review", date: new Date("2024-01-17") }
        },
        {
          id: "5",
          title: "Prepare Q1 performance report",
          assignee: { name: "John Smith", initials: "JS" },
          dueDate: new Date("2024-01-26"),
          priority: "medium",
          status: "todo",
          source: { meeting: "Leadership Sync", date: new Date("2024-01-19") }
        },
        {
          id: "6",
          title: "Fix critical bug in payment module",
          assignee: { name: "Mike Chen", initials: "MC" },
          dueDate: new Date("2024-01-21"),
          priority: "high",
          status: "in-progress",
          source: { meeting: "Bug Triage", date: new Date("2024-01-20") }
        }
      ]
      
      setActions(mockActions)
      setIsLoading(false)
    }

    fetchActions()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const isOverdue = (date: Date) => {
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString()
  }

  const columns = [
    { id: "todo", title: "To Do", color: "border-gray-200" },
    { id: "in-progress", title: "In Progress", color: "border-blue-200" },
    { id: "blocked", title: "Blocked", color: "border-red-200" },
    { id: "done", title: "Done", color: "border-green-200" }
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Action Command Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 border rounded animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Simplified view for the dashboard
  const simplifiedView = (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Action Command Center</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {actions.filter(a => a.status !== "done").length} Active
            </Badge>
            <button className="p-1 hover:bg-white rounded transition-colors">
              <Filter className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {actions
            .filter(a => a.status !== "done")
            .sort((a, b) => {
              // Sort by priority then due date
              const priorityOrder = { high: 0, medium: 1, low: 2 }
              if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority]
              }
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            })
            .map((action) => (
              <div
                key={action.id}
                className={cn(
                  "p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                  action.status === "blocked" && "border-red-200 bg-red-50",
                  action.status === "in-progress" && "border-blue-200 bg-blue-50",
                  action.status === "todo" && "border-gray-200 bg-white"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    {getStatusIcon(action.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-2">{action.title}</p>
                      {action.blockers && action.blockers.length > 0 && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {action.blockers[0]}
                        </p>
                      )}
                    </div>
                  </div>
                  <button className="p-0.5 hover:bg-white rounded transition-colors">
                    <MoreVertical className="h-3 w-3 text-gray-500" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {action.assignee.initials}
                      </AvatarFallback>
                    </Avatar>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getPriorityColor(action.priority))}
                    >
                      <Flag className="h-3 w-3 mr-1" />
                      {action.priority}
                    </Badge>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    isOverdue(action.dueDate) ? "text-red-600" : "text-muted-foreground"
                  )}>
                    <Calendar className="h-3 w-3" />
                    {new Date(action.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <button className="w-full py-2 text-sm text-center text-muted-foreground hover:text-foreground transition-colors">
            View All Actions →
          </button>
        </div>
      </CardContent>
    </Card>
  )

  return simplifiedView
}