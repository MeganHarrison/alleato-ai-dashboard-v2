"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database.types"

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase environment variables. Some features may not work properly.")
    return null
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}
