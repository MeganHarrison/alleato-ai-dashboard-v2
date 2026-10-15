/**
 * @fileoverview Tests for Notion projects utility functions
 * @module utils/notion/__tests__/projects.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotionProjects } from '../projects';

// Mock the client module
vi.mock('../client', () => ({
  notionRequest: vi.fn(),
}));

// Mock the schemas module  
vi.mock('../schemas', () => ({
  NotionDatabaseIdSchema: {
    parse: vi.fn((id: string) => {
      if (!id.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$|^[a-f0-9]{32}$/)) {
        throw new Error('Invalid database ID');
      }
      return id;
    }),
  },
  NotionQueryResponseSchema: {
    parse: vi.fn((response) => response),
  },
  ProjectDataSchema: {
    parse: vi.fn((data) => data),
  },
}));

import { notionRequest } from '../client';

/**
 * Test suite for getNotionProjects function.
 * 
 * Tests API integration, data transformation, error handling,
 * and pagination support with comprehensive mocking.
 */
describe('getNotionProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and transform projects successfully', async () => {
    const mockResponse = {
      object: 'list',
      results: [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          url: 'https://notion.so/test-project-1',
          created_time: '2025-01-01T00:00:00.000Z',
          last_edited_time: '2025-01-01T12:00:00.000Z',
          properties: {
            name: {
              type: 'title',
              title: [
                {
                  type: 'text',
                  text: { content: 'Test Project 1' },
                  plain_text: 'Test Project 1',
                }
              ],
            },
            status: {
              type: 'select',
              select: {
                name: 'In Progress',
                color: 'blue',
              },
            },
            priority: {
              type: 'select',
              select: {
                name: 'High',
                color: 'red',
              },
            },
          },
        }
      ],
      next_cursor: null,
      has_more: false,
    };

    vi.mocked(notionRequest).mockResolvedValue(mockResponse);

    const result = await getNotionProjects('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Test Project 1',
      status: 'In Progress',
      priority: 'High',
      url: 'https://notion.so/test-project-1',
    });

    expect(notionRequest).toHaveBeenCalledWith(
      '/databases/a1b2c3d4-e5f6-7890-abcd-ef1234567890/query',
      {
        method: 'POST',
        data: {
          sorts: [
            {
              timestamp: 'last_edited_time',
              direction: 'descending',
            },
          ],
        },
      }
    );
  });

  it('should handle pagination correctly', async () => {
    const firstPageResponse = {
      object: 'list',
      results: [
        {
          id: 'project-1',
          url: 'https://notion.so/project-1',
          created_time: '2025-01-01T00:00:00.000Z',
          last_edited_time: '2025-01-01T12:00:00.000Z',
          properties: {
            name: {
              type: 'title',
              title: [{ type: 'text', text: { content: 'Project 1' }, plain_text: 'Project 1' }],
            },
          },
        }
      ],
      next_cursor: 'cursor123',
      has_more: true,
    };

    const secondPageResponse = {
      object: 'list',
      results: [
        {
          id: 'project-2',
          url: 'https://notion.so/project-2',
          created_time: '2025-01-01T00:00:00.000Z',
          last_edited_time: '2025-01-01T12:00:00.000Z',
          properties: {
            name: {
              type: 'title',
              title: [{ type: 'text', text: { content: 'Project 2' }, plain_text: 'Project 2' }],
            },
          },
        }
      ],
      next_cursor: null,
      has_more: false,
    };

    vi.mocked(notionRequest)
      .mockResolvedValueOnce(firstPageResponse)
      .mockResolvedValueOnce(secondPageResponse);

    const result = await getNotionProjects('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Project 1');
    expect(result[1].name).toBe('Project 2');

    // Check that second request included cursor
    expect(notionRequest).toHaveBeenCalledTimes(2);
    expect(notionRequest).toHaveBeenNthCalledWith(2,
      '/databases/a1b2c3d4-e5f6-7890-abcd-ef1234567890/query',
      {
        method: 'POST',
        data: {
          sorts: [
            {
              timestamp: 'last_edited_time',
              direction: 'descending',
            },
          ],
          start_cursor: 'cursor123',
        },
      }
    );
  });

  it('should handle flexible property key matching', async () => {
    const mockResponse = {
      object: 'list',
      results: [
        {
          id: 'test-project',
          url: 'https://notion.so/test',
          created_time: '2025-01-01T00:00:00.000Z',
          last_edited_time: '2025-01-01T12:00:00.000Z',
          properties: {
            // Using capitalized property names (common in Notion)
            'Name': {
              type: 'title',
              title: [{ type: 'text', text: { content: 'Test Project' }, plain_text: 'Test Project' }],
            },
            'Status': {
              type: 'select',
              select: { name: 'Active', color: 'green' },
            },
            'Priority': {
              type: 'select',
              select: { name: 'Medium', color: 'yellow' },
            },
          },
        }
      ],
      next_cursor: null,
      has_more: false,
    };

    vi.mocked(notionRequest).mockResolvedValue(mockResponse);

    const result = await getNotionProjects('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    expect(result[0].name).toBe('Test Project');
    expect(result[0].status).toBe('Active');
    expect(result[0].priority).toBe('Medium');
  });

  it('should handle missing or null properties gracefully', async () => {
    const mockResponse = {
      object: 'list',
      results: [
        {
          id: 'minimal-project',
          url: 'https://notion.so/minimal',
          created_time: '2025-01-01T00:00:00.000Z',
          last_edited_time: '2025-01-01T12:00:00.000Z',
          properties: {
            name: {
              type: 'title',
              title: [],
            },
            status: {
              type: 'select',
              select: null,
            },
          },
        }
      ],
      next_cursor: null,
      has_more: false,
    };

    vi.mocked(notionRequest).mockResolvedValue(mockResponse);

    const result = await getNotionProjects('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    expect(result[0].name).toBe('Untitled');
    expect(result[0].status).toBeNull();
    expect(result[0].priority).toBeNull();
    expect(result[0].assignee).toBeNull();
  });

  it('should reject invalid database ID format', async () => {
    const invalidId = 'invalid-database-id';

    await expect(getNotionProjects(invalidId)).rejects.toThrow('Invalid database ID');
  });

  it('should handle API request failures', async () => {
    vi.mocked(notionRequest).mockRejectedValue(new Error('API request failed'));

    await expect(getNotionProjects('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).rejects.toThrow('Failed to fetch projects');
  });

  it('should handle Zod validation errors', async () => {
    const mockResponse = { invalid: 'response' };
    
    vi.mocked(notionRequest).mockResolvedValue(mockResponse);
    
    // Mock schema to throw validation error
    const { NotionQueryResponseSchema } = await import('../schemas');
    vi.mocked(NotionQueryResponseSchema.parse).mockImplementation(() => {
      const error = new Error('Validation failed');
      error.name = 'ZodError';
      throw error;
    });

    await expect(getNotionProjects('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).rejects.toThrow('Invalid data format from Notion API');
  });

  it('should handle empty results', async () => {
    const emptyResponse = {
      object: 'list',
      results: [],
      next_cursor: null,
      has_more: false,
    };

    vi.mocked(notionRequest).mockResolvedValue(emptyResponse);

    const result = await getNotionProjects('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    expect(result).toEqual([]);
  });

  it('should handle complex people property', async () => {
    const mockResponse = {
      object: 'list',
      results: [
        {
          id: 'team-project',
          url: 'https://notion.so/team',
          created_time: '2025-01-01T00:00:00.000Z',
          last_edited_time: '2025-01-01T12:00:00.000Z',
          properties: {
            name: {
              type: 'title',
              title: [{ type: 'text', text: { content: 'Team Project' }, plain_text: 'Team Project' }],
            },
            assignee: {
              type: 'people',
              people: [
                { id: 'user1', name: 'John Doe', avatar_url: 'https://example.com/john.jpg' },
                { id: 'user2', name: 'Jane Smith', avatar_url: 'https://example.com/jane.jpg' },
              ],
            },
          },
        }
      ],
      next_cursor: null,
      has_more: false,
    };

    vi.mocked(notionRequest).mockResolvedValue(mockResponse);

    const result = await getNotionProjects('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    expect(result[0].assignee).toBe('John Doe, Jane Smith');
  });

  it('should handle date properties correctly', async () => {
    const mockResponse = {
      object: 'list',
      results: [
        {
          id: 'dated-project',
          url: 'https://notion.so/dated',
          created_time: '2025-01-01T00:00:00.000Z',
          last_edited_time: '2025-01-01T12:00:00.000Z',
          properties: {
            name: {
              type: 'title',
              title: [{ type: 'text', text: { content: 'Dated Project' }, plain_text: 'Dated Project' }],
            },
            due_date: {
              type: 'date',
              date: {
                start: '2025-12-31',
                end: null,
              },
            },
          },
        }
      ],
      next_cursor: null,
      has_more: false,
    };

    vi.mocked(notionRequest).mockResolvedValue(mockResponse);

    const result = await getNotionProjects('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    expect(result[0].dueDate).toBe('2025-12-31');
  });
});