const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const projectRef = process.env.PROJ_REF || 'lgveqfnpkxvzbnnwuled';
const accessToken = process.env.SUPABASE_MANAGEMENT_API_TOKEN;

if (!accessToken) {
  console.error('Error: SUPABASE_MANAGEMENT_API_TOKEN not found in .env file');
  console.error('Please create a personal access token at https://app.supabase.com/account/tokens');
  process.exit(1);
}

console.log(`Starting Supabase MCP Server for project: ${projectRef}`);

const server = spawn('npx', [
  '@supabase/mcp-server-supabase',
  '--access-token', accessToken
], {
  env: {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: accessToken,
    SUPABASE_PROJECT_ID: projectRef
  },
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
});

server.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
});