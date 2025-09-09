import { createClient } from '@/lib/supabase/server'
import { embed, generateText, embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'

interface MeetingMetadata {
  title: string
  date: string
  duration_minutes: number
  participants: string[]
  fireflies_id: string
  fireflies_link?: string
}

interface ChunkMetadata {
  speaker?: string
  timestamp?: string
  section?: string
  chunk_index: number
}

export class MeetingVectorizationService {
  private readonly CHUNK_SIZE = 1500
  private readonly CHUNK_OVERLAP = 200
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small'

  async processTranscript(
    storagePath: string,
    metadata?: MeetingMetadata
  ) {
    const supabase = await createClient()
    
    try {
      // Check if already processed
      const { data: existingMeeting } = await supabase
        .from('meetings')
        .select('id')
        .eq('storage_path', storagePath)
        .single()

      if (existingMeeting) {
        return { success: true, meetingId: existingMeeting.id, skipped: true }
      }

      // Download transcript from storage
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('meetings')
        .download(storagePath)

      if (downloadError) throw downloadError

      const transcriptText = await fileData.text()
      
      // Parse transcript and extract metadata if not provided
      const meetingData = metadata || this.extractMetadataFromTranscript(transcriptText)
      
      // Create meeting record
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          storage_path: storagePath,
          title: meetingData.title,
          meeting_date: meetingData.date,
          duration_minutes: meetingData.duration_minutes,
          participants: meetingData.participants,
          fireflies_id: meetingData.fireflies_id,
          fireflies_link: meetingData.fireflies_link,
          raw_transcript: transcriptText,
          summary: await this.generateSummary(transcriptText)
        })
        .select()
        .single()

      if (meetingError) throw meetingError

      // Chunk the transcript
      const chunks = this.chunkTranscript(transcriptText)
      
      // Generate embeddings for each chunk
      const embeddingsData = await Promise.all(
        chunks.map(async (chunk, index) => {
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small') as any,
            value: chunk.content
          })
          
          return {
            meeting_id: meeting.id,
            chunk_index: index,
            content: chunk.content,
            embedding: `[${embedding.join(',')}]`,
            metadata: chunk.metadata
          }
        })
      )

      // Insert embeddings
      const { error: embeddingsError } = await supabase
        .from('meeting_embeddings')
        .insert(embeddingsData)

      if (embeddingsError) throw embeddingsError

      // Generate insights
      const insights = await this.generateInsights(transcriptText, meeting.id)
      
      if (insights.length > 0) {
        const { error: insightsError } = await supabase
          .from('meeting_insights')
          .insert(insights)

        if (insightsError) throw insightsError
      }

      // Auto-assign to project
      const projectAssociation = await this.findProjectAssociation(
        transcriptText,
        meetingData
      )
      
      if (projectAssociation) {
        const { error: assocError } = await supabase
          .from('meetings')
          .update({ project_id: projectAssociation.project_id })
          .eq('id', meeting.id)

        if (!assocError) {
          await supabase
            .from('project_meeting_associations')
            .insert({
              project_id: projectAssociation.project_id,
              meeting_id: meeting.id,
              association_confidence: projectAssociation.confidence,
              association_reasoning: projectAssociation.reasoning,
              is_manual: false
            })
        }
      }

      // Update vectorization status
      await supabase
        .from('meetings')
        .update({ vectorized_at: new Date().toISOString() })
        .eq('id', meeting.id)

      return { success: true, meetingId: meeting.id }
    } catch (error) {
      // Update queue status if exists
      await supabase
        .from('meeting_vectorization_queue')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('storage_path', storagePath)
      
      throw error
    }
  }

  private chunkTranscript(text: string): Array<{ content: string; metadata: ChunkMetadata }> {
    const chunks: Array<{ content: string; metadata: ChunkMetadata }> = []
    const lines = text.split('\n')
    let currentChunk = ''
    let currentSpeaker = ''
    let chunkIndex = 0

    for (const line of lines) {
      // Extract speaker if present (format: "Speaker Name: text")
      const speakerMatch = line.match(/^([^:]+):\s*(.*)/)
      if (speakerMatch) {
        currentSpeaker = speakerMatch[1]
      }

      // Add line to current chunk
      currentChunk += line + '\n'

      // Check if chunk is large enough
      if (currentChunk.length >= this.CHUNK_SIZE) {
        // Find last sentence boundary
        const lastPeriod = currentChunk.lastIndexOf('.')
        const lastQuestion = currentChunk.lastIndexOf('?')
        const lastExclamation = currentChunk.lastIndexOf('!')
        
        const lastBoundary = Math.max(
          lastPeriod,
          lastQuestion,
          lastExclamation,
          this.CHUNK_SIZE - this.CHUNK_OVERLAP
        )

        if (lastBoundary > 0) {
          chunks.push({
            content: currentChunk.substring(0, lastBoundary + 1),
            metadata: {
              speaker: currentSpeaker,
              chunk_index: chunkIndex++
            }
          })

          // Keep overlap for context
          currentChunk = currentChunk.substring(
            Math.max(0, lastBoundary - this.CHUNK_OVERLAP)
          )
        }
      }
    }

    // Add remaining chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk,
        metadata: {
          speaker: currentSpeaker,
          chunk_index: chunkIndex
        }
      })
    }

    return chunks
  }

  private extractMetadataFromTranscript(transcript: string): MeetingMetadata {
    // Extract metadata from transcript header (Fireflies format)
    const titleMatch = transcript.match(/Title:\s*([^\n]+)/)
    const dateMatch = transcript.match(/Date:\s*([^\n]+)/)
    const durationMatch = transcript.match(/Duration:\s*(\d+)\s*minutes/)
    const participantsMatch = transcript.match(/Participants:\s*([^\n]+)/)
    const firefliesIdMatch = transcript.match(/Meeting ID:\s*([^\n]+)/)
    const firefliesLinkMatch = transcript.match(/Meeting Link:\s*([^\n]+)/)

    // Extract participants list
    const participantsText = participantsMatch?.[1] || ''
    const participants = participantsText
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)

    return {
      title: titleMatch?.[1] || 'Untitled Meeting',
      date: dateMatch?.[1] || new Date().toISOString(),
      duration_minutes: parseInt(durationMatch?.[1] || '60'),
      participants,
      fireflies_id: firefliesIdMatch?.[1] || `meeting_${Date.now()}`,
      fireflies_link: firefliesLinkMatch?.[1]
    }
  }

  private async generateSummary(transcript: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini') as any,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating concise executive summaries from meeting transcripts.'
          },
          {
            role: 'user',
            content: `Analyze this meeting transcript and provide a concise executive summary (max 300 words) highlighting:
        1. Main topics discussed
        2. Key decisions made
        3. Action items identified
        4. Important insights or concerns raised
        
        Transcript:
        ${transcript.substring(0, 8000)}`
          }
        ],
        temperature: 0.3
        // maxTokens: 500  // Commented out due to AI SDK compatibility
      })

      return text || 'No summary available'
    } catch (error) {
      return 'Summary generation failed'
    }
  }

  private async generateInsights(
    transcript: string,
    meetingId: string
  ): Promise<any[]> {
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini') as any,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing meeting transcripts and extracting actionable insights.'
          },
          {
            role: 'user',
            content: `Analyze this meeting transcript and extract actionable insights. Return a JSON array with objects containing:
        - type: "risk" | "action_item" | "decision" | "question" | "highlight"
        - content: Clear description of the insight
        - priority: "high" | "medium" | "low"
        - assigned_to: Person responsible (if mentioned)
        - due_date: Due date if mentioned (ISO format)
        
        Focus on:
        1. Project risks and blockers
        2. Clear action items with owners
        3. Important decisions that were made
        4. Open questions requiring follow-up
        5. Key highlights or achievements
        
        Transcript:
        ${transcript.substring(0, 10000)}
        
        Return only valid JSON array:`
          }
        ],
        temperature: 0.2
        // maxTokens: 1000  // Commented out due to AI SDK compatibility
      })

      const insights = JSON.parse(text || '[]')
      return insights.map((insight: any) => ({
        ...insight,
        meeting_id: meetingId,
        status: 'pending'
      }))
    } catch (error) {
      return []
    }
  }

  private async findProjectAssociation(
    transcript: string,
    metadata: MeetingMetadata
  ): Promise<{ project_id: string; confidence: number; reasoning: string } | null> {
    const supabase = await createClient()
    
    try {
      // Get all projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, description')

      if (!projects || projects.length === 0) return null

      const { text } = await generateText({
        model: openai('gpt-4o-mini') as any,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing meeting transcripts and associating them with projects.'
          },
          {
            role: 'user',
            content: `Given this meeting transcript and metadata, identify which project it most likely belongs to.
        
        Meeting Title: ${metadata.title}
        Participants: ${metadata.participants.join(', ')}
        Transcript excerpt: ${transcript.substring(0, 3000)}
        
        Available Projects:
        ${projects.map(p => `- ${p.name}: ${p.description || 'No description'} (ID: ${p.id})`).join('\n')}
        
        Return JSON with:
        - project_id: The UUID of the most relevant project (or null if no match)
        - confidence: Number between 0 and 1
        - reasoning: Brief explanation of the association
        
        Only associate if confidence > 0.6. Return valid JSON:`
          }
        ],
        temperature: 0.2
        // maxTokens: 200  // Commented out due to AI SDK compatibility
      })

      const result = JSON.parse(text || '{}')
      
      if (result.project_id && result.confidence > 0.6) {
        return {
          project_id: result.project_id,
          confidence: result.confidence,
          reasoning: result.reasoning
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }
}

// Batch processing function for cron job
export async function processVectorizationQueue() {
  const supabase = await createClient()
  const service = new MeetingVectorizationService()
  
  // Get pending items from queue
  const { data: queueItems } = await supabase
    .from('meeting_vectorization_queue')
    .select('*')
    .eq('status', 'pending')
    .lt('attempt_count', 3)
    .limit(5)

  if (!queueItems || queueItems.length === 0) {
    return
  }

  for (const item of queueItems) {
    // Update status to processing
    await supabase
      .from('meeting_vectorization_queue')
      .update({ 
        status: 'processing',
        attempt_count: item.attempt_count + 1
      })
      .eq('id', item.id)

    try {
      await service.processTranscript(
        item.storage_path,
        item.fireflies_metadata as MeetingMetadata
      )

      // Update status to completed
      await supabase
        .from('meeting_vectorization_queue')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', item.id)
    } catch (error) {
      // Update status to failed if max attempts reached
      if (item.attempt_count >= 2) {
        await supabase
          .from('meeting_vectorization_queue')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', item.id)
      } else {
        // Reset to pending for retry
        await supabase
          .from('meeting_vectorization_queue')
          .update({ status: 'pending' })
          .eq('id', item.id)
      }
    }
  }
}