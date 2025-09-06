'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Brain, AlertCircle, CheckCircle2, FileText, MessageSquare, Lightbulb } from 'lucide-react'
import { generateMeetingInsights, bulkGenerateInsights } from '@/app/actions/meeting-insights-actions'
import { toast } from '@/hooks/use-toast'

interface MeetingInsightsGeneratorProps {
  meetingId?: string
  onInsightsGenerated?: () => void
}

interface Insight {
  type: 'risk' | 'action_item' | 'decision' | 'question' | 'highlight' | 'blocker' | 'update'
  content: string
  priority: 'high' | 'medium' | 'low'
  assigned_to?: string
  due_date?: string
}

export default function MeetingInsightsGenerator({ 
  meetingId, 
  onInsightsGenerated 
}: MeetingInsightsGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<Insight[]>([])
  const [lastResult, setLastResult] = useState<string>('')

  const handleGenerateInsights = async (single: boolean = true) => {
    setLoading(true)
    try {
      let result
      if (single && meetingId) {
        result = await generateMeetingInsights(meetingId)
      } else {
        result = await bulkGenerateInsights()
      }

      if (result.success) {
        setInsights(result.insights || [])
        setLastResult(result.meetingId || 'Success')
        toast({
          title: 'Insights Generated',
          description: `Successfully generated ${result.insights?.length || 0} insights`,
        })
        if (onInsightsGenerated) {
          onInsightsGenerated()
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to generate insights',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'action_item': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'decision': return <FileText className="h-4 w-4 text-brand-500" />
      case 'question': return <MessageSquare className="h-4 w-4 text-yellow-500" />
      case 'highlight': return <Lightbulb className="h-4 w-4 text-purple-500" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand-500" />
              Meeting Intelligence Generator
            </CardTitle>
            <CardDescription>
              Generate AI-powered insights from meeting transcripts
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {meetingId && (
              <Button
                onClick={() => handleGenerateInsights(true)}
                disabled={loading}
                variant="outline"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate for Meeting'}
              </Button>
            )}
            <Button
              onClick={() => handleGenerateInsights(false)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bulk Generate'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {(insights.length > 0 || lastResult) && (
        <CardContent>
          {lastResult && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                {lastResult}
              </p>
            </div>
          )}
          
          {insights.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Generated Insights ({insights.length}):</h4>
              {insights.map((insight, index) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start gap-2">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {insight.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getPriorityColor(insight.priority) as any} className="text-xs">
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm">{insight.content}</p>
                      {insight.assigned_to && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned to: {insight.assigned_to}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}