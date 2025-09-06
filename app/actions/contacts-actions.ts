"use server"

import { createClient } from "@/utils/supabase/server"
import { Database } from "@/types/database.types"

type Contact = Database["public"]["Tables"]["contacts"]["Row"]
type Company = Database["public"]["Tables"]["companies"]["Row"]

interface ContactWithCompany extends Contact {
  company?: Company | null
}

export async function getContacts(): Promise<Contact[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching contacts:", error)
    return []
  }

  return data || []
}

export async function getContactById(id: string): Promise<Contact | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", parseInt(id))
    .single()

  if (error) {
    console.error("Error fetching contact:", error)
    return null
  }

  return data
}

// Get contacts that are employees (have job titles)
export async function getEmployees(): Promise<Contact[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .not("job_title", "is", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching employees:", error)
    return []
  }

  return data || []
}