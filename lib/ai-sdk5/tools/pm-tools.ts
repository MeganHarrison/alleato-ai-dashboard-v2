import { tool } from "ai";
import { z } from "zod";
import { meetingRAGService } from "@/lib/rag/meeting-service";
import { pmKnowledgeEngine } from "@/lib/pm/knowledge-engine";

/**
 * PM Assistant Tools following AI SDK 5 patterns
 * Documentation: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
 * 
 * Key concepts from docs:
 * - Tools are defined using the `tool` function with Zod schemas
 * - Tools can be passed to streamText/generateText via the `tools` parameter
 * - The model decides when to invoke tools based on the conversation
 */

export const pmTools = {
  /**
   * Search through meeting transcripts using RAG
   * Based on: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#tool-with-parameters
   */
  searchMeetings: tool({
    description: 'Search through meeting transcripts to find relevant discussions, decisions, action items, or topics. Always use this when users ask about meetings, projects, or work-related topics.',
    parameters: z.object({
      query: z.string().describe('The search query to find relevant meeting content'),
      matchCount: z.number().optional().default(5).describe('Number of results to return (default: 5)'),
      projectId: z.number().optional().describe('Filter by specific project ID if known'),
    }),
    execute: async ({ query, matchCount = 5, projectId }) => {
      console.log("🔍 Executing searchMeetings tool with query:", query);
      
      try {
        const context = await meetingRAGService.searchMeetingContext(query, {
          matchCount,
          projectId,
        });

        // Analyze context with PM knowledge engine
        const pmAnalysis = pmKnowledgeEngine.analyzeMeetingContext(context, query);

        const result = {
          success: true,
          meetingChunks: context.chunks.map(chunk => ({
            content: chunk.content,
            meeting: chunk.meeting_title,
            date: chunk.meeting_date,
            similarity: chunk.similarity,
          })),
          analysis: pmAnalysis,
          insights: context.insights,
          totalResults: context.chunks.length,
        };

        console.log(`✅ Found ${result.totalResults} relevant meeting chunks`);
        return result;
      } catch (error) {
        console.error("❌ searchMeetings tool error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to search meetings',
          meetingChunks: [],
          totalResults: 0,
        };
      }
    },
  }),

  /**
   * Analyze project status from meeting data
   * Following pattern from: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#multi-step-calls
   */
  analyzeProjectStatus: tool({
    description: 'Analyze the overall status and health of projects based on meeting data',
    parameters: z.object({
      projectName: z.string().optional().describe('Specific project to analyze'),
      timeRange: z.enum(['week', 'month', 'quarter', 'all']).default('month').describe('Time range for analysis'),
    }),
    execute: async ({ projectName, timeRange = 'month' }) => {
      console.log("📊 Analyzing project status for:", projectName || "all projects");
      
      try {
        // Search for project-related meetings
        const query = projectName 
          ? `project ${projectName} status updates progress blockers risks`
          : "project status updates progress blockers risks";
          
        const context = await meetingRAGService.searchMeetingContext(query, {
          matchCount: 10,
        });

        const analysis = pmKnowledgeEngine.analyzeMeetingContext(context, query);

        return {
          success: true,
          projectName: projectName || "All Projects",
          timeRange,
          keyFindings: analysis.keyTopics || [],
          risks: analysis.riskAssessment || "No significant risks identified",
          recommendations: analysis.recommendations || [],
          meetingsAnalyzed: context.chunks.length,
        };
      } catch (error) {
        console.error("❌ analyzeProjectStatus tool error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to analyze project status',
        };
      }
    },
  }),

  /**
   * Extract action items from recent meetings
   * Pattern from: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#tool-choice
   */
  getActionItems: tool({
    description: 'Extract and list action items from meeting transcripts',
    parameters: z.object({
      assignee: z.string().optional().describe('Filter by person assigned to the action'),
      status: z.enum(['pending', 'completed', 'all']).default('pending').describe('Filter by action item status'),
      limit: z.number().default(10).describe('Maximum number of action items to return'),
    }),
    execute: async ({ assignee, status = 'pending', limit = 10 }) => {
      console.log("📋 Extracting action items, assignee:", assignee, "status:", status);
      
      try {
        const query = `action items tasks todo ${assignee || ''} ${status === 'pending' ? 'pending not completed' : status === 'completed' ? 'done completed' : ''}`.trim();
        
        const context = await meetingRAGService.searchMeetingContext(query, {
          matchCount: Math.min(limit * 2, 20), // Search more to filter later
        });

        // Extract action items from the context
        const actionItems = context.chunks
          .map(chunk => {
            // Simple extraction - in production, use NLP
            const lines = chunk.content.split('\n');
            const actions = lines.filter(line => 
              line.match(/action:|todo:|task:|will do|assigned to|owner:/i)
            );
            return actions.map(action => ({
              action: action.replace(/^.*?(:|\|)/i, '').trim(),
              meeting: chunk.meeting_title,
              date: chunk.meeting_date,
              assignee: assignee || 'TBD',
            }));
          })
          .flat()
          .slice(0, limit);

        return {
          success: true,
          actionItems,
          totalFound: actionItems.length,
          filterCriteria: { assignee, status, limit },
        };
      } catch (error) {
        console.error("❌ getActionItems tool error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to extract action items',
          actionItems: [],
        };
      }
    },
  }),
};

/**
 * Export tool descriptions for system prompts
 * Based on: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#system-prompt
 */
export const PM_TOOL_DESCRIPTIONS = `
Available tools:
1. searchMeetings - Search meeting transcripts for any topic, decision, or discussion
2. analyzeProjectStatus - Get comprehensive project health analysis
3. getActionItems - Extract and list action items from meetings

Always use these tools when users ask about:
- Meeting content, decisions, or discussions
- Project status, progress, or blockers  
- Action items, tasks, or todos
- Team performance or insights
`;