"use client";

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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Briefcase,
  Building,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Columns3,
  DollarSign,
  ExternalLink,
  FileText,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Project {
  id: string;
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
  };
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  team?: string;
  documents?: unknown[];
}

const COLUMNS = [
  { id: "name", label: "Project Name", defaultVisible: true },
  { id: "phase", label: "Status", defaultVisible: true },
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter((col) => col.defaultVisible).map((col) => col.id))
  );
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        const query = supabase.from("projects").select(`
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
        console.error("Failed to fetch projects:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [showOnlyActive]);

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
          case "phase":
            aValue = a.phase?.toLowerCase() || "";
            bValue = b.phase?.toLowerCase() || "";
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

  const toggleColumn = (columnId: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    setVisibleColumns(newVisible);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to Load Projects
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const CardView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredProjects.map((project) => (
        <Card
          key={project.id}
          className="group bg-white border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
        >
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between text-brand-500 text-sm mb-3">
              <div className="flex-1">
                <Link
                  href={`/projects/${project.id}`}
                  className="font-medium text-base line-clamp-1 hover:text-brand-500 hover:underline cursor-pointer flex items-center gap-1"
                >
                  {project.name}
                  <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                {project.clients?.name && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <Building className="h-3.5 w-3.5" />
                    <span>{project.clients.name}</span>
                  </div>
                )}
              </div>
              <Badge className={cn("text-xs", getStatusColor(project.phase))}>
                {project.phase}
              </Badge>
            </div>

            {/* Metadata */}
            <div className="space-y-2 mb-3">
              {project.category && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>{project.category}</span>
                </div>
              )}
              {project["est revenue"] && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {formatCurrency(project["est revenue"])}
                  </span>
                </div>
              )}
              {(project.address || project.state) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {project.state
                      ? `${project.address || ""} ${project.state}`.trim()
                      : project.address}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {project.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {project.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(project.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                {project.documents && project.documents.length > 0 && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{project.documents.length} document{project.documents.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <Link href={`/projects/${project.id}`}>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TableView = () => (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {visibleColumns.has("name") && (
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Project Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
            )}
            {visibleColumns.has("phase") && (
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("phase")}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon("phase")}
                </div>
              </TableHead>
            )}
            {visibleColumns.has("company") && (
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("company")}
              >
                <div className="flex items-center">
                  Company
                  {getSortIcon("company")}
                </div>
              </TableHead>
            )}
            {visibleColumns.has("revenue") && (
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("revenue")}
              >
                <div className="flex items-center">
                  Est. Revenue
                  {getSortIcon("revenue")}
                </div>
              </TableHead>
            )}
            {visibleColumns.has("category") && (
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">
                  Category
                  {getSortIcon("category")}
                </div>
              </TableHead>
            )}
            {visibleColumns.has("location") && <TableHead>Location</TableHead>}
            {visibleColumns.has("created") && (
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("created")}
              >
                <div className="flex items-center">
                  Created
                  {getSortIcon("created")}
                </div>
              </TableHead>
            )}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjects.map((project) => (
            <TableRow key={project.id} className="hover:bg-gray-50">
              {visibleColumns.has("name") && (
                <TableCell className="font-medium">
                  <Link
                    href={`/projects/${project.id}`}
                    className="hover:text-brand-600 hover:underline flex items-center gap-1"
                  >
                    {project.name}
                    <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                  </Link>
                </TableCell>
              )}
              {visibleColumns.has("phase") && (
                <TableCell>
                  <Badge
                    className={cn("text-xs", getStatusColor(project.phase))}
                  >
                    {project.phase}
                  </Badge>
                </TableCell>
              )}
              {visibleColumns.has("company") && (
                <TableCell>{project.clients?.name || "—"}</TableCell>
              )}
              {visibleColumns.has("revenue") && (
                <TableCell className="font-medium">
                  {formatCurrency(project["est revenue"])}
                </TableCell>
              )}
              {visibleColumns.has("category") && (
                <TableCell>{project.category || "—"}</TableCell>
              )}
              {visibleColumns.has("location") && (
                <TableCell>{project.location || "—"}</TableCell>
              )}
              {visibleColumns.has("created") && (
                <TableCell>
                  {project.created_at
                    ? format(new Date(project.created_at), "MMM d, yyyy")
                    : "—"}
                </TableCell>
              )}
              <TableCell className="text-right">
                <Link href={`/projects/${project.id}`}>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-[95%] sm:w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* FM Global Guru Card */}
          <div>
            <Link
              href="/chat-asrs"
              className="block transition-transform hover:-translate-y-1"
            >
              <Card className="h-full bg-gray-50 border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      FM Global Guru
                    </h3>
                    <span className="text-2xl font-bold text-gray-900">
                      $3,500
                    </span>
                  </div>
                  <p className="text-gray-600 text-base leading-relaxed">
                    AI Agent trained on all of your business documents.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Project Maestro Card */}
          <div>
            <Link
              href="/projects"
              className="block transition-transform hover:-translate-y-1"
            >
              <Card className="h-full bg-gray-50 border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Project Maestro
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    AI Agent trained on all the systems you use within your business.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Company Knowledge Base Card */}
          <div>
            <Link
              href="/insights"
              className="block transition-transform hover:-translate-y-1"
            >
              <Card className="h-full bg-gray-50 border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Company Knowledge Base
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Create and update content with your AI agent workflows.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl">Projects Dashboard</h1>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="rounded-lg mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Active Projects Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="active-only"
                  checked={showOnlyActive}
                  onCheckedChange={setShowOnlyActive}
                />
                <Label
                  htmlFor="active-only"
                  className="text-sm font-medium cursor-pointer"
                >
                  Current projects only
                </Label>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  className="text-sm border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="text-sm border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            </div>

            {/* Column selector for table view */}
            <div className="flex items-center gap-2">
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

              <span className="text-sm text-gray-600">
                {filteredProjects.length} of {projects.length} projects
              </span>
            </div>
          </div>
        </div>

        {/* Content with View Toggle */}
        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList className="bg-gray-50 border">
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No projects found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search query
                </p>
              </div>
            ) : (
              <CardView />
            )}
          </TabsContent>

          <TabsContent value="table">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No projects found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search query
                </p>
              </div>
            ) : (
              <TableView />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
