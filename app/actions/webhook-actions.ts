"use server"

// Define a type for the conversation state
type ConversationState = {
  messageId: string
  userMessage: string
  status: "pending" | "completed" | "failed"
  response?: string
  error?: string
  timestamp: Date
}

// In-memory store for conversation states (in a real app, this would be in a database)
const conversationStates: Map<string, ConversationState> = new Map()

export async function sendWebhook(message: string) {
  try {
    // Use the NEXT_PUBLIC_APP_URL environment variable to construct the API URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const apiUrl = `${appUrl}/api/trigger-n8n`

    console.log(`Sending webhook request to: ${apiUrl}`)

    // Make a request to our API route
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || "Failed to send message")
    }

    // If we have an AI response, return it
    if (result.aiResponse) {
      return {
        success: true,
        response: result.aiResponse,
      }
    }

    // Otherwise, return a pending status
    return {
      success: true,
      pending: true,
    }
  } catch (error) {
    console.error("Error in sendWebhook:", error)
    return {
      success: false,
      error: (error as Error).message || "An error occurred",
    }
  }
}

// Function to check the status of a message
export async function checkMessageStatus(messageId: string) {
  const state = conversationStates.get(messageId)

  if (!state) {
    return {
      success: false,
      error: "Message not found",
    }
  }

  // If the message is already completed, return the response
  if (state.status === "completed") {
    return {
      success: true,
      status: "completed",
      response: state.response,
    }
  }

  // If the message failed, return the error
  if (state.status === "failed") {
    return {
      success: false,
      status: "failed",
      error: state.error || "Unknown error",
    }
  }

  // If the message is still pending, we'll try to get a response from the webhook again
  try {
    // Use the NEXT_PUBLIC_APP_URL environment variable to construct the API URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const apiUrl = `${appUrl}/api/trigger-n8n`

    // Call our API route again to check if there's a response now
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: state.userMessage }),
      cache: "no-store",
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        status: "failed",
        error: result.message || "Failed to check message status",
      }
    }

    // Check if we got an AI response
    if (result.aiResponse) {
      // Update conversation state with the response
      conversationStates.set(messageId, {
        ...state,
        status: "completed",
        response: result.aiResponse,
      })

      return {
        success: true,
        status: "completed",
        response: result.aiResponse,
      }
    }

    // If we still don't have a response, keep waiting
    return {
      success: true,
      status: "pending",
      message: "Still waiting for response from the expert system...",
    }
  } catch (error) {
    console.error("Error checking message status:", error)
    return {
      success: false,
      status: "failed",
      error: (error as Error).message,
    }
  }
}
