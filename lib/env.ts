import { z } from "zod";

/**
 * Environment variables validation schema
 * 
 * This ensures all required environment variables are properly typed
 * and validated at startup according to the project guidelines.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),
  
  // AI Service APIs
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  ANTHROPIC_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: z.string().url("Invalid app URL").default("http://localhost:3000"),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, "NextAuth secret must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("Invalid NextAuth URL").optional(),
  
  // Optional Configuration
  VERCEL_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 * 
 * Use this instead of process.env directly to ensure type safety
 * and proper validation.
 */
export const env = envSchema.parse(process.env);

/**
 * Client-safe environment variables
 * 
 * Only includes environment variables that are safe to expose to the client
 */
export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: env.NODE_ENV,
} as const;