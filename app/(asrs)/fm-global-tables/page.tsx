"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import {
  Search,
  RefreshCw,
  FileText,
  AlertCircle,
  Loader2,
  TableIcon,
  X,
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<string>("figures");
  const supabase = createClientComponentClient();

  // Function to get color class based on ASRS type
  const getAsrsTypeColor = (type: string | null | undefined) => {
    if (!type) return "";
    
    const normalizedType = type.toLowerCase();
    
    if (normalizedType.includes("top-load") || normalizedType.includes("top load")) {
      return "bg-red-100 text-red-700 border-red-300";
    } else if (normalizedType.includes("mini-load") || normalizedType.includes("mini load")) {
      return "bg-blue-100 text-blue-700 border-blue-300";
    } else if (normalizedType.includes("unit-load") || normalizedType.includes("unit load")) {
      return "bg-green-100 text-green-700 border-green-300";
    } else if (normalizedType.includes("carousel") || normalizedType.includes("horizontal")) {
      return "bg-purple-100 text-purple-700 border-purple-300";
    } else if (normalizedType.includes("vertical")) {
      return "bg-orange-100 text-orange-700 border-orange-300";
    } else if (normalizedType.includes("shuttle")) {
      return "bg-pink-100 text-pink-700 border-pink-300";
    } else if (normalizedType.includes("crane")) {
      return "bg-indigo-100 text-indigo-700 border-indigo-300";
    } else if (normalizedType.includes("robot")) {
      return "bg-teal-100 text-teal-700 border-teal-300";
    } else {
      return "bg-gray-100 text-gray-700 border-gray-300";
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
    (table) =>
      table.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.table_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.asrs_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.protection_scheme
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      table.commodity_types?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto p-4 lg:p-6 space-y-6 animate-in fade-in">
      {/* Page Header */}
      <PageHeader
        title="FM Global Reference"
        description="Tables & Figures Database"
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Tabs for Figures and Tables with Search and Refresh */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid grid-cols-2 h-12 bg-muted/30 border border-brand/20 max-w-lg">
            <TabsTrigger 
              value="figures" 
              className="flex items-center gap-2 text-slate-700 data-[state=active]:bg-brand data-[state=active]:text-white data-[state=inactive]:text-slate-700 hover:text-slate-900"
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium">
                Figures <span className="ml-1 px-2 py-0.5 text-xs bg-brand/20 rounded-full">
                  {filteredFigures.length}
                </span>
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="tables" 
              className="flex items-center gap-2 text-slate-700 data-[state=active]:bg-brand data-[state=active]:text-white data-[state=inactive]:text-slate-700 hover:text-slate-900"
            >
              <TableIcon className="w-4 h-4" />
              <span className="font-medium">
                Tables <span className="ml-1 px-2 py-0.5 text-xs bg-brand/20 rounded-full">
                  {filteredTables.length}
                </span>
              </span>
            </TabsTrigger>
          </TabsList>
          
          {/* Search and Refresh Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand/70" />
              <Input
                placeholder="Search tables and figures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[280px] lg:w-[350px] h-11 border-brand/20 focus:border-brand/50 focus:ring-brand/20"
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
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[1100px]">
                  <TableHeader>
                    <TableRow className="border-brand/20 bg-gradient-to-r from-brand/5 to-brand/10">
                      <TableHead className="w-20 text-brand font-semibold whitespace-nowrap h-12">Figure #</TableHead>
                      <TableHead className="min-w-[300px] text-brand font-semibold h-12">Title</TableHead>
                      <TableHead className="text-brand font-semibold whitespace-nowrap h-12">ASRS Type</TableHead>
                      <TableHead className="text-brand font-semibold whitespace-nowrap h-12">Container</TableHead>
                      <TableHead className="text-brand font-semibold whitespace-nowrap h-12">Max Depth</TableHead>
                      <TableHead className="text-brand font-semibold whitespace-nowrap h-12">Max Spacing</TableHead>
                      <TableHead className="min-w-[200px] text-brand font-semibold h-12">Commodities</TableHead>
                      <TableHead className="text-brand font-semibold whitespace-nowrap h-12">Section</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFigures.map((figure, index) => (
                      <TableRow 
                        key={figure.id} 
                        className="hover:bg-brand/5 transition-colors duration-200 border-border/50 animate-in slide-in-from-bottom"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: 'both'
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
                            <Badge className={`${getAsrsTypeColor(figure.asrs_type)} border font-medium`}>
                              {figure.asrs_type}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="h-12">{figure.container_type || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="h-12">{figure.max_depth || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="h-12">{figure.max_spacing || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="max-w-xs h-12">
                          <span className="line-clamp-2 text-sm">
                            {figure.applicable_commodities || <span className="text-muted-foreground">-</span>}
                          </span>
                        </TableCell>
                        <TableCell className="h-12">{figure.section || <span className="text-muted-foreground">-</span>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
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
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow className="border-brand/20 bg-gradient-to-r from-brand/5 to-brand/10">
                      <TableHead className="w-20 text-brand font-semibold whitespace-nowrap h-12">Table #</TableHead>
                      <TableHead className="min-w-[300px] text-brand font-semibold h-12">Title</TableHead>
                      <TableHead className="text-brand font-semibold whitespace-nowrap h-12">ASRS Type</TableHead>
                      <TableHead className="text-brand font-semibold whitespace-nowrap h-12">System Type</TableHead>
                      <TableHead className="text-brand font-semibold whitespace-nowrap h-12">Protection</TableHead>
                      <TableHead className="min-w-[200px] text-brand font-semibold h-12">Commodities</TableHead>
                      <TableHead className="text-brand font-semibold whitespace-nowrap h-12">Ceiling Height</TableHead>
                      <TableHead className="text-brand font-semibold whitespace-nowrap h-12">Section</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTables.map((table, index) => (
                      <TableRow 
                        key={table.id} 
                        className="hover:bg-brand/5 transition-colors duration-200 border-border/50 animate-in slide-in-from-bottom"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: 'both'
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
                            <Badge className={`${getAsrsTypeColor(table.asrs_type)} border font-medium`}>
                              {table.asrs_type}
                            </Badge>
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
                                  className="text-xs border-brand/30 hover:border-brand/50 hover:text-brand"
                                >
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="h-12">{table.protection_scheme || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="max-w-xs h-12">
                          <span className="line-clamp-2 text-sm">
                            {table.commodity_types || <span className="text-muted-foreground">-</span>}
                          </span>
                        </TableCell>
                        <TableCell className="h-12">
                          {table.ceiling_height_min ||
                          table.ceiling_height_max ? (
                            <span className="text-sm font-medium">
                              {table.ceiling_height_min &&
                                `${table.ceiling_height_min}`}
                              {table.ceiling_height_min &&
                                table.ceiling_height_max &&
                                " - "}
                              {table.ceiling_height_max &&
                                `${table.ceiling_height_max}`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="h-12">{table.section || <span className="text-muted-foreground">-</span>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
