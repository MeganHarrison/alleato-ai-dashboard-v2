// @ts-nocheck
// @ts-nocheck
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Target, Users, Calendar, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProjectManagerWelcomeProps {
  onSuggestionClick?: (suggestion: string) => void;
  welcomeMessage?: string;
  suggestedQuestions?: string[];
}

export function ProjectManagerWelcome({ 
  onSuggestionClick,
  welcomeMessage,
  suggestedQuestions = []
}: ProjectManagerWelcomeProps) {
  const router = useRouter();
  
  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    } else {
      // Navigate to new chat with the suggestion as prompt
      router.push(`/persistent-chat?new=true&prompt=${encodeURIComponent(suggestion)}`);
    }
  };
  // Use provided suggestions or default ones
  const defaultSuggestions = [
    {
      icon: TrendingUp,
      title: "Weekly Summary",
      query: "What were the key decisions and action items from this week's meetings?",
      category: "insights",
    },
    {
      icon: AlertCircle,
      title: "Risk Analysis",
      query: "What risks or blockers were discussed in recent meetings? What's the mitigation plan?",
      category: "risks",
    },
    {
      icon: Target,
      title: "Project Status",
      query: "Show me the current status of all active projects based on recent meeting discussions",
      category: "status",
    },
    {
      icon: Users,
      title: "Team Insights",
      query: "Analyze team participation and engagement patterns from recent meetings",
      category: "team",
    },
    {
      icon: Calendar,
      title: "Action Items",
      query: "List all open action items from the last month's meetings with owners and deadlines",
      category: "actions",
    },
    {
      icon: FileText,
      title: "Strategic Themes",
      query: "What are the recurring themes and topics across our meetings this quarter?",
      category: "strategy",
    },
  ];

  // Map suggested questions to suggestion format if provided
  const suggestions = suggestedQuestions.length > 0 
    ? suggestedQuestions.map((query, index) => ({
        icon: [TrendingUp, AlertCircle, Target, Users, Calendar, FileText][index % 6],
        title: query.split(' ').slice(0, 3).join(' ') + '...',
        query,
        category: ['insights', 'risks', 'status', 'team', 'actions', 'strategy'][index % 6],
      }))
    : defaultSuggestions;

  const categoryColors: Record<string, string> = {
    insights: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    risks: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    status: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    team: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    actions: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    strategy: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Your AI Project Manager</CardTitle>
          <CardDescription className="text-base">
            {welcomeMessage || "I analyze your meeting transcripts to provide strategic insights, track progress, and help you make data-driven decisions."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Powered by real meeting data and AI analysis</span>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What I can help you with:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Summarize key decisions and action items from any time period</li>
                <li>• Track project progress and identify blockers</li>
                <li>• Analyze team dynamics and participation patterns</li>
                <li>• Surface risks and opportunities from meeting discussions</li>
                <li>• Provide strategic recommendations based on discussion trends</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleSuggestionClick(suggestion.query)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <suggestion.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <Badge variant="secondary" className={cn("text-xs", categoryColors[suggestion.category])}>
                        {suggestion.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.query}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Try asking specific questions about your projects, teams, or timeframes. 
            I'll search through your meeting history to provide evidence-based insights.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

