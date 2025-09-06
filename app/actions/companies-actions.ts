"use server"

import { createClient } from "@/utils/supabase/server"
import { Database } from "@/types/database.types"

type Company = Database["public"]["Tables"]["companies"]["Row"]

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching companies:", error)
    return []
  }

  return data || []
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching company:", error)
    return null
  }

  return data
}