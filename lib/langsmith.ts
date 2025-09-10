import { Client } from 'langsmith';
import { traceable } from 'langsmith/traceable';
import { wrapOpenAI } from 'langsmith/wrappers';

// Initialize LangSmith client
export const langsmithClient = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
  apiUrl: process.env.LANGSMITH_API_URL || 'https://api.smith.langchain.com',
});

// Check if tracing is enabled
export const isTracingEnabled = process.env.LANGSMITH_TRACING === 'true';

// Export utilities
export { traceable, wrapOpenAI };

// Helper to create feedback
export async function createFeedback(
  runId: string,
  score: number,
  key: string = 'user-score',
  comment?: string
) {
  if (!isTracingEnabled) return;
  
  try {
    await langsmithClient.createFeedback(
      runId,
      key,
      {
        score,
        comment,
      }
    );
  } catch (error) {
    console.error('Failed to create feedback:', error);
  }
}

// Helper to get project name
export function getProjectName(): string {
  return process.env.LANGSMITH_PROJECT || 'fm-global-rag';
}

// Helper to add metadata to traces
export function getTraceMetadata(customMetadata?: Record<string, any>) {
  return {
    environment: process.env.NODE_ENV || 'development',
    deployment: process.env.DEPLOYMENT_ENV || 'local',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    ...customMetadata,
  };
}