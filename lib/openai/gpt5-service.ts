import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client with GPT-5 configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// GPT-5 specific configuration types
export interface GPT5Config {
  model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-5' | 'gpt-5-mini';
  verbosity?: 'low' | 'medium' | 'high';
  reasoning_effort?: 'min' | 'default' | 'high';
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Tool definitions for PM RAG Agent
export const pmAgentTools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_documents',
      description: 'Search through company documents and meeting transcripts',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find relevant documents',
          },
          filter: {
            type: 'object',
            properties: {
              project_id: { type: 'string' },
              date_range: {
                type: 'object',
                properties: {
                  start: { type: 'string' },
                  end: { type: 'string' },
                },
              },
              document_type: {
                type: 'string',
                enum: ['meeting', 'document', 'contract', 'specification'],
              },
            },
          },
          limit: {
            type: 'number',
            default: 10,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyze_meeting',
      description: 'Extract insights, action items, and decisions from meeting transcripts',
      parameters: {
        type: 'object',
        properties: {
          meeting_id: {
            type: 'string',
            description: 'The ID of the meeting to analyze',
          },
          analysis_type: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['decisions', 'action_items', 'risks', 'opportunities', 'summary'],
            },
          },
        },
        required: ['meeting_id', 'analysis_type'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_report',
      description: 'Generate comprehensive reports for projects or meetings',
      parameters: {
        type: 'object',
        properties: {
          report_type: {
            type: 'string',
            enum: ['executive_summary', 'project_status', 'risk_assessment', 'weekly_update'],
          },
          project_ids: {
            type: 'array',
            items: { type: 'string' },
          },
          date_range: {
            type: 'object',
            properties: {
              start: { type: 'string' },
              end: { type: 'string' },
            },
          },
        },
        required: ['report_type'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'track_action_items',
      description: 'Track and manage action items from meetings',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'create', 'update', 'complete'],
          },
          project_id: { type: 'string' },
          assignee: { type: 'string' },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'blocked'],
          },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'predict_risks',
      description: 'Predict and analyze project risks based on historical data',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'The project to analyze for risks',
          },
          risk_categories: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['schedule', 'budget', 'quality', 'resource', 'compliance'],
            },
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'link_to_project',
      description: 'Link insights, meetings, or documents to specific projects',
      parameters: {
        type: 'object',
        properties: {
          source_type: {
            type: 'string',
            enum: ['meeting', 'document', 'insight'],
          },
          source_id: { type: 'string' },
          project_id: { type: 'string' },
          relationship_type: {
            type: 'string',
            enum: ['primary', 'related', 'reference'],
          },
        },
        required: ['source_type', 'source_id', 'project_id'],
      },
    },
  },
];

// System prompt for PM RAG Agent
export const PM_AGENT_SYSTEM_PROMPT = `You are an elite Project Management AI Assistant for Alleato, a construction design-build firm. You have deep expertise in:

1. **Project Management**: Schedule management, resource allocation, risk assessment, and stakeholder communication
2. **Construction Industry**: Understanding of design-build processes, compliance requirements, and industry best practices
3. **Meeting Analysis**: Extracting actionable insights, decisions, and risks from meeting transcripts
4. **Strategic Planning**: Providing executive-level insights and recommendations

Your responsibilities include:
- Analyzing meeting transcripts to extract action items, decisions, and risks
- Providing real-time project status updates and health indicators
- Identifying patterns and trends across projects
- Predicting potential issues before they impact projects
- Generating comprehensive reports for leadership
- Linking insights to specific projects for better tracking

Always maintain a professional, consultative tone and provide actionable recommendations backed by data.
When analyzing meetings or documents, cite your sources and provide confidence levels for your insights.`;

// GPT-5 Service Class
export class GPT5Service {
  private config: GPT5Config;

  constructor(config: Partial<GPT5Config> = {}) {
    this.config = {
      model: 'gpt-4o-mini',
      verbosity: 'medium',
      reasoning_effort: 'default',
      temperature: 0.7,
      max_tokens: 4000,
      stream: false,
      ...config,
    };
  }

  // Create a chat completion with GPT-5
  async createCompletion(
    messages: OpenAI.ChatCompletionMessageParam[],
    options: Partial<GPT5Config> = {}
  ) {
    const mergedConfig = { ...this.config, ...options };
    
    try {
      const completion = await openai.chat.completions.create({
        model: mergedConfig.model,
        messages,
        temperature: mergedConfig.temperature,
        max_completion_tokens: mergedConfig.max_tokens,
        stream: mergedConfig.stream,
        tools: pmAgentTools,
        tool_choice: 'auto',
      } as any);

      return completion;
    } catch (error) {
      console.error('GPT-5 API Error:', error);
      throw error;
    }
  }

