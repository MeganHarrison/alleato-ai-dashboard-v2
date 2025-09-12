"use server";

import { getNotionProjects } from "@/utils/notion/projects";
import { 
  NotionEnvSchema, 
  NotionProjectsResponseSchema,
  type NotionProjectsResponse 
} from "@/utils/notion/schemas";

// Re-export type for backward compatibility
export type { NotionProjectsResponse };

/**
 * Server action to fetch Notion projects with comprehensive validation.
 * 
 * Validates environment variables and provides secure error handling.
 * Uses NOTION_DATABASE_ID or NOTION_PROJECTS_DATABASE_ID from environment.
 * 
 * @returns Promise resolving to validated NotionProjectsResponse
 */
export async function fetchNotionProjects(): Promise<NotionProjectsResponse> {
  try {
    // Validate environment variables using Zod schema
    const env = NotionEnvSchema.parse({
      NOTION_TOKEN: process.env.NOTION_TOKEN,
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
      NOTION_PROJECTS_DATABASE_ID: process.env.NOTION_PROJECTS_DATABASE_ID,
    });

    // Get the appropriate database ID
    const databaseId = env.NOTION_DATABASE_ID || env.NOTION_PROJECTS_DATABASE_ID;
    
    if (!databaseId) {
      return NotionProjectsResponseSchema.parse({
        projects: [],
        error: "Database ID configuration error. Please check your environment variables.",
      });
    }

    // Fetch and validate projects
    const projects = await getNotionProjects(databaseId);
    
    // Validate response structure
    const response = NotionProjectsResponseSchema.parse({
      projects,
    });
    
    return response;
  } catch (error) {
    // Log detailed error information server-side for debugging
    console.error("Error in fetchNotionProjects:", error);
    
    // Return only generic error message to prevent information leakage
    return NotionProjectsResponseSchema.parse({
      projects: [],
      error: "Failed to fetch Notion projects. Please check your configuration.",
    });
  }
}