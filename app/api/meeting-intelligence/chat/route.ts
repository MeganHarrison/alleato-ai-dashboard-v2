import { streamText, embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const meetingTools = {
  searchMeetings: {
    description: 'Search meetings by semantic similarity to find relevant discussions',
    parameters: z.object({
      query: z.string().describe('The search query'),
      limit: z.number().optional().default(10),
      projectId: z.string().optional().describe('Filter by project ID')
    }),
    execute: async (params: any) => {
      const { query, limit, projectId }: { query: string; limit: number; projectId?: string }) => {
      const supabase = await createClient()
      
      // Generate embedding for the query using 384 dimensions for text-embedding-3-small
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small') as any,
        value: query
      })

      // Use the search_meeting_embeddings function with 384-dimensional vectors
      const { data: embeddingResults, error } = await supabase.rpc('search_meeting_embeddings', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: limit
      })

      if (error) {
        console.error('Vector search error:', error)
        // Fallback to text search if vector search fails
        const { data: textResults } = await supabase
          .from('meeting_embeddings')
          .select(`
            meeting_id,
            chunk_index,
            content,
            metadata,
            meeting:meetings!inner(
              id,
              title,
              meeting_date,
              summary,
              project_id,
              topics,
              action_items,
              decisions,
              risks
            )
          `)
          .textSearch('content', query)
          .limit(limit)

        return textResults?.map(r => ({
          ...r,
          similarity: 0.5,
          meeting_title: (r as any).meeting?.title,
          meeting_date: (r as any).meeting?.meeting_date,
          project_id: (r as any).meeting?.project_id
        })) || []
      }

      // Enrich results with meeting details
      if (embeddingResults && embeddingResults.length > 0) {
        const meetingIds = [...new Set(embeddingResults.map((r: any) => r.meeting_id))]
        const { data: meetings } = await supabase
          .from('meetings')
          .select('*')
          .in('id', meetingIds)

        const meetingsMap = new Map(meetings?.map(m => [m.id, m]) || [])

        return embeddingResults.map((r: any) => ({
          ...r,
          meeting: meetingsMap.get(r.meeting_id),
          meeting_title: meetingsMap.get(r.meeting_id)?.title,
          meeting_date: meetingsMap.get(r.meeting_id)?.meeting_date,
          project_id: meetingsMap.get(r.meeting_id)?.project_id
        }))
      }

      return embeddingResults || []
    }
  },

  getActionItems: {
    description: 'Get action items from meetings with filters',
    parameters: z.object({
      status: z.enum(['pending', 'in_progress', 'resolved', 'all']).optional().default('pending'),
      assignedTo: z.string().optional(),
      priority: z.enum(['high', 'medium', 'low', 'all']).optional(),
      projectId: z.string().optional()
    }),
    execute: async (params: any) => {
      const { status, assignedTo, priority, projectId } = params;
      const supabase = await createClient()
      
      // First try the ai_insights table
      let query = supabase
        .from('ai_insights')
        .select(`
          *,
          meeting:meetings(title, meeting_date, project_id)
        `)
        .eq('insight_type', 'action_item')

      if (status !== 'all') {
        query = query.eq('resolved', status === 'resolved' ? 1 : 0)
      }
      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data: aiInsights } = await query.order('created_at', { ascending: false })

      // Also check the meeting_insights table
      let miQuery = supabase
        .from('meeting_insights')
        .select(`
          *,
          meeting:meetings(title, meeting_date, project_id)
        `)
        .eq('insight_type', 'action_item')

      if (status !== 'all') {
        miQuery = miQuery.eq('status', status)
      }
      if (assignedTo) {
        miQuery = miQuery.ilike('assigned_to', `%${assignedTo}%`)
      }
      if (priority && priority !== 'all') {
        miQuery = miQuery.eq('priority', priority)
      }
      if (projectId) {
        miQuery = miQuery.eq('meeting.project_id', projectId)
      }

      const { data: meetingInsights } = await miQuery.order('created_at', { ascending: false })

      // Combine and deduplicate results
      const combined = [...(aiInsights || []), ...(meetingInsights || [])]
      return combined
    }
  },

  getRisks: {
    description: 'Get identified risks from meetings',
    parameters: z.object({
      status: z.enum(['pending', 'resolved', 'all']).optional().default('pending'),
      priority: z.enum(['high', 'medium', 'low', 'critical', 'all']).optional(),
      daysBack: z.number().optional().default(30),
      projectId: z.string().optional()
    }),
    execute: async (params: any) => {
      const { status, priority, daysBack, projectId } = params;
      const supabase = await createClient()
      
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      // Query ai_insights table for risks
      let aiQuery = supabase
        .from('ai_insights')
        .select(`
          *,
          meeting:meetings(title, meeting_date, project:projects(name))
        `)
        .eq('insight_type', 'risk')
        .gte('created_at', cutoffDate.toISOString())

      if (status !== 'all') {
        aiQuery = aiQuery.eq('resolved', status === 'resolved' ? 1 : 0)
      }
      if (priority && priority !== 'all') {
        aiQuery = aiQuery.eq('severity', priority)
      }
      if (projectId) {
        aiQuery = aiQuery.eq('project_id', projectId)
      }

      const { data: aiRisks } = await aiQuery.order('severity', { ascending: false })

      // Also query meeting_insights table
      let miQuery = supabase
        .from('meeting_insights')
        .select(`
          *,
          meeting:meetings(title, meeting_date, project:projects(name))
        `)
        .eq('insight_type', 'risk')
        .gte('created_at', cutoffDate.toISOString())

      if (status !== 'all') {
        miQuery = miQuery.eq('status', status)
      }
      if (priority && priority !== 'all') {
        miQuery = miQuery.eq('priority', priority)
      }

      const { data: meetingRisks } = await miQuery.order('priority', { ascending: true })

      // Combine results
      return [...(aiRisks || []), ...(meetingRisks || [])]
    }
  },

  getMeetingSummary: {
    description: 'Get a summary of a specific meeting or recent meetings',
    parameters: z.object({
      meetingId: z.string().optional(),
      daysBack: z.number().optional().default(7)
    }),
    execute: async (params: any) => {
      const { meetingId, daysBack } = params;
      const supabase = await createClient()
      
      if (meetingId) {
        const { data } = await supabase
          .from('meetings')
          .select(`
            *,
            project:projects(name),
            insights:meeting_insights(*)
          `)
          .eq('id', meetingId)
          .single()
        
        return data
      } else {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysBack)
        
        const { data } = await supabase
          .from('meetings')
          .select(`
            *,
            project:projects(name),
            insights:meeting_insights(count)
          `)
          .gte('meeting_date', cutoffDate.toISOString())
          .order('meeting_date', { ascending: false })
          .limit(10)
        
        return data || []
      }
    }
  },

  getDecisions: {
    description: 'Get key decisions made in meetings',
    parameters: z.object({
      projectId: z.string().optional(),
      daysBack: z.number().optional().default(30)
    }),
    execute: async (params: any) => {
      const { projectId, daysBack } = params;
      const supabase = await createClient()
      
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      // Query both ai_insights and meeting_insights tables
      let aiQuery = supabase
        .from('ai_insights')
        .select(`
          *,
          meeting:meetings(title, meeting_date, project:projects(name))
        `)
        .eq('insight_type', 'decision')
        .gte('created_at', cutoffDate.toISOString())

      if (projectId) {
        aiQuery = aiQuery.eq('project_id', projectId)
      }

      const { data: aiDecisions } = await aiQuery.order('created_at', { ascending: false })

      let miQuery = supabase
        .from('meeting_insights')
        .select(`
          *,
          meeting:meetings(title, meeting_date, project:projects(name))
        `)
        .eq('insight_type', 'decision')
        .gte('created_at', cutoffDate.toISOString())

      if (projectId) {
        miQuery = miQuery.eq('meeting.project_id', projectId)
      }

      const { data: meetingDecisions } = await miQuery.order('created_at', { ascending: false })

      return [...(aiDecisions || []), ...(meetingDecisions || [])]
    }
  },

  generateInsights: {
    description: 'Generate AI insights from meeting content and store them',
    parameters: z.object({
      meetingIds: z.array(z.string()).optional().describe('Specific meeting IDs to generate insights for'),
      projectId: z.string().optional().describe('Project to associate insights with'),
      insightTypes: z.array(z.enum(['risk', 'opportunity', 'decision', 'action_item', 'strategic', 'technical'])).optional()
    }),
    execute: async (params: any) => {
      const { meetingIds, projectId, insightTypes } = params;
      const supabase = await createClient()
      
      // Determine which meetings to analyze
      let meetingsToAnalyze = []
      if (meetingIds && meetingIds.length > 0) {
        const { data } = await supabase
          .from('meetings')
          .select('*')
          .in('id', meetingIds)
        meetingsToAnalyze = data || []
      } else if (projectId) {
        const { data } = await supabase
          .from('meetings')
          .select('*')
          .eq('project_id', projectId)
          .order('meeting_date', { ascending: false })
          .limit(10)
        meetingsToAnalyze = data || []
      } else {
        // Get recent meetings if no specific filter
        const { data } = await supabase
          .from('meetings')
          .select('*')
          .order('meeting_date', { ascending: false })
          .limit(5)
        meetingsToAnalyze = data || []
      }

      const generatedInsights = []
      const typesToGenerate = insightTypes || ['risk', 'opportunity', 'decision', 'action_item']

      for (const meeting of meetingsToAnalyze) {
        // Get meeting content from embeddings
        const { data: chunks } = await supabase
          .from('meeting_embeddings')
          .select('content, metadata')
          .eq('meeting_id', meeting.id)
          .order('chunk_index')

        const meetingContent = chunks?.map(c => c.content).join('\n') || meeting.raw_transcript || meeting.summary || ''

        if (!meetingContent) continue

        // Use AI to generate insights
        const prompt = `Analyze this meeting content and identify key insights:

Meeting: ${meeting.title}
Date: ${meeting.meeting_date}

Content:
${meetingContent.substring(0, 4000)}

Generate insights for: ${typesToGenerate.join(', ')}

For each insight, provide:
- Type (risk/opportunity/decision/action_item/strategic/technical)
- Title (brief summary)
- Description (detailed explanation)
- Severity/Priority (critical/high/medium/low)
- Confidence score (0.0-1.0)`

        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are an expert meeting analyst. Generate actionable insights from meeting content.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              response_format: { type: 'json_object' },
              max_tokens: 1000
            })
          })

          const result = await response.json()
          const insights = JSON.parse(result.choices[0].message.content).insights || []

          // Store insights in ai_insights table
          for (const insight of insights) {
            const { data, error } = await supabase
              .from('ai_insights')
              .insert({
                meeting_id: meeting.id,
                project_id: projectId || meeting.project_id,
                meeting_name: meeting.title,
                project_name: meeting.project_id ? null : null, // Will be auto-populated by trigger
                insight_type: insight.type,
                title: insight.title,
                description: insight.description,
                severity: insight.severity || insight.priority,
                confidence_score: insight.confidence_score || 0.8,
                source_meetings: meeting.title,
                resolved: 0
              })
              .select()

            if (data) {
              generatedInsights.push(data[0])
            }
          }
        } catch (error) {
          console.error('Error generating insights for meeting:', meeting.id, error)
        }
      }

      return {
        success: true,
        insights_generated: generatedInsights.length,
        insights: generatedInsights
      }
    }
  }
}

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json()
    const supabase = await createClient()
    
    // Get user context
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Build context prompt based on selected context
    let contextPrompt = ''
    if (context === 'recent') {
      contextPrompt = 'Focus on meetings from the last 30 days. '
    } else if (context === 'project') {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
      contextPrompt = `Available projects: ${projects?.map(p => p.name).join(', ')}. `
    }

    const systemPrompt = `You are an intelligent meeting assistant with advanced RAG capabilities for searching and analyzing meeting content.

${contextPrompt}

Your capabilities:
1. **Vector Search**: Search through meeting transcripts using semantic similarity to find relevant discussions
2. **Action Item Tracking**: Track and manage action items across all meetings with assignee and status
3. **Risk Management**: Identify, monitor, and prioritize project risks from meeting discussions  
4. **Decision Tracking**: Extract and highlight key decisions made during meetings
5. **Insight Generation**: Generate AI insights from meeting content and store them for future reference
6. **Pattern Analysis**: Identify trends and patterns across multiple meetings
7. **Project Intelligence**: Link insights to specific projects for better project management

Available tools:
- searchMeetings: Find relevant meeting content using vector similarity search
- getActionItems: Retrieve action items with filters for status, assignee, priority
- getRisks: Get identified risks with severity levels and mitigation strategies
- getDecisions: Track key decisions made in meetings
- getMeetingSummary: Get detailed summaries of specific meetings or recent meetings
- generateInsights: Generate and store AI insights from meeting content

Response Guidelines:
- Use tools to search for actual data before making claims
- Be specific and reference actual meetings, dates, and people
- Format responses using markdown for clarity
- Include relevant metadata (assignee, priority, dates, project) 
- When insights are found, display them in a structured format
- Suggest follow-up actions or questions when relevant
- If no data is found, suggest using generateInsights to analyze meetings

Current date: ${new Date().toLocaleDateString()}

IMPORTANT: Always use the search tools first to find relevant information. Don't make assumptions without data.`

    const result = streamText({
      model: openai('gpt-4o-mini') as any,
      system: systemPrompt,
      messages,
      tools: meetingTools,
      maxSteps: 5,
      temperature: 0.3,
      onStepFinish: async (event) => {
        console.log('Step finished:', event.toolCalls)
      }
    })

    return (result as any).toDataStreamResponse()
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}