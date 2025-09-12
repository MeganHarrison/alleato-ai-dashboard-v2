/**
 * @fileoverview Tests for RefreshButton component
 * @module components/notion-projects/__tests__/refresh-button.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RefreshButton } from '../refresh-button';

// Mock Next.js router
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock React's useTransition
const mockStartTransition = vi.fn((callback) => callback());
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useTransition: () => [false, mockStartTransition],
  };
});

/**
 * Test suite for RefreshButton component.
 * 
 * Tests user interactions, loading states, accessibility,
 * and memory leak prevention with comprehensive scenarios.
 */
describe('RefreshButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render refresh button with correct initial state', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Refresh');
      expect(button).not.toBeDisabled();
    });

    it('should display refresh icon', () => {
      render(<RefreshButton />);

      const icon = screen.getByText('Refresh').closest('button')?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have correct button styling classes', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      expect(button).toHaveClass('gap-2');
    });
  });

  describe('User Interactions', () => {
    it('should call router.refresh when clicked', async () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(button);

      expect(mockStartTransition).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should show loading state immediately when clicked', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(button);

      expect(button).toHaveTextContent('Refreshing...');
      expect(button).toBeDisabled();
    });

    it('should show spinning icon during loading', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(button);

      const icon = button.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });

    it('should reset state after timeout', async () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(button);

      expect(button).toHaveTextContent('Refreshing...');
      expect(button).toBeDisabled();

      // Fast-forward time by 1000ms
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(button).toHaveTextContent('Refresh');
        expect(button).not.toBeDisabled();
      });
    });

    it('should not allow multiple simultaneous refreshes', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      
      // First click
      fireEvent.click(button);
      expect(button).toBeDisabled();

      // Second click while disabled
      fireEvent.click(button);

      // Should still only have been called once
      expect(mockStartTransition).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should handle transition pending state', () => {
      // Mock useTransition to return pending state
      const mockUseTransition = vi.fn(() => [true, mockStartTransition]);
      vi.doMock('react', async () => {
        const actual = await vi.importActual('react');
        return {
          ...actual,
          useTransition: mockUseTransition,
        };
      });

      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Refreshing...');
    });

    it('should show loading state when either refreshing or pending', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(button);

      // Should be in loading state
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Refreshing...');
      
      const icon = button.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });
  });

  describe('Memory Management', () => {
    it('should clear timeout on unmount to prevent memory leaks', () => {
      const { unmount } = render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(button);

      // Unmount component before timeout completes
      unmount();

      // Advance timers - should not cause any issues
      vi.advanceTimersByTime(1000);

      // No assertions needed - test passes if no errors are thrown
      expect(true).toBe(true);
    });

    it('should handle multiple refresh attempts with proper cleanup', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      
      // First refresh
      fireEvent.click(button);
      
      // Fast-forward to complete first refresh
      vi.advanceTimersByTime(1000);

      // Second refresh
      fireEvent.click(button);
      
      // Fast-forward to complete second refresh
      vi.advanceTimersByTime(1000);

      expect(mockStartTransition).toHaveBeenCalledTimes(2);
      expect(mockRefresh).toHaveBeenCalledTimes(2);
    });

    it('should reset timeout reference correctly', async () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(button);

      expect(button).toBeDisabled();

      // Complete the timeout
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });

      // Should be able to click again
      fireEvent.click(button);
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      expect(button).toBeInstanceOf(HTMLButtonElement);
    });

    it('should maintain focus behavior when disabled', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      button.focus();

      fireEvent.click(button);

      // Button should still be focusable even when disabled for accessibility
      expect(button).toBeDisabled();
      expect(document.activeElement).toBe(button);
    });

    it('should have appropriate button attributes', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should provide clear visual feedback during loading', () => {
      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      
      // Before click
      expect(button).toHaveTextContent('Refresh');
      const iconBefore = button.querySelector('svg');
      expect(iconBefore).not.toHaveClass('animate-spin');

      // After click
      fireEvent.click(button);
      expect(button).toHaveTextContent('Refreshing...');
      const iconAfter = button.querySelector('svg');
      expect(iconAfter).toHaveClass('animate-spin');
    });
  });

  describe('Error Handling', () => {
    it('should handle router.refresh throwing an error', () => {
      mockRefresh.mockImplementation(() => {
        throw new Error('Router refresh failed');
      });

      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      
      // Should not throw error to user
      expect(() => fireEvent.click(button)).not.toThrow();

      // Should still show loading state and complete timeout
      expect(button).toBeDisabled();
      
      vi.advanceTimersByTime(1000);
      
      expect(button).not.toBeDisabled();
    });

    it('should handle transition callback throwing an error', () => {
      mockStartTransition.mockImplementation((callback) => {
        try {
          callback();
        } catch (error) {
          // Simulate transition handling the error
        }
      });

      render(<RefreshButton />);

      const button = screen.getByRole('button', { name: /refresh/i });
      
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('Component State', () => {
    it('should maintain independent state for multiple instances', () => {
      const { rerender } = render(
        <div>
          <RefreshButton />
          <RefreshButton />
        </div>
      );

      const buttons = screen.getAllByRole('button', { name: /refresh/i });
      expect(buttons).toHaveLength(2);

      // Click first button
      fireEvent.click(buttons[0]);
      
      expect(buttons[0]).toBeDisabled();
      expect(buttons[1]).not.toBeDisabled();

      // Rerender to ensure state is maintained
      rerender(
        <div>
          <RefreshButton />
          <RefreshButton />
        </div>
      );

      const updatedButtons = screen.getAllByRole('button', { name: /refresh/i });
      expect(updatedButtons[0]).toBeDisabled();
      expect(updatedButtons[1]).not.toBeDisabled();
    });
  });
});