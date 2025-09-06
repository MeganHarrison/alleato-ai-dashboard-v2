import { NextRequest, NextResponse } from 'next/server'
import { openai, gpt5Config } from '@/lib/ai/openai'
import { RAGSystem } from '@/lib/ai/rag'

export const runtime = 'nodejs'

// System prompt for the PM Agent
const SYSTEM_PROMPT = `You are the Ultimate PM Agent, an AI assistant specializing in project management, meeting insights, and organizational knowledge. You have access to a comprehensive knowledge base of documents, meeting transcripts, and project information.

Your capabilities include:
- Answering questions about projects, meetings, and documents
- Providing insights and summaries from meeting transcripts
- Helping with project planning and decision-making
- Identifying action items and follow-ups
- Analyzing trends and patterns across projects

Guidelines:
- Always base your answers on the provided context when available
- Cite specific sources when referencing information
- Be concise but thorough in your responses
- Highlight important action items or decisions
- If information is not available in the context, acknowledge this clearly
- Maintain a professional yet friendly tone`

export async function POST(req: NextRequest) {
  try {
    const { messages, projectId, options = {} } = await req.json()
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // Get the latest user message
    const latestMessage = messages[messages.length - 1]
    const query = latestMessage.content

    console.log(`📨 Chat request: "${query.substring(0, 50)}..."`)
    
    // Initialize RAG system
    const rag = new RAGSystem()
    
    // Search for relevant context
    const context = await rag.search(query, {
      projectId,
      searchType: options.searchType || 'hybrid',
      maxResults: options.maxResults || 10,
      maxTokens: options.maxTokens || 4000,
      minSimilarity: options.minSimilarity || 0.7,
      rerank: options.rerank !== false,
    })

    console.log(`📚 Found ${context.results.length} relevant results`)
    
    // Build messages for GPT-5
    const systemMessage = {
      role: 'system' as const,
      content: SYSTEM_PROMPT,
    }

    // Add context to the user message
    const augmentedMessage = {
      role: 'user' as const,
      content: rag.generateAugmentedPrompt(query, context),
    }

    // Include conversation history (limit to last 5 messages for context window)
    const history = messages.slice(-5, -1).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    const allMessages = [
      systemMessage,
      ...history,
      augmentedMessage,
    ]

    // Create streaming response
    const response = await openai.chat.completions.create({
      ...gpt5Config,
      messages: allMessages,
      stream: true,
    })

    // Create a ReadableStream from the OpenAI response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    // Return streaming response with sources
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Sources': JSON.stringify(context.sources),
        'X-Results-Count': context.results.length.toString(),
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    
    // Check if it's an OpenAI API error
    if (error instanceof Error) {
      if (error.message.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      if (error.message.includes('api_key')) {
        return NextResponse.json(
          { error: 'Invalid API key configuration.' },
          { status: 401 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'An error occurred processing your request.' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}