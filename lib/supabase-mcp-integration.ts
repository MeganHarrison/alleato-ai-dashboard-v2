import { getMcpClient } from './mcpClient';

export async function integrateSupabaseMCP() {
  try {
    const mcpClient = await getMcpClient();
    const tools = await (mcpClient as any).getTools();
    
    // Filter for Supabase-specific tools
    const supabaseTools = (tools || []).filter((tool: any) => 
      tool.name.includes('supabase') || 
      ['listTables', 'queryTable', 'executeSql'].includes(tool.name)
    );
    
    return supabaseTools;
  } catch (error) {
    console.error('Failed to integrate Supabase MCP:', error);
    return [];
  }
}