/**
 * @fileoverview Vitest test setup file
 * @module test/setup
 * 
 * Global test configuration for Vitest with React Testing Library integration.
 * Sets up DOM testing environment and custom matchers.
 */

import '@testing-library/jest-dom';

// Mock Next.js modules that are not available in test environment
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
}));

// Mock Next.js image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock Next.js link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.NOTION_TOKEN = 'test-notion-token';
process.env.NOTION_DATABASE_ID = 'test-database-id';

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Suppress console warnings during tests (optional)
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Custom test utilities
export const createMockProjectData = (overrides?: Partial<any>) => ({
  id: 'test-project-id',
  name: 'Test Project',
  status: 'Active',
  priority: 'High',
  assignee: 'Test User',
  dueDate: '2025-12-31',
  description: 'Test description',
  url: 'https://notion.so/test-project',
  createdTime: '2025-01-01T00:00:00.000Z',
  lastEditedTime: '2025-01-01T12:00:00.000Z',
  ...overrides,
});