'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Users, 
  Calendar,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface ProjectMeetingInsightsProps {
  projectId: string
  projectName?: string
}

interface Insight {
  insight_id: string
  insight_type: 'risk' | 'action_item' | 'decision' | 'question' | 'highlight'
  content: string
  priority?: 'high' | 'medium' | 'low'
  status: string
  assigned_to?: string
  due_date?: string
  meeting_id: string
  meeting_title: string
  meeting_date: string
  created_at: string
}

interface Meeting {
  id: string
  title: string
  meeting_date: string
  duration_minutes: number
  participants: string[]
  summary?: string
}

export default function ProjectMeetingInsights({ 
  projectId, 
  projectName = 'This Project' 
}: ProjectMeetingInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('insights')
  
  const supabase = createClient()

  useEffect(() => {
    fetchProjectMeetingData()
  }, [projectId])

  const fetchProjectMeetingData = async () => {
    try {
      // Fetch recent insights
      const { data: insightsData } = await supabase
        .rpc('get_recent_project_insights', {
          p_project_id: projectId,
          p_days_back: 30,
          p_limit: 20
        })

      // Fetch recent meetings
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('*')
        .eq('project_id', projectId)
        .order('meeting_date', { ascending: false })
        .limit(10)

      setInsights(insightsData || [])
      setMeetings(meetingsData || [])
    } catch (error) {
      console.error('Error fetching meeting data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'action_item': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'decision': return <FileText className="h-4 w-4 text-blue-500" />
      case 'question': return <MessageSquare className="h-4 w-4 text-yellow-500" />
      case 'highlight': return <Lightbulb className="h-4 w-4 text-purple-500" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.insight_type]) {
      acc[insight.insight_type] = []
    }
    acc[insight.insight_type].push(insight)
    return acc
  }, {} as Record<string, Insight[]>)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Meeting Intelligence</CardTitle>
            <CardDescription>
              Insights and action items from {meetings.length} recent meetings
            </CardDescription>
          </div>
          <Link href="/meeting-intelligence">
            <Button variant="outline" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {Object.entries(groupedInsights).map(([type, typeInsights]) => (
                <div key={type} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    {getInsightIcon(type)}
                    <h4 className="font-medium capitalize">
                      {type.replace('_', ' ')}s ({typeInsights.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {typeInsights.slice(0, 3).map((insight) => (
                      <div
                        key={insight.insight_id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm">{insight.content}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(insight.meeting_date), 'MMM d')}</span>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">
                                {insight.meeting_title}
                              </span>
                            </div>
                            {insight.assigned_to && (
                              <div className="flex items-center gap-1 text-xs">
                                <Users className="h-3 w-3" />
                                <span>{insight.assigned_to}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            {insight.priority && (
                              <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                                {insight.priority}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {insight.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No insights found for recent meetings
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {insights
                  .filter(i => i.insight_type === 'action_item')
                  .map((action) => (
                    <div
                      key={action.insight_id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className={`h-5 w-5 mt-0.5 ${
                          action.status === 'resolved' 
                            ? 'text-green-500' 
                            : 'text-muted-foreground'
                        }`} />
                        <div className="flex-1 space-y-2">
                          <p className={`text-sm ${
                            action.status === 'resolved' ? 'line-through opacity-60' : ''
                          }`}>
                            {action.content}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            {action.assigned_to && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{action.assigned_to}</span>
                              </div>
                            )}
                            {action.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(action.due_date), 'MMM d')}</span>
                              </div>
                            )}
                            <Badge variant={getPriorityColor(action.priority)} className="text-xs">
                              {action.priority || 'normal'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            From: {action.meeting_title}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {insights.filter(i => i.insight_type === 'action_item').length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No action items found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="meetings" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{meeting.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(meeting.meeting_date), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{meeting.participants.length} participants</span>
                          </div>
                        </div>
                        {meeting.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                            {meeting.summary}
                          </p>
                        )}
                      </div>
                      <Link href={`/meeting-intelligence?meeting=${meeting.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {meetings.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No meetings associated with this project
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}