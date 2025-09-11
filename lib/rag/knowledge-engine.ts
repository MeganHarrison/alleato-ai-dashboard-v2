import { MeetingContext } from "@/lib/rag/meeting-service";

export interface PMAnalysis {
  projectStatus: 'on-track' | 'at-risk' | 'delayed' | 'unknown';
  keyRisks: string[];
  actionItems: Array<{
    description: string;
    priority: 'high' | 'medium' | 'low';
    assignee?: string;
    dueDate?: string;
  }>;
  recommendations: string[];
  stakeholderInsights: string[];
}

export class PMKnowledgeEngine {
  /**
   * Analyze meeting context to provide PM insights
   */
  analyzeMeetingContext(context: MeetingContext, userQuery: string): PMAnalysis {
    const analysis: PMAnalysis = {
      projectStatus: 'unknown',
      keyRisks: [],
      actionItems: [],
      recommendations: [],
      stakeholderInsights: []
    };

    // Analyze chunks for project status indicators
    const statusIndicators = this.extractStatusIndicators(context.chunks);
    analysis.projectStatus = this.determineProjectStatus(statusIndicators);

    // Extract risks and blockers
    analysis.keyRisks = this.extractRisks(context.chunks);

    // Extract and prioritize action items
    analysis.actionItems = this.extractActionItems(context.chunks);

    // Generate recommendations based on patterns
    analysis.recommendations = this.generateRecommendations(context, analysis);

    // Extract stakeholder insights
    analysis.stakeholderInsights = this.extractStakeholderInsights(context);

    return analysis;
  }

  /**
   * Extract status indicators from meeting chunks
   */
  private extractStatusIndicators(chunks: unknown[]): Record<string, number> {
    const indicators: Record<string, number> = {
      positive: 0,
      negative: 0,
      neutral: 0
    };

    const positiveKeywords = ['on track', 'ahead of schedule', 'completed', 'successful', 'achieved'];
    const negativeKeywords = ['delayed', 'blocked', 'at risk', 'behind schedule', 'issue', 'problem'];

    chunks.forEach(chunk => {
      const content = chunk.content.toLowerCase();
      
      if (positiveKeywords.some(keyword => content.includes(keyword))) {
        indicators.positive++;
      } else if (negativeKeywords.some(keyword => content.includes(keyword))) {
        indicators.negative++;
      } else {
        indicators.neutral++;
      }
    });

    return indicators;
  }

  /**
   * Determine overall project status
   */
  private determineProjectStatus(indicators: Record<string, number>): PMAnalysis['projectStatus'] {
    const total = indicators.positive + indicators.negative + indicators.neutral;
    if (total === 0) return 'unknown';

    const negativeRatio = indicators.negative / total;
    const positiveRatio = indicators.positive / total;

    if (negativeRatio > 0.4) return 'at-risk';
    if (negativeRatio > 0.2) return 'delayed';
    if (positiveRatio > 0.6) return 'on-track';
    
    return 'on-track';
  }

  /**
   * Extract risks from meeting chunks
   */
  private extractRisks(chunks: unknown[]): string[] {
    const risks: string[] = [];
    const riskKeywords = ['risk', 'concern', 'blocker', 'issue', 'problem', 'challenge'];

    chunks.forEach(chunk => {
      const content = chunk.content.toLowerCase();
      if (riskKeywords.some(keyword => content.includes(keyword))) {
        // Extract the sentence containing the risk
        const sentences = chunk.content.split(/[.!?]+/);
        sentences.forEach((sentence: unknown) => {
          if (riskKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
            risks.push(sentence.trim());
          }
        });
      }
    });

    return [...new Set(risks)].slice(0, 5); // Return top 5 unique risks
  }

  /**
   * Extract action items from meeting chunks
   */
  private extractActionItems(chunks: unknown[]): PMAnalysis['actionItems'] {
    const actionItems: PMAnalysis['actionItems'] = [];
    const actionKeywords = ['action item', 'todo', 'task', 'will', 'need to', 'should', 'must'];

    chunks.forEach(chunk => {
      if (chunk.chunk_type === 'action_items') {
        // Direct action item chunk
        const priority = this.determinePriority(chunk.content);
        actionItems.push({
          description: chunk.content,
          priority,
          assignee: this.extractAssignee(chunk.content),
        });
      } else {
        // Look for action items in general content
        const content = chunk.content.toLowerCase();
        if (actionKeywords.some(keyword => content.includes(keyword))) {
          const priority = this.determinePriority(chunk.content);
          actionItems.push({
            description: chunk.content,
            priority,
          });
        }
      }
    });

    return actionItems.slice(0, 10); // Return top 10 action items
  }

