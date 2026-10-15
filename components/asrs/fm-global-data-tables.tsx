'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileImage, Grid3x3, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createClient } from '@/utils/supabase/client';

interface FMGlobalFigure {
  id: number;
  figure_number: number;
  title: string;
  description: string;
  asrs_type: string;
  container_type: string | null;
  max_spacing_ft: number | null;
  max_depth_ft: number | null;
  max_height_ft: number | null;
  sprinkler_count: number | null;
  page_reference: number | null;
  requirements: string[] | null;
  figure_type: string | null;
  normalized_summary: string | null;
  machine_readable_claims: any;
  search_keywords: string[] | null;
}

interface FMGlobalTable {
  id: number;
  table_number: number;
  title: string;
  description: string;
  asrs_type: string;
  protection_scheme: string | null;
  commodity_types: string[] | null;
  ceiling_height_min_ft: number | null;
  ceiling_height_max_ft: number | null;
  sprinkler_specifications: any;
  design_parameters: any;
  special_conditions: string[] | null;
  page_reference: number | null;
  normalized_summary: string | null;
  search_keywords: string[] | null;
}

export default function FMGlobalDataTables() {
  const [figures, setFigures] = useState<FMGlobalFigure[]>([]);
  const [tables, setTables] = useState<FMGlobalTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch figures
      const { data: figuresData, error: figuresError } = await supabase
        .from('fm_global_figures')
        .select('*')
        .order('figure_number');

      if (figuresError) {
        console.error('Error fetching figures:', figuresError);
        setError('Failed to fetch figures');
        return;
      }

      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('fm_global_tables')
        .select('*')
        .order('table_number');

      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
        setError('Failed to fetch tables');
        return;
      }

      setFigures(figuresData || []);
      setTables(tablesData || []);
      setError(null);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredFigures = figures.filter(figure =>
    figure.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    figure.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    figure.asrs_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (figure.container_type && figure.container_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTables = tables.filter(table =>
    table.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.asrs_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (table.protection_scheme && table.protection_scheme.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading FM Global data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">FM Global 8-34 ASRS Data</h2>
          <p className="text-muted-foreground">
            Browse official FM Global figures and tables for ASRS sprinkler systems
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search figures and tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="figures" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="figures" className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            Figures ({filteredFigures.length})
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Tables ({filteredTables.length})
          </TabsTrigger>
        </TabsList>

        {/* Figures Tab */}
        <TabsContent value="figures" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Figure #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>ASRS Type</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Max Spacing</TableHead>
                  <TableHead>Max Depth</TableHead>
                  <TableHead>Sprinklers</TableHead>
                  <TableHead>Page</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFigures.map((figure) => (
                  <TableRow key={figure.id}>
                    <TableCell className="font-mono font-bold">
                      {figure.figure_number}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <div className="font-medium">{figure.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {figure.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {figure.asrs_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {figure.container_type ? (
                        <Badge variant="secondary" className="capitalize">
                          {figure.container_type.replace('-', ' ')}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {figure.max_spacing_ft ? (
                        <span className="font-mono">{figure.max_spacing_ft}ft</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {figure.max_depth_ft ? (
                        <span className="font-mono">{figure.max_depth_ft}ft</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {figure.sprinkler_count ? (
                        <span className="font-mono">{figure.sprinkler_count}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {figure.page_reference ? (
                        <span className="font-mono text-sm">{figure.page_reference}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredFigures.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileImage className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>No figures found matching "{searchTerm}"</p>
            </div>
          )}
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Table #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>ASRS Type</TableHead>
                  <TableHead>Protection</TableHead>
                  <TableHead>Height Range</TableHead>
                  <TableHead>Commodities</TableHead>
                  <TableHead>Page</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-mono font-bold">
                      {table.table_number}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <div className="font-medium">{table.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {table.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {table.asrs_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {table.protection_scheme ? (
                        <Badge variant="secondary" className="capitalize">
                          {table.protection_scheme.replace('_', ' ')}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {table.ceiling_height_min_ft && table.ceiling_height_max_ft ? (
                        <span className="font-mono text-sm">
                          {table.ceiling_height_min_ft}-{table.ceiling_height_max_ft}ft
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32">
                        {table.commodity_types && table.commodity_types.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {table.commodity_types.slice(0, 2).map((commodity, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {commodity}
                              </Badge>
                            ))}
                            {table.commodity_types.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{table.commodity_types.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {table.page_reference ? (
                        <span className="font-mono text-sm">{table.page_reference}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredTables.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>No tables found matching "{searchTerm}"</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}