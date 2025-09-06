import { Database } from './database.types';

// Use the auto-generated Supabase types
export type DatabaseProject = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

// Frontend display type (mapped from database for cleaner UI)
export interface Project {
  id: string; // mapped from project_number
  name: string;
  description?: string;
  project_type?: string;
  status: string;
  priority: string;
  start_date?: string;
  end_date?: string; // mapped from est_completion
  budget?: number; // mapped from est_revenue (represents estimated revenue)
  actual_cost?: number;
  progress_percentage: number;
  project_manager?: string;
  client_name?: string; // populated from join
  client_company?: string; // populated from join
  created_at: string;
  updated_at: string;
}

// Helper function to transform database project to frontend project
export function transformProjectForUI(dbProject: DatabaseProject): Project {
  // Map phase to status
  const statusMap: Record<string, string> = {
    'Current': 'active',
    'Complete': 'completed',
    'Lost': 'cancelled',
    'Planning': 'planning',
    'On Hold': 'on_hold'
  };
  
  return {
    id: dbProject['job number'] || dbProject.id.toString(),
    name: dbProject.name || '',
    description: dbProject.description || undefined,
    project_type: dbProject.category || undefined,
    status: statusMap[dbProject.phase || ''] || dbProject.phase || 'unknown',
    priority: 'medium', // Not in database, using default
    start_date: dbProject['start date'] || undefined,
    end_date: dbProject['est completion'] || undefined,
    budget: dbProject['est revenue'] || undefined,
    actual_cost: dbProject.budget_used || undefined,
    progress_percentage: dbProject.completion_percentage || 0,
    project_manager: dbProject.team_members?.[0] || undefined,
    client_name: undefined, // Will be populated from join
    client_company: undefined, // Will be populated from join
    created_at: dbProject.created_at,
    updated_at: dbProject.created_at, // No updated_at in database
  };
}

export interface ProjectsResponse {
  projects: Project[];
  total_count: number;
  status: string;
}