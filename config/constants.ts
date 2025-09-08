/**
 * Application Constants
 * Centralized application settings and constants
 */

export const APP_CONFIG = {
  name: 'Alleato AI Dashboard',
  version: '1.0.0',
  description: 'Intelligent business dashboard with AI-powered insights',
  
  // Navigation and routing
  routes: {
    HOME: '/',
    DASHBOARD: '/dashboard',
    TABLES: '/tables',
    ASRS: '/asrs',
    MEETINGS: '/meetings',
    INSIGHTS: '/insights',
    PROFILE: '/profile',
    AUTH: {
      LOGIN: '/auth/login',
      SIGNUP: '/auth/signup',
      RESET: '/auth/reset-password',
    }
  },
  
  // UI constants
  ui: {
    SIDEBAR_WIDTH: 240,
    HEADER_HEIGHT: 64,
    MAX_CONTENT_WIDTH: 1200,
    ANIMATION_DURATION: 200,
  },
  
  // Pagination and limits
  pagination: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    MAX_SEARCH_RESULTS: 50,
  },
  
  // File upload limits
  upload: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  
  // Feature flags
  features: {
    ENABLE_REAL_TIME: true,
    ENABLE_AI_CHAT: true,
    ENABLE_DOCUMENT_UPLOAD: true,
    ENABLE_MEETING_INTELLIGENCE: true,
    ENABLE_ASRS_MODULE: true,
  }
} as const;

export const API_ENDPOINTS = {
  // AI endpoints
  CHAT: '/api/chat',
  GENERATE_INSIGHTS: '/api/insights/generate',
  SUMMARIZE: '/api/summarize',
  
  // Data endpoints
  DOCUMENTS: '/api/documents',
  MEETINGS: '/api/meetings',
  EMPLOYEES: '/api/employees',
  
  // Upload endpoints
  UPLOAD_DOCUMENT: '/api/upload/document',
  UPLOAD_AVATAR: '/api/upload/avatar',
  
  // Integration endpoints
  FIREFLIES_SYNC: '/api/integrations/fireflies/sync',
  NOTION_SYNC: '/api/integrations/notion/sync',
} as const;

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported format.',
} as const;

export const SUCCESS_MESSAGES = {
  DOCUMENT_UPLOADED: 'Document uploaded successfully',
  INSIGHTS_GENERATED: 'Insights generated successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  DATA_SYNCED: 'Data synchronized successfully',
} as const;

export type RouteKeys = keyof typeof APP_CONFIG.routes;
export type APIEndpointKeys = keyof typeof API_ENDPOINTS;
