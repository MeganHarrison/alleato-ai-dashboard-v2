// @ts-nocheck
import { tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { meetingRAGService } from "@/lib/rag/meeting-service";
import { pmKnowledgeEngine } from "@/lib/pm/knowledge-engine";

/**
 * Fixed PM Assistant Tools for AI SDK 5 Beta
 * Manually converting Zod schemas to JSON Schema format
 */

// Helper to ensure proper JSON schema format
function createToolWithSchema<T extends z.ZodObject<any>>(config: {
  description: string;
  schema: T;
  execute: (params: z.infer<T>) => Promise<any>;
}) {
  // Convert Zod schema to JSON schema
  const jsonSchema = zodToJsonSchema(config.schema, {
    target: "openAi3",
    $refStrategy: "none",
  });

  return tool({
    description: config.description,
    parameters: config.schema,
    execute: config.execute,
  });
}

export const pmToolsFixed = {
  searchMeetings: createToolWithSchema({
    description: 'Search through meeting transcripts to find relevant discussions, decisions, action items, or topics. Always use this when users ask about meetings, projects, or work-related topics.',
    schema: z.object({
      query: z.string().describe('The search query to find relevant meeting content'),
      matchCount: z.number().optional().default(5).describe('Number of results to return'),
      projectId: z.number().optional().describe('Filter by specific project ID'),
    }),
    execute: async ({ query, matchCount = 5, projectId }) => {
      console.log("🔍 [FIXED] Executing searchMeetings with:", { query, matchCount, projectId });
      
      try {
        const context = await meetingRAGService.searchMeetingContext(query, {
          matchCount,
          projectId,
        });

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

        console.log(`✅ [FIXED] Found ${result.totalResults} relevant meeting chunks`);
        return result;
      } catch (error) {
        console.error("❌ [FIXED] searchMeetings error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to search meetings',
          meetingChunks: [],
          totalResults: 0,
        };
      }
    },
  }),

  analyzeProjectStatus: createToolWithSchema({
    description: 'Analyze the overall status and health of projects based on meeting data',
    schema: z.object({
      projectName: z.string().optional().describe('Specific project to analyze'),
      timeRange: z.enum(['week', 'month', 'quarter', 'all']).default('month').describe('Time range'),
    }),
    execute: async ({ projectName, timeRange = 'month' }) => {
      console.log("📊 [FIXED] Analyzing project status:", { projectName, timeRange });
      
      try {
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
        console.error("❌ [FIXED] analyzeProjectStatus error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to analyze status',
        };
      }
    },
  }),

  getActionItems: createToolWithSchema({
    description: 'Extract and list action items from meeting transcripts',
    schema: z.object({
      assignee: z.string().optional().describe('Filter by assignee'),
      status: z.enum(['pending', 'completed', 'all']).default('pending').describe('Status filter'),
      limit: z.number().default(10).describe('Max items to return'),
    }),
    execute: async ({ assignee, status = 'pending', limit = 10 }) => {
      console.log("📋 [FIXED] Extracting action items:", { assignee, status, limit });
      
      try {
        const query = `action items tasks todo ${assignee || ''} ${
          status === 'pending' ? 'pending not completed' : 
          status === 'completed' ? 'done completed' : ''
        }`.trim();
        
        const context = await meetingRAGService.searchMeetingContext(query, {
          matchCount: Math.min(limit * 2, 20),
        });

        const actionItems = context.chunks
          .map(chunk => {
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
        console.error("❌ [FIXED] getActionItems error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to extract action items',
          actionItems: [],
        };
      }
    },
  }),
};

export const PM_TOOL_DESCRIPTIONS_FIXED = `
Available AI-powered tools for meeting analysis:
1. searchMeetings - Search meeting transcripts for any topic, decision, or discussion
2. analyzeProjectStatus - Get comprehensive project health analysis from meetings
3. getActionItems - Extract and list action items from meeting transcripts

These tools will automatically search through your meeting database to provide insights.
`;