"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CalendarIcon,
  CheckCircle2Icon,
  DollarSignIcon,
  LoaderIcon,
  MoreVerticalIcon,
  TrendingUpIcon,
  BriefcaseIcon,
  ClockIcon,
} from "lucide-react"
import type { Database } from "@/types/database.types"
import { ProjectDetailsWithMeetings } from "./project-details-with-meetings"
import { cn } from "@/lib/utils"

type Project = Database["public"]["Tables"]["projects"]["Row"]

interface ProjectsCardViewProps {
  projects: Project[]
}

export function ProjectsCardView({ projects }: ProjectsCardViewProps) {
  const getPhaseColor = (phase: string | null) => {
    switch (phase) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Planning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "On Hold":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getPhaseIcon = (phase: string | null) => {
    switch (phase) {
      case "Completed":
        return <CheckCircle2Icon className="h-4 w-4" />
      case "In Progress":
        return <LoaderIcon className="h-4 w-4 animate-spin" />
      case "Planning":
        return <ClockIcon className="h-4 w-4" />
      default:
        return <BriefcaseIcon className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "$0"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return "Not set"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const calculateProgress = (project: Project) => {
    // Simple progress calculation based on phase
    switch (project.phase) {
      case "Completed":
        return 100
      case "In Progress":
        return 60
      case "Planning":
        return 20
      default:
        return 0
    }
  }

  return (
    <div className="space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 sm:space-y-0">
      {projects.length === 0 ? (
        <div className="col-span-full">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BriefcaseIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No projects found</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first project to get started</p>
              <Button className="mt-4">
                Create Project
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        projects.map((project) => (
          <Card
            key={project.id}
            className="group relative overflow-hidden transition-all duration-200 active:scale-[0.98] touch-manipulation sm:hover:shadow-lg"
          >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${calculateProgress(project)}%` }}
              />
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <ProjectDetailsWithMeetings
                    project={project}
                    trigger={
                      <Button
                        variant="link"
                        className="p-0 h-auto font-semibold text-sm sm:text-base hover:underline text-left justify-start line-clamp-1"
                      >
                        {project.name || "Untitled Project"}
                      </Button>
                    }
                  />
                  {project["job number"] && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Job #{project["job number"]}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                    >
                      <MoreVerticalIcon className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Project</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Mobile-First Layout: Category and Phase */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {project.category || "General"}
                </Badge>
                <Badge className={cn("text-xs gap-1", getPhaseColor(project.phase))}>
                  {getPhaseIcon(project.phase)}
                  <span className="hidden sm:inline">{project.phase || "Not Started"}</span>
                  <span className="sm:hidden">{project.phase?.charAt(0) || "N"}</span>
                </Badge>
              </div>

              {/* Mobile-Optimized Financial Info */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSignIcon className="h-3 w-3" />
                    Revenue
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(project["est revenue"])}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUpIcon className="h-3 w-3" />
                    Profit
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(project["est profit"])}
                  </p>
                </div>
              </div>

              {/* Simplified Date Info for Mobile */}
              <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">Start:</span>
                </div>
                <span className="font-medium">{formatDate(project["start date"])}</span>
              </div>

              {/* Mobile-Optimized Description - Only show if space allows */}
              {project.description && (
                <div className="pt-1 sm:pt-2">
                  <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2">
                    {project.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}