"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Tables, TablesInsert } from "@/types/database.types"

type Client = Tables<"clients">
type ClientInsert = TablesInsert<"clients">

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient()

  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching clients:", error)
    return []
  }

  return clients || []
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const clientData: ClientInsert = {
    name: formData.get("name") as string,
    company_id: (formData.get("company_id") as string) || null,
    status: (formData.get("status") as string) || "active",
  }

  const { error } = await supabase.from("clients").insert(clientData)

  if (error) {
    console.error("Error creating client:", error)
    throw new Error("Failed to create client")
  }

  revalidatePath("/clients-db")
  return { success: true }
}

export async function updateClient(id: number, formData: FormData) {
  const supabase = await createClient()

  const updateData: Partial<Client> = {
    name: formData.get("name") as string,
    company_id: (formData.get("company_id") as string) || null,
    status: formData.get("status") as string,
  }

  const { error } = await supabase.from("clients").update(updateData).eq("id", id)

  if (error) {
    console.error("Error updating client:", error)
    throw new Error("Failed to update client")
  }

  revalidatePath("/clients-db")
  return { success: true }
}

export async function deleteClient(id: number) {
  const supabase = await createClient()

  const { error } = await supabase.from("clients").delete().eq("id", id)

  if (error) {
    console.error("Error deleting client:", error)
    throw new Error("Failed to delete client")
  }

  revalidatePath("/clients-db")
  return { success: true }
}