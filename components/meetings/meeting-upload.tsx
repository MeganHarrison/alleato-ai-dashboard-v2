'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { MeetingVectorizationService } from '@/lib/services/meeting-vectorization'

export default function MeetingUpload() {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [transcriptText, setTranscriptText] = useState('')
  const [metadata, setMetadata] = useState({
    title: '',
    fireflies_id: '',
    fireflies_link: '',
    participants: ''
  })
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null
    message: string
  }>({ type: null, message: '' })

  const supabase = createClient()

  const handleFileUpload = async () => {
    if (!file && !transcriptText.trim()) {
      setStatus({
        type: 'error',
        message: 'Please select a file or paste transcript text'
      })
      return
    }

    setUploading(true)
    setStatus({ type: 'info', message: 'Uploading transcript...' })

    try {
      let storagePath = ''
      let transcriptContent = transcriptText

      if (file) {
        // Upload file to storage
        const fileName = `${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('meetings')
          .upload(fileName, file)

        if (uploadError) throw uploadError
        storagePath = uploadData.path

        // Read file content
        transcriptContent = await file.text()
      } else {
        // Create a file from text
        const fileName = `${Date.now()}_manual_upload.md`
        const blob = new Blob([transcriptText], { type: 'text/markdown' })
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('meetings')
          .upload(fileName, blob)

        if (uploadError) throw uploadError
        storagePath = uploadData.path
      }

      // Add to vectorization queue
      const { error: queueError } = await supabase
        .from('meeting_vectorization_queue')
        .insert({
          storage_path: storagePath,
          status: 'pending',
          fireflies_metadata: {
            title: metadata.title || 'Uploaded Meeting',
            fireflies_id: metadata.fireflies_id || `manual_${Date.now()}`,
            fireflies_link: metadata.fireflies_link,
            participants: metadata.participants.split(',').map(p => p.trim()).filter(Boolean),
            date: new Date().toISOString(),
            duration_minutes: 60
          }
        })

      if (queueError) throw queueError

      setStatus({
        type: 'success',
        message: 'Transcript uploaded successfully! Processing will begin shortly.'
      })

      // Trigger immediate processing
      await processTranscript(storagePath)

    } catch (error) {
      console.error('Upload error:', error)
      // Improved error handling with detailed messages
      let errorMessage = 'Upload failed'
      
      if (error instanceof Error) {
        errorMessage = error.message
        // Check for specific Supabase storage errors
        if (error.message.includes('storage')) {
          errorMessage = 'Storage error: Please check that the "meetings" bucket exists in Supabase Storage'
        } else if (error.message.includes('unauthorized') || error.message.includes('auth')) {
          errorMessage = 'Authentication error: Please sign in again'
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error: Please check your connection'
        }
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase error format
        const supabaseError = error as any
        if (supabaseError.error) {
          errorMessage = supabaseError.error
        } else if (supabaseError.message) {
          errorMessage = supabaseError.message
        } else {
          errorMessage = JSON.stringify(error)
        }
      }
      
      setStatus({
        type: 'error',
        message: errorMessage
      })
    } finally {
      setUploading(false)
    }
  }

  const processTranscript = async (storagePath: string) => {
    setProcessing(true)
    setStatus({ type: 'info', message: 'Processing and vectorizing transcript...' })

    try {
      // Trigger the vectorization API
      const response = await fetch('/api/cron/vectorize-meetings', {
        method: 'GET'
      })

      if (!response.ok) throw new Error('Processing failed')

      const result = await response.json()
      
      setStatus({
        type: 'success',
        message: `Processing complete! ${result.message}`
      })

      // Reset form
      setFile(null)
      setTranscriptText('')
      setMetadata({
        title: '',
        fireflies_id: '',
        fireflies_link: '',
        participants: ''
      })
    } catch (error) {
      console.error('Processing error:', error)
      setStatus({
        type: 'error',
        message: 'Processing failed. The transcript will be processed in the next scheduled run.'
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Meeting Transcript</CardTitle>
        <CardDescription>
          Upload a meeting transcript for immediate processing and vectorization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">Upload File</Label>
          <Input
            id="file"
            type="file"
            accept=".txt,.md,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={uploading || processing}
          />
          <p className="text-xs text-muted-foreground">
            Supported formats: TXT, MD, DOC, DOCX
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transcript">Paste Transcript</Label>
          <Textarea
            id="transcript"
            placeholder="Paste your meeting transcript here..."
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            disabled={uploading || processing}
            className="min-h-[200px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="e.g., Product Planning Meeting"
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              disabled={uploading || processing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fireflies_id">Fireflies ID</Label>
            <Input
              id="fireflies_id"
              placeholder="e.g., FF123456"
              value={metadata.fireflies_id}
              onChange={(e) => setMetadata({ ...metadata, fireflies_id: e.target.value })}
              disabled={uploading || processing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fireflies_link">Fireflies Link</Label>
            <Input
              id="fireflies_link"
              placeholder="https://app.fireflies.ai/..."
              value={metadata.fireflies_link}
              onChange={(e) => setMetadata({ ...metadata, fireflies_link: e.target.value })}
              disabled={uploading || processing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Participants</Label>
            <Input
              id="participants"
              placeholder="John Doe, Jane Smith, ..."
              value={metadata.participants}
              onChange={(e) => setMetadata({ ...metadata, participants: e.target.value })}
              disabled={uploading || processing}
            />
          </div>
        </div>

        {status.type && (
          <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
            {status.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {status.type === 'info' && <Loader2 className="h-4 w-4 animate-spin" />}
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleFileUpload}
          disabled={uploading || processing || (!file && !transcriptText.trim())}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload & Process
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}