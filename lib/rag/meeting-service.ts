import OpenAI from "openai";
import { queryMeetingChunksSimple } from "@/app/actions/meeting-embedding-actions-simple";
import { createServiceClient } from "@/utils/supabase/service";
import { Tables } from "@/types/database.types";

type Meeting = Tables<"meetings">;
type MeetingChunk = Tables<"meeting_chunks">;

export interface MeetingContext {
  chunks: Array<{
    content: string;
    meeting_title: string;
    meeting_date: string;
    chunk_type: string;
    similarity: number;
    metadata: unknown;
    speakers: unknown;
    meeting_id: string;
  }>;
  meetings: Map<string, Meeting>;
  insights: string[];
}

export class MeetingRAGService {
  private openai: OpenAI | null;
  private supabase: ReturnType<typeof createServiceClient>;

  constructor() {
    // Initialize OpenAI only if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      this.openai = null;
      console.warn('OpenAI API key not found - RAG features will be limited');
    }
    this.supabase = createServiceClient();
  }

  /**
   * Generate embedding for a query string
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized - API key required for embeddings');
    }
    
    const embeddingResponse = await this.openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return embeddingResponse.data[0].embedding;
  }

  /**
   * Search for relevant meeting chunks based on query
   */
  async searchMeetingContext(
    query: string,
    options: {
      matchCount?: number;
      matchThreshold?: number;
      projectId?: number;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<MeetingContext> {
    const {
      matchCount = 10,
      matchThreshold = 0.5,
      projectId,
      dateFrom,
      dateTo
    } = options;

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);

    // Search meeting chunks (using simple query as workaround)
    const searchResult = await queryMeetingChunksSimple(queryEmbedding, matchCount, matchThreshold);

    if (!searchResult.success || !searchResult.data) {
      throw new Error(searchResult.error || "Failed to search meeting chunks");
    }

    // Filter by date range if provided
    const filteredChunks = searchResult.data;
    if (dateFrom || dateTo) {
      filteredChunks = filteredChunks.filter(chunk => {
        const chunkDate = new Date(chunk.meeting_date);
        if (dateFrom && chunkDate < new Date(dateFrom)) return false;
        if (dateTo && chunkDate > new Date(dateTo)) return false;
        return true;
      });
    }

    // Get unique meeting IDs
    const meetingIds = [...new Set(filteredChunks.map(chunk => chunk.metadata?.meeting_id))].filter(Boolean);

    // Fetch full meeting details
    const meetings = new Map<string, Meeting>();
    if (meetingIds.length > 0) {
      const { data: meetingData } = await this.supabase
        .from("meetings")
        .select("*")
        .in("id", meetingIds);

      meetingData?.forEach(meeting => {
        meetings.set(meeting.id, meeting);
      });
    }

    // Extract insights from the chunks
    const insights = await this.extractInsights(filteredChunks, query);

    return {
      chunks: filteredChunks.map((chunk: unknown) => ({
        ...chunk,
        meeting_id: chunk.metadata?.meeting_id || '',
      })),
      meetings,
      insights
    };
  }

  /**
   * Extract actionable insights from meeting chunks
   */
  private async extractInsights(chunks: unknown[], query: string): Promise<string[]> {
    const insights: string[] = [];
    
    // Group chunks by type
    const chunksByType = chunks.reduce((acc, chunk) => {
      const type = chunk.chunk_type || 'general';
      if (!acc[type]) acc[type] = [];
      acc[type].push(chunk);
      return acc;
    }, {} as Record<string, any[]>);

    // Extract insights based on chunk types
    if (chunksByType.action_items) {
      insights.push(`Found ${chunksByType.action_items.length} action items related to "${query}"`);
    }
    
    if (chunksByType.decisions) {
      insights.push(`Found ${chunksByType.decisions.length} decisions related to "${query}"`);
    }
    
    if (chunksByType.risks) {
      insights.push(`Found ${chunksByType.risks.length} risks or blockers related to "${query}"`);
    }

    // Analyze sentiment trends
    const sentimentScores = chunks
      .map(chunk => chunk.metadata?.sentiment_score)
      .filter(score => typeof score === 'number');
    
    if (sentimentScores.length > 0) {
      const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
      if (avgSentiment < 0.3) {
        insights.push("⚠️ Overall negative sentiment detected in related discussions");
      } else if (avgSentiment > 0.7) {
        insights.push("✅ Overall positive sentiment in related discussions");
      }
    }

    return insights;
  }

  /**
   * Get meeting summary with project context
   */
  async getMeetingSummary(meetingId: string): Promise<{
    meeting: Meeting;
    summary: unknown;
    actionItems: unknown[];
    participants: string[];
  } | null> {
    const { data: meeting } = await this.supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .single();

    if (!meeting) return null;

    const { data: summary } = await this.supabase
      .from("meeting_summaries")
      .select("*")
      .eq("meeting_id", meetingId)
      .single();

    return {
      meeting,
      summary,
      actionItems: (summary?.action_items as any) || [],
      participants: meeting.participants || []
    };
  }

  /**
   * Analyze project health based on meeting data
   */
  async analyzeProjectHealth(projectId: number): Promise<{
    health: 'good' | 'warning' | 'critical';
    indicators: string[];
    recommendations: string[];
  }> {
    // Get recent meetings for the project
    const { data: meetings } = await this.supabase
      .from("meetings")
      .select("*")
      .eq("project_id", projectId)
      .order("date", { ascending: false })
      .limit(10);

    if (!meetings || meetings.length === 0) {
      return {
        health: 'warning',
        indicators: ['No recent meetings found'],
        recommendations: ['Schedule regular project meetings']
      };
    }

    const indicators: string[] = [];
    const recommendations: string[] = [];
    const healthScore = 100;

    // Check meeting frequency
    const daysSinceLastMeeting = Math.floor(
      (Date.now() - new Date(meetings[0].date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastMeeting > 14) {
      healthScore -= 20;
      indicators.push(`No meetings in the last ${daysSinceLastMeeting} days`);
      recommendations.push('Schedule a project sync meeting');
    }

    // Check sentiment trends
    const avgSentiment = meetings.reduce((sum, m) => sum + (m.sentiment_score || 0.5), 0) / meetings.length;
    if (avgSentiment < 0.4) {
      healthScore -= 30;
      indicators.push('Low sentiment in recent meetings');
      recommendations.push('Address team concerns and blockers');
    }

    // Check for unresolved insights
    const { data: unresolvedInsights } = await this.supabase
      .from("ai_insights")
      .select("*")
      .eq("project_id", projectId)
      .eq("resolved", 0);

    if (unresolvedInsights && unresolvedInsights.length > 5) {
      healthScore -= 20;
      indicators.push(`${unresolvedInsights.length} unresolved issues`);
      recommendations.push('Review and address pending issues');
    }

    return {
      health: healthScore >= 70 ? 'good' : healthScore >= 40 ? 'warning' : 'critical',
      indicators,
      recommendations
    };
  }
}

// Export singleton instance
export const meetingRAGService = new MeetingRAGService();