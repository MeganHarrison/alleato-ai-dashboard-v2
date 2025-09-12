/**
 * @fileoverview Tests for Notion validation schemas
 * @module utils/notion/__tests__/schemas.test
 */

import { describe, it, expect } from 'vitest';
import {
  NotionDatabaseIdSchema,
  NotionPageIdSchema,
  NotionProjectSchema,
  NotionQueryResponseSchema,
  ProjectDataSchema,
  NotionEnvSchema,
  NotionProjectsResponseSchema,
} from '../schemas';

/**
 * Test suite for Notion validation schemas.
 * 
 * Validates schema behavior for valid and invalid inputs.
 * Ensures proper type safety and error handling.
 */
describe('Notion Schemas', () => {
  describe('NotionDatabaseIdSchema', () => {
    it('should accept valid UUID format', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      expect(() => NotionDatabaseIdSchema.parse(validId)).not.toThrow();
    });

    it('should accept valid 32-character format', () => {
      const validId = 'abcd1234567890abcdef1234567890ab';
      expect(() => NotionDatabaseIdSchema.parse(validId)).not.toThrow();
    });

    it('should reject invalid format', () => {
      const invalidId = 'invalid-id';
      expect(() => NotionDatabaseIdSchema.parse(invalidId)).toThrow();
    });

    it('should reject empty string', () => {
      expect(() => NotionDatabaseIdSchema.parse('')).toThrow();
    });
  });

  describe('NotionPageIdSchema', () => {
    it('should accept valid page ID', () => {
      const validId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      expect(() => NotionPageIdSchema.parse(validId)).not.toThrow();
    });
  });

  describe('ProjectDataSchema', () => {
    it('should validate complete project data', () => {
      const validProject = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Test Project',
        status: 'In Progress',
        priority: 'High',
        assignee: 'John Doe',
        dueDate: '2025-12-31',
        description: 'Test description',
        url: 'https://notion.so/test',
        createdTime: '2025-01-01T00:00:00.000Z',
        lastEditedTime: '2025-01-01T12:00:00.000Z',
      };

      const result = ProjectDataSchema.parse(validProject);
      expect(result).toEqual(validProject);
    });

    it('should handle null optional fields', () => {
      const projectWithNulls = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Test Project',
        status: null,
        priority: null,
        assignee: null,
        dueDate: null,
        description: null,
        url: 'https://notion.so/test',
        createdTime: '2025-01-01T00:00:00.000Z',
        lastEditedTime: '2025-01-01T12:00:00.000Z',
      };

      expect(() => ProjectDataSchema.parse(projectWithNulls)).not.toThrow();
    });

    it('should reject empty project name', () => {
      const invalidProject = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: '',
        status: null,
        priority: null,
        assignee: null,
        dueDate: null,
        description: null,
        url: 'https://notion.so/test',
        createdTime: '2025-01-01T00:00:00.000Z',
        lastEditedTime: '2025-01-01T12:00:00.000Z',
      };

      expect(() => ProjectDataSchema.parse(invalidProject)).toThrow();
    });

    it('should reject invalid URL', () => {
      const invalidProject = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Test Project',
        status: null,
        priority: null,
        assignee: null,
        dueDate: null,
        description: null,
        url: 'not-a-url',
        createdTime: '2025-01-01T00:00:00.000Z',
        lastEditedTime: '2025-01-01T12:00:00.000Z',
      };

      expect(() => ProjectDataSchema.parse(invalidProject)).toThrow();
    });
  });

  describe('NotionEnvSchema', () => {
    it('should accept valid environment with NOTION_DATABASE_ID', () => {
      const validEnv = {
        NOTION_TOKEN: 'secret_token123',
        NOTION_DATABASE_ID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => NotionEnvSchema.parse(validEnv)).not.toThrow();
    });

    it('should accept valid environment with NOTION_PROJECTS_DATABASE_ID', () => {
      const validEnv = {
        NOTION_TOKEN: 'secret_token123',
        NOTION_PROJECTS_DATABASE_ID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => NotionEnvSchema.parse(validEnv)).not.toThrow();
    });

    it('should reject missing NOTION_TOKEN', () => {
      const invalidEnv = {
        NOTION_DATABASE_ID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => NotionEnvSchema.parse(invalidEnv)).toThrow();
    });

    it('should reject missing database IDs', () => {
      const invalidEnv = {
        NOTION_TOKEN: 'secret_token123',
      };

      expect(() => NotionEnvSchema.parse(invalidEnv)).toThrow();
    });

    it('should reject empty NOTION_TOKEN', () => {
      const invalidEnv = {
        NOTION_TOKEN: '',
        NOTION_DATABASE_ID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      expect(() => NotionEnvSchema.parse(invalidEnv)).toThrow();
    });
  });

  describe('NotionProjectsResponseSchema', () => {
    it('should validate successful response', () => {
      const validResponse = {
        projects: [
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            name: 'Test Project',
            status: 'Active',
            priority: 'High',
            assignee: 'John Doe',
            dueDate: '2025-12-31',
            description: 'Test description',
            url: 'https://notion.so/test',
            createdTime: '2025-01-01T00:00:00.000Z',
            lastEditedTime: '2025-01-01T12:00:00.000Z',
          }
        ],
      };

      expect(() => NotionProjectsResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should validate error response', () => {
      const errorResponse = {
        projects: [],
        error: 'Something went wrong',
      };

      expect(() => NotionProjectsResponseSchema.parse(errorResponse)).not.toThrow();
    });

    it('should reject invalid project in array', () => {
      const invalidResponse = {
        projects: [
          {
            id: 'invalid-id',
            name: 'Test Project',
            url: 'not-a-url',
          }
        ],
      };

      expect(() => NotionProjectsResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('NotionQueryResponseSchema', () => {
    it('should validate complete query response', () => {
      const validResponse = {
        object: 'list' as const,
        results: [
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            url: 'https://notion.so/test',
            created_time: '2025-01-01T00:00:00.000Z',
            last_edited_time: '2025-01-01T12:00:00.000Z',
            properties: {
              name: {
                type: 'title' as const,
                title: [
                  {
                    type: 'text' as const,
                    text: { content: 'Test Project' },
                    plain_text: 'Test Project',
                  }
                ],
              },
            },
          }
        ],
        next_cursor: null,
        has_more: false,
      };

      expect(() => NotionQueryResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should handle pagination fields', () => {
      const paginatedResponse = {
        object: 'list' as const,
        results: [],
        next_cursor: 'cursor123',
        has_more: true,
      };

      expect(() => NotionQueryResponseSchema.parse(paginatedResponse)).not.toThrow();
    });
  });
});