  /**
   * Determine priority based on content
   */
  private determinePriority(content: string): 'high' | 'medium' | 'low' {
    const urgentKeywords = ['urgent', 'critical', 'asap', 'immediately', 'blocker'];
    const highKeywords = ['important', 'priority', 'key', 'essential'];
    
    const lowerContent = content.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) return 'high';
    if (highKeywords.some(keyword => lowerContent.includes(keyword))) return 'high';
    
    return 'medium';
  }

  /**
   * Extract assignee from content
   */
  private extractAssignee(content: string): string | undefined {
    // Look for patterns like "@John" or "assigned to John"
    const assigneePattern = /@(\w+)|assigned to (\w+)/i;
    const match = content.match(assigneePattern);
    return match ? (match[1] || match[2]) : undefined;
  }

  /**
   * Generate PM recommendations
   */
  private generateRecommendations(context: MeetingContext, analysis: PMAnalysis): string[] {
    const recommendations: string[] = [];

    // Based on project status
    if (analysis.projectStatus === 'at-risk') {
      recommendations.push('Schedule an urgent project review meeting');
      recommendations.push('Identify and address top 3 blockers immediately');
    }

    // Based on risks
    if (analysis.keyRisks.length > 3) {
      recommendations.push('Create a risk mitigation plan for identified issues');
    }

    // Based on action items
    const highPriorityItems = analysis.actionItems.filter(item => item.priority === 'high');
    if (highPriorityItems.length > 5) {
      recommendations.push('Too many high-priority items - consider re-prioritization');
    }

    // Based on meeting patterns
    if (context.meetings.size > 0) {
      const meetingDates = Array.from(context.meetings.values()).map(m => new Date(m.date));
      const avgGap = this.calculateAverageMeetingGap(meetingDates);
      
      if (avgGap > 14) {
        recommendations.push('Increase meeting frequency to maintain project momentum');
      }
    }

    return recommendations;
  }

  /**
   * Calculate average gap between meetings in days
   */
  private calculateAverageMeetingGap(dates: Date[]): number {
    if (dates.length < 2) return 0;
    
    dates.sort((a, b) => a.getTime() - b.getTime());
    const totalGap = 0;
    
    for (const i = 1; i < dates.length; i++) {
      totalGap += (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
    }
    
    return totalGap / (dates.length - 1);
  }

  /**
   * Extract stakeholder insights
   */
  private extractStakeholderInsights(context: MeetingContext): string[] {
    const insights: string[] = [];
    const speakerMentions = new Map<string, number>();

    // Count speaker participation
    context.chunks.forEach(chunk => {
      if (chunk.speakers && Array.isArray(chunk.speakers)) {
        chunk.speakers.forEach((speaker: unknown) => {
          const name = speaker.name || speaker;
          speakerMentions.set(name, (speakerMentions.get(name) || 0) + 1);
        });
      }
    });

    // Generate insights based on participation
    const sortedSpeakers = Array.from(speakerMentions.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedSpeakers.length > 0) {
      insights.push(`Most active participant: ${sortedSpeakers[0][0]} (${sortedSpeakers[0][1]} contributions)`);
    }

    // Look for decision makers
    const decisionChunks = context.chunks.filter(chunk => 
      chunk.chunk_type === 'decisions' || 
      chunk.content.toLowerCase().includes('decided') ||
      chunk.content.toLowerCase().includes('approved')
    );

    if (decisionChunks.length > 0) {
      insights.push(`${decisionChunks.length} key decisions made in recent meetings`);
    }

    return insights;
  }

  /**
   * Generate PM-specific prompts for different scenarios
   */
  generatePromptTemplate(scenario: 'status_update' | 'risk_assessment' | 'resource_planning' | 'stakeholder_comm'): string {
    const templates = {
      status_update: `Based on the meeting context, provide a comprehensive project status update including:
        1. Overall project health
        2. Key achievements since last update
        3. Current blockers and risks
        4. Upcoming milestones
        5. Required decisions or actions`,
      
      risk_assessment: `Analyze the meeting data to identify and assess project risks:
        1. List all identified risks with severity
        2. Potential impact on timeline and deliverables
        3. Recommended mitigation strategies
        4. Early warning indicators to monitor`,
      
      resource_planning: `Review resource allocation and capacity based on meeting discussions:
        1. Current resource utilization
        2. Identified resource gaps or conflicts
        3. Upcoming resource needs
        4. Recommendations for optimization`,
      
      stakeholder_comm: `Prepare stakeholder communication based on meeting insights:
        1. Key messages for different stakeholder groups
        2. Concerns that need addressing
        3. Success stories to highlight
        4. Action items requiring stakeholder input`
    };

    return templates[scenario];
  }
}

// Export singleton instance
export const pmKnowledgeEngine = new PMKnowledgeEngine();