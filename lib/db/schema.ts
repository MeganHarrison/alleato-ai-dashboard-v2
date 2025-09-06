import {
  check,
  index,
  integer,
  sqliteTable,
  real,
  text,
} from "drizzle-orm/sqlite-core";
import { MyDataPart, MyUIMessage, MyProviderMetadata } from "../message-type";
import { generateId } from "ai";
import { sql } from "drizzle-orm";
import {
  getLocationInput,
  getLocationOutput,
  getWeatherInformationInput,
  getWeatherInformationOutput,
} from "@/ai/tools";

export const chats = sqliteTable("chats", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
});

export const messages = sqliteTable(
  "messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    chatId: text("chatId")
      .references(() => chats.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull()
      .$defaultFn(() => new Date()),
    role: text("role").$type<MyUIMessage["role"]>().notNull(),
  },
  (table) => [
    index("messages_chat_id_idx").on(table.chatId),
    index("messages_chat_id_created_at_idx").on(table.chatId, table.createdAt),
  ],
);

export const parts = sqliteTable(
  "parts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    messageId: text("messageId")
      .references(() => messages.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull()
      .$defaultFn(() => new Date()),
    order: integer("order").notNull().default(0),

    // Text fields
    text_text: text("text_text"),

    // Reasoning fields
    reasoning_text: text("reasoning_text"),

    // File fields
    file_mediaType: text("file_mediaType"),
    file_filename: text("file_filename"), // optional
    file_url: text("file_url"),

    // Source url fields
    source_url_sourceId: text("source_url_sourceId"),
    source_url_url: text("source_url_url"),
    source_url_title: text("source_url_title"), // optional

    // Source document fields
    source_document_sourceId: text("source_document_sourceId"),
    source_document_mediaType: text("source_document_mediaType"),
    source_document_title: text("source_document_title"),
    source_document_filename: text("source_document_filename"), // optional

    // shared tool call columns
    tool_toolCallId: text("tool_toolCallId"),
    tool_state: text("tool_state").$type<string>(),
    tool_errorText: text("tool_errorText").$type<string>(),

    // tools inputs and outputs are stored as JSON text in SQLite
    tool_getWeatherInformation_input:
      text("tool_getWeatherInformation_input", { mode: "json" }).$type<getWeatherInformationInput>(),
    tool_getWeatherInformation_output:
      text("tool_getWeatherInformation_output", { mode: "json" }).$type<getWeatherInformationOutput>(),

    tool_getLocation_input: text("tool_getLocation_input", { mode: "json" }).$type<getLocationInput>(),
    tool_getLocation_output: text("tool_getLocation_output", { mode: "json" }).$type<getLocationOutput>(),

    // Data parts
    data_weather_id: text("data_weather_id").$defaultFn(() => generateId()),
    data_weather_location: text("data_weather_location").$type<MyDataPart["weather"]["location"]>(),
    data_weather_weather: text("data_weather_weather").$type<MyDataPart["weather"]["weather"]>(),
    data_weather_temperature:
      real("data_weather_temperature").$type<MyDataPart["weather"]["temperature"]>(),

    providerMetadata: text("providerMetadata", { mode: "json" }).$type<MyProviderMetadata>(),
  },
  (t) => [
    // Indexes for performance optimisation
    index("parts_message_id_idx").on(t.messageId),
    index("parts_message_id_order_idx").on(t.messageId, t.order),

    // Check constraints
    check(
      "text_text_required_if_type_is_text",
      // This SQL expression enforces: if type = 'text' then text_text IS NOT NULL
      sql`CASE WHEN ${t.type} = 'text' THEN ${t.text_text} IS NOT NULL ELSE TRUE END`,
    ),
    check(
      "reasoning_text_required_if_type_is_reasoning",
      sql`CASE WHEN ${t.type} = 'reasoning' THEN ${t.reasoning_text} IS NOT NULL ELSE TRUE END`,
    ),
    check(
      "file_fields_required_if_type_is_file",
      sql`CASE WHEN ${t.type} = 'file' THEN ${t.file_mediaType} IS NOT NULL AND ${t.file_url} IS NOT NULL ELSE TRUE END`,
    ),
    check(
      "source_url_fields_required_if_type_is_source_url",
      sql`CASE WHEN ${t.type} = 'source_url' THEN ${t.source_url_sourceId} IS NOT NULL AND ${t.source_url_url} IS NOT NULL ELSE TRUE END`,
    ),
    check(
      "source_document_fields_required_if_type_is_source_document",
      sql`CASE WHEN ${t.type} = 'source_document' THEN ${t.source_document_sourceId} IS NOT NULL AND ${t.source_document_mediaType} IS NOT NULL AND ${t.source_document_title} IS NOT NULL ELSE TRUE END`,
    ),
    check(
      "tool_getWeatherInformation_fields_required",
      sql`CASE WHEN ${t.type} = 'tool-getWeatherInformation' THEN ${t.tool_toolCallId} IS NOT NULL AND ${t.tool_state} IS NOT NULL ELSE TRUE END`,
    ),
    check(
      "tool_getLocation_fields_required",
      sql`CASE WHEN ${t.type} = 'tool-getLocation' THEN ${t.tool_toolCallId} IS NOT NULL AND ${t.tool_state} IS NOT NULL ELSE TRUE END`,
    ),
    check(
      "data_weather_fields_required",
      sql`CASE WHEN ${t.type} = 'data-weather' THEN ${t.data_weather_location} IS NOT NULL AND ${t.data_weather_weather} IS NOT NULL AND ${t.data_weather_temperature} IS NOT NULL ELSE TRUE END`,
    ),
  ],
);

export type MyDBUIMessagePart = typeof parts.$inferInsert;
export type MyDBUIMessagePartSelect = typeof parts.$inferSelect;
