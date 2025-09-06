"use server";

import { createClient } from '@supabase/supabase-js';
import { generateId, UIMessage, UIMessagePart } from "ai";
import { MyUIMessage } from "../message-type";

// Use Supabase client for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const createChat = async () => {
  const chatId = generateId();
  // Minimal schema: only id column exists per provided SQL
  const { error } = await supabase
    .from('chats')
    .insert({ id: chatId });
  if (error) throw error;
  return chatId;
};

export const upsertMessage = async ({
  chatId,
  message,
  id,
}: {
  id: string;
  chatId: string;
  message: MyUIMessage;
}) => {
  // Insert or update message using provided schema (chatId camelCase, createdAt default)
  const { error: messageError } = await supabase
    .from('messages')
    .upsert({
      id,
      chatId: chatId,
      role: message.role,
    });
  if (messageError) throw messageError;

  // Delete existing parts for this message
  await supabase
    .from('parts')
    .delete()
    .eq('messageId', id)
    .throwOnError();

  // Insert new parts
  if (message.parts && message.parts.length > 0) {
    const partsToInsert = message.parts.map((part: UIMessagePart, index: number) => {
      const base: any = {
        id: generateId(),
        messageId: id,
        type: part.type,
        order: index,
      };

      switch (part.type) {
        case 'text':
          base.text_text = (part as any).text;
          break;
        case 'reasoning':
          base.reasoning_text = (part as any).text;
          break;
        case 'file': {
          const p: any = part;
          base.file_mediaType = p.mediaType;
          base.file_filename = p.filename ?? null;
          base.file_url = p.url;
          break;
        }
        case 'source_url': {
          const p: any = part;
          base.source_url_sourceId = p.sourceId;
          base.source_url_url = p.url;
          base.source_url_title = p.title ?? null;
          break;
        }
        case 'source_document': {
          const p: any = part;
          base.source_document_sourceId = p.sourceId;
          base.source_document_mediaType = p.mediaType;
          base.source_document_title = p.title;
          base.source_document_filename = p.filename ?? null;
          break;
        }
        case 'tool-getWeatherInformation': {
          const p: any = part;
          base.tool_toolCallId = p.toolCallId;
          base.tool_state = p.state;
          base.tool_errorText = p.errorText ?? null;
          base.tool_getWeatherInformation_input = p.input ?? null;
          base.tool_getWeatherInformation_output = p.result ?? null;
          break;
        }
        case 'tool-getLocation': {
          const p: any = part;
          base.tool_toolCallId = p.toolCallId;
          base.tool_state = p.state;
          base.tool_errorText = p.errorText ?? null;
          base.tool_getLocation_input = p.input ?? null;
          base.tool_getLocation_output = p.result ?? null;
          break;
        }
        case 'data-weather': {
          const p: any = part;
          const d = p.data || {};
          base.data_weather_id = generateId();
          base.data_weather_location = d.location ?? null;
          base.data_weather_weather = d.weather ?? null;
          base.data_weather_temperature = d.temperature ?? null;
          break;
        }
        default:
          // For unknown types, rely on absence of constraints
          break;
      }

      return base;
    });

    const { error: partsError } = await supabase
      .from('parts')
      .insert(partsToInsert);
    if (partsError) throw partsError;
  }
};

export const loadChat = async (chatId: string): Promise<MyUIMessage[]> => {
  // Join messages and parts with your exact column names
  // 1) fetch messages for chatId ordered by createdAt
  const { data: messagesData, error: msgErr } = await supabase
    .from('messages')
    .select('*')
    .eq('chatId', chatId)
    .order('createdAt', { ascending: true });
  if (msgErr) throw msgErr;
  if (!messagesData || messagesData.length === 0) return [];

  // 2) fetch parts for these messages
  const messageIds = messagesData.map((m: any) => m.id);
  const { data: partsData, error: partsErr } = await supabase
    .from('parts')
    .select('*')
    .in('messageId', messageIds)
    .order('order', { ascending: true });
  if (partsErr) throw partsErr;

  const byMessage = new Map<string, any[]>();
  (partsData || []).forEach((p: any) => {
    const arr = byMessage.get(p.messageId) || [];
    arr.push(p);
    byMessage.set(p.messageId, arr);
  });

  return messagesData.map((m: any) => {
    const p = byMessage.get(m.id) || [];
    const uiParts: UIMessagePart[] = p.map((part: any) => {
      switch (part.type) {
        case 'text':
          return { type: 'text', text: part.text_text ?? '' } as any;
        case 'reasoning':
          return { type: 'reasoning', text: part.reasoning_text ?? '' } as any;
        case 'file':
          return { type: 'file', mediaType: part.file_mediaType, filename: part.file_filename ?? undefined, url: part.file_url } as any;
        case 'source_url':
          return { type: 'source_url', sourceId: part.source_url_sourceId, url: part.source_url_url, title: part.source_url_title ?? undefined } as any;
        case 'source_document':
          return { type: 'source_document', sourceId: part.source_document_sourceId, mediaType: part.source_document_mediaType, title: part.source_document_title, filename: part.source_document_filename ?? undefined } as any;
        default:
          return { type: 'text', text: '' } as any;
      }
    });

    return {
      id: m.id,
      role: m.role,
      parts: uiParts,
    } as MyUIMessage;
  });
};
