"use server";

import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { chats, messages, parts } from "@/lib/db/schema-pg";
import { MyUIMessage } from "../message-type";
import {
  mapUIMessagePartsToDBParts,
  mapDBPartToUIMessagePart,
} from "@/utils/message-mapping";

export const createChat = async () => {
  const [{ id }] = await db.insert(chats).values({}).returning();
  return id;
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
  const mappedDBUIParts = mapUIMessagePartsToDBParts(message.parts, id);

  await db.transaction(async (tx) => {
    await tx
      .insert(messages)
      .values({
        chat_id: chatId,
        role: message.role,
        id,
      })
      .onConflictDoUpdate({
        target: messages.id,
        set: {
          chat_id: chatId,
        },
      });

    await tx.delete(parts).where(eq(parts.message_id, id));
    if (mappedDBUIParts.length > 0) {
      await tx.insert(parts).values(mappedDBUIParts);
    }
  });
};

export const loadChat = async (chatId: string): Promise<MyUIMessage[]> => {
  const result = await db.query.messages.findMany({
    where: eq(messages.chat_id, chatId),
    with: {
      parts: {
        orderBy: (parts, { asc }) => [asc(parts.order)],
      },
    },
    orderBy: (messages, { asc }) => [asc(messages.created_at)],
  });

  return result.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content || '',
    parts: message.parts.map((part) => mapDBPartToUIMessagePart(part)),
  }));
};

export const getChats = async () => {
  return await db.select().from(chats);
};

export const deleteChat = async (chatId: string) => {
  await db.delete(chats).where(eq(chats.id, chatId));
};

export const deleteMessage = async (messageId: string) => {
  await db.transaction(async (tx) => {
    const [targetMessage] = await tx
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!targetMessage) return;

    // Delete all messages after this one in the chat
    await tx
      .delete(messages)
      .where(
        and(
          eq(messages.chat_id, targetMessage.chat_id),
          gt(messages.created_at, targetMessage.created_at),
        ),
      );

    // Delete the target message (cascade delete will handle parts)
    await tx.delete(messages).where(eq(messages.id, messageId));
  });
};
