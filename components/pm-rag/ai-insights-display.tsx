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
  FolderOpen,
  ChevronDown,
  ChevronRight,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [loading] = useState($2);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [projects, setProjects] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");

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

  // Group insights by project
  const insightsByProject = filteredInsights.reduce((acc, insight) => {
    const projectName = insight.project_name || "No Project";
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(insight);
    return acc;
  }, {} as Record<string, AIInsight[]>);

  const toggleProject = (projectName: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectName)) {
      newExpanded.delete(projectName);
    } else {
      newExpanded.add(projectName);
    }
    setExpandedProjects(newExpanded);
  };

  const expandAllProjects = () => {
    setExpandedProjects(new Set(Object.keys(insightsByProject)));
  };

  const collapseAllProjects = () => {
    setExpandedProjects(new Set());
  };

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
      <div className="flex gap-4 mb-4 flex-wrap">
        <Select value={viewMode} onValueChange={(value: "grouped" | "flat") => setViewMode(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="View mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grouped">Group by Project</SelectItem>
            <SelectItem value="flat">Flat View</SelectItem>
          </SelectContent>
        </Select>

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

        {viewMode === "grouped" && (
          <>
            <Button onClick={expandAllProjects} variant="outline" size="sm">
              Expand All
            </Button>
            <Button onClick={collapseAllProjects} variant="outline" size="sm">
              Collapse All
            </Button>
          </>
        )}

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

      {viewMode === "grouped" ? (
        // Grouped by Project View
        <div className="space-y-4">
          {Object.entries(insightsByProject).map(([projectName, projectInsights]) => (
            <Card key={projectName} className="overflow-hidden">
              <Collapsible
                open={expandedProjects.has(projectName)}
                onOpenChange={() => toggleProject(projectName)}
              >
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedProjects.has(projectName) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{projectName}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {projectInsights.length} insights
                        </Badge>
                        <Badge 
                          variant="secondary"
                          className="bg-orange-100 text-orange-800"
                        >
                          {projectInsights.filter(i => i.resolved === 0).length} open
                        </Badge>
                        {projectInsights.some(i => i.severity === "high" || i.severity === "critical") && (
                          <Badge className="bg-red-100 text-red-800">
                            {projectInsights.filter(i => i.severity === "high" || i.severity === "critical").length} high priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid grid-cols-7 w-full mb-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        {Object.keys(insightIcons).map((type) => (
                          <TabsTrigger key={type} value={type}>
                            {type.replace("_", " ").charAt(0).toUpperCase() +
                              type.replace("_", " ").slice(1)}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      <TabsContent value="all" className="space-y-4">
                        {projectInsights.map((insight) => (
                          <InsightCard
                            key={insight.id}
                            insight={insight}
                            onResolve={resolveInsight}
                          />
                        ))}
                      </TabsContent>

                      {Object.keys(insightIcons).map((type) => {
                        const typeInsights = projectInsights.filter(i => i.insight_type === type);
                        return (
                          <TabsContent key={type} value={type} className="space-y-4">
                            {typeInsights.length > 0 ? (
                              typeInsights.map((insight) => (
                                <InsightCard
                                  key={insight.id}
                                  insight={insight}
                                  onResolve={resolveInsight}
                                />
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No {type.replace("_", " ")} insights for this project
                              </div>
                            )}
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      ) : (
        // Flat View (Original)
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
      )}
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
