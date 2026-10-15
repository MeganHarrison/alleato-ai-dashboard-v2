/**
 * Simple key-value database interface for the OpenAI Agents API
 * This provides temporary storage for conversation state during agent runs
 */

// In-memory store for conversation state
// In production, you might want to use Redis or another persistent store
const memoryStore = new Map<string, string>();

export interface Database {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export function db(): Database {
  return {
    async get(key: string): Promise<string | null> {
      const value = memoryStore.get(key);
      return value || null;
    },

    async set(key: string, value: string): Promise<void> {
      memoryStore.set(key, value);
    },
  };
}

// Export the database instance
export default db;