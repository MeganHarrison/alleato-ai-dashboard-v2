"use server"

// Define the types for the request and response
interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatCompletionRequest {
  messages: Message[]
  stream: boolean
  include_functions_info?: boolean
  include_retrieval_info?: boolean
  include_guardrails_info?: boolean
}

interface ChatCompletionResponse {
  choices: {
    message: {
      role: string
      content: string
    }
    index: number
    finish_reason: string
  }[]
  retrieval?: unknown
  functions?: unknown
  guardrails?: unknown
}

export async function queryDocumentationAgent(messages: Message[], includeRetrieval = false) {
  try {
    // The endpoint URL - make sure it's correctly formatted with the /api/v1/chat/completions path
    const endpoint = "https://dmcdva54lb2v7wbop7dj7zrj.agents.do-ai.run/api/v1/chat/completions"

    // Get the API key from environment variables only
    const accessKey = process.env.documentation_agent_key

    if (!accessKey) {
      return {
        success: false,
        message: "Documentation Agent API key is missing.",
        retrieval: null,
        missingApiKey: true,
      }
    }

    // Log a masked version of the key for debugging (only showing first 4 chars)
    console.log(`Using API key: ${accessKey.substring(0, 4)}${"*".repeat(accessKey.length - 4)}`)

    // Prepare the request payload exactly as shown in the documentation
    const payload: ChatCompletionRequest = {
      messages,
      stream: false,
      include_retrieval_info: includeRetrieval,
      include_functions_info: false,
      include_guardrails_info: false,
    }

    console.log("Sending request to Documentation Agent:", JSON.stringify(payload))

    // Send the request with the exact Authorization header format from the documentation
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessKey}`,
      },
      body: JSON.stringify(payload),
    })

    // Log the full response for debugging
    console.log("Documentation Agent response status:", response.status)
    console.log("Documentation Agent response headers:", Object.fromEntries([...response.headers.entries()]))

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response body:", errorText)

      // Special handling for authentication errors
      if (response.status === 401) {
        return {
          success: false,
          message:
            "Authentication failed: Invalid API key for Documentation Agent. Please check the key format and permissions.",
          retrieval: null,
          invalidApiKey: true,
        }
      }

      throw new Error(`Request failed with status ${response.status}: ${errorText}`)
    }

    // Parse the response
    const data: ChatCompletionResponse = await response.json()

    // Extract the assistant's message
    const assistantMessage = data.choices[0]?.message?.content || "No response from the agent."

    // Return both the message and any retrieval information
    return {
      success: true,
      message: assistantMessage,
      retrieval: data.retrieval || null,
    }
  } catch (error) {
    console.error("Error querying Documentation Agent:", error)
    return {
      success: false,
      message: `Error: ${(error as Error).message}`,
      retrieval: null,
    }
  }
}
