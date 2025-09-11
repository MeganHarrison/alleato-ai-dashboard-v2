"use client";

import { ReactElement, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/database.types";

type Priority = "high" | "medium" | "low";
type InsightType = "action" | "risk" | "decision" | "question" | "update";
type ProjectStatus = "at-risk" | "attention" | "on-track";
type TabType = "today" | "week" | "projects";

type AIInsight = Database['public']['Tables']['ai_insights']['Row'];

interface Insight {
  id: string;
  type: InsightType;
  priority: Priority;
  confidence: number;
  text: string;
  project: string;
  meta: string[];
  title?: string;
  created_at?: string;
}

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
}

interface Meeting {
  id: string;
  title: string;
  time: string;
  project: string;
  insights: string;
  confidence: number;
}

export default function AIDashboard(): ReactElement {
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to map database insight types to UI types
  const mapInsightType = (dbType: string | null): InsightType => {
    if (!dbType) return "update";
    const type = dbType.toLowerCase();
    if (["action", "risk", "decision", "question", "update"].includes(type)) {
      return type as InsightType;
    }
    return "update";
  };

  // Function to map severity to priority
  const mapSeverityToPriority = (severity: string | null): Priority => {
    if (!severity) return "medium";
    const sev = severity.toLowerCase();
    if (sev === "high" || sev === "critical") return "high";
    if (sev === "low") return "low";
    return "medium";
  };

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        
        const { data: insightsData, error: insightsError } = await supabase
          .from('ai_insights')
          .select(`
            *,
            projects (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (insightsError) {
          throw new Error(`Failed to fetch insights: ${insightsError.message}`);
        }

        if (insightsData) {
          const formattedInsights: Insight[] = insightsData.map((item) => ({
            id: item.id.toString(),
            type: mapInsightType(item.insight_type),
            priority: mapSeverityToPriority(item.severity),
            confidence: item.confidence_score || 85,
            text: item.description,
            title: item.title,
            project: (item as any).projects?.name || "Unknown Project",
            meta: [
              item.created_at ? new Date(item.created_at).toLocaleDateString() : "",
              item.resolved ? "Resolved" : "Open"
            ].filter(Boolean),
            created_at: item.created_at || undefined
          }));

          setInsights(formattedInsights);
        }
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError(err instanceof Error ? err.message : 'Failed to load insights');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);


  const projects: Project[] = [
    { id: "1", name: "Alpha Project", status: "at-risk" },
    { id: "2", name: "Beta Project", status: "attention" },
    { id: "3", name: "Gamma Project", status: "on-track" },
    { id: "4", name: "Infrastructure", status: "on-track" },
  ];

  const meetings: Meeting[] = [
    {
      id: "1",
      title: "Alpha Sprint Review",
      time: "9:00 AM",
      project: "Alpha Project",
      insights: "Security audit concerns, timeline risks",
      confidence: 94,
    },
    {
      id: "2",
      title: "Beta Budget Review",
      time: "11:30 AM",
      project: "Beta Project",
      insights: "Budget overrun risk, scope decisions",
      confidence: 87,
    },
    {
      id: "3",
      title: "Infrastructure Planning",
      time: "2:00 PM",
      project: "Infrastructure",
      insights: "AWS migration approved, Q4 timeline",
      confidence: 91,
    },
  ];

  const stats = {
    highPriority: insights.filter((i) => i.priority === "high").length,
    actions: insights.filter((i) => i.type === "action").length,
    meetings: meetings.length,
    risks: insights.filter((i) => i.type === "risk").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Insights</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1600px] p-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
          <div className="flex items-center gap-5">
            <h1 className="text-base font-semibold text-gray-900">
              Today • Sept 8, 2025
            </h1>
            <div className="flex gap-0.5">
              {(["today", "week", "projects"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded text-xs font-medium transition-all",
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {stats.highPriority}
              </span>{" "}
              High Priority
            </span>
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {stats.actions}
              </span>{" "}
              Actions
            </span>
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {stats.meetings}
              </span>{" "}
              Meetings
            </span>
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {stats.risks}
              </span>{" "}
              Risks
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          {/* Insights Feed */}
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold">Key Insights</h2>
              <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                {stats.highPriority} High Priority
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {insights.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">💡</div>
                  <h3 className="text-sm font-medium mb-2 text-gray-900">No insights available</h3>
                  <p className="text-xs text-gray-600">Insights will appear here as they are generated from your data.</p>
                </div>
              ) : (
                insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="flex gap-3 p-2.5 px-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={cn(
                        "w-0.5 h-10 rounded-sm flex-shrink-0 mt-0.5",
                        insight.priority === "high" && "bg-red-600",
                        insight.priority === "medium" && "bg-orange-600",
                        insight.priority === "low" && "bg-lime-600"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
                          {insight.type}
                        </span>
                        <span className="text-[10px] text-green-600 font-medium">
                          {insight.confidence}%
                        </span>
                      </div>
                      {insight.title && (
                        <h4 className="text-sm font-semibold leading-tight mb-1 text-gray-900">
                          {insight.title}
                        </h4>
                      )}
                      <p className="text-sm font-medium leading-tight mb-1 text-gray-700">
                        {insight.text}
                      </p>
                      <div className="flex gap-3 text-[11px] text-gray-600">
                        <span className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded-sm font-medium">
                          {insight.project}
                        </span>
                        {insight.meta.map((item, idx) => (
                          <span key={idx}>{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Projects Panel */}
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold">Projects</h2>
              </div>
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between px-3 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-medium">{project.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        project.status === "at-risk" && "bg-red-600",
                        project.status === "attention" && "bg-orange-600",
                        project.status === "on-track" && "bg-green-600"
                      )}
                    />
                    <span className="text-[11px] text-gray-600">
                      {project.status === "at-risk" && "At Risk"}
                      {project.status === "attention" && "Attention"}
                      {project.status === "on-track" && "On Track"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Meetings Panel */}
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold">Today's Meetings</h2>
              </div>
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-xs font-medium leading-tight">
                      {meeting.title}
                    </h3>
                    <span className="text-[10px] text-gray-600 whitespace-nowrap">
                      {meeting.time}
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-600 mb-1">
                    {meeting.project}
                  </p>
                  <p className="text-[11px] text-gray-600 leading-tight">
                    {meeting.insights}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-[30px] h-0.5 bg-gray-100 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-green-600"
                        style={{ width: `${meeting.confidence}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-600">
                      {meeting.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}