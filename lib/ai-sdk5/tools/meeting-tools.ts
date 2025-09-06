import { tool } from "ai";
import { z } from "zod";
import OpenAI from "openai";
import { queryMeetingChunks } from "@/app/actions/meeting-embedding-actions";
import { createClient } from "@/utils/supabase/server";

// Tool to search meeting content using vector similarity
export const searchMeetingsTool = tool({
  description: "Search through meeting transcripts to find relevant discussions, decisions, or topics",
  parameters: z.object({
    query: z.string().describe("The search query to find relevant meeting content"),
    matchCount: z.number().optional().default(5).describe("Number of results to return"),
    includeContext: z.boolean().optional().default(true).describe("Include surrounding context from the meeting"),
  }),
  execute: async ({ query, matchCount, includeContext }) => {
    try {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      // Generate embedding for the query
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: query,
      });
      
      const queryEmbedding = embeddingResponse.data[0].embedding;
      
      // Search meeting chunks
      const searchResult = await queryMeetingChunks(queryEmbedding, matchCount, 0.5);
      
      if (!searchResult.success) {
        return {
          error: searchResult.error,
          results: [],
        };
      }
      
      // Format results with context
      const results = searchResult.data.map((chunk: any) => ({
        content: chunk.content,
        meeting: {
          title: chunk.meeting_title,
          date: chunk.meeting_date,
          speakers: chunk.speakers,
        },
        relevance: Math.round(chunk.similarity * 100),
        type: chunk.chunk_type,
        metadata: chunk.metadata,
      }));
      
      return {
        query,
        resultsFound: results.length,
        results,
      };
    } catch (error) {
      return {
        error: `Failed to search meetings: ${error}`,
        results: [],
      };
    }
  },
});

