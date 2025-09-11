import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface FirefliesTranscript {
  id: string
  title: string
  transcript_url: string
  duration: number
  date: string
  participants: string[]
  sentences?: Array<{
    text: string
    speaker_id: string
    speaker_name: string
    start_time: number
  }>
  summary?: {
    keywords?: string[]
    action_items?: string[]
    outline?: string[]
    overview?: string
    bullet_gist?: string[]
    topics_discussed?: string[]
  }
}

class FirefliesClient {
  private apiKey: string
  private baseUrl = "https://api.fireflies.ai/graphql"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async graphqlRequest(query: string, variables: Record<string, any> = {}): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ query, variables })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Fireflies API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    return data.data
  }

  async getTranscripts(limit: number = 20): Promise<FirefliesTranscript[]> {
    const query = `
      query GetTranscripts($limit: Int) {
        transcripts(limit: $limit) {
          id
          title
          transcript_url
          duration
          date
          participants
        }
      }
    `
    
    const data = await this.graphqlRequest(query, { limit })
    return data.transcripts || []
  }

  async getTranscriptById(id: string): Promise<FirefliesTranscript> {
    const query = `
      query GetTranscriptContent($id: String!) {
        transcript(id: $id) {
          id
          title
          transcript_url
          duration
          date
          participants
          sentences {
            text
            speaker_id
            speaker_name
            start_time
          }
          summary {
            keywords
            action_items
            outline
            overview
            bullet_gist
            topics_discussed
          }
        }
      }
    `
    
    const data = await this.graphqlRequest(query, { id })
    return data.transcript
  }
}

function formatTranscriptToMarkdown(transcript: FirefliesTranscript): string {
  const md = `# ${transcript.title}\n\n`
  md += `**Date:** ${new Date(transcript.date).toLocaleDateString()}\n`
  md += `**Duration:** ${Math.round(transcript.duration / 60)} minutes\n`
  md += `**Participants:** ${transcript.participants?.join(", ") || "N/A"}\n\n`
  
  if (transcript.summary) {
    if (transcript.summary.overview) {
      md += `## Overview\n${transcript.summary.overview}\n\n`
    }
    
    if (transcript.summary.keywords?.length) {
      md += `## Keywords\n${transcript.summary.keywords.join(", ")}\n\n`
    }
    
    if (transcript.summary.action_items?.length) {
      md += `## Action Items\n`
      md += transcript.summary.action_items.map(item => `- ${item}`).join("\n")
      md += "\n\n"
    }
    
    if (transcript.summary.topics_discussed?.length) {
      md += `## Topics Discussed\n`
      md += transcript.summary.topics_discussed.map(topic => `- ${topic}`).join("\n")
      md += "\n\n"
    }
  }
  
  if (transcript.sentences?.length) {
    md += `## Transcript\n\n`
    const currentSpeaker = ""
    
    for (const sentence of transcript.sentences) {
      if (sentence.speaker_name !== currentSpeaker) {
        currentSpeaker = sentence.speaker_name
        md += `\n**${currentSpeaker}:**\n`
      }
      md += `${sentence.text} `
    }
  }
  
  return md
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { limit = 20, startDate, endDate } = body
    
    // Check for Fireflies API key
    const firefliesApiKey = process.env.FIREFLIES_API_KEY
    if (!firefliesApiKey) {
      return NextResponse.json(
        { error: "Fireflies API key not configured" },
        { status: 500 }
      )
    }
    
    const client = new FirefliesClient(firefliesApiKey)
    
    // Get list of transcripts
    const transcripts = await client.getTranscripts(limit)
    
    const processedCount = 0
    const errors: string[] = []
    
    for (const transcript of transcripts) {
      try {
        // Skip if date filtering is applied
        if (startDate || endDate) {
          const transcriptDate = new Date(transcript.date)
          if (startDate && transcriptDate < new Date(startDate)) continue
          if (endDate && transcriptDate > new Date(endDate)) continue
        }
        
        // Get full transcript with content
        const fullTranscript = await client.getTranscriptById(transcript.id)
        
        // Format to markdown
        const markdown = formatTranscriptToMarkdown(fullTranscript)
        
        // Upload to Supabase Storage
        const fileName = `fireflies/${transcript.id}.md`
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, markdown, {
            contentType: "text/markdown",
            upsert: true
          })
        
        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("documents")
          .getPublicUrl(fileName)
        
        // Save to documents table with proper column mapping
        const { error: dbError } = await supabase
          .from("documents")
          .upsert({
            id: transcript.id,
            title: transcript.title,
            source: publicUrl,
            content: markdown,
            document_type: "meeting",
            meeting_date: transcript.date,
            participants: transcript.participants,
            duration_minutes: Math.round(transcript.duration / 60),
            summary: transcript.summary?.overview || null,  // Store overview in summary column
            action_items: transcript.summary?.action_items || [],  // Store action items in action_items column
            bullet_points: transcript.summary?.bullet_gist || [],  // Store bullet points in bullet_points column
            metadata: {
              fireflies_id: transcript.id,
              full_summary: transcript.summary,  // Keep complete summary in metadata
              transcript_url: transcript.transcript_url,
              topics_discussed: transcript.summary?.topics_discussed || [],
              outline: transcript.summary?.outline || [],
              shorthand_bullet: (transcript.summary as any)?.shorthand_bullet || []
            },
            tags: transcript.summary?.keywords || [],
            processing_status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (dbError) throw dbError
        
        processedCount++
      } catch (error) {
        console.error(`Error processing transcript ${transcript.id}:`, error)
        errors.push(`${transcript.id}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      transcriptsProcessed: processedCount,
      totalTranscripts: transcripts.length,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error("Fireflies sync error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync transcripts" },
      { status: 500 }
    )
  }
}