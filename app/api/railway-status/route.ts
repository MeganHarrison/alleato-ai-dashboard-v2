import { NextResponse } from 'next/server';

// Check status of all Railway deployments
export async function GET() {
  const endpoints = [
    {
      name: 'FM Global ASRS Expert',
      url: process.env.RAILWAY_ASRS_RAG ? 
           `https://${process.env.RAILWAY_ASRS_RAG}` : 
           'https://fm-global-asrs-expert-production-afb0.up.railway.app',
      envVar: 'RAILWAY_ASRS_RAG'
    },
    {
      name: 'PM RAG Agent',
      url: process.env.RAILWAY_PM_RAG ? 
           `https://${process.env.RAILWAY_PM_RAG}` :
           'https://rag-agent-api-production.up.railway.app',
      envVar: 'RAILWAY_PM_RAG'
    }
  ];
  
  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        // Check health endpoint
        const healthResponse = await fetch(`${endpoint.url}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        
        const healthData = await healthResponse.json().catch(() => null);
        
        // Test chat endpoint with minimal request
        let chatStatus = 'untested';
        let chatError = null;
        
        try {
          const chatResponse = await fetch(`${endpoint.url}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'test' }),
            signal: AbortSignal.timeout(5000),
          });
          
          if (chatResponse.ok) {
            chatStatus = 'working';
          } else {
            chatStatus = 'error';
            chatError = `HTTP ${chatResponse.status}`;
          }
        } catch (e) {
          chatStatus = 'error';
          chatError = e instanceof Error ? e.message : 'Unknown error';
        }
        
        return {
          name: endpoint.name,
          url: endpoint.url,
          envVar: endpoint.envVar,
          configured: !!process.env[endpoint.envVar],
          health: {
            status: healthResponse.ok ? 'healthy' : 'unhealthy',
            httpStatus: healthResponse.status,
            data: healthData
          },
          chat: {
            status: chatStatus,
            error: chatError
          }
        };
      } catch (error) {
        return {
          name: endpoint.name,
          url: endpoint.url,
          envVar: endpoint.envVar,
          configured: !!process.env[endpoint.envVar],
          health: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Connection failed'
          },
          chat: {
            status: 'untested'
          }
        };
      }
    })
  );
  
  // Determine overall status
  const allHealthy = results.every(r => r.health.status === 'healthy');
  const anyWorking = results.some(r => r.chat.status === 'working');
  
  return NextResponse.json({
    status: allHealthy && anyWorking ? 'operational' : 
            allHealthy ? 'degraded' : 
            'issues',
    timestamp: new Date().toISOString(),
    deployments: results,
    recommendation: !anyWorking ? 
      'Railway deployments are not functioning correctly. The chat endpoints are returning errors. Check Railway dashboard for deployment logs and ensure all environment variables are set.' :
      'Some services are operational.'
  });
}