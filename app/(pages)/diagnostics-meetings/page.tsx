import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function MeetingsDiagnosticsPage() {
  const supabase = await createClient();
  
  // Get current user - authentication check
  await supabase.auth.getUser();
  
  // Table schemas temporarily hardcoded due to missing RPC function
  const meetingsColumns: any[] = [];
  const chunksColumns: any[] = [];
  const insightsColumns: any[] = [];
  
  // Get sample meetings data
  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .limit(3);
    
  // Get sample chunks to understand structure - temporarily disabled due to missing table
  const chunks: any[] = []; // await supabase.from('meetings_chunks').select('*').limit(3);
    
  // Get sample insights - temporarily disabled due to missing table
  const insights: any[] = []; // await supabase.from('meetings_insights').select('*').limit(3);
    
  // Check for vector/embedding columns
  const vectorColumns: any[] = [
    ...((chunksColumns as any)?.filter((col: any) => col.data_type === 'vector' || col.column_name?.includes('embedding')) || []),
    ...((meetingsColumns as any)?.filter((col: any) => col.data_type === 'vector' || col.column_name?.includes('embedding')) || []),
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meetings RAG Diagnostics</h1>
        <p className="text-muted-foreground">
          Examining meeting-related tables for RAG implementation
        </p>
      </div>

      {/* Meetings Table Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Meetings Table Schema</CardTitle>
          <CardDescription>Structure of the meetings table</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Nullable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((meetingsColumns as any)?.map((col: any) => (
                  <TableRow key={col.column_name}>
                    <TableCell className="font-mono text-sm">{col.column_name}</TableCell>
                    <TableCell>{col.data_type}</TableCell>
                    <TableCell>{col.is_nullable}</TableCell>
                  </TableRow>
                )) || [])}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Meetings Chunks Table Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Meetings Chunks Table Schema</CardTitle>
          <CardDescription>Structure of the meetings_chunks table (for RAG)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Nullable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((chunksColumns as any)?.map((col: any) => (
                  <TableRow key={col.column_name} className={col.data_type === 'vector' || col.column_name?.includes('embedding') ? 'bg-green-50 dark:bg-green-950' : ''}>
                    <TableCell className="font-mono text-sm">
                      {col.column_name}
                      {(col.data_type === 'vector' || col.column_name?.includes('embedding')) && (
                        <Badge className="ml-2" variant="secondary">Vector</Badge>
                      )}
                    </TableCell>
                    <TableCell>{col.data_type}</TableCell>
                    <TableCell>{col.is_nullable}</TableCell>
                  </TableRow>
                )) || [])}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Meetings Insights Table Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Meetings Insights Table Schema</CardTitle>
          <CardDescription>Structure of the meetings_insights table</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Nullable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((insightsColumns as any)?.map((col: any) => (
                  <TableRow key={col.column_name}>
                    <TableCell className="font-mono text-sm">{col.column_name}</TableCell>
                    <TableCell>{col.data_type}</TableCell>
                    <TableCell>{col.is_nullable}</TableCell>
                  </TableRow>
                )) || [])}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Vector/Embedding Columns Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Vector/Embedding Columns</CardTitle>
          <CardDescription>Columns available for RAG similarity search</CardDescription>
        </CardHeader>
        <CardContent>
          {vectorColumns.length > 0 ? (
            <div className="space-y-2">
              {vectorColumns.map((col: any) => (
                <div key={`${col.table_name}-${col.column_name}`} className="flex items-center gap-2">
                  <Badge variant="outline">
                    {col.table_name || 'meetings_chunks'}.{col.column_name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{col.data_type}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No vector/embedding columns found</p>
          )}
        </CardContent>
      </Card>

      {/* Sample Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sample Meeting</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-48">
              {JSON.stringify(meetings?.[0] || {}, null, 2)}
            </pre>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sample Chunk</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-48">
              {JSON.stringify(chunks?.[0] || {}, null, 2)}
            </pre>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sample Insight</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-48">
              {JSON.stringify(insights?.[0] || {}, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}