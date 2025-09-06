// Temporarily disabled - customers table does not exist
export {};

/*
"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

interface CustomerData {
  full_name: string
  email?: string | null
  phone?: string | null
  gender?: string | null
  birthday?: string | null
  country?: string | null
}

export async function addCustomer(formData: FormData) {
  try {
    const supabase = await createClient()

    // Extract data from form
    const full_name = formData.get("full_name") as string
    const email = (formData.get("email") as string) || null
    const phone = (formData.get("phone") as string) || null
    const gender = (formData.get("gender") as string) || null
    const birthday = (formData.get("birthday") as string) || null
    const country = (formData.get("country") as string) || null

    // Validate required fields
    if (!full_name) {
      return {
        success: false,
        error: "Full name is required",
      }
    }

    // Prepare customer data
    const customerData: CustomerData = {
      full_name,
    }

    // Add optional fields if provided
    if (email) customerData.email = email
    if (phone) customerData.phone = phone
    if (gender) customerData.gender = gender
    if (birthday) customerData.birthday = birthday
    if (country) customerData.country = country

    // Insert into database
    const { data, error } = await supabase.from("customers").insert(customerData).select()

    if (error) {
      // Check if it's a unique constraint violation
      if (error.code === "23505") {
        return {
          success: false,
          error: "A customer with this information already exists",
        }
      }

      throw error
    }

    // Revalidate the customers page to show the new data
    revalidatePath("/customers")

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error adding customer:", error)
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred",
    }
  }
}
*/
