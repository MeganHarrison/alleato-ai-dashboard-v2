import { notionRequest } from "./client";

/**
 * Notion project interface based on typical project database structure
 */
export interface NotionProject {
  id: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  properties: {
    name?: {
      type: "title";
      title: Array<{
        type: "text";
        text: { content: string };
        plain_text: string;
      }>;
    };
    status?: {
      type: "select";
      select?: {
        name: string;
        color: string;
      };
    };
    priority?: {
      type: "select";
      select?: {
        name: string;
        color: string;
      };
    };
    assignee?: {
      type: "people";
      people: Array<{
        id: string;
        name?: string;
        avatar_url?: string;
      }>;
    };
    due_date?: {
      type: "date";
      date?: {
        start: string;
        end?: string;
      };
    };
    description?: {
      type: "rich_text";
      rich_text: Array<{
        type: "text";
        text: { content: string };
        plain_text: string;
      }>;
    };
  };
}

/**
 * Simplified project data for display
 */
export interface ProjectData {
  id: string;
  name: string;
  status: string | null;
  priority: string | null;
  assignee: string | null;
  dueDate: string | null;
  description: string | null;
  url: string;
  createdTime: string;
  lastEditedTime: string;
}

/**
 * Fetch projects from a Notion database
 * @param databaseId - The ID of the Notion database containing projects
 * @returns Promise resolving to an array of project data
 */
export async function getNotionProjects(databaseId: string): Promise<ProjectData[]> {
  try {
    const response = await notionRequest(`/databases/${databaseId}/query`, {
      method: "POST",
      data: {
        sorts: [
          {
            timestamp: "last_edited_time",
            direction: "descending",
          },
        ],
      },
    });

    if (!response || !response.results) {
      return [];
    }

    return response.results.map((page: NotionProject): ProjectData => {
      const properties = page.properties;

      return {
        id: page.id,
        name: extractTitle(properties.name),
        status: extractSelect(properties.status),
        priority: extractSelect(properties.priority),
        assignee: extractPeople(properties.assignee),
        dueDate: extractDate(properties.due_date),
        description: extractRichText(properties.description),
        url: page.url,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
      };
    });
  } catch (error) {
    console.error("Error fetching Notion projects:", error);
    throw new Error(`Failed to fetch projects: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Extract title text from Notion title property
 */
function extractTitle(titleProp: NotionProject["properties"]["name"]): string {
  if (!titleProp || titleProp.type !== "title" || !titleProp.title.length) {
    return "Untitled";
  }
  return titleProp.title.map(t => t.plain_text).join("");
}

/**
 * Extract select option from Notion select property
 */
function extractSelect(selectProp: NotionProject["properties"]["status"]): string | null {
  if (!selectProp || selectProp.type !== "select" || !selectProp.select) {
    return null;
  }
  return selectProp.select.name;
}

/**
 * Extract people names from Notion people property
 */
function extractPeople(peopleProp: NotionProject["properties"]["assignee"]): string | null {
  if (!peopleProp || peopleProp.type !== "people" || !peopleProp.people.length) {
    return null;
  }
  return peopleProp.people.map(person => person.name || "Unnamed").join(", ");
}

/**
 * Extract date from Notion date property
 */
function extractDate(dateProp: NotionProject["properties"]["due_date"]): string | null {
  if (!dateProp || dateProp.type !== "date" || !dateProp.date) {
    return null;
  }
  return dateProp.date.start;
}

/**
 * Extract rich text content from Notion rich text property
 */
function extractRichText(richTextProp: NotionProject["properties"]["description"]): string | null {
  if (!richTextProp || richTextProp.type !== "rich_text" || !richTextProp.rich_text.length) {
    return null;
  }
  return richTextProp.rich_text.map(rt => rt.plain_text).join("");
}