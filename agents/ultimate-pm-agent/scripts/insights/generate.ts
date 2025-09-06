#!/usr/bin/env tsx

import { openai, gpt5Config } from '@/lib/ai/openai'
import { supabaseAdmin } from '@/lib/db/supabase'
import { DocumentProcessor } from '@/lib/vectorization/processor'
import { EmbeddingGenerator } from '@/lib/vectorization/embeddings'
import { VectorStorage } from '@/lib/vectorization/storage'

interface MeetingInsight {
  type: 'action_item' | 'decision' | 'risk' | 'question' | 'summary'
  content: string
  priority: 'high' | 'medium' | 'low'
  assignee?: string
  due_date?: string
  confidence: number
  context?: string
}

interface ProjectMatch {
  project_id: string
  project_name: string
  confidence: number
  reason: string
}

class MeetingInsightsGenerator {
  private processor: DocumentProcessor
  private embedder: EmbeddingGenerator
  private storage: VectorStorage
  private supabase: ReturnType<typeof supabaseAdmin>

  constructor() {
    this.processor = new DocumentProcessor(1500, 300) // Larger chunks for meetings
    this.embedder = new EmbeddingGenerator()
    this.storage = new VectorStorage()
    this.supabase = supabaseAdmin()
  }

  /**
   * Generate insights from a meeting transcript
   */
  async generateInsights(
    meetingId: string,
    transcript: string,
    metadata?: {
      title?: string
      date?: string
      participants?: string[]
      [key: string]: any
    }
  ): Promise<{
    insights: MeetingInsight[]
    projectMatches: ProjectMatch[]
    summary: string
  }> {
    console.log('🎙️ Generating insights for meeting:', meetingId)
    
    // Parse and chunk the transcript
    const chunks = await this.parseTranscript(transcript)
    console.log(`📝 Parsed into ${chunks.length} segments`)
    
    // Generate embeddings for chunks
    const embeddedChunks = await this.embedder.generateEmbeddings(chunks)
    
    // Store chunks in database
    await this.storage.storeMeetingChunks(embeddedChunks, meetingId, metadata)
    console.log('💾 Stored meeting chunks')
    
    // Extract insights
    const insights = await this.extractInsights(transcript, metadata)
    console.log(`💡 Extracted ${insights.length} insights`)
    
    // Generate summary
    const summary = await this.generateSummary(transcript, insights)
    console.log('📋 Generated summary')
    
    // Match to projects
    const projectMatches = await this.matchToProjects(transcript, insights)
    console.log(`🎯 Matched to ${projectMatches.length} projects`)
    
    // Store insights in database
    await this.storeInsights(meetingId, insights, projectMatches, summary)
    
    return {
      insights,
      projectMatches,
      summary,
    }
  }

  /**
   * Parse transcript into chunks with speaker identification
   */
  private async parseTranscript(transcript: string) {
    // Detect speaker patterns
    const speakerPattern = /^(\w+[\s\w]*?):\s*(.+)$/gm
    const segments = []
    let currentSpeaker = 'Unknown'
    let currentContent = ''
    let lastIndex = 0
    
    let match
    while ((match = speakerPattern.exec(transcript)) !== null) {
      // Save previous segment if exists
      if (currentContent) {
        segments.push({
          speaker: currentSpeaker,
          content: currentContent.trim(),
          startIndex: lastIndex,
          endIndex: match.index,
        })
      }
      
      currentSpeaker = match[1]
      currentContent = match[2]
      lastIndex = match.index
    }
    
    // Add final segment
    if (currentContent) {
      segments.push({
        speaker: currentSpeaker,
        content: currentContent.trim(),
        startIndex: lastIndex,
        endIndex: transcript.length,
      })
    }
    
    // If no speaker pattern found, chunk the entire transcript
    if (segments.length === 0) {
      return this.processor.chunkDocument(transcript, 'text')
    }
    
    // Convert segments to chunks
    return segments.map(seg => ({
      content: `${seg.speaker}: ${seg.content}`,
      metadata: {
        speaker: seg.speaker,
        startIndex: seg.startIndex,
        endIndex: seg.endIndex,
        type: 'transcript' as const,
        tokens: Math.ceil(seg.content.length / 4),
      }
    }))
  }

  /**
   * Extract insights using GPT-5
   */
  private async extractInsights(
    transcript: string,
    metadata?: any
  ): Promise<MeetingInsight[]> {
    const prompt = `Analyze the following meeting transcript and extract key insights.

Meeting Details:
- Title: ${metadata?.title || 'Unknown'}
- Date: ${metadata?.date || 'Unknown'}
- Participants: ${metadata?.participants?.join(', ') || 'Unknown'}

Transcript:
${transcript.substring(0, 10000)} ${transcript.length > 10000 ? '...' : ''}

Extract the following types of insights:
1. Action Items - Tasks that need to be completed
2. Decisions - Important decisions that were made
3. Risks - Potential risks or concerns raised
4. Questions - Important questions that need answers
5. Key Points - Other important information

For each insight, provide:
- Type (action_item, decision, risk, question, summary)
- Content (clear description)
- Priority (high, medium, low)
- Assignee (if mentioned)
- Due Date (if mentioned)
- Confidence (0-1)
- Context (relevant quote or context)

Return as JSON array.`

    try {
      const response = await openai.chat.completions.create({
        ...gpt5Config,
        model: 'gpt-5-nano',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        stream: false,
      })

      const content = response.choices[0]?.message?.content
      if (!content) return []

      const parsed = JSON.parse(content)
      return parsed.insights || []
    } catch (error) {
      console.error('Failed to extract insights:', error)
      return []
    }
  }

