"use server";

import { getNotionProjects, type ProjectData } from "@/utils/notion/projects";

export interface NotionProjectsResponse {
  projects: ProjectData[];
  error?: string;
}

/**
 * Server action to fetch Notion projects
 * Uses NOTION_DATABASE_ID from environment variables
 */
export async function fetchNotionProjects(): Promise<NotionProjectsResponse> {
  try {
    // Get database ID from environment variables
    const databaseId = process.env.NOTION_DATABASE_ID || process.env.NOTION_PROJECTS_DATABASE_ID;
    
    if (!databaseId) {
      return {
        projects: [],
        error: "NOTION_DATABASE_ID or NOTION_PROJECTS_DATABASE_ID environment variable is not set. Please add it to your .env file.",
      };
    }

    const projects = await getNotionProjects(databaseId);
    
    return {
      projects,
    };
  } catch (error) {
    console.error("Error in fetchNotionProjects:", error);
    
    return {
      projects: [],
      error: error instanceof Error ? error.message : "Failed to fetch Notion projects",
    };
  }
}