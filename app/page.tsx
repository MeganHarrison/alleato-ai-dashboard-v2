"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import ErrorBoundary from "@/components/error-boundary";
import { AddProjectButton } from "@/components/table-buttons/add-project-button";
import { EditableProjectsTable } from "@/components/tables/editable-projects-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile, useIsSmallMobile } from "@/hooks/use-mobile";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Building,
  ChevronDown,
  Columns3,
  DollarSign,
  ExternalLink,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Project {
  id: number;
  name: string;
  phase: string;
  category?: string;
  description?: string;
  "est revenue"?: number;
  address?: string;
  state?: string;
  location?: string;
  clients?: {
    id: number;
    name: string;
  } | null;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  team?: string;
  documents?: unknown[];
  client_id?: number | null;
}


const COLUMNS = [
  { id: "name", label: "Project Name", defaultVisible: true },
  { id: "company", label: "Company", defaultVisible: true },
  { id: "revenue", label: "Est. Revenue", defaultVisible: true },
  { id: "category", label: "Category", defaultVisible: true },
  { id: "location", label: "Location", defaultVisible: false },
  { id: "created", label: "Created", defaultVisible: false },
];

function getStatusColor(phase: string) {
  const statusMap: Record<string, string> = {
    Planning: "bg-brand-100 text-brand-800 border-brand-200",
    Current: "bg-green-100 text-green-800 border-green-200",
    "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
    Complete: "bg-gray-100 text-gray-800 border-gray-200",
    Lost: "bg-red-100 text-red-800 border-red-200",
  };
  return statusMap[phase] || "bg-gray-100 text-gray-800 border-gray-200";
}

