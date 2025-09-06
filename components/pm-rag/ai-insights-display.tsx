"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  ListTodo,
  Lightbulb,
  Code,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AIInsight {
  id: number;
  meeting_id: string;
  project_id: number;
  meeting_name: string;
  project_name: string;
  insight_type: string;
  title: string;
  description: string;
  severity?: string;
  confidence_score: number;
  resolved: number;
  created_at: string;
}

const insightIcons = {
  risk: AlertTriangle,
  opportunity: TrendingUp,
  decision: CheckCircle,
  action_item: ListTodo,
  strategic: Lightbulb,
  technical: Code,
};

const severityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function AIInsightsDisplay() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pm-rag/insights");
      if (!response.ok) throw new Error("Failed to fetch insights");
      const data = await response.json();
      setInsights(data.insights || []);

      // Extract unique project names
      const uniqueProjects = [
        ...new Set(
          data.insights.map((i: AIInsight) => i.project_name).filter(Boolean)
        ),
      ];
      setProjects(uniqueProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const filteredInsights = insights.filter((insight) => {
    const projectMatch =
      selectedProject === "all" || insight.project_name === selectedProject;
    const typeMatch =
      selectedType === "all" || insight.insight_type === selectedType;
    return projectMatch && typeMatch;
  });

  const groupedInsights = filteredInsights.reduce((acc, insight) => {
    if (!acc[insight.insight_type]) {
      acc[insight.insight_type] = [];
    }
    acc[insight.insight_type].push(insight);
    return acc;
  }, {} as Record<string, AIInsight[]>);

  const resolveInsight = async (insightId: number) => {
    try {
      const response = await fetch(
        `/api/pm-rag/insights/${insightId}/resolve`,
        {
          method: "PATCH",
        }
      );
      if (!response.ok) throw new Error("Failed to resolve insight");
      await fetchInsights();
    } catch (err) {
      console.error("Error resolving insight:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project} value={project}>
                {project}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.keys(insightIcons).map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace("_", " ").charAt(0).toUpperCase() +
                  type.replace("_", " ").slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={fetchInsights} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <h3>{filteredInsights.length} Total Insights</h3>
        </div>

        <div>
          <h3>
            {filteredInsights.filter((i) => i.resolved === 0).length} Unresolved
          </h3>
        </div>

        <div>
          <h3>
            {
              filteredInsights.filter(
                (i) => i.severity === "high" || i.severity === "critical"
              ).length
            }{" "}
            High Priority
          </h3>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.keys(insightIcons).map((type) => (
            <TabsTrigger key={type} value={type}>
              {type.replace("_", " ").charAt(0).toUpperCase() +
                type.replace("_", " ").slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onResolve={resolveInsight}
            />
          ))}
        </TabsContent>

        {Object.entries(groupedInsights).map(([type, typeInsights]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            {typeInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onResolve={resolveInsight}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function InsightCard({
  insight,
  onResolve,
}: {
  insight: AIInsight;
  onResolve: (id: number) => void;
}) {
  const Icon =
    insightIcons[insight.insight_type as keyof typeof insightIcons] ||
    Lightbulb;

  return (
    <Card className={insight.resolved === 1 ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="text-lg">{insight.title}</CardTitle>
          </div>
          <div className="flex gap-2">
            {insight.severity && (
              <Badge
                className={
                  severityColors[
                    insight.severity as keyof typeof severityColors
                  ]
                }
              >
                {insight.severity}
              </Badge>
            )}
            <Badge variant={insight.resolved === 1 ? "secondary" : "default"}>
              {insight.resolved === 1 ? "Resolved" : "Open"}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {insight.meeting_name} • {insight.project_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{insight.description}</p>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Confidence: {(insight.confidence_score * 100).toFixed(0)}%
          </div>
          {insight.resolved === 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onResolve(insight.id)}
            >
              Mark Resolved
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
