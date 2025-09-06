import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema-pg';
import * as relations from './relations';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Parse the connection URL to check if it's using pooler
const dbUrl = process.env.DATABASE_URL;
const isPooler = dbUrl.includes('pooler.supabase.com');

// Use appropriate settings for Supabase pooler
const client = postgres(dbUrl, {
  ssl: 'require',
  prepare: false, // Required for Supabase pooler connections
  connect_timeout: 10,
  // Don't set max connections for pooler
  ...(isPooler ? {} : { max: 1 })
});

export const db = drizzle(client, {
  schema: {
    ...schema,
    ...relations,
  }
});