function formatCurrency(amount: number | null | undefined) {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardHome() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [meetings, setMeetings] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Mobile responsive hooks
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if required environment variables are set
        if (
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ) {
          throw new Error(
            "Missing Supabase configuration. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set with valid values."
          );
        }

        // Check for placeholder values
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder")
        ) {
          throw new Error(
            "Supabase configuration uses placeholder values. Please update your .env.local file with actual Supabase project credentials."
          );
        }

        const supabase = createClient();

        let query = supabase.from("projects").select(`
            *,
            clients (
              id,
              name
            ),
            documents (
              id
            )
          `);

        // Only filter by phase if showOnlyActive is true
        if (showOnlyActive) {
          query = query.in("phase", ["Current", "Planning", "On Hold"]);
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        if (data) {
          setProjects(data);
        }
      } catch (err: unknown) {
        // Log error silently in development to avoid React error boundary
        if (process.env.NODE_ENV === "development") {
          console.warn("Projects fetch failed:", err);
        }
        setError(
          err instanceof Error ? err.message : "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    fetchMeetings();
    fetchInsights();
  }, [showOnlyActive]);

  // Fetch meetings
  const fetchMeetings = async () => {
    try {
      setMeetingsLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          date,
          meeting_date,
          created_at,
          projects(id, name)
        `)
        .not('meeting_date', 'is', null)
        .order('meeting_date', { ascending: false })
        .limit(10);
        
      if (!error && data) {
        setMeetings(data);
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    } finally {
      setMeetingsLoading(false);
    }
  };

  // Fetch insights
  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('ai_insights')
        .select(`
          id,
          title,
          insight_type,
          severity,
          created_at,
          documents!inner(
            id,
            title,
            projects(id, name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(8);
        
      if (!error && data) {
        setInsights(data);
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Get unique phases and types for filters
  const phases = useMemo(() => {
    const phaseSet = new Set(projects.map((p) => p.phase).filter(Boolean));
    return ["all", ...Array.from(phaseSet).sort()];
  }, [projects]);

  const categories = useMemo(() => {
    const categorySet = new Set(
      projects.map((p) => p.category).filter(Boolean)
    );
    return ["all", ...Array.from(categorySet).sort()];
  }, [projects]);

  // Group meetings by time periods
  const groupedMeetings = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const groups = {
      today: [] as any[],
      yesterday: [] as any[],
      thisWeek: [] as any[],
      older: [] as any[]
    };
    
    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.meeting_date || meeting.date);
      const meetingDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
      
      if (meetingDay.getTime() === today.getTime()) {
        groups.today.push(meeting);
      } else if (meetingDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(meeting);
      } else if (meetingDay >= weekAgo) {
        groups.thisWeek.push(meeting);
      } else {
        groups.older.push(meeting);
      }
    });
    
    return groups;
  }, [meetings]);

  // Group insights by project
  const insightsByProject = useMemo(() => {
    const grouped = {} as Record<string, any[]>;
    
    insights.forEach(insight => {
      const projectName = insight.documents?.projects?.name || 'Unknown Project';
      if (!grouped[projectName]) {
        grouped[projectName] = [];
      }
      grouped[projectName].push(insight);
    });
    
    return grouped;
  }, [insights]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      // Phase filter
      if (selectedPhase !== "all" && project.phase !== selectedPhase) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "all" && project.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          project.name?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.clients?.name?.toLowerCase().includes(query) ||
          project.address?.toLowerCase().includes(query) ||
          project.state?.toLowerCase().includes(query)
        );
      }

      return true;
    });

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: unknown;
        let bValue: unknown;

        switch (sortColumn) {
          case "name":
            aValue = a.name?.toLowerCase() || "";
            bValue = b.name?.toLowerCase() || "";
            break;
          case "company":
            aValue = a.clients?.name?.toLowerCase() || "";
            bValue = b.clients?.name?.toLowerCase() || "";
            break;
          case "revenue":
            aValue = a["est revenue"] || 0;
            bValue = b["est revenue"] || 0;
            break;
          case "category":
            aValue = a.category?.toLowerCase() || "";
            bValue = b.category?.toLowerCase() || "";
            break;
          case "created":
            aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
            bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by created date descending
      filtered.sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });
    }

    return filtered;
  }, [
    projects,
    selectedPhase,
    selectedCategory,
    searchQuery,
    sortColumn,
    sortDirection,
  ]);

  // Modern sleek project cards
  const ModernProjectCards = () => (
    <div className="space-y-3">
      {filteredProjects.slice(0, 6).map((project) => (
        <div
          key={project.id}
          className="group relative"
        >
          <Link
            href={`/projects/${project.id}`}
            className="block p-4 hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-lg transition-all duration-150"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                  {project.name}
                </h3>
                {project.clients?.name && (
                  <p className="text-xs text-gray-500 mt-1">{project.clients.name}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {project["est revenue"] && (
                  <span className="text-xs font-medium text-gray-700">
                    {formatCurrency(project["est revenue"])}
                  </span>
                )}
                <Badge className={cn("text-xs", getStatusColor(project.phase))}>
                  {project.phase}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {project.category && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {project.category}
                </span>
              )}
              {(project.address || project.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {project.state ? project.state : project.address}
                </span>
              )}
            </div>
          </Link>
        </div>
      ))}
      
      {filteredProjects.length > 6 && (
        <Link 
          href="/projects-dashboard"
          className="block p-4 text-center text-sm text-brand-600 hover:text-brand-700 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
        >
          View all {filteredProjects.length} projects →
        </Link>
      )}
    </div>
  );

  // Meetings component
  const MeetingsSection = () => (
    <div className="space-y-4">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        RECENT MEETINGS
      </h2>
      
      {meetingsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Today */}
          {groupedMeetings.today.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-2">Today</h3>
              <div className="space-y-2">
                {groupedMeetings.today.map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className="block p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {meeting.title || 'Untitled Meeting'}
                        </p>
                        {meeting.projects?.name && (
                          <p className="text-xs text-gray-500">{meeting.projects.name}</p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(meeting.meeting_date || meeting.date), 'h:mm a')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groupedMeetings.yesterday.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-2">Yesterday</h3>
              <div className="space-y-2">
                {groupedMeetings.yesterday.map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className="block p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {meeting.title || 'Untitled Meeting'}
                        </p>
                        {meeting.projects?.name && (
                          <p className="text-xs text-gray-500">{meeting.projects.name}</p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(meeting.meeting_date || meeting.date), 'h:mm a')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* This Week */}
          {groupedMeetings.thisWeek.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-2">This Week</h3>
              <div className="space-y-2">
                {groupedMeetings.thisWeek.slice(0, 3).map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className="block p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {meeting.title || 'Untitled Meeting'}
                        </p>
                        {meeting.projects?.name && (
                          <p className="text-xs text-gray-500">{meeting.projects.name}</p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(meeting.meeting_date || meeting.date), 'MMM d')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link 
            href="/meetings"
            className="block p-3 text-center text-sm text-brand-600 hover:text-brand-700 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
          >
            View all meetings →
          </Link>
        </div>
      )}
    </div>
  );

  // Insights component
  const InsightsSection = () => (
    <div className="space-y-4">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        RECENT INSIGHTS
      </h2>
      
      {insightsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(insightsByProject).slice(0, 3).map(([projectName, projectInsights]) => (
            <div key={projectName}>
              <h3 className="text-xs font-medium text-gray-900 mb-2">{projectName}</h3>
              <div className="space-y-2">
                {projectInsights.slice(0, 2).map((insight) => (
                  <div
                    key={insight.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {insight.title}
                      </p>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        insight.severity === 'high' 
                          ? 'bg-red-100 text-red-700'
                          : insight.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      )}>
                        {insight.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 capitalize">
                      {insight.insight_type.replace('_', ' ')} • {format(new Date(insight.created_at), 'MMM d')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {insights.length === 0 && !insightsLoading && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No recent insights available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center max-w-4xl px-4">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Failed to Load Projects
              </h1>
              <p className="text-gray-600 mb-4">{error}</p>

              {(error.includes("Missing Supabase configuration") ||
                error.includes("placeholder")) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-left">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Setup Instructions:
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-2">
                    <li>
                      1. Copy{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        .env.example
                      </code>{" "}
                      to{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        .env.local
                      </code>
                    </li>
                    <li>
                      2. Update the Supabase URL and keys with your actual
                      project credentials
                    </li>
                    <li>
                      3. Get your Supabase credentials from your{" "}
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Supabase dashboard
                      </a>
                    </li>
                    <li>
                      4. Restart the development server after updating the
                      environment variables
                    </li>
                  </ol>
                </div>
              )}

              <div className="flex gap-2 justify-center mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700"
                >
                  Retry
                </button>
                <a
                  href="https://github.com/MeganHarrison/alleato-ai-dashboard-v2#environment-variables"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  View Setup Guide
                </a>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumbs />
          </div>
        </header>
        <div
          className={cn(
            "flex flex-1 flex-col gap-4 pt-0",
            isMobile ? "p-3" : "p-4",
            isMobile
              ? "mx-0" // No side margins on mobile
              : "mx-[5%] sm:mx-[8%] lg:mx-[5%] xl:mx-[5%]"
          )}
        >
          <ErrorBoundary>
            <div className="min-h-screen">
              {/* Service Cards */}
              <div
                className={cn(
                  "grid gap-6 mb-8",
                  isSmallMobile
                    ? "grid-cols-1 gap-4 mb-6"
                    : isMobile
                    ? "grid-cols-1 gap-4 mb-6"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                )}
              >
                {services.map((service, index) => (
                  <Link
                    href={service.href}
                    key={index}
                    className={cn(
                      "block transition-transform",
                      isMobile ? "hover:scale-[1.02]" : "hover:-translate-y-1"
                    )}
                  >
                    <Card className="h-full bg-gray-50 border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                      <CardContent className={cn(isMobile ? "p-6" : "p-8")}>
                        {service.price ? (
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-900">
                              {service.title}
                            </h3>
                            <span className="text-xl font-bold text-gray-900">
                              {service.price}
                            </span>
                          </div>
                        ) : (
                          <h3 className="text-l font-semibold text-gray-900 mb-4">
                            {service.title}
                          </h3>
                        )}
                        <p className="text-sm leading-relaxed">
                          {service.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Projects Dashboard Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-base font-medium">PROJECTS</h1>
                  </div>
                  <AddProjectButton />
                </div>
              </div>

              {/* Filters and Controls */}
              <div className={cn("rounded-lg", isMobile ? "mb-4" : "mb-6")}>
                <div
                  className={cn(
                    "flex flex-col gap-4",
                    !isMobile &&
                      "lg:flex-row lg:items-center lg:justify-between"
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col gap-4",
                      isMobile
                        ? "space-y-4"
                        : "sm:flex-row sm:items-center sm:gap-4"
                    )}
                  >
                    {/* Search */}
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                          "pl-10",
                          isMobile ? "h-12 text-base" : "h-10 text-sm"
                        )}
                      />
                    </div>

                    {/* Filters */}
                    <div
                      className={cn(
                        "flex gap-3",
                        isMobile ? "flex-col" : "items-center gap-2"
                      )}
                    >
                      {!isMobile && (
                        <Filter className="h-4 w-4 text-gray-400" />
                      )}

                      <select
                        value={selectedPhase}
                        onChange={(e) => setSelectedPhase(e.target.value)}
                        className={cn(
                          "border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white",
                          isMobile
                            ? "text-base px-4 py-3 w-full"
                            : "text-sm px-3 py-1.5"
                        )}
                      >
                        <option value="all">All Status</option>
                        {phases
                          .filter((p) => p !== "all")
                          .map((phase) => (
                            <option key={phase} value={phase}>
                              {phase}
                            </option>
                          ))}
                      </select>

                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={cn(
                          "border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white",
                          isMobile
                            ? "text-base px-4 py-3 w-full"
                            : "text-sm px-3 py-1.5"
                        )}
                      >
                        <option value="all">All Categories</option>
                        {categories
                          .filter((c) => c !== "all")
                          .map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Active Projects Toggle */}
                    <div className="flex items-center space-x-3">
                      <Switch
                        id="active-only"
                        checked={showOnlyActive}
                        onCheckedChange={setShowOnlyActive}
                        className={cn(isMobile && "scale-110")}
                      />
                      <Label
                        htmlFor="active-only"
                        className={cn(
                          "font-medium cursor-pointer",
                          isMobile ? "text-base" : "text-sm"
                        )}
                      >
                        Current projects only
                      </Label>
                    </div>
                  </div>

                  {/* Column selector and count */}
                  <div
                    className={cn(
                      "flex gap-3",
                      isMobile ? "flex-col-reverse" : "items-center gap-2"
                    )}
                  >
                    {/* Project count */}
                    <div
                      className={cn(
                        "text-gray-600 text-center",
                        isMobile ? "text-sm py-2" : "text-sm"
                      )}
                    >
                      {filteredProjects.length} of {projects.length} projects
                    </div>

                    {/* Column selector - only show on desktop for table view */}
                    {!isMobile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Columns3 className="h-4 w-4 mr-2" />
                            Columns
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {COLUMNS.map((column) => (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              checked={visibleColumns.has(column.id)}
                              onCheckedChange={() => toggleColumn(column.id)}
                            >
                              {column.label}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>

              {/* Content with View Toggle */}
              <Tabs
                defaultValue={isMobile ? "cards" : "table"}
                className="space-y-4"
              >
                <TabsList
                  className={cn(
                    "bg-gray-50 border",
                    isMobile ? "w-full grid grid-cols-2" : ""
                  )}
                >
                  <TabsTrigger
                    value="cards"
                    className={cn(
                      "flex items-center gap-2",
                      isMobile ? "flex-1 py-3" : ""
                    )}
                  >
                    <LayoutGrid
                      className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")}
                    />
                    <span
                      className={cn(isMobile ? "text-base font-medium" : "")}
                    >
                      Cards
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className={cn(
                      "flex items-center gap-2",
                      isMobile ? "flex-1 py-3" : ""
                    )}
                  >
                    <List className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                    <span
                      className={cn(isMobile ? "text-base font-medium" : "")}
                    >
                      Table
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cards">
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📁</div>
                      <h3 className="text-lg font-medium mb-2">
                        No projects found
                      </h3>
                      <p>Try adjusting your filters or search query</p>
                    </div>
                  ) : (
                    <CardView />
                  )}
                </TabsContent>

                <TabsContent value="table">
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-500 text-6xl mb-4">📁</div>
                      <h3 className="text-lg font-medium mb-2">
                        No projects found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your filters or search query
                      </p>
                    </div>
                  ) : (
                    <EditableProjectsTable projects={filteredProjects} />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ErrorBoundary>
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
