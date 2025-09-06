CREATE TABLE "ai_sdk5_chats" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_sdk5_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_sdk5_parts" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"order" integer NOT NULL,
	"type" text NOT NULL,
	"text_text" text,
	"reasoning_text" text,
	"file_media_type" text,
	"file_filename" text,
	"file_url" text,
	"source_url_source_id" text,
	"source_url_url" text,
	"source_url_title" text,
	"source_document_source_id" text,
	"source_document_media_type" text,
	"source_document_title" text,
	"source_document_filename" text,
	"tool_tool_call_id" text,
	"tool_state" text,
	"tool_error_text" text,
	"tool_get_weather_information_input" text,
	"tool_get_weather_information_output" text,
	"tool_get_location_input" text,
	"tool_get_location_output" text,
	"data_weather_id" text,
	"data_weather_location" text,
	"data_weather_weather" text,
	"data_weather_temperature" integer,
	"provider_metadata" text
);
--> statement-breakpoint
ALTER TABLE "ai_sdk5_messages" ADD CONSTRAINT "ai_sdk5_messages_chat_id_ai_sdk5_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."ai_sdk5_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_sdk5_parts" ADD CONSTRAINT "ai_sdk5_parts_message_id_ai_sdk5_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_sdk5_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_chat_id_idx" ON "ai_sdk5_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "messages_chat_id_created_at_idx" ON "ai_sdk5_messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "parts_message_id_idx" ON "ai_sdk5_parts" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "parts_message_id_order_idx" ON "ai_sdk5_parts" USING btree ("message_id","order");