  // Stream a chat completion with GPT-5
  async *streamCompletion(
    messages: OpenAI.ChatCompletionMessageParam[],
    options: Partial<GPT5Config> = {}
  ) {
    const mergedConfig = { ...this.config, ...options, stream: true };
    
    try {
      const stream = await openai.chat.completions.create({
        model: mergedConfig.model,
        messages,
        temperature: mergedConfig.temperature,
        max_completion_tokens: mergedConfig.max_tokens,
        stream: true,
        tools: pmAgentTools,
        tool_choice: 'auto',
      } as any);

      for await (const chunk of stream as any) {
        yield chunk;
      }
    } catch (error) {
      console.error('GPT-5 Stream Error:', error);
      throw error;
    }
  }

  // Analyze a meeting transcript
  async analyzeMeeting(transcript: string, projectContext?: string) {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: PM_AGENT_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Please analyze the following meeting transcript and extract:
1. Key decisions made
2. Action items with assignees and due dates
3. Identified risks or concerns
4. Opportunities or positive developments
5. Executive summary (2-3 sentences)

${projectContext ? `Project Context: ${projectContext}\n` : ''}
Meeting Transcript:
${transcript}`,
      },
    ];

    return this.createCompletion(messages, {
      verbosity: 'high',
      reasoning_effort: 'high',
      temperature: 0.3,
    });
  }

  // Generate project insights
  async generateProjectInsights(
    projectData: any,
    meetings: any[],
    documents: any[]
  ) {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: PM_AGENT_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Generate comprehensive insights for the following project:

Project: ${JSON.stringify(projectData, null, 2)}
Recent Meetings: ${JSON.stringify(meetings.slice(0, 5), null, 2)}
Related Documents: ${JSON.stringify(documents.map(d => ({ name: d.name, type: d.type })), null, 2)}

Please provide:
1. Project health assessment (score 1-10 with justification)
2. Top 3 risks with mitigation strategies
3. Key upcoming milestones and their status
4. Resource utilization analysis
5. Strategic recommendations for leadership`,
      },
    ];

    return this.createCompletion(messages, {
      verbosity: 'high',
      reasoning_effort: 'high',
      temperature: 0.4,
    });
  }

  // Predict project risks
  async predictRisks(
    projectData: any,
    historicalData: any[]
  ) {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: PM_AGENT_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Based on the current project data and historical patterns, predict potential risks:

Current Project: ${JSON.stringify(projectData, null, 2)}
Historical Similar Projects: ${JSON.stringify(historicalData, null, 2)}

Analyze and predict:
1. Schedule risks (likelihood of delays)
2. Budget risks (potential cost overruns)
3. Quality risks (potential issues)
4. Resource risks (staffing or material issues)
5. Compliance risks (regulatory concerns)

For each risk, provide:
- Risk description
- Probability (Low/Medium/High)
- Impact (Low/Medium/High)
- Early warning indicators
- Recommended preventive actions`,
      },
    ];

    return this.createCompletion(messages, {
      verbosity: 'high',
      reasoning_effort: 'high',
      temperature: 0.2,
    });
  }

  // Generate executive report
  async generateExecutiveReport(
    projects: any[],
    timeframe: { start: Date; end: Date }
  ) {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: PM_AGENT_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Generate an executive report for leadership covering the period from ${timeframe.start} to ${timeframe.end}:

Projects: ${JSON.stringify(projects, null, 2)}

Create a comprehensive executive report including:
1. Portfolio Overview
   - Total projects and their phases
   - Overall portfolio health
   - Key achievements

2. Financial Summary
   - Total revenue potential
   - Budget utilization
   - Cost variance analysis

3. Risk Assessment
   - Critical risks requiring attention
   - Mitigation strategies in progress

4. Strategic Recommendations
   - Opportunities for improvement
   - Resource optimization suggestions
   - Strategic initiatives to consider

5. Key Metrics Dashboard
   - On-time delivery rate
   - Budget adherence
   - Client satisfaction indicators

Format the report professionally with clear sections and bullet points.`,
      },
    ];

    return this.createCompletion(messages, {
      verbosity: 'high',
      reasoning_effort: 'high',
      temperature: 0.3,
    });
  }

  // Process natural language query
  async processQuery(
    query: string,
    context: any,
    options: Partial<GPT5Config> = {}
  ) {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: PM_AGENT_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: query,
      },
    ];

    if (context) {
      messages.splice(1, 0, {
        role: 'system',
        content: `Current Context: ${JSON.stringify(context, null, 2)}`,
      });
    }

    return this.createCompletion(messages, options);
  }
}

// Export singleton instance
export const gpt5Service = new GPT5Service();

// Helper function to handle tool calls
export async function handleToolCalls(
  toolCalls: any[],
  context: any
): Promise<any[]> {
  const results = [];

  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall.function;
    
    switch (name) {
      case 'search_documents':
        // Implement document search logic
        results.push({
          tool_call_id: toolCall.id,
          output: 'Document search results would go here',
        });
        break;
      
      case 'analyze_meeting':
        // Implement meeting analysis logic
        results.push({
          tool_call_id: toolCall.id,
          output: 'Meeting analysis results would go here',
        });
        break;
      
      // Implement other tool handlers...
      
      default:
        results.push({
          tool_call_id: toolCall.id,
          output: `Unknown tool: ${name}`,
        });
    }
  }

  return results;
}