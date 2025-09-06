import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Squares2X2Icon as TableIcon, 
  DocumentTextIcon,
  FireIcon,
  ShieldCheckIcon,
  CubeIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface FMTableMetadata {
  id: string;
  table_number: number;
  title: string;
  category: string;
  asrs_type: string;
  description: string | null;
  priority: string | null;
  system_type: string | null;
  commodity_classes: string[] | null;
  page_range: string | null;
  created_at: string;
  updated_at: string;
}

interface FMGlobalTable {
  id: string;
  table_number: number;
  title: string;
  ceiling_height_ft: number | null;
  k_factor: number | null;
  min_pressure_psi: number | null;
  sprinkler_count: number | null;
  system_type: string | null;
  protection_scheme: string | null;
  asrs_type: string | null;
  commodity_class: string | null;
}

const categoryIcons = {
  'System Configuration': <CubeIcon className="w-5 h-5" />,
  'Ceiling Protection': <ShieldCheckIcon className="w-5 h-5" />,
  'In-Rack Design': <FireIcon className="w-5 h-5" />,
  'Special Systems': <BeakerIcon className="w-5 h-5" />
};

const priorityColors = {
  'Critical': 'destructive',
  'High': 'default',
  'Medium': 'secondary',
  'Low': 'outline'
} as const;

export default async function FMTablesPage() {
  const supabase = await createClient();
  
  // Fetch table metadata
  const { data: tableMetadata, error: metadataError } = await supabase
    .from('fm_table_metadata')
    .select('*')
    .order('table_number', { ascending: true });

  // Fetch detailed table data
  const { data: detailedTables, error: detailError } = await supabase
    .from('fm_global_tables')
    .select('id, table_number, title, ceiling_height_ft, k_factor, min_pressure_psi, sprinkler_count, system_type, protection_scheme, asrs_type, commodity_class')
    .order('table_number', { ascending: true })
    .limit(50); // Limit for initial display

  if (metadataError || detailError) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-600">
          Error loading FM Global tables: {metadataError?.message || detailError?.message}
        </div>
      </div>
    );
  }

  // Group tables by category
  const tablesByCategory = (tableMetadata || []).reduce((acc, table) => {
    const category = table.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(table);
    return acc;
  }, {} as Record<string, FMTableMetadata[]>);

  // Group detailed tables by table number for quick lookup
  const detailsByTableNumber = (detailedTables || []).reduce((acc, table) => {
    if (!acc[table.table_number]) acc[table.table_number] = [];
    acc[table.table_number].push(table);
    return acc;
  }, {} as Record<number, FMGlobalTable[]>);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          FM Global 8-34 Protection Tables
        </h1>
        <p className="text-lg text-gray-600">
          Complete reference for Automatic Storage and Retrieval System (ASRS) fire protection requirements
        </p>
        <div className="mt-4 flex gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <DocumentTextIcon className="w-4 h-4" />
            {tableMetadata?.length || 0} Primary Tables
          </span>
          <span className="flex items-center gap-1">
            <TableIcon className="w-4 h-4" />
            {detailedTables?.length || 0}+ Parameter Sets
          </span>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="category" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="category">By Category</TabsTrigger>
          <TabsTrigger value="list">All Tables</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
        </TabsList>

        {/* Category View */}
        <TabsContent value="category" className="space-y-6">
          {Object.entries(tablesByCategory).map(([category, tables]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                {categoryIcons[category as keyof typeof categoryIcons] || <DocumentTextIcon className="w-5 h-5" />}
                <h2 className="text-xl font-semibold">{category}</h2>
                <Badge variant="secondary">{Array.isArray(tables) ? tables.length : 0} tables</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.isArray(tables) && tables.map((table: FMTableMetadata) => (
                  <Card key={table.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          Table {table.table_number}
                        </CardTitle>
                        {table.priority && (
                          <Badge variant={priorityColors[table.priority as keyof typeof priorityColors] || 'default'}>
                            {table.priority}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm mt-2">
                        {table.title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {table.asrs_type && table.asrs_type !== 'All' && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">ASRS Type:</span>
                            <Badge variant="outline">{table.asrs_type}</Badge>
                          </div>
                        )}
                        {table.system_type && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">System:</span>
                            <Badge variant="outline">{table.system_type}</Badge>
                          </div>
                        )}
                        {table.commodity_classes && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Classes:</span>
                            <div className="flex gap-1 flex-wrap">
                              {table.commodity_classes?.map((cls: string) => (
                                <Badge key={cls} variant="secondary" className="text-xs">
                                  {cls}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {table.page_range && (
                          <div className="text-gray-500">
                            Pages: {table.page_range}
                          </div>
                        )}
                        {detailsByTableNumber[table.table_number] && (
                          <div className="pt-2 border-t">
                            <span className="text-xs text-gray-500">
                              {detailsByTableNumber[table.table_number].length} parameter configurations
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ASRS Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableMetadata?.map((table) => (
                  <tr key={table.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {table.table_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {table.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.asrs_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {table.priority && (
                        <Badge variant={priorityColors[table.priority as keyof typeof priorityColors] || 'default'}>
                          {table.priority}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Parameters View */}
        <TabsContent value="parameters">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Showing first 50 parameter configurations. Each table can have multiple configurations based on specific conditions.
            </div>
            <div className="grid gap-4">
              {detailedTables?.map((config) => (
                <Card key={config.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">
                        Table {config.table_number}: {config.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {config.ceiling_height_ft && (
                        <div>
                          <span className="text-gray-500">Height:</span>
                          <span className="ml-2 font-medium">{config.ceiling_height_ft} ft</span>
                        </div>
                      )}
                      {config.k_factor && (
                        <div>
                          <span className="text-gray-500">K-Factor:</span>
                          <span className="ml-2 font-medium">{config.k_factor}</span>
                        </div>
                      )}
                      {config.min_pressure_psi && (
                        <div>
                          <span className="text-gray-500">Min Pressure:</span>
                          <span className="ml-2 font-medium">{config.min_pressure_psi} psi</span>
                        </div>
                      )}
                      {config.sprinkler_count && (
                        <div>
                          <span className="text-gray-500">Sprinklers:</span>
                          <span className="ml-2 font-medium">{config.sprinkler_count}</span>
                        </div>
                      )}
                      {config.system_type && (
                        <div>
                          <span className="text-gray-500">System:</span>
                          <Badge variant="outline" className="ml-2">{config.system_type}</Badge>
                        </div>
                      )}
                      {config.asrs_type && (
                        <div>
                          <span className="text-gray-500">ASRS:</span>
                          <Badge variant="outline" className="ml-2">{config.asrs_type}</Badge>
                        </div>
                      )}
                      {config.commodity_class && (
                        <div>
                          <span className="text-gray-500">Class:</span>
                          <Badge variant="secondary" className="ml-2">{config.commodity_class}</Badge>
                        </div>
                      )}
                      {config.protection_scheme && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Protection:</span>
                          <span className="ml-2 font-medium">{config.protection_scheme}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}