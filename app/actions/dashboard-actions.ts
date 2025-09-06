/**
 * DASHBOARD ACTIONS - Dashboard-specific project queries
 * 
 * PURPOSE: Server actions for the main dashboard, providing filtered project views
 * FUNCTIONALITY: Fetches projects with specific filtering for dashboard display
 * DEPENDENCIES:
 *   - Supabase client for database access
 *   - Database types for TypeScript safety  
 * USAGE: Called from main dashboard page components for project statistics
 * CONNECTIONS: Used by /app/(dashboard)/page.tsx
 * 
 * NOTE: This file focuses on dashboard-specific project queries, distinct from
 * project-actions.ts which handles CRUD operations
 */

"use server"

import { createClient } from "@/utils/supabase/server"
import { Database } from "@/types/database.types"

type Project = Database["public"]["Tables"]["projects"]["Row"]

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .neq("phase", "Complete")
    .neq("phase", "Completed")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching projects:", error)
    return []
  }

  return data || []
}

export async function getCurrentProjects(): Promise<Project[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("phase", "Current")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("Error fetching current projects:", error)
    return []
  }

  return data || []
}

export async function getProjectById(id: number): Promise<Project | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching project:", error)
    return null
  }

  return data
}