"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface Insight {
  id?: string;
  type?: "risk" | "action_item" | "decision" | "question" | "highlight";
  insight_type?: string;
  status?: "pending" | "completed";
  insight_id?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  severity?: string;
  action_required?: boolean;
  content?: string;
  meeting_title?: string;
  meeting_date?: string;
  assigned_to?: string;
  created_at?: string;
  date?: string;
  [key: string]: unknown;
}

interface InsightsSectionProps {
  meetingInsights: Insight[];
  projectInsights: unknown[];
  aiInsights: unknown[];
}

export function InsightsSection({ 
  meetingInsights = [], 
  projectInsights = [], 
  aiInsights = [] 
}: InsightsSectionProps) {
  const [currentPage] = useState(false);
  const itemsPerPage = 20;

  // Combine all insights and sort by date
  const allInsights = [
    ...meetingInsights.map(insight => ({
      ...insight,
      source: 'meeting',
      sortDate: insight.meeting_date || insight.created_at || ''
    })),
    ...projectInsights.map(insight => ({
      ...insight,
      source: 'project',
      sortDate: insight.created_at || ''
    })),
    ...aiInsights.map(insight => ({
      ...insight,
      source: 'ai',
      sortDate: insight.created_at || ''
    }))
  ].sort((a, b) => {
    const dateA = new Date(a.sortDate || '').getTime();
    const dateB = new Date(b.sortDate || '').getTime();
    return dateB - dateA; // Sort descending (newest first)
  });

  // Calculate pagination
  const totalPages = Math.ceil(allInsights.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInsights = allInsights.slice(startIndex, endIndex);

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case "risk":
        return "bg-red-100 text-red-700";
      case "action_item":
        return "bg-blue-100 text-blue-700";
      case "decision":
        return "bg-green-100 text-green-700";
      case "question":
        return "bg-purple-100 text-purple-700";
      case "highlight":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "";
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "meeting":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "project":
        return "bg-purple-50 text-purple-600 border-purple-200";
      case "ai":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div>
      {allInsights.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No insights available for this project yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentInsights.map((insight, index) => (
              <div 
                key={insight.id || insight.insight_id || index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {insight.title || "Untitled Insight"}
                      </h4>
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full border",
                        getSourceBadge(insight.source)
                      )}>
                        {insight.source === 'ai' ? 'AI' : insight.source}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {(insight.type || insight.insight_type) && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded capitalize",
                          getInsightTypeColor(insight.type || insight.insight_type || '')
                        )}>
                          {(insight.type || insight.insight_type || '').replace('_', ' ')}
                        </span>
                      )}
                      
                      {insight.severity && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded capitalize",
                          getSeverityColor(insight.severity)
                        )}>
                          {insight.severity}
                        </span>
                      )}
                      
                      {insight.status && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded capitalize",
                          insight.status === "completed" 
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        )}>
                          {insight.status}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {insight.sortDate && (
                    <span className="text-xs text-gray-500">
                      {format(new Date(insight.sortDate), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mt-2">
                  {insight.description || insight.content || "No description available"}
                </p>
                
                {insight.assigned_to && (
                  <p className="text-xs text-gray-500 mt-2">
                    Assigned to: <span className="font-medium">{insight.assigned_to}</span>
                  </p>
                )}
                
                {insight.meeting_title && (
                  <p className="text-xs text-gray-500 mt-1">
                    From meeting: <span className="font-medium">{insight.meeting_title}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, allInsights.length)} of {allInsights.length} insights
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={i}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}