  /**
   * Generate meeting summary
   */
  private async generateSummary(
    transcript: string,
    insights: MeetingInsight[]
  ): Promise<string> {
    const prompt = `Generate a concise summary of this meeting.

Key Insights:
${insights.map(i => `- ${i.type}: ${i.content}`).join('\n')}

Transcript excerpt:
${transcript.substring(0, 5000)}

Provide a 2-3 paragraph summary covering:
1. Main topics discussed
2. Key decisions and outcomes
3. Next steps and action items`

    try {
      const response = await openai.chat.completions.create({
        ...gpt5Config,
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      })

      return response.choices[0]?.message?.content || 'Summary generation failed'
    } catch (error) {
      console.error('Failed to generate summary:', error)
      return 'Summary generation failed'
    }
  }

  /**
   * Match meeting to projects
   */
  private async matchToProjects(
    transcript: string,
    insights: MeetingInsight[]
  ): Promise<ProjectMatch[]> {
    // Get all projects from database
    const { data: projects, error } = await this.supabase
      .from('projects')
      .select('id, name, description, keywords')
      .limit(100)

    if (error || !projects || projects.length === 0) {
      console.log('No projects found for matching')
      return []
    }

    const prompt = `Match this meeting to relevant projects.

Meeting Content:
${insights.map(i => i.content).join('\n')}
${transcript.substring(0, 3000)}

Available Projects:
${projects.map(p => `- ${p.name}: ${p.description || 'No description'}`).join('\n')}

For each relevant project, provide:
- project_id
- project_name
- confidence (0-1)
- reason (why it matches)

Return as JSON array of matches.`

    try {
      const response = await openai.chat.completions.create({
        ...gpt5Config,
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        stream: false,
      })

      const content = response.choices[0]?.message?.content
      if (!content) return []

      const parsed = JSON.parse(content)
      const matches = parsed.matches || []
      
      // Validate project IDs
      return matches.filter((match: ProjectMatch) => 
        projects.some(p => p.id === match.project_id)
      )
    } catch (error) {
      console.error('Failed to match projects:', error)
      return []
    }
  }

  /**
   * Store insights in database
   */
  private async storeInsights(
    meetingId: string,
    insights: MeetingInsight[],
    projectMatches: ProjectMatch[],
    summary: string
  ) {
    // Store each insight
    for (const insight of insights) {
      const projectId = projectMatches[0]?.project_id // Use highest confidence match
      
      try {
        await this.supabase
          .from('ai_insights')
          .insert({
            meeting_id: meetingId,
            project_id: projectId,
            type: insight.type,
            content: insight.content,
            metadata: {
              priority: insight.priority,
              assignee: insight.assignee,
              due_date: insight.due_date,
              confidence: insight.confidence,
              context: insight.context,
            },
            auto_assigned: true,
          })
      } catch (error) {
        console.error('Failed to store insight:', error)
      }
    }

    // Update meeting with summary and project matches
    try {
      await this.supabase
        .from('meetings')
        .update({
          summary,
          metadata: {
            project_matches: projectMatches,
            insights_count: insights.length,
            processed_at: new Date().toISOString(),
          }
        })
        .eq('id', meetingId)
    } catch (error) {
      console.error('Failed to update meeting:', error)
    }
  }

  /**
   * Process all unprocessed meetings
   */
  async processAllMeetings() {
    const { data: meetings, error } = await this.supabase
      .from('meetings')
      .select('id, title, transcript, metadata')
      .is('summary', null)
      .limit(10)

    if (error || !meetings) {
      console.error('Failed to fetch meetings:', error)
      return
    }

    console.log(`Found ${meetings.length} unprocessed meetings`)

    for (const meeting of meetings) {
      if (!meeting.transcript) {
        console.log(`Skipping meeting ${meeting.id} - no transcript`)
        continue
      }

      try {
        await this.generateInsights(
          meeting.id,
          meeting.transcript,
          {
            title: meeting.title,
            ...meeting.metadata,
          }
        )
        console.log(`✅ Processed meeting: ${meeting.title}`)
      } catch (error) {
        console.error(`❌ Failed to process meeting ${meeting.id}:`, error)
      }
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: tsx scripts/insights/generate.ts [options]

Options:
  --meeting-id <id>    Process a specific meeting
  --all                Process all unprocessed meetings
  --transcript <file>  Process a transcript file
  --help               Show this help message

Examples:
  tsx scripts/insights/generate.ts --all
  tsx scripts/insights/generate.ts --meeting-id abc123
  tsx scripts/insights/generate.ts --transcript ./meeting.txt --meeting-id abc123
    `)
    process.exit(0)
  }
  
  const generator = new MeetingInsightsGenerator()
  
  if (args.includes('--all')) {
    await generator.processAllMeetings()
  } else if (args.includes('--meeting-id')) {
    const index = args.indexOf('--meeting-id')
    const meetingId = args[index + 1]
    
    if (args.includes('--transcript')) {
      const transcriptIndex = args.indexOf('--transcript')
      const transcriptFile = args[transcriptIndex + 1]
      const fs = await import('fs/promises')
      const transcript = await fs.readFile(transcriptFile, 'utf-8')
      
      const result = await generator.generateInsights(meetingId, transcript)
      console.log('\n📊 Results:')
      console.log(`- ${result.insights.length} insights extracted`)
      console.log(`- ${result.projectMatches.length} project matches`)
      console.log('\nSummary:')
      console.log(result.summary)
    } else {
      // Process existing meeting from database
      const { data: meeting } = await generator['supabase']
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single()
      
      if (meeting?.transcript) {
        await generator.generateInsights(meetingId, meeting.transcript, meeting.metadata)
      } else {
        console.error('Meeting not found or has no transcript')
      }
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { MeetingInsightsGenerator }