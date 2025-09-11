'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Play, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function TriggerVectorizationPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<Record<string, unknown> | null>(null)

  const triggerVectorization = async () => {
    setStatus('loading')
    setMessage('Triggering vectorization process...')
    
    try {
      const response = await fetch('/api/cron/vectorize-meetings', {
        method: 'GET',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Vectorization triggered successfully!')
        setDetails(data)
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to trigger vectorization')
      }
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/meeting-intelligence/status', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDetails((prev: unknown) => ({ ...(prev as object), status: data }))
      }
    } catch (error) {
      console.error('Status check failed:', error)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Meeting Vectorization Trigger</CardTitle>
          <CardDescription>
            Manually trigger the processing of meeting transcripts for AI search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4">
            <Button
              onClick={triggerVectorization}
              disabled={status === 'loading'}
              size="lg"
              className="w-full"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Trigger Vectorization
                </>
              )}
            </Button>

            {status === 'success' && (
              <Button
                onClick={checkStatus}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Status
              </Button>
            )}
          </div>

          {message && (
            <Alert variant={status === 'error' ? 'destructive' : 'default'}>
              {status === 'success' && <CheckCircle className="h-4 w-4" />}
              {status === 'error' && <AlertCircle className="h-4 w-4" />}
              {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {details && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">Response Details:</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Scans the meetings storage bucket for new transcripts</li>
              <li>• Adds unprocessed files to the vectorization queue</li>
              <li>• Processes up to 5 meetings at a time</li>
              <li>• Generates embeddings for AI search</li>
              <li>• Extracts insights, action items, and risks</li>
              <li>• Associates meetings with projects automatically</li>
            </ul>
          </div>

          <div className="mt-4 p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Quick Actions:</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/meeting-intelligence', '_blank')}
              >
                Open Meeting Intelligence
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/api/cron/vectorize-meetings', '_blank')}
              >
                Direct API Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}