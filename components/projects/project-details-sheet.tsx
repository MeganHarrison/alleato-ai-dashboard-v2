"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Database } from "@/types/database.types"

type Project = Database["public"]["Tables"]["projects"]["Row"]

interface ProjectDetailsSheetProps {
  project: Project
  trigger: React.ReactNode
}

export function ProjectDetailsSheet({ project, trigger }: ProjectDetailsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col w-[400px] sm:w-[540px]">
        <SheetHeader className="gap-1">
          <SheetTitle>{project.name || "Untitled Project"}</SheetTitle>
          <SheetDescription>
            Project ID: {project["job number"] || `#${project.id}`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
          <div className="space-y-4">
            {/* Project Overview */}
            <div>
              <h3 className="font-semibold mb-2">Project Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{project.category || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phase:</span>
                  <span>{project.phase || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State:</span>
                  <span>{project.state || "N/A"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Financial Information */}
            <div>
              <h3 className="font-semibold mb-2">Financial Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Revenue:</span>
                  <span>${project["est revenue"]?.toLocaleString() || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Profit:</span>
                  <span>${project["est profit"]?.toLocaleString() || "0"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <div>
              <h3 className="font-semibold mb-2">Timeline</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span>{project["start date"] ? new Date(project["start date"]).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Completion:</span>
                  <span>{project["est completion"] ? new Date(project["est completion"]).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            {project.address && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-sm">{project.address}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Description */}
            {project.description && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm whitespace-pre-wrap">{project.description}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Edit Form */}
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" defaultValue={project.name || ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="category">Category</Label>
                  <Select defaultValue={project.category || ""}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Construction">Construction</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="phase">Phase</Label>
                  <Select defaultValue={project.phase || ""}>
                    <SelectTrigger id="phase" className="w-full">
                      <SelectValue placeholder="Select a phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="revenue">Est. Revenue</Label>
                  <Input 
                    id="revenue" 
                    type="number" 
                    defaultValue={project["est revenue"] || 0} 
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="profit">Est. Profit</Label>
                  <Input 
                    id="profit" 
                    type="number" 
                    defaultValue={project["est profit"] || 0} 
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
        <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
          <Button className="w-full">Save Changes</Button>
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}