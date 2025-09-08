'use client'

import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, Users, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MeetingCardProps {
  meeting: any
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {meeting.title || 'Untitled Meeting'}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {meeting.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {meeting.summary}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {meeting.meeting_date && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(meeting.meeting_date), 'MMM dd, yyyy')}</span>
            </div>
          )}
          
          {meeting.document_type && (
            <Badge variant="secondary" className="text-xs">
              {meeting.document_type}
            </Badge>
          )}
        </div>

        {meeting.tags && meeting.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meeting.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {meeting.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{meeting.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {meeting.attendees && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{meeting.attendees} attendees</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}