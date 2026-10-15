import { z } from "zod";

/**
 * @fileoverview Zod validation schemas for Notion API data
 * @module utils/notion/schemas
 * 
 * Comprehensive validation schemas for all external Notion API data.
 * Required per CLAUDE.md: "MUST validate ALL external data with Zod"
 */

// Database ID validation with branded type
export const NotionDatabaseIdSchema = z.string().regex(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$|^[a-f0-9]{32}$/).brand<"NotionDatabaseId">();
export type NotionDatabaseId = z.infer<typeof NotionDatabaseIdSchema>;

// Page ID validation with branded type
export const NotionPageIdSchema = z.string().regex(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$|^[a-f0-9]{32}$/).brand<"NotionPageId">();
export type NotionPageId = z.infer<typeof NotionPageIdSchema>;

// Notion title property schema
export const NotionTitleSchema = z.object({
  type: z.literal("title"),
  title: z.array(z.object({
    type: z.literal("text"),
    text: z.object({
      content: z.string(),
    }),
    plain_text: z.string(),
  })),
});

// Notion select property schema
export const NotionSelectSchema = z.object({
  type: z.literal("select"),
  select: z.object({
    name: z.string(),
    color: z.string(),
  }).nullable(),
});

// Notion people property schema
export const NotionPeopleSchema = z.object({
  type: z.literal("people"),
  people: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    avatar_url: z.string().url().optional(),
  })),
});

// Notion date property schema
export const NotionDateSchema = z.object({
  type: z.literal("date"),
  date: z.object({
    start: z.string(),
    end: z.string().optional(),
  }).nullable(),
});

// Notion rich text property schema
export const NotionRichTextSchema = z.object({
  type: z.literal("rich_text"),
  rich_text: z.array(z.object({
    type: z.literal("text"),
    text: z.object({
      content: z.string(),
    }),
    plain_text: z.string(),
  })),
});

// Complete Notion project properties schema
export const NotionProjectPropertiesSchema = z.object({
  name: NotionTitleSchema.optional(),
  status: NotionSelectSchema.optional(),
  priority: NotionSelectSchema.optional(),
  assignee: NotionPeopleSchema.optional(),
  due_date: NotionDateSchema.optional(),
  description: NotionRichTextSchema.optional(),
}).passthrough(); // Allow additional properties

// Notion project page schema
export const NotionProjectSchema = z.object({
  id: NotionPageIdSchema,
  url: z.string().url(),
  created_time: z.string().datetime(),
  last_edited_time: z.string().datetime(),
  properties: NotionProjectPropertiesSchema,
});

// Notion API query response schema
export const NotionQueryResponseSchema = z.object({
  object: z.literal("list"),
  results: z.array(NotionProjectSchema),
  next_cursor: z.string().nullable(),
  has_more: z.boolean(),
});

// Validated project data for display
export const ProjectDataSchema = z.object({
  id: NotionPageIdSchema,
  name: z.string().min(1, "Project name cannot be empty"),
  status: z.string().nullable(),
  priority: z.string().nullable(),
  assignee: z.string().nullable(),
  dueDate: z.string().nullable(),
  description: z.string().nullable(),
  url: z.string().url(),
  createdTime: z.string().datetime(),
  lastEditedTime: z.string().datetime(),
});

// Environment variables schema for Notion integration
export const NotionEnvSchema = z.object({
  NOTION_TOKEN: z.string().min(1, "NOTION_TOKEN is required"),
  NOTION_DATABASE_ID: z.string().optional(),
  NOTION_PROJECTS_DATABASE_ID: z.string().optional(),
}).refine(
  data => data.NOTION_DATABASE_ID || data.NOTION_PROJECTS_DATABASE_ID,
  {
    message: "Either NOTION_DATABASE_ID or NOTION_PROJECTS_DATABASE_ID must be provided",
    path: ["NOTION_DATABASE_ID", "NOTION_PROJECTS_DATABASE_ID"],
  }
);

// Server action response schema
export const NotionProjectsResponseSchema = z.object({
  projects: z.array(ProjectDataSchema),
  error: z.string().optional(),
});

// Type exports for use in components
export type NotionProject = z.infer<typeof NotionProjectSchema>;
export type NotionQueryResponse = z.infer<typeof NotionQueryResponseSchema>;
export type ProjectData = z.infer<typeof ProjectDataSchema>;
export type NotionProjectsResponse = z.infer<typeof NotionProjectsResponseSchema>;
export type NotionEnv = z.infer<typeof NotionEnvSchema>;