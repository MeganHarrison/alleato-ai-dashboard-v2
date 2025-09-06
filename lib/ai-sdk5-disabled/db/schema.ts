// @ts-nocheck
import { pgTable, text, integer, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// AI SDK 5 Persistent Chat Tables
// These tables support the full AI SDK 5 persistent chat functionality

export const aiSdk5Chats = pgTable('ai_sdk5_chats', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title'),
  metadata: jsonb('metadata').$default(() => ({})),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const aiSdk5Messages = pgTable('ai_sdk5_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  chatId: text('chat_id').notNull().references(() => aiSdk5Chats.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  metadata: jsonb('metadata').$default(() => ({})),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const aiSdk5Parts = pgTable('ai_sdk5_parts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: text('message_id').notNull().references(() => aiSdk5Messages.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  type: text('type').notNull(),
  
  // Text part fields
  textText: text('text_text'),
  
  // Reasoning part fields
  reasoningText: text('reasoning_text'),
  
  // File part fields
  fileMediaType: text('file_media_type'),
  fileFilename: text('file_filename'),
  fileUrl: text('file_url'),
  fileBase64: text('file_base64'),
  fileSize: integer('file_size'),
  
  // Source URL part fields
  sourceUrlSourceId: text('source_url_source_id'),
  sourceUrlUrl: text('source_url_url'),
  sourceUrlTitle: text('source_url_title'),
  
  // Source document part fields
  sourceDocumentMediaType: text('source_document_media_type'),
  sourceDocumentTitle: text('source_document_title'),
  sourceDocumentFilename: text('source_document_filename'),
  sourceDocumentData: text('source_document_data'),
  
  // Tool call part fields
  toolCallName: text('tool_call_name'),
  toolCallInput: jsonb('tool_call_input'),
  toolCallOutput: jsonb('tool_call_output'),
  
  // Data part fields
  dataContent: jsonb('data_content'),
  
  // Provider metadata
  providerMetadata: jsonb('provider_metadata').$default(() => ({})),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Zod schemas for validation
export const insertChatSchema = createInsertSchema(aiSdk5Chats);
export const selectChatSchema = createSelectSchema(aiSdk5Chats);
export const insertMessageSchema = createInsertSchema(aiSdk5Messages);
export const selectMessageSchema = createSelectSchema(aiSdk5Messages);
export const insertPartSchema = createInsertSchema(aiSdk5Parts);
export const selectPartSchema = createSelectSchema(aiSdk5Parts);

// Type exports
export type Chat = typeof aiSdk5Chats.$inferSelect;
export type NewChat = typeof aiSdk5Chats.$inferInsert;
export type Message = typeof aiSdk5Messages.$inferSelect;
export type NewMessage = typeof aiSdk5Messages.$inferInsert;
export type Part = typeof aiSdk5Parts.$inferSelect;
export type NewPart = typeof aiSdk5Parts.$inferInsert;

// Import reference to projects table (assuming it exists)
// Note: This should be imported from your main schema file
declare const projects: any;