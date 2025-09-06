import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PersistentChatDiagnosticsPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get counts for each table
  const { count: chatsCount } = await supabase
    .from('chats')
    .select('*', { count: 'exact', head: true });
    
  const { count: messagesCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });
    
  const { count: partsCount } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true });
  
  // Get sample data from chats
  const { data: chats, error: chatsError } = await supabase
    .from('chats')
    .select('*')
    .order('id', { ascending: false })
    .limit(5);
  
  // Get column information for parts - temporarily disabled due to missing function
  const columns: any[] = []; // await supabase.rpc('get_table_columns', { table_name: 'parts', schema_name: 'public' });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI SDK 5 Tables Diagnostics</h1>
        <p className="text-muted-foreground">
          Viewing the AI SDK 5 persistent chat tables in Supabase
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-sm">{user?.email || 'Not authenticated'}</p>
        </CardContent>
      </Card>

      {/* Tables Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Tables Overview</CardTitle>
          <CardDescription>AI SDK 5 tables in the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">chats</span>
              <Badge>{chatsCount || 0} records</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">messages</span>
              <Badge>{messagesCount || 0} records</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">parts</span>
              <Badge>{partsCount || 0} records</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Chats */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Chats</CardTitle>
          <CardDescription>Last 5 chats from the chats table</CardDescription>
        </CardHeader>
        <CardContent>
          {chatsError ? (
            <p className="text-red-500">Error loading chats: {chatsError.message}</p>
          ) : chats && chats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats.map((chat) => (
                  <TableRow key={chat.id}>
                    <TableCell className="font-mono text-xs">{chat.id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No chats found</p>
          )}
        </CardContent>
      </Card>

      {/* Parts Table Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Parts Table Schema</CardTitle>
          <CardDescription>Column structure of the parts table</CardDescription>
        </CardHeader>
        <CardContent>
          {columns && columns.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column Name</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Nullable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((col: any) => (
                    <TableRow key={col.column_name}>
                      <TableCell className="font-mono text-sm">{col.column_name}</TableCell>
                      <TableCell>{col.data_type}</TableCell>
                      <TableCell>{col.is_nullable === 'YES' ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">No column information found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}