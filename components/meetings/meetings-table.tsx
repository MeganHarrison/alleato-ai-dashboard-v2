'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ExternalLink, 
  FileText, 
  Users, 
  Clock, 
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Sparkles
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MeetingDetailsSheet } from './meeting-details-sheet'

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
  project?: {
    id: string
    name: string
  }
  insights?: Array<{
    count: number
  }>
  vectorized_at?: string
}

interface MeetingsTableProps {
  meetings: Meeting[]
}

export default function MeetingsTable({ meetings: initialMeetings }: MeetingsTableProps) {
  const [meetings, setMeetings] = useState(initialMeetings)
  const [searchTerm, setSearchTerm] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  // Get unique projects for filter
  const projects = Array.from(
    new Set(meetings.filter(m => m.project).map(m => m.project!.name))
  )

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesProject = projectFilter === 'all' || 
      (projectFilter === 'unassigned' && !meeting.project) ||
      meeting.project?.name === projectFilter

    return matchesSearch && matchesProject
  })

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getStorageUrl = (path: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/meetings/${path}`
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings or participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {projects.map(project => (
              <SelectItem key={project} value={project}>
                {project}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meeting</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Insights</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMeetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No meetings found
                </TableCell>
              </TableRow>
            ) : (
              filteredMeetings.map((meeting) => (
                <TableRow key={meeting.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <MeetingDetailsSheet
                      meeting={meeting}
                      trigger={
                        <div className="space-y-1 cursor-pointer">
                          <div className="font-medium hover:text-brand-500 transition-colors">
                            {meeting.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {meeting.fireflies_id}
                          </div>
                        </div>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(meeting.meeting_date), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDuration(meeting.duration_minutes)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex -space-x-2">
                        {meeting.participants.slice(0, 3).map((participant, idx) => (
                          <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {participant.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {meeting.participants.length > 3 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-background">
                            <span className="text-xs">+{meeting.participants.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {meeting.project ? (
                      <Badge variant="outline">{meeting.project.name}</Badge>
                    ) : (
                      <Badge variant="secondary">Unassigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {meeting.insights && meeting.insights[0]?.count > 0 ? (
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{meeting.insights[0].count}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <MeetingDetailsSheet
                        meeting={meeting}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(getStorageUrl(meeting.storage_path), '_blank')
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Showing {filteredMeetings.length} of {meetings.length} meetings
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span>Auto-vectorization active</span>
          </div>
        </div>
      </div>
    </div>
  )
}