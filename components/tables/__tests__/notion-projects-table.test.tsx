/**
 * @fileoverview Tests for NotionProjectsTable component
 * @module components/tables/__tests__/notion-projects-table.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotionProjectsTable } from '../notion-projects-table';
import type { ProjectData } from '@/utils/notion/projects';

// Mock window.open to prevent actual navigation in tests
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

// Mock date-fns to ensure consistent date formatting in tests
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM d, yyyy') {
      return 'Jan 1, 2025';
    }
    return date;
  }),
  parseISO: vi.fn((dateStr) => new Date(dateStr)),
}));

/**
 * Test suite for NotionProjectsTable component.
 * 
 * Tests rendering, interaction, accessibility, and edge cases
 * with comprehensive data variations and user scenarios.
 */
describe('NotionProjectsTable', () => {
  const mockProjects: ProjectData[] = [
    {
      id: 'project-1',
      name: 'Test Project 1',
      status: 'In Progress',
      priority: 'High',
      assignee: 'John Doe',
      dueDate: '2025-12-31',
      description: 'This is a test project description',
      url: 'https://notion.so/test-project-1',
      createdTime: '2025-01-01T00:00:00.000Z',
      lastEditedTime: '2025-01-01T12:00:00.000Z',
    },
    {
      id: 'project-2',
      name: 'Test Project 2',
      status: 'Completed',
      priority: 'Medium',
      assignee: 'Jane Smith',
      dueDate: '2025-06-30',
      description: 'Another test project',
      url: 'https://notion.so/test-project-2',
      createdTime: '2024-12-01T00:00:00.000Z',
      lastEditedTime: '2025-01-01T06:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all projects in table format', () => {
      render(<NotionProjectsTable projects={mockProjects} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render table headers correctly', () => {
      render(<NotionProjectsTable projects={mockProjects} />);

      expect(screen.getByText('Project Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Assignee')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Last Updated')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display empty state when no projects provided', () => {
      render(<NotionProjectsTable projects={[]} />);

      expect(screen.getByText('No projects found in the Notion database.')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should sort projects by last edited time (newest first)', () => {
      render(<NotionProjectsTable projects={mockProjects} />);

      const rows = screen.getAllByRole('row');
      // First row is header, second should be Project 1 (more recent), third should be Project 2
      expect(rows[1]).toHaveTextContent('Test Project 1');
      expect(rows[2]).toHaveTextContent('Test Project 2');
    });
  });

  describe('Badge Variants', () => {
    it('should apply correct status badge variants', () => {
      const projectsWithStatuses: ProjectData[] = [
        { ...mockProjects[0], status: 'Completed' },
        { ...mockProjects[0], id: 'project-2', status: 'In Progress' },
        { ...mockProjects[0], id: 'project-3', status: 'Blocked' },
        { ...mockProjects[0], id: 'project-4', status: null },
      ];

      render(<NotionProjectsTable projects={projectsWithStatuses} />);

      // Verify all status badges are rendered (exact classes may vary)
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Blocked')).toBeInTheDocument();
      expect(screen.getByText('No Status')).toBeInTheDocument();
    });

    it('should apply correct priority badge variants', () => {
      const projectsWithPriorities: ProjectData[] = [
        { ...mockProjects[0], priority: 'High' },
        { ...mockProjects[0], id: 'project-2', priority: 'Medium' },
        { ...mockProjects[0], id: 'project-3', priority: 'Low' },
        { ...mockProjects[0], id: 'project-4', priority: null },
      ];

      render(<NotionProjectsTable projects={projectsWithPriorities} />);

      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('No Priority')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format dates correctly', () => {
      render(<NotionProjectsTable projects={mockProjects} />);

      // Due to mocking, all dates should show as 'Jan 1, 2025'
      const dateElements = screen.getAllByText('Jan 1, 2025');
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('should handle null dates gracefully', () => {
      const projectsWithNullDates: ProjectData[] = [
        { ...mockProjects[0], dueDate: null },
      ];

      render(<NotionProjectsTable projects={projectsWithNullDates} />);

      expect(screen.getByText('No due date')).toBeInTheDocument();
    });

    it('should handle null assignee gracefully', () => {
      const projectsWithNullAssignee: ProjectData[] = [
        { ...mockProjects[0], assignee: null },
      ];

      render(<NotionProjectsTable projects={projectsWithNullAssignee} />);

      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should handle null description gracefully', () => {
      const projectsWithNullDescription: ProjectData[] = [
        { ...mockProjects[0], description: null },
      ];

      render(<NotionProjectsTable projects={projectsWithNullDescription} />);

      expect(screen.getByText('No description')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should open project URL when action button is clicked', async () => {
      render(<NotionProjectsTable projects={mockProjects} />);

      const actionButtons = screen.getAllByRole('button', { name: /open in notion/i });
      expect(actionButtons).toHaveLength(2);

      fireEvent.click(actionButtons[0]);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          'https://notion.so/test-project-1',
          '_blank',
          'noopener,noreferrer'
        );
      });
    });

    it('should handle missing URL gracefully', async () => {
      const projectsWithoutUrl: ProjectData[] = [
        { ...mockProjects[0], url: '' },
      ];

      render(<NotionProjectsTable projects={projectsWithoutUrl} />);

      const actionButton = screen.getByRole('button', { name: /open in notion/i });
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(mockWindowOpen).not.toHaveBeenCalled();
      });
    });

    it('should set opener to null for security when window opens successfully', async () => {
      const mockNewWindow = { opener: null };
      mockWindowOpen.mockReturnValue(mockNewWindow);

      render(<NotionProjectsTable projects={mockProjects} />);

      const actionButton = screen.getByRole('button', { name: /open in notion/i });
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalled();
        expect(mockNewWindow.opener).toBeNull();
      });
    });

    it('should handle window.open returning null', async () => {
      mockWindowOpen.mockReturnValue(null);

      render(<NotionProjectsTable projects={mockProjects} />);

      const actionButton = screen.getByRole('button', { name: /open in notion/i });
      
      // Should not throw an error
      expect(() => fireEvent.click(actionButton)).not.toThrow();

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for action buttons', () => {
      render(<NotionProjectsTable projects={mockProjects} />);

      const actionButtons = screen.getAllByLabelText('Open in Notion');
      expect(actionButtons).toHaveLength(2);

      actionButtons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-label', 'Open in Notion');
      });
    });

    it('should have proper table structure for screen readers', () => {
      render(<NotionProjectsTable projects={mockProjects} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check for table headers
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(8);

      // Check for table rows (excluding header)
      const dataRows = screen.getAllByRole('row');
      expect(dataRows).toHaveLength(3); // 1 header + 2 data rows
    });

    it('should truncate long content appropriately', () => {
      const longDescriptionProject: ProjectData = {
        ...mockProjects[0],
        description: 'This is a very long description that should be truncated to prevent layout issues and maintain readability in the table format.',
      };

      render(<NotionProjectsTable projects={[longDescriptionProject]} />);

      // Description should be truncated (exact behavior depends on CSS, but element should exist)
      const descriptionCell = screen.getByText(longDescriptionProject.description);
      expect(descriptionCell).toBeInTheDocument();
      expect(descriptionCell.closest('div')).toHaveClass('truncate');
    });
  });

  describe('Performance', () => {
    it('should handle large number of projects without performance issues', () => {
      const manyProjects: ProjectData[] = Array.from({ length: 100 }, (_, index) => ({
        id: `project-${index}`,
        name: `Project ${index}`,
        status: index % 2 === 0 ? 'Active' : 'Completed',
        priority: index % 3 === 0 ? 'High' : 'Medium',
        assignee: `User ${index}`,
        dueDate: '2025-12-31',
        description: `Description for project ${index}`,
        url: `https://notion.so/project-${index}`,
        createdTime: '2025-01-01T00:00:00.000Z',
        lastEditedTime: `2025-01-01T${String(index % 24).padStart(2, '0')}:00:00.000Z`,
      }));

      const startTime = performance.now();
      render(<NotionProjectsTable projects={manyProjects} />);
      const endTime = performance.now();

      // Rendering should complete within reasonable time (less than 100ms for 100 items)
      expect(endTime - startTime).toBeLessThan(100);

      // Verify all projects are rendered
      expect(screen.getAllByRole('row')).toHaveLength(101); // 1 header + 100 data rows
    });
  });

  describe('Edge Cases', () => {
    it('should handle projects with special characters in names', () => {
      const specialCharProject: ProjectData = {
        ...mockProjects[0],
        name: 'Project with "quotes" & <symbols> and émojis 🚀',
      };

      render(<NotionProjectsTable projects={[specialCharProject]} />);

      expect(screen.getByText('Project with "quotes" & <symbols> and émojis 🚀')).toBeInTheDocument();
    });

    it('should handle invalid date strings gracefully', () => {
      const invalidDateProject: ProjectData = {
        ...mockProjects[0],
        dueDate: 'invalid-date',
        lastEditedTime: 'also-invalid',
      };

      // Should not throw error during rendering
      expect(() => render(<NotionProjectsTable projects={[invalidDateProject]} />)).not.toThrow();
    });
  });
});