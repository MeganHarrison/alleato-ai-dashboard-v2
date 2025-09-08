'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

interface Document {
  id: number
  content: string | null
  document_type: string | null
  metadata: any | null
  project_id?: number | null
  created_at?: string | null
  updated_at?: string | null
}

interface ProjectInsight {
  id: string
  project_id: number | null
  category: string
  text: string
  meeting_id: string | null
  created_at: string | null
}

interface AIInsight {
  id: number
  project_id: number | null
  title: string
  description: string
  insight_type: string | null
  severity: string | null
  confidence_score: number | null
  meeting_id: string | null
  resolved: number | null
  created_at: string | null
}

export async function getProjectDocuments(projectId: number): Promise<{ success: boolean; documents: Document[]; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    })

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching project documents:', error)
      return { success: false, documents: [], error: error.message }
    }

    return { success: true, documents: documents || [] }
  } catch (error) {
    console.error('Error in getProjectDocuments:', error)
    return { success: false, documents: [], error: 'Failed to fetch documents' }
  }
}

export async function getProjectInsights(projectId: number): Promise<{ 
  success: boolean; 
  projectInsights: ProjectInsight[]; 
  aiInsights: AIInsight[];
  error?: string 
}> {
  try {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    })

    // Fetch project insights
    const { data: projectInsights, error: projectError } = await supabase
      .from('project_insights')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (projectError) {
      console.error('Error fetching project insights:', projectError)
    }

    // Fetch AI insights
    const { data: aiInsights, error: aiError } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (aiError) {
      console.error('Error fetching AI insights:', aiError)
    }

    return { 
      success: true, 
      projectInsights: projectInsights || [],
      aiInsights: aiInsights || []
    }
  } catch (error) {
    console.error('Error in getProjectInsights:', error)
    return { 
      success: false, 
      projectInsights: [], 
      aiInsights: [],
      error: 'Failed to fetch insights' 
    }
  }
}