"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  TableIcon,
  X,
  Filter,
  Briefcase,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

interface FMGlobalFigure {
  id: number;
  figure_number: string;
  title: string;
  asrs_type: string | null;
  container_type: string | null;
  max_depth: string | null;
  max_spacing: string | null;
  applicable_commodities: string;
  section: string | null;
}

interface FMGlobalTable {
  id: number;
  table_number: string;
  title: string;
  asrs_type: string | null;
  system_type: string[] | null;
  protection_scheme: string | null;
  commodity_types: string | null;
  ceiling_height_min: string | null;
  ceiling_height_max: string | null;
  section: string;
}

export default function FMGlobalTablesPage() {
  const [figures, setFigures] = useState<FMGlobalFigure[]>([]);
  const [tables, setTables] = useState<FMGlobalTable[]>([]);
  const [loadingFigures, setLoadingFigures] = useState<boolean>(false);
  const [loadingTables, setLoadingTables] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [asrsTypeFilter, setAsrsTypeFilter] = useState<string>("all");
  const [protectionFilter, setProtectionFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("figures");
  const supabase = createClientComponentClient();

  // Function to get color class based on ASRS type (text only, no background)
  const getAsrsTypeColor = (type: string | null | undefined) => {
    if (!type) return "text-gray-500";

    const normalizedType = type.toLowerCase();

    if (
      normalizedType.includes("top-load") ||
      normalizedType.includes("top load")
    ) {
      return "text-red-600 font-semibold";
    } else if (
      normalizedType.includes("mini-load") ||
      normalizedType.includes("mini load")
    ) {
      return "text-blue-600 font-semibold";
    } else if (
      normalizedType.includes("unit-load") ||
      normalizedType.includes("unit load")
    ) {
      return "text-green-600 font-semibold";
    } else if (
      normalizedType.includes("carousel") ||
      normalizedType.includes("horizontal")
    ) {
      return "text-purple-600 font-semibold";
    } else if (normalizedType.includes("vertical")) {
      return "text-orange-600 font-semibold";
    } else if (normalizedType.includes("shuttle")) {
      return "text-pink-600 font-semibold";
    } else if (normalizedType.includes("crane")) {
      return "text-indigo-600 font-semibold";
    } else if (normalizedType.includes("robot")) {
      return "text-teal-600 font-semibold";
    } else {
      return "text-gray-600 font-medium";
    }
  };

  const fetchFigures = async () => {
    try {
      setLoadingFigures(true);
      setError(null);

      const { data, error } = await supabase
        .from("fm_global_figures")
        .select("*")
        .order("figure_number", { ascending: true });

      if (error) throw error;
      setFigures(data || []);
    } catch (err) {
      console.error("Error fetching figures:", err);
      setError(`Failed to load FM Global figures: ${(err as Error).message}`);
    } finally {
      setLoadingFigures(false);
    }
  };

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      setError(null);

      const { data, error } = await supabase
        .from("fm_global_tables")
        .select("*")
        .order("table_number", { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error("Error fetching tables:", err);
      setError(`Failed to load FM Global tables: ${(err as Error).message}`);
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchFigures();
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get unique ASRS types and protection schemes for filters
  const asrsTypes = Array.from(new Set(tables.map((t) => t.asrs_type).filter((type): type is string => Boolean(type)))).sort();
  const protectionSchemes = Array.from(new Set(tables.map((t) => t.protection_scheme).filter((scheme): scheme is string => Boolean(scheme)))).sort();

  const filteredFigures = figures.filter(
    (figure) =>
      figure.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      figure.figure_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      figure.asrs_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      figure.container_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      figure.applicable_commodities
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const filteredTables = tables.filter(
    (table) => {
      const matchesSearch = 
        table.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.table_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.asrs_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.protection_scheme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.commodity_types?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAsrsType = asrsTypeFilter === "all" || table.asrs_type === asrsTypeFilter;
      const matchesProtection = protectionFilter === "all" || table.protection_scheme === protectionFilter;

      return matchesSearch && matchesAsrsType && matchesProtection;
    }
  );

  return (
    <div className="mx-auto p-2 lg:p-2 space-y-2 animate-in fade-in">
      {/* Enhanced Header with Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 pl-5">
          <h1 className="text-3xl tracking-tight mb-2">FM Global Reference</h1>
          <p className="text-muted-foreground text-lg">
            Tables & Figures Database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand/70" />
            <Input
              placeholder="Search tables and figures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[280px] lg:w-[350px] h-11"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Button
            onClick={() => {
              if (activeTab === "figures") fetchFigures();
              else fetchTables();
            }}
            variant="outline"
            size="icon"
            className="h-11 w-11"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Tabs for Figures and Tables */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-lg grid-cols-2 h-12 bg-muted/30">
            <TabsTrigger value="figures" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-medium">
                Figures{" "}
                <span
                  className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === "figures"
                      ? "bg-white/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {filteredFigures.length}
                </span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="tables"
              className="flex items-center gap-2"
            >
              <TableIcon className="w-4 h-4" />
              <span className="font-medium">
                Tables{" "}
                <span
                  className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === "tables"
                      ? "bg-white/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {filteredTables.length}
                </span>
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Filters - only show for tables tab */}
        {activeTab === "tables" && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <Select value={asrsTypeFilter} onValueChange={setAsrsTypeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by ASRS type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ASRS Types</SelectItem>
                  {asrsTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={protectionFilter} onValueChange={setProtectionFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by protection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Protection Types</SelectItem>
                  {protectionSchemes.map(scheme => (
                    <SelectItem key={scheme} value={scheme}>
                      {scheme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(asrsTypeFilter !== "all" || protectionFilter !== "all" || searchTerm) && (
              <Button
                onClick={() => {
                  setAsrsTypeFilter("all");
                  setProtectionFilter("all");
                  setSearchTerm("");
                }}
                variant="outline"
                size="sm"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Figures Tab */}
        <TabsContent value="figures" className="space-y-4">
          {loadingFigures ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading figures...</span>
            </div>
          ) : filteredFigures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No figures found matching your search."
                : "No figures available."}
            </div>
          ) : (
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32 font-medium whitespace-nowrap h-12">
                        Figure #
                      </TableHead>
                      <TableHead className="min-w-[200px] font-medium h-12">
                        Title
                      </TableHead>
                      <TableHead className="font-medium whitespace-nowrap h-12">
                        ASRS Type
                      </TableHead>
                      <TableHead className="font-medium whitespace-nowrap h-12">
                        Container
                      </TableHead>
                      <TableHead className="font-medium whitespace-nowrap h-12">
                        Max Depth
                      </TableHead>
                      <TableHead className="font-medium whitespace-nowrap h-12">
                        Max Spacing
                      </TableHead>
                      <TableHead className="min-w-[150px] font-medium h-12">
                        Commodities
                      </TableHead>
                      <TableHead className="font-medium whitespace-nowrap h-12">
                        Section
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFigures.map((figure, index) => (
                      <TableRow
                        key={figure.id}
                        className="hover:bg-muted/50 transition-colors duration-200 animate-in slide-in-from-bottom"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        <TableCell className="font-mono text-sm font-semibold text-brand h-12">
                          {figure.figure_number}
                        </TableCell>
                        <TableCell className="font-medium h-12">
                          {figure.title}
                        </TableCell>
                        <TableCell className="h-12">
                          {figure.asrs_type ? (
                            <span className={getAsrsTypeColor(figure.asrs_type)}>
                              {figure.asrs_type}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="h-12">
                          {figure.container_type || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="h-12">
                          {figure.max_depth || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="h-12">
                          {figure.max_spacing || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs h-12">
                          <span className="line-clamp-2 text-sm">
                            {figure.applicable_commodities || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="h-12">
                          {figure.section || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          {loadingTables ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading tables...</span>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No tables found matching your search."
                : "No tables available."}
            </div>
          ) : (
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 font-medium whitespace-nowrap h-12">
                        #
                      </TableHead>
                      <TableHead className="min-w-[200px] font-medium h-12">
                        Title
                      </TableHead>
                      <TableHead className="font-medium whitespace-nowrap h-12">
                        ASRS
                      </TableHead>
                      <TableHead className="font-medium whitespace-nowrap h-12">
                        Container Type
                      </TableHead>
                      <TableHead className="min-w-[150px] font-medium h-12">
                        Commodities
                      </TableHead>
                      <TableHead className="font-medium whitespace-nowrap h-12">
                        Protection Type
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTables.map((table, index) => (
                      <TableRow
                        key={table.id}
                        className="hover:bg-muted/50 transition-colors duration-200 animate-in slide-in-from-bottom"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        <TableCell className="font-mono text-sm font-semibold text-brand h-12">
                          {table.table_number}
                        </TableCell>
                        <TableCell className="font-medium h-12">
                          {table.title}
                        </TableCell>
                        <TableCell className="h-12">
                          {table.asrs_type ? (
                            <span className={getAsrsTypeColor(table.asrs_type)}>
                              {table.asrs_type}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="h-12">
                          {table.system_type &&
                          Array.isArray(table.system_type) &&
                          table.system_type.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {table.system_type.map((type, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs hover:text-brand"
                                >
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs h-12">
                          <span className="line-clamp-2 text-sm">
                            {table.commodity_types || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="h-12">
                          {table.protection_scheme || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
