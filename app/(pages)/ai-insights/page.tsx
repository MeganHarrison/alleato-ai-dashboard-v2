"use client";

import { ReactElement, useState } from "react";
import { cn } from "@/lib/utils";

type Priority = "high" | "medium" | "low";
type InsightType = "action" | "risk" | "decision" | "question" | "update";
type ProjectStatus = "at-risk" | "attention" | "on-track";
type TabType = "today" | "week" | "projects";

interface Insight {
  id: string;
  type: InsightType;
  priority: Priority;
  confidence: number;
  text: string;
  project: string;
  meta: string[];
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

  const insights: Insight[] = [
    {
      id: "1",
      type: "action",
      priority: "high",
      confidence: 94,
      text: "Complete security audit for Alpha project before Friday deadline",
      project: "Alpha",
      meta: ["Mike Chen", "Due Sept 12"],
    },
    {
      id: "2",
      type: "risk",
      priority: "high",
      confidence: 87,
      text: "Budget overrun risk on Beta project due to scope creep",
      project: "Beta",
      meta: ["High severity", "Medium likelihood"],
    },
    {
      id: "3",
      type: "decision",
      priority: "medium",
      confidence: 91,
      text: "AWS migration approved for Q4 implementation",
      project: "Infrastructure",
      meta: ["DevOps, Engineering", "Q4 2025"],
    },
    {
      id: "4",
      type: "question",
      priority: "medium",
      confidence: 76,
      text: "API rate limits clarification needed for third-party integration",
      project: "Gamma",
      meta: ["Alex Rodriguez", "Unanswered"],
    },
    {
      id: "5",
      type: "action",
      priority: "high",
      confidence: 89,
      text: "Schedule design review for mobile app mockups",
      project: "Beta",
      meta: ["Design Team", "This week"],
    },
    {
      id: "6",
      type: "update",
      priority: "low",
      confidence: 82,
      text: "Testing environment setup completed for staging",
      project: "Alpha",
      meta: ["DevOps", "Completed"],
    },
  ];

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
              {insights.map((insight) => (
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
                    <p className="text-sm font-medium leading-tight mb-1 text-gray-900">
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
              ))}
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