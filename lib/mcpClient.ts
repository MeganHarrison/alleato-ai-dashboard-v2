// Note: experimental_createMCPClient is not available in AI SDK 3.4.33
// This functionality is disabled until AI SDK is upgraded to v5+

const DEFAULT_MCP_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001/sse';
const SUPABASE_MCP_URL = process.env.NEXT_PUBLIC_SUPABASE_MCP_URL || 'http://localhost:3002/sse';

export async function getMcpClient(type: 'default' | 'supabase' = 'default') {
  const url = type === 'supabase' ? SUPABASE_MCP_URL : DEFAULT_MCP_URL;
  
  // Placeholder - MCP functionality disabled for AI SDK 3.4.33
  throw new Error('MCP client functionality is not available in AI SDK 3.4.33. Please upgrade to AI SDK v5+');
}

// Convenience method for Supabase MCP
export async function getSupabaseMcpClient() {
  return getMcpClient('supabase');
}

// Default client for backward compatibility - placeholder
export const mcpClient = null;