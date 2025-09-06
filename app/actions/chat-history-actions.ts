"use server"

import { revalidatePath } from "next/cache"

// Define types for chat messages and sessions
export type ChatMessage = {
  id: string
  role: string | null
  content: string
  created_at: string | null
  session_id: string | null
}

export type ChatSession = {
  id: string
  session_title: string
  started_at: string | null
  last_activity: string | null
  message_count: number | null
  user_id: string | null
}

export type Conversation = {
  id: string
  title: string
  created_at: string
}

// STUB FUNCTIONS - Temporarily disabled due to missing database tables

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  console.log("getChatHistory disabled for:", sessionId);
  return [];
}

export async function saveChatMessage(message: {
  role: string
  content: string
  conversation_id: string
}) {
  console.log("saveChatMessage disabled:", message);
}

export async function clearChatHistory(sessionId: string) {
  console.log("clearChatHistory disabled for:", sessionId);
}

export async function getChatSessions(): Promise<ChatSession[]> {
  console.log("getChatSessions disabled");
  return [];
}

export async function createChatSession(agentType: string, title: string): Promise<string> {
  console.log("createChatSession disabled:", agentType, title);
  return `stub-session-${Date.now()}`;
}

export async function updateChatSession(sessionId: string, title: string) {
  console.log("updateChatSession disabled:", sessionId, title);
}

export async function getConversations(): Promise<Conversation[]> {
  console.log("getConversations disabled");
  return [];
}

export async function createConversation(title: string): Promise<string> {
  console.log("createConversation disabled:", title);
  return `stub-conversation-${Date.now()}`;
}