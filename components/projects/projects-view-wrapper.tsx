"use client"

import * as React from "react"
import { ProjectsDataTable } from "./projects-data-table"
import { ProjectsCardView } from "./projects-card-view"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  LayoutGridIcon,
  TableIcon,
  PlusIcon,
  FilterIcon,
  SearchIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Database } from "@/types/database.types"

type Project = Database["public"]["Tables"]["projects"]["Row"]

interface ProjectsViewWrapperProps {
  projects: Project[]
  defaultView?: "card" | "table"
}

export function ProjectsViewWrapper({ 
  projects, 
  defaultView = "card" 
}: ProjectsViewWrapperProps) {
  const [view, setView] = React.useState<"card" | "table">(defaultView)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [phaseFilter, setPhaseFilter] = React.useState<string>("all")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")

  // Get unique phases and categories for filters
  const phases = React.useMemo(() => {
    const uniquePhases = new Set(projects.map(p => p.phase).filter(Boolean))
    return Array.from(uniquePhases).sort()
  }, [projects])

  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(projects.map(p => p.category).filter(Boolean))
    return Array.from(uniqueCategories).sort()
  }, [projects])

  // Filter projects based on search and filters
  const filteredProjects = React.useMemo(() => {
    const filtered = [...projects]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.name?.toLowerCase().includes(query) ||
          project["job number"]?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.category?.toLowerCase().includes(query)
      )
    }

    // Apply phase filter
    if (phaseFilter !== "all") {
      filtered = filtered.filter((project) => project.phase === phaseFilter)
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((project) => project.category === categoryFilter)
    }

    return filtered
  }, [projects, searchQuery, phaseFilter, categoryFilter])

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Header with Title and Controls */}
      <div className="flex flex-col gap-3 px-1 lg:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Projects</h2>
          <div className="flex items-center gap-2">
            {/* Desktop View Toggle */}
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(value) => value && setView(value as "card" | "table")}
              className="hidden sm:flex"
            >
              <ToggleGroupItem
                value="card"
                aria-label="Card view"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <LayoutGridIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="table"
                aria-label="Table view"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <TableIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Mobile-Optimized Add Button */}
            <Button size="sm" className="touch-manipulation active:scale-95 transition-transform px-3 py-1.5 text-xs">
              <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden lg:inline">Add Project</span>
              <span className="lg:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Mobile-First Search and Filters */}
        <div className="space-y-2">
          {/* Search Input - Full Width on Mobile */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm border-0 bg-gray-100 focus:bg-white"
            />
          </div>

          {/* Filters Row - Horizontal scroll on mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {/* Phase Filter */}
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="w-[100px] shrink-0 h-8 text-xs border-0 bg-gray-100">
                <FilterIcon className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase || 'unknown'} value={phase || 'unknown'}>
                    {phase || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[100px] shrink-0 h-8 text-xs border-0 bg-gray-100">
                <FilterIcon className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category || 'general'} value={category || 'general'}>
                    {category || 'General'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile View Toggle */}
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(value) => value && setView(value as "card" | "table")}
              className="shrink-0"
            >
              <ToggleGroupItem
                value="card"
                aria-label="Card view"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-2 h-8 border-0 bg-gray-100"
                size="sm"
              >
                <LayoutGridIcon className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="table"
                aria-label="Table view"  
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-2 h-8 border-0 bg-gray-100"
                size="sm"
              >
                <TableIcon className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Results Count */}
        {(searchQuery || phaseFilter !== "all" || categoryFilter !== "all") && (
          <div className="text-xs text-muted-foreground px-1">
            Showing {filteredProjects.length} of {projects.length} projects
            {searchQuery && ` matching "${searchQuery}"`}
            {phaseFilter !== "all" && ` in ${phaseFilter}`}
            {categoryFilter !== "all" && ` under ${categoryFilter}`}
          </div>
        )}
      </div>

      {/* View Content */}
      <div className="px-1 lg:px-6">
        {view === "card" ? (
          <ProjectsCardView projects={filteredProjects} />
        ) : (
          <div className="-mx-1 lg:-mx-6">
            <ProjectsDataTable projects={filteredProjects} />
          </div>
        )}
      </div>
    </div>
  )
}