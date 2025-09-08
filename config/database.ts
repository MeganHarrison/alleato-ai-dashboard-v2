/**
 * Database Configuration
 * Centralized database settings and connection parameters
 */

export const DATABASE_CONFIG = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  
  // Table names - centralized for consistency
  tables: {
    PROFILES: 'profiles',
    DOCUMENTS: 'documents',
    MEETINGS: 'meetings',
    EMPLOYEES: 'employees',
    AI_INSIGHTS: 'ai_insights',
    DOCUMENT_INSIGHTS: 'document_insights',
    VECTORIZED_DOCUMENTS: 'vectorized_documents',
    CHAT_MESSAGES: 'chat_messages',
    CHATS: 'chats',
  },
  
  // Storage buckets
  storage: {
    DOCUMENTS: 'documents',
    AVATARS: 'avatars',
    MEETINGS: 'meetings',
  },
  
  // RLS policies
  policies: {
    ENABLE_RLS: true,
    USER_ISOLATION: true,
  }
} as const;

export type DatabaseTableNames = typeof DATABASE_CONFIG.tables;
export type StorageBucketNames = typeof DATABASE_CONFIG.storage;
