/**
 * @fileoverview Tests for Notion projects server actions
 * @module app/actions/__tests__/notion-projects-actions.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNotionProjects } from '../notion-projects-actions';

// Mock the projects utility
vi.mock('@/utils/notion/projects', () => ({
  getNotionProjects: vi.fn(),
}));

// Mock the schemas
vi.mock('@/utils/notion/schemas', () => ({
  NotionEnvSchema: {
    parse: vi.fn(),
  },
  NotionProjectsResponseSchema: {
    parse: vi.fn((data) => data),
  },
}));

import { getNotionProjects } from '@/utils/notion/projects';
import { NotionEnvSchema } from '@/utils/notion/schemas';

/**
 * Test suite for fetchNotionProjects server action.
 * 
 * Tests environment validation, data fetching, error handling,
 * and response formatting with comprehensive mocking.
 */
describe('fetchNotionProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.NOTION_TOKEN;
    delete process.env.NOTION_DATABASE_ID;
    delete process.env.NOTION_PROJECTS_DATABASE_ID;
  });

  it('should fetch projects successfully with NOTION_DATABASE_ID', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        name: 'Test Project 1',
        status: 'Active',
        priority: 'High',
        assignee: 'John Doe',
        dueDate: '2025-12-31',
        description: 'Test description',
        url: 'https://notion.so/test-1',
        createdTime: '2025-01-01T00:00:00.000Z',
        lastEditedTime: '2025-01-01T12:00:00.000Z',
      }
    ];

    process.env.NOTION_TOKEN = 'test-token';
    process.env.NOTION_DATABASE_ID = 'test-db-id';

    vi.mocked(NotionEnvSchema.parse).mockReturnValue({
      NOTION_TOKEN: 'test-token',
      NOTION_DATABASE_ID: 'test-db-id',
    });

    vi.mocked(getNotionProjects).mockResolvedValue(mockProjects);

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: mockProjects,
    });

    expect(NotionEnvSchema.parse).toHaveBeenCalledWith({
      NOTION_TOKEN: 'test-token',
      NOTION_DATABASE_ID: 'test-db-id',
      NOTION_PROJECTS_DATABASE_ID: undefined,
    });

    expect(getNotionProjects).toHaveBeenCalledWith('test-db-id');
  });

  it('should fetch projects successfully with NOTION_PROJECTS_DATABASE_ID', async () => {
    const mockProjects = [
      {
        id: 'project-2',
        name: 'Test Project 2',
        status: 'Completed',
        priority: 'Medium',
        assignee: null,
        dueDate: null,
        description: null,
        url: 'https://notion.so/test-2',
        createdTime: '2025-01-01T00:00:00.000Z',
        lastEditedTime: '2025-01-01T12:00:00.000Z',
      }
    ];

    process.env.NOTION_TOKEN = 'test-token';
    process.env.NOTION_PROJECTS_DATABASE_ID = 'test-projects-db-id';

    vi.mocked(NotionEnvSchema.parse).mockReturnValue({
      NOTION_TOKEN: 'test-token',
      NOTION_PROJECTS_DATABASE_ID: 'test-projects-db-id',
    });

    vi.mocked(getNotionProjects).mockResolvedValue(mockProjects);

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: mockProjects,
    });

    expect(getNotionProjects).toHaveBeenCalledWith('test-projects-db-id');
  });

  it('should handle missing environment variables', async () => {
    // No environment variables set
    vi.mocked(NotionEnvSchema.parse).mockImplementation(() => {
      throw new Error('Environment validation failed');
    });

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: [],
      error: 'Configuration error. Please check environment variables.',
    });
  });

  it('should handle missing NOTION_TOKEN', async () => {
    process.env.NOTION_DATABASE_ID = 'test-db-id';

    vi.mocked(NotionEnvSchema.parse).mockImplementation(() => {
      const error = new Error('NOTION_TOKEN is required');
      error.name = 'ZodError';
      throw error;
    });

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: [],
      error: 'Configuration error. Please check environment variables.',
    });
  });

  it('should handle missing database ID after env validation', async () => {
    process.env.NOTION_TOKEN = 'test-token';

    vi.mocked(NotionEnvSchema.parse).mockReturnValue({
      NOTION_TOKEN: 'test-token',
    });

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: [],
      error: 'Database ID configuration error. Please check your environment variables.',
    });
  });

  it('should handle API request failures', async () => {
    process.env.NOTION_TOKEN = 'test-token';
    process.env.NOTION_DATABASE_ID = 'test-db-id';

    vi.mocked(NotionEnvSchema.parse).mockReturnValue({
      NOTION_TOKEN: 'test-token',
      NOTION_DATABASE_ID: 'test-db-id',
    });

    vi.mocked(getNotionProjects).mockRejectedValue(new Error('API request failed'));

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: [],
      error: 'Unable to fetch Notion projects.',
    });
  });

  it('should handle Notion authentication errors', async () => {
    process.env.NOTION_TOKEN = 'invalid-token';
    process.env.NOTION_DATABASE_ID = 'test-db-id';

    vi.mocked(NotionEnvSchema.parse).mockReturnValue({
      NOTION_TOKEN: 'invalid-token',
      NOTION_DATABASE_ID: 'test-db-id',
    });

    vi.mocked(getNotionProjects).mockRejectedValue(new Error('NOTION_TOKEN authentication failed'));

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: [],
      error: 'Authentication error. Please check NOTION_TOKEN.',
    });
  });

  it('should handle database configuration errors', async () => {
    process.env.NOTION_TOKEN = 'test-token';
    process.env.NOTION_DATABASE_ID = 'invalid-db-id';

    vi.mocked(NotionEnvSchema.parse).mockReturnValue({
      NOTION_TOKEN: 'test-token',
      NOTION_DATABASE_ID: 'invalid-db-id',
    });

    vi.mocked(getNotionProjects).mockRejectedValue(new Error('database not found'));

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: [],
      error: 'Database configuration error. Please check NOTION_DATABASE_ID.',
    });
  });

  it('should handle data validation errors', async () => {
    process.env.NOTION_TOKEN = 'test-token';
    process.env.NOTION_DATABASE_ID = 'test-db-id';

    vi.mocked(NotionEnvSchema.parse).mockReturnValue({
      NOTION_TOKEN: 'test-token',
      NOTION_DATABASE_ID: 'test-db-id',
    });

    vi.mocked(getNotionProjects).mockRejectedValue(new Error('Invalid data format from Notion API'));

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: [],
      error: 'Data validation error. Please check your Notion database structure.',
    });
  });

  it('should handle ZodError from environment validation', async () => {
    process.env.NOTION_TOKEN = '';
    process.env.NOTION_DATABASE_ID = 'test-db-id';

    const zodError = new Error('Validation failed');
    zodError.name = 'ZodError';
    vi.mocked(NotionEnvSchema.parse).mockImplementation(() => {
      throw zodError;
    });

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: [],
      error: 'Configuration error. Please check environment variables.',
    });
  });

  it('should handle unknown errors gracefully', async () => {
    process.env.NOTION_TOKEN = 'test-token';
    process.env.NOTION_DATABASE_ID = 'test-db-id';

    vi.mocked(NotionEnvSchema.parse).mockReturnValue({
      NOTION_TOKEN: 'test-token',
      NOTION_DATABASE_ID: 'test-db-id',
    });

    vi.mocked(getNotionProjects).mockRejectedValue('Unknown error');

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: [],
      error: 'Unable to fetch Notion projects.',
    });
  });

  it('should return empty array for successful request with no projects', async () => {
    process.env.NOTION_TOKEN = 'test-token';
    process.env.NOTION_DATABASE_ID = 'test-db-id';

    vi.mocked(NotionEnvSchema.parse).mockReturnValue({
      NOTION_TOKEN: 'test-token',
      NOTION_DATABASE_ID: 'test-db-id',
    });

    vi.mocked(getNotionProjects).mockResolvedValue([]);

    const result = await fetchNotionProjects();

    expect(result).toEqual({
      projects: [],
    });
  });

  it('should prefer NOTION_DATABASE_ID over NOTION_PROJECTS_DATABASE_ID', async () => {
    process.env.NOTION_TOKEN = 'test-token';
    process.env.NOTION_DATABASE_ID = 'primary-db-id';
    process.env.NOTION_PROJECTS_DATABASE_ID = 'secondary-db-id';

    vi.mocked(NotionEnvSchema.parse).mockReturnValue({
      NOTION_TOKEN: 'test-token',
      NOTION_DATABASE_ID: 'primary-db-id',
      NOTION_PROJECTS_DATABASE_ID: 'secondary-db-id',
    });

    vi.mocked(getNotionProjects).mockResolvedValue([]);

    await fetchNotionProjects();

    expect(getNotionProjects).toHaveBeenCalledWith('primary-db-id');
  });
});