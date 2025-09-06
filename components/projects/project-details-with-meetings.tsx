"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Download,
  User,
  MessageSquare,
  TrendingUp,
  Hash
} from "lucide-react"
import type { Database } from "@/types/database.types"
import { getMeetingsByProject } from "@/app/actions/meeting-actions"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Project = Database["public"]["Tables"]["projects"]["Row"]
type Meeting = Database["public"]["Tables"]["meetings"]["Row"]

interface ProjectDetailsWithMeetingsProps {
  project: Project
  trigger: React.ReactNode
}

export function ProjectDetailsWithMeetings({ project, trigger }: ProjectDetailsWithMeetingsProps) {
  const [meetings, setMeetings] = React.useState<Meeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = React.useState<Meeting | null>(null)
  const [loadingMeetings, setLoadingMeetings] = React.useState(true)

  React.useEffect(() => {
    async function fetchMeetings() {
      setLoadingMeetings(true)
      const { meetings } = await getMeetingsByProject(project.id)
      setMeetings(meetings)
      setLoadingMeetings(false)
    }
    fetchMeetings()
  }, [project.id])

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    }
    return `${mins}m`
  }

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-700"
    const lowerCategory = category.toLowerCase()
    if (lowerCategory.includes("planning")) return "bg-blue-100 text-blue-700"
    if (lowerCategory.includes("review")) return "bg-purple-100 text-purple-700"
    if (lowerCategory.includes("standup") || lowerCategory.includes("daily")) return "bg-green-100 text-green-700"
    if (lowerCategory.includes("retro")) return "bg-orange-100 text-orange-700"
    if (lowerCategory.includes("client")) return "bg-pink-100 text-pink-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col w-[600px] sm:w-[700px] p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-xl">{project.name || "Untitled Project"}</SheetTitle>
          <SheetDescription>
            Project ID: {project["job number"] || `#${project.id}`}
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="mx-6 grid w-[calc(100%-48px)] grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="meetings" className="relative">
              Meetings
              {meetings.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {meetings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="px-6 pb-6 mt-6 space-y-6">
              {/* Project Overview */}
              <div>
                <h3 className="font-semibold mb-3">Project Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{project.category || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Phase:</span>
                    <Badge variant="outline">{project.phase || "N/A"}</Badge>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">State:</span>
                    <span className="font-medium">{project.state || "N/A"}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Information */}
              <div>
                <h3 className="font-semibold mb-3">Financial Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Est. Revenue:</span>
                    <span className="font-medium text-green-600">
                      ${project["est revenue"]?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Est. Profit:</span>
                    <span className="font-medium text-blue-600">
                      ${project["est profit"]?.toLocaleString() || "0"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-medium">
                      {project["start date"] ? new Date(project["start date"]).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Est. Completion:</span>
                    <span className="font-medium">
                      {project["est completion"] ? new Date(project["est completion"]).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              {project.address && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Location</h3>
                    <p className="text-sm text-muted-foreground">{project.address}</p>
                  </div>
                </>
              )}

              {/* Description */}
              {project.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Description</h3>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {project.description}
                    </p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="meetings" className="px-6 pb-6 mt-6">
              {loadingMeetings ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-muted-foreground">Loading meetings...</div>
                </div>
              ) : meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No meetings found for this project</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMeeting ? (
                    // Meeting Detail View
                    <div className="space-y-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMeeting(null)}
                        className="mb-2"
                      >
                        ← Back to meetings
                      </Button>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            {selectedMeeting.title || "Untitled Meeting"}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(selectedMeeting.date), "MMM d, yyyy")}
                            </div>
                            {selectedMeeting.duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDuration(selectedMeeting.duration_minutes)}
                              </div>
                            )}
                            {selectedMeeting.category && (
                              <Badge className={cn("text-xs", getCategoryColor(selectedMeeting.category))}>
                                {selectedMeeting.category}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Separator />

                        {/* Participants */}
                        {selectedMeeting.participants && selectedMeeting.participants.length > 0 && (
                          <>
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Participants ({selectedMeeting.participants.length})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedMeeting.participants.map((participant, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg"
                                  >
                                    <User className="h-3 w-3" />
                                    <span className="text-sm">{participant}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <Separator />
                          </>
                        )}

                        {/* Summary */}
                        {selectedMeeting.summary && (
                          <>
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Summary
                              </h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {selectedMeeting.summary}
                              </p>
                            </div>
                            <Separator />
                          </>
                        )}

                        {/* Links */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Resources
                          </h4>
                          <div className="space-y-2">
                            {selectedMeeting.storage_bucket_path && (
                              <a
                                href={selectedMeeting.storage_bucket_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                              >
                                {selectedMeeting.storage_bucket_path.endsWith('.md') ? (
                                  <>
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">View Transcript</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm font-medium">Download File</span>
                                  </>
                                )}
                                <ChevronRight className="h-4 w-4 ml-auto" />
                              </a>
                            )}
                            {selectedMeeting.transcript_url && (
                              <a
                                href={selectedMeeting.transcript_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium">Fireflies Recording</span>
                                <ChevronRight className="h-4 w-4 ml-auto" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Metadata */}
                        {(selectedMeeting.sentiment_score || selectedMeeting.insights) && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Analytics
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {selectedMeeting.sentiment_score && (
                                  <div className="p-3 bg-secondary rounded-lg">
                                    <span className="text-xs text-muted-foreground">Sentiment Score</span>
                                    <p className="text-lg font-semibold">
                                      {(selectedMeeting.sentiment_score * 100).toFixed(0)}%
                                    </p>
                                  </div>
                                )}
                                {selectedMeeting.insights && (
                                  <div className="p-3 bg-secondary rounded-lg">
                                    <span className="text-xs text-muted-foreground">Insights</span>
                                    <p className="text-lg font-semibold">{selectedMeeting.insights}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Meetings List View
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Recent Meetings</h3>
                        <Badge variant="secondary">{meetings.length} total</Badge>
                      </div>
                      {meetings.map((meeting) => (
                        <button
                          key={meeting.id}
                          onClick={() => setSelectedMeeting(meeting)}
                          className="w-full p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium line-clamp-1">
                                {meeting.title || "Untitled Meeting"}
                              </h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(meeting.date), "MMM d, yyyy")}
                                </div>
                                {meeting.duration_minutes && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(meeting.duration_minutes)}
                                  </div>
                                )}
                                {meeting.participants && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {meeting.participants.length}
                                  </div>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                          </div>
                          {meeting.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {meeting.summary}
                            </p>
                          )}
                          {meeting.category && (
                            <Badge className={cn("text-xs", getCategoryColor(meeting.category))}>
                              {meeting.category}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <SheetFooter className="px-6 pb-6 pt-4 border-t">
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