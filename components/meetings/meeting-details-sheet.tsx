"use client"

import * as React from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Calendar,
  Clock,
  Users,
  FileText,
  ExternalLink,
  Sparkles,
  Download,
  Building,
  Hash,
} from "lucide-react"

interface Meeting {
  id: string
  title: string
  meeting_date: string
  duration_minutes: number
  participants: string[]
  fireflies_id: string
  fireflies_link?: string
  storage_path: string
  summary?: string
  action_items?: string[]
  key_points?: string[]
  project?: {
    id: string
    name: string
  }
  insights?: Array<{
    count: number
  }>
  vectorized_at?: string
  created_at?: string
}

interface MeetingDetailsSheetProps {
  meeting: Meeting
  trigger: React.ReactNode
}

export function MeetingDetailsSheet({ meeting, trigger }: MeetingDetailsSheetProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getStorageUrl = (path: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/meetings/${path}`
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col w-[500px] sm:w-[640px]">
        <SheetHeader className="gap-1">
          <SheetTitle className="text-xl">{meeting.title || "Untitled Meeting"}</SheetTitle>
          <SheetDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(meeting.meeting_date), "MMMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(meeting.duration_minutes)}
            </span>
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Meeting Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Meeting Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fireflies ID:</span>
                  <span className="font-mono text-xs">{meeting.fireflies_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span>{format(new Date(meeting.meeting_date), "MMM d, yyyy h:mm a")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{formatDuration(meeting.duration_minutes)}</span>
                </div>
                {meeting.project && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project:</span>
                    <Badge variant="outline">
                      <Building className="h-3 w-3 mr-1" />
                      {meeting.project.name}
                    </Badge>
                  </div>
                )}
                {meeting.insights && meeting.insights[0]?.count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insights:</span>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{meeting.insights[0].count}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Participants */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Participants ({meeting.participants.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {meeting.participants.map((participant, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {participant.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{participant}</span>
                  </div>
                ))}
              </div>
            </div>

            {meeting.summary && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Summary</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {meeting.summary}
                  </p>
                </div>
              </>
            )}

            {meeting.key_points && meeting.key_points.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Key Points</h3>
                  <ul className="space-y-2">
                    {meeting.key_points.map((point, idx) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <span className="text-brand-500 mt-1">•</span>
                        <span className="text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {meeting.action_items && meeting.action_items.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Action Items</h3>
                  <div className="space-y-2">
                    {meeting.action_items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center text-xs font-medium text-brand-600 dark:text-brand-400">
                          {idx + 1}
                        </div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div>
              <h3 className="font-semibold mb-3">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getStorageUrl(meeting.storage_path), "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Transcript
                </Button>
                {meeting.fireflies_link && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(meeting.fireflies_link, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Fireflies
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = getStorageUrl(meeting.storage_path)
                    link.download = `${meeting.title.replace(/[^a-z0-9]/gi, "_")}_transcript.txt`
                    link.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              {meeting.vectorized_at && (
                <div>Vectorized: {format(new Date(meeting.vectorized_at), "MMM d, yyyy h:mm a")}</div>
              )}
              {meeting.created_at && (
                <div>Added: {format(new Date(meeting.created_at), "MMM d, yyyy h:mm a")}</div>
              )}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="mt-auto">
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