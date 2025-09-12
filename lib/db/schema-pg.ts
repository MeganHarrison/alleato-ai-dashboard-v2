import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  index,
  check,
} from "drizzle-orm/pg-core";
import { MyDataPart, MyUIMessage, MyProviderMetadata } from "../message-type";
import { generateId } from "ai";
import { sql } from "drizzle-orm";
import {
  getLocationInput,
  getLocationOutput,
  getWeatherInformationInput,
  getWeatherInformationOutput,
} from "@/ai/tools";

export const chats = pgTable("chats", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  user_id: text("user_id").notNull(),
  title: text("title"),
  metadata: text("metadata").default('{}'),
  created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    chat_id: text("chat_id")
      .references(() => chats.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").$type<MyUIMessage["role"]>().notNull(),
    content: text("content"),
    metadata: text("metadata").default('{}'),
    created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => [
    index("messages_chat_id_idx").on(table.chat_id),
    index("messages_chat_id_created_at_idx").on(table.chat_id, table.created_at),
  ],
);

export const parts = pgTable(
  "parts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    message_id: text("message_id")
      .references(() => messages.id, { onDelete: "cascade" })
      .notNull(),
    sequence_number: integer("sequence_number").default(0),
    content: text("content"),
    metadata: text("metadata").default('{}'),
    created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    
    // Keep AI SDK 5 specific fields for compatibility
    order: integer("order").notNull().default(0),
    type: text("type", {
      enum: [
        "text",
        "reasoning",
        "file",
        "source-url",
        "source-document",
        "step-start",
        "tool-getWeatherInformation",
        "tool-getLocation",
        "data-weather",
      ],
    })
      .$type<MyUIMessagePart["type"]>()
      .notNull(),
    // Text part fields
    text_text: text("text_text"),
    // Reasoning part fields
    reasoning_text: text("reasoning_text"),
    // File part fields  
    file_mediaType: text("file_mediaType"),
    file_filename: text("file_filename"),
    file_url: text("file_url"),
    // Source URL fields
    source_url_sourceId: text("source_url_sourceId"),
    source_url_url: text("source_url_url"),
    source_url_title: text("source_url_title"),
    // Source document fields
    source_document_sourceId: text("source_document_sourceId"),
    source_document_mediaType: text("source_document_mediaType"),
    source_document_title: text("source_document_title"),
    source_document_filename: text("source_document_filename"),
    // Tool fields
    tool_toolCallId: text("tool_toolCallId"),
    tool_state: text("tool_state"),
    tool_errorText: text("tool_errorText"),
    tool_getWeatherInformation_input: text("tool_getWeatherInformation_input"),
    tool_getWeatherInformation_output: text("tool_getWeatherInformation_output"),
    tool_getLocation_input: text("tool_getLocation_input"),
    tool_getLocation_output: text("tool_getLocation_output"),
    // Weather data part fields
    data_weather_id: text("data_weather_id"),
    data_weather_location: text("data_weather_location"),
    data_weather_weather: text("data_weather_weather"),
    data_weather_temperature: real("data_weather_temperature"),
    // Provider metadata for supported parts  
    providerMetadata: text("providerMetadata"),
  },
  (table) => [
    index("parts_message_id_idx").on(table.message_id),
    index("parts_message_id_order_idx").on(table.message_id, table.order),
  ],
);

export type MyUIMessagePart = MyDataPart | any | MyProviderMetadata;
export type ChatSelect = typeof chats.$inferSelect;
export type MessageSelect = typeof messages.$inferSelect;
export type PartSelect = typeof parts.$inferSelect;

// Add these DB part types for compatibility
export type MyDBUIMessagePart = Omit<PartSelect, 'id' | 'createdAt'>;
export type MyDBUIMessagePartSelect = PartSelect;