// @ts-nocheck
"use server";

import { UIMessage, UIMessagePart, generateId } from "ai";
import { mapDBPartToUIMessagePart, mapUIMessagePartsToDBParts } from "./message-mapping";
import { createClient } from "@/utils/supabase/server";
import { MyUIMessage } from "../types/message-types";

/**
 * Verify user is authenticated
 */
async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Not authenticated");
  }
  
  return user;
}

/**
 * Create a new chat
 */
export async function createChat(): Promise<string> {
  try {
    await requireAuth();
    const supabase = await createClient();
    
    const chatId = generateId();
    const { error } = await supabase
      .from('chats')
      .insert({ id: chatId });
      
    if (error) throw error;
    
    return chatId;
  } catch (error) {
    // If tables don't exist, still generate an ID to allow the interface to work
    console.log('AI SDK 5 tables not found, creating temporary chat ID');
    return generateId();
  }
}

/**
 * Get all chats
 */
export async function getChats() {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ai_sdk5_chats')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    // If tables don't exist yet, return empty array
    console.log('AI SDK 5 tables not found, returning empty chats array');
    return [];
  }
}

/**
 * Get a specific chat
 */
export async function getChat(chatId: string) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ai_sdk5_chats')
      .select('*')
      .eq('id', chatId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    
    return data;
  } catch (error) {
    // If tables don't exist, return null (will trigger 404)
    console.log('AI SDK 5 tables not found for chat:', chatId);
    return null;
  }
}

/**
 * Delete a chat and all its messages
 */
export async function deleteChat(chatId: string) {
  await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);
    
  if (error) throw error;
}

/**
 * Load all messages for a chat
 */
export async function loadChat(chatId: string): Promise<MyUIMessage[]> {
  try {
    await requireAuth();
    const supabase = await createClient();

    // Get messages with their parts
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        parts (*)
      `)
      .eq('chatId', chatId)
      .order('createdAt', { ascending: true });
      
    if (messagesError) throw messagesError;
    
    if (!messagesData) return [];

    // Transform the data into UI messages
    return messagesData.map((message) => {
      const messageParts = (message.parts || [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((part: any) => mapDBPartToUIMessagePart(part))
        .filter((part): part is UIMessagePart => part !== null);

      return {
        id: message.id,
        role: message.role,
        parts: messageParts,
        createdAt: message.createdAt,
      } as MyUIMessage;
    });
  } catch (error) {
    // If tables don't exist, return empty messages array
    console.log('AI SDK 5 message tables not found, returning empty messages array');
    return [];
  }
}

/**
 * Save chat messages
 */
export async function saveChat({
  chatId,
  messages: messagesToSave,
}: {
  chatId: string;
  messages: UIMessage[];
}) {
  await requireAuth();
  const supabase = await createClient();

  // Validate messages parameter
  if (!messagesToSave || !Array.isArray(messagesToSave)) {
    console.error('saveChat: Invalid messages parameter', messagesToSave);
    return; // Exit early if messages is not a valid array
  }

  // Delete existing messages (parts will cascade)
  const { error: deleteError } = await supabase
    .from('messages')
    .delete()
    .eq('chatId', chatId);
    
  if (deleteError) throw deleteError;

  // Insert all messages with their parts
  for (const message of messagesToSave) {
    const messageId = message.id || generateId();
    
    // Insert message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        id: messageId,
        chatId,
        role: message.role,
      });
      
    if (messageError) throw messageError;

    // Insert parts if any
    if (message.parts && message.parts.length > 0) {
      const dbParts = mapUIMessagePartsToDBParts(message.parts);
      
      const partsToInsert = dbParts.map((part, index) => ({
        ...part,
        id: generateId(),
        messageId,
        order: index,
      }));
      
      const { error: partsError } = await supabase
        .from('parts')
        .insert(partsToInsert);
        
      if (partsError) throw partsError;
    }
  }
}

/**
 * Create a single message with parts
 */
export async function createMessage({
  chatId,
  role,
  parts: messageParts,
}: {
  chatId: string;
  role: "user" | "assistant" | "system";
  parts: UIMessagePart[];
}) {
  await requireAuth();
  const supabase = await createClient();
  
  const messageId = generateId();
  
  // Insert message
  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      id: messageId,
      chatId,
      role,
    });
    
  if (messageError) throw messageError;

  // Insert parts if any
  if (messageParts.length > 0) {
    const dbParts = mapUIMessagePartsToDBParts(messageParts);
    
    const partsToInsert = dbParts.map((part, index) => ({
      ...part,
      id: generateId(),
      messageId,
      order: index,
    }));
    
    const { error: partsError } = await supabase
      .from('parts')
      .insert(partsToInsert);
      
    if (partsError) throw partsError;
  }

  return { id: messageId, chatId, role, createdAt: new Date().toISOString() };
}