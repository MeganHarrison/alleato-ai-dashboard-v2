import { notionRequest } from "./client";
import {
  NotionDatabaseIdSchema,
  NotionQueryResponseSchema,
  ProjectDataSchema,
  type NotionDatabaseId,
  type NotionProject,
  type ProjectData,
  type NotionQueryResponse,
} from "./schemas";

// Re-export types for backward compatibility
export type { NotionProject, ProjectData };

/**
 * Fetch projects from a Notion database with full validation and pagination support.
 * 
 * @param databaseId - The ID of the Notion database containing projects
 * @returns Promise resolving to an array of validated project data
 * @throws {Error} When database ID is invalid or API request fails
 */
export async function getNotionProjects(databaseId: string): Promise<ProjectData[]> {
  // Validate database ID using Zod schema
  const validatedDatabaseId = NotionDatabaseIdSchema.parse(databaseId);

  try {
    // Fetch all pages with pagination support
    const allProjects: NotionProject[] = [];
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const requestData: Record<string, unknown> = {
        sorts: [
          {
            timestamp: "last_edited_time",
            direction: "descending",
          },
        ],
      };

      // Add cursor for pagination
      if (cursor) {
        requestData.start_cursor = cursor;
      }

      const response = await notionRequest(`/databases/${validatedDatabaseId}/query`, {
        method: "POST",
        data: requestData,
      });

      // Validate API response structure
      const validatedResponse: NotionQueryResponse = NotionQueryResponseSchema.parse(response);

      // Add results to collection
      allProjects.push(...validatedResponse.results);

      // Update pagination state
      cursor = validatedResponse.next_cursor;
      hasMore = validatedResponse.has_more;
    }

    // Transform and validate each project
    const transformedProjects: ProjectData[] = allProjects.map((page: NotionProject): ProjectData => {
      const properties = page.properties;

      // Use flexible property key matching for better compatibility
      const props = properties as Record<string, unknown>;
      
      const projectData: ProjectData = {
        id: page.id,
        name: extractTitle(props["Name"] ?? props["name"] ?? properties.name),
        status: extractSelect(props["Status"] ?? props["status"] ?? properties.status),
        priority: extractSelect(props["Priority"] ?? props["priority"] ?? properties.priority),
        assignee: extractPeople(props["Assignee"] ?? props["assignee"] ?? properties.assignee),
        dueDate: extractDate(props["Due Date"] ?? props["due_date"] ?? properties.due_date),
        description: extractRichText(props["Description"] ?? props["description"] ?? properties.description),
        url: page.url,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
      };

      // Validate the final project data
      return ProjectDataSchema.parse(projectData);
    });

    return transformedProjects;
  } catch (error) {
    console.error("Error fetching Notion projects:", error);
    
    // Differentiate error types for better debugging
    if (error instanceof Error) {
      if (error.name === "ZodError") {
        throw new Error(`Invalid data format from Notion API: ${error.message}`);
      }
      if (error.message.includes("Notion API request failed")) {
        throw new Error(`Notion API error: ${error.message}`);
      }
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
    
    throw new Error("Failed to fetch projects: Unknown error occurred");
  }
}

/**
 * Extract title text from Notion title property with enhanced error handling.
 * @param titleProp - Notion title property (supports both exact type and flexible Record)
 * @returns Extracted title text or "Untitled" fallback
 */
function extractTitle(titleProp: unknown): string {
  try {
    if (!titleProp || typeof titleProp !== "object") {
      return "Untitled";
    }

    const prop = titleProp as Record<string, unknown>;
    
    if (prop.type !== "title" || !Array.isArray(prop.title)) {
      return "Untitled";
    }

    const titleText = prop.title
      .map((block: unknown) => {
        if (typeof block === "object" && block && "plain_text" in block) {
          return (block as Record<string, string>).plain_text;
        }
        return "";
      })
      .join("")
      .trim();

    return titleText || "Untitled";
  } catch (error) {
    console.warn("Error extracting title:", error);
    return "Untitled";
  }
}

/**
 * Extract select option from Notion select property with null safety.
 * @param selectProp - Notion select property (supports flexible types)
 * @returns Selected option name or null
 */
function extractSelect(selectProp: unknown): string | null {
  try {
    if (!selectProp || typeof selectProp !== "object") {
      return null;
    }

    const prop = selectProp as Record<string, unknown>;
    
    if (prop.type !== "select") {
      return null;
    }

    const selectValue = prop.select;
    if (typeof selectValue === "object" && selectValue && "name" in selectValue) {
      const name = (selectValue as Record<string, string>).name;
      return typeof name === "string" ? name.trim() : null;
    }

    return null;
  } catch (error) {
    console.warn("Error extracting select:", error);
    return null;
  }
}

/**
 * Extract people names from Notion people property with validation.
 * @param peopleProp - Notion people property
 * @returns Comma-separated people names or null
 */
function extractPeople(peopleProp: unknown): string | null {
  try {
    if (!peopleProp || typeof peopleProp !== "object") {
      return null;
    }

    const prop = peopleProp as Record<string, unknown>;
    
    if (prop.type !== "people" || !Array.isArray(prop.people)) {
      return null;
    }

    const names = prop.people
      .map((person: unknown) => {
        if (typeof person === "object" && person && "name" in person) {
          const name = (person as Record<string, string>).name;
          return typeof name === "string" ? name.trim() : "Unnamed";
        }
        return "Unnamed";
      })
      .filter((name: string) => name !== "")
      .join(", ");

    return names || null;
  } catch (error) {
    console.warn("Error extracting people:", error);
    return null;
  }
}

/**
 * Extract date from Notion date property with ISO string validation.
 * @param dateProp - Notion date property
 * @returns ISO date string or null
 */
function extractDate(dateProp: unknown): string | null {
  try {
    if (!dateProp || typeof dateProp !== "object") {
      return null;
    }

    const prop = dateProp as Record<string, unknown>;
    
    if (prop.type !== "date") {
      return null;
    }

    const dateValue = prop.date;
    if (typeof dateValue === "object" && dateValue && "start" in dateValue) {
      const startDate = (dateValue as Record<string, string>).start;
      
      // Validate date format
      if (typeof startDate === "string" && startDate.trim()) {
        return startDate.trim();
      }
    }

    return null;
  } catch (error) {
    console.warn("Error extracting date:", error);
    return null;
  }
}

/**
 * Extract rich text content from Notion rich text property with sanitization.
 * @param richTextProp - Notion rich text property
 * @returns Concatenated rich text content or null
 */
function extractRichText(richTextProp: unknown): string | null {
  try {
    if (!richTextProp || typeof richTextProp !== "object") {
      return null;
    }

    const prop = richTextProp as Record<string, unknown>;
    
    if (prop.type !== "rich_text" || !Array.isArray(prop.rich_text)) {
      return null;
    }

    const content = prop.rich_text
      .map((block: unknown) => {
        if (typeof block === "object" && block && "plain_text" in block) {
          const text = (block as Record<string, string>).plain_text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("")
      .trim();

    return content || null;
  } catch (error) {
    console.warn("Error extracting rich text:", error);
    return null;
  }
}