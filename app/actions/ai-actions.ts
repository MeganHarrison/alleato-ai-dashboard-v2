"use server"

import { createClient } from "@/utils/supabase/server"
import OpenAI from "openai"
import type { Database } from "@/types/database.types"

type Message = {
  role: "user" | "assistant"
  content: string
}

type TableName = keyof Database["public"]["Tables"]

export async function askAI(question: string, history: Message[]) {
  try {
    // Only initialize OpenAI when the function is called (server-side only)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Format the conversation history for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are an AI assistant for a Supabase database dashboard. 
        You can help users query data, understand database structure, and perform operations.
        Be concise, helpful, and accurate. If you're asked to perform an action like adding or deleting data,
        explain what would happen but note that you'd need to call a specific function to actually perform the operation.

        `,
      },
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: question },
    ]

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    })

    return response.choices[0].message.content || "I'm not sure how to respond to that."
  } catch (error) {
    console.error("Error in askAI:", error)
    return "Sorry, I encountered an error processing your request."
  }
}

export async function getProductsData() {
  const supabase = await createClient()

  try {
    // Temporarily disabled due to missing products table
    const data: any[] = [];
    const error = null;
    // const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

export async function getProductById(id: number) {
  const supabase = await createClient()

  try {
    // Temporarily disabled due to missing products table
    const data: any = null;
    const error = null;
    // const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) throw error

    return data
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error)
    return null
  }
}

export async function getTableData(tableName: TableName) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from(tableName).select("*").limit(100)

    if (error) throw error

    return data
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error)
    return []
  }
}

export async function getTableInfo(tableName: string) {
  // This is a simplified version - in a real app, you'd query Supabase's system tables
  // to get actual schema information
  const tableInfo = {
    products: {
      columns: ["id", "name", "description", "price", "category", "created_at", "updated_at"],
      primaryKey: "id",
    },
    customers: {
      columns: ["full_name", "company", "industry", "subcategory", "email", "phone", "gender", "birthday", "country"],
      primaryKey: "id",
    },
    documents: {
      columns: ["id", "title", "content", "author_id", "created_at"],
      primaryKey: "id",
    },
    content: {
      columns: ["id", "title", "body", "status", "author_id", "created_at"],
      primaryKey: "id",
    },
    sales: {
      columns: ["id", "product_id", "customer_id", "quantity", "total", "date"],
      primaryKey: "id",
    },
  }

  return tableInfo[tableName as keyof typeof tableInfo] || null
}