// Tool to get meeting insights and summaries
export const getMeetingInsightsTool = tool({
  description: "Retrieve analyzed insights, action items, and key decisions from meetings",
  parameters: z.object({
    timeframe: z.enum(["recent", "week", "month", "all"]).optional().default("recent").describe("Time period to search"),
    meetingId: z.string().optional().describe("Specific meeting ID to get insights for"),
    insightType: z.enum(["summary", "action_items", "decisions", "risks", "all"]).optional().default("all"),
  }),
  execute: async ({ timeframe, meetingId, insightType }) => {
    const supabase = createClient();
    
    try {
      let query = supabase
        .from("meetings_insights")
        .select(`
          *,
          meetings (
            title,
            date,
            duration_minutes,
            attendees
          )
        `);
      
      // Filter by meeting ID if provided
      if (meetingId) {
        query = query.eq("meeting_id", meetingId);
      }
      
      // Filter by timeframe
      if (timeframe !== "all") {
        const now = new Date();
        let startDate: Date;
        
        switch (timeframe) {
          case "recent":
            startDate = new Date(now.setDate(now.getDate() - 3));
            break;
          case "week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte("created_at", startDate.toISOString());
      }
      
      // Filter by insight type if not "all"
      if (insightType !== "all") {
        query = query.eq("insight_type", insightType);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
        return {
          error: error.message,
          insights: [],
        };
      }
      
      return {
        timeframe,
        insightType,
        totalInsights: data?.length || 0,
        insights: data || [],
      };
    } catch (error) {
      return {
        error: `Failed to retrieve insights: ${error}`,
        insights: [],
      };
    }
  },
});

// Tool to analyze meeting patterns and trends
export const analyzeMeetingTrendsTool = tool({
  description: "Analyze patterns and trends across multiple meetings to identify recurring themes, issues, or opportunities",
  parameters: z.object({
    analysisType: z.enum(["topics", "sentiment", "participation", "action_completion"]).describe("Type of trend analysis to perform"),
    timeframe: z.enum(["week", "month", "quarter"]).default("month"),
    projectId: z.string().optional().describe("Filter by specific project"),
  }),
  execute: async ({ analysisType, timeframe, projectId }) => {
    const supabase = createClient();
    
    try {
      // Get meetings within timeframe
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "quarter":
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
      }
      
      let query = supabase
        .from("meetings")
        .select(`
          id,
          title,
          date,
          duration_minutes,
          attendees,
          meetings_insights (
            insight_type,
            content,
            metadata
          )
        `)
        .gte("date", startDate.toISOString())
        .order("date", { ascending: false });
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      
      const { data: meetings, error } = await query;
      
      if (error) {
        return {
          error: error.message,
          analysis: null,
        };
      }
      
      // Perform different types of analysis
      let analysis: any = {
        type: analysisType,
        timeframe,
        meetingCount: meetings?.length || 0,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
        },
      };
      
      switch (analysisType) {
        case "topics":
          // Extract common topics from meeting insights
          const topics: Record<string, number> = {};
          meetings?.forEach(meeting => {
            meeting.meetings_insights?.forEach((insight: any) => {
              if (insight.metadata?.topics) {
                insight.metadata.topics.forEach((topic: string) => {
                  topics[topic] = (topics[topic] || 0) + 1;
                });
              }
            });
          });
          analysis.topTopics = Object.entries(topics)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([topic, count]) => ({ topic, count }));
          break;
          
        case "participation":
          // Analyze attendee participation patterns
          const attendeeStats: Record<string, number> = {};
          meetings?.forEach(meeting => {
            meeting.attendees?.forEach((attendee: string) => {
              attendeeStats[attendee] = (attendeeStats[attendee] || 0) + 1;
            });
          });
          analysis.participationStats = {
            averageAttendees: meetings?.reduce((sum, m) => sum + (m.attendees?.length || 0), 0) / (meetings?.length || 1),
            mostFrequentAttendees: Object.entries(attendeeStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([name, count]) => ({ name, meetingsAttended: count })),
          };
          break;
          
        case "action_completion":
          // Analyze action items and their completion
          const actionItems = meetings?.flatMap(m => 
            m.meetings_insights?.filter((i: any) => i.insight_type === "action_items") || []
          );
          analysis.actionItemStats = {
            totalActionItems: actionItems?.length || 0,
            byMeeting: meetings?.map(m => ({
              meeting: m.title,
              date: m.date,
              actionItemCount: m.meetings_insights?.filter((i: any) => i.insight_type === "action_items").length || 0,
            })),
          };
          break;
      }
      
      return {
        analysis,
        meetingsAnalyzed: meetings?.length || 0,
      };
    } catch (error) {
      return {
        error: `Failed to analyze trends: ${error}`,
        analysis: null,
      };
    }
  },
});

// Tool to get meeting context for a specific topic or project
export const getMeetingContextTool = tool({
  description: "Get comprehensive context about meetings related to a specific topic, project, or time period",
  parameters: z.object({
    contextType: z.enum(["project", "topic", "timeline"]).describe("Type of context to retrieve"),
    value: z.string().describe("The project name, topic, or date range to get context for"),
    includeTranscripts: z.boolean().optional().default(false).describe("Include full transcript excerpts"),
  }),
  execute: async ({ contextType, value, includeTranscripts }) => {
    const supabase = createClient();
    
    try {
      let meetings;
      
      switch (contextType) {
        case "project":
          // Search for meetings related to a project
          const projectSearch = await searchMeetingsTool.execute({
            query: `project ${value} status updates progress`,
            matchCount: 10,
            includeContext: true,
          });
          
          meetings = projectSearch.results;
          break;
          
        case "topic":
          // Search for meetings discussing a specific topic
          const topicSearch = await searchMeetingsTool.execute({
            query: value,
            matchCount: 10,
            includeContext: true,
          });
          
          meetings = topicSearch.results;
          break;
          
        case "timeline":
          // Get meetings within a date range
          const { data, error } = await supabase
            .from("meetings")
            .select("*")
            .gte("date", value) // Expecting ISO date string
            .order("date", { ascending: true });
            
          if (error) throw error;
          meetings = data;
          break;
      }
      
      return {
        contextType,
        searchValue: value,
        meetingCount: meetings?.length || 0,
        context: meetings,
        includeTranscripts,
      };
    } catch (error) {
      return {
        error: `Failed to get meeting context: ${error}`,
        context: [],
      };
    }
  },
});