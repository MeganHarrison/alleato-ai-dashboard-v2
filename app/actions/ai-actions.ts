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
    // Try to use PM RAG Railway endpoint first
    const railwayEndpoint = process.env.RAILWAY_RAG_API_URL;
    
    if (!railwayEndpoint) {
      console.log('Railway RAG API URL not configured, falling back to OpenAI');
    }
    
    if (railwayEndpoint) {
      try {
        // Build conversation context
      const conversationContext = history.slice(-4).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
      
      const fullQuery = conversationContext ? 
        `Context:\n${conversationContext}\n\nCurrent question: ${question}` : 
        question;
      
      const railwayResponse = await fetch(`${railwayEndpoint}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: fullQuery }),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (railwayResponse.ok) {
        const data = await railwayResponse.json();
        return data.response || "I'm not sure how to respond to that.";
      }
      } catch (railwayError) {
        console.log("Railway RAG unavailable, falling back to OpenAI:", railwayError);
      }
    }

    // Fallback to OpenAI if Railway fails
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Format the conversation history for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are an AI assistant for a project management dashboard. 
        You can help users with project insights, meeting summaries, task management, and data queries.
        Be concise, helpful, and accurate. If you're asked to perform an action like adding or deleting data,
        explain what would happen but note that you'd need to call a specific function to actually perform the operation.`,
      },
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: question },
    ]

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
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
    const data: unknown[] = [];
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
    const data: unknown = null;
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
