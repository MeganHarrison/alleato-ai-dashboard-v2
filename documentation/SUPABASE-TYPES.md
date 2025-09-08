# Supabase Types

### Chats
create table public.chats (
  id character varying not null,
  constraint chats_pkey primary key (id)
) TABLESPACE pg_default;

### Messages
create table public.messages (
  id character varying not null,
  "chatId" character varying not null,
  "createdAt" timestamp without time zone not null default now(),
  role character varying not null,
  constraint messages_pkey primary key (id),
  constraint messages_chatId_chats_id_fk foreign KEY ("chatId") references chats (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists messages_chat_id_idx on public.messages using btree ("chatId") TABLESPACE pg_default;

create index IF not exists messages_chat_id_created_at_idx on public.messages using btree ("chatId", "createdAt") TABLESPACE pg_default;

### Parts
create table public.parts (
  id character varying not null,
  "messageId" character varying not null,
  type character varying not null,
  "createdAt" timestamp without time zone not null default now(),
  "order" integer not null default 0,
  text_text text null,
  reasoning_text text null,
  "file_mediaType" character varying null,
  file_filename character varying null,
  file_url character varying null,
  "source_url_sourceId" character varying null,
  source_url_url character varying null,
  source_url_title character varying null,
  "source_document_sourceId" character varying null,
  "source_document_mediaType" character varying null,
  source_document_title character varying null,
  source_document_filename character varying null,
  "tool_toolCallId" character varying null,
  tool_state character varying null,
  "tool_errorText" character varying null,
  "tool_getWeatherInformation_input" jsonb null,
  "tool_getWeatherInformation_output" jsonb null,
  "tool_getLocation_input" jsonb null,
  "tool_getLocation_output" jsonb null,
  data_weather_id character varying null,
  data_weather_location character varying null,
  data_weather_weather character varying null,
  data_weather_temperature real null,
  "providerMetadata" jsonb null,
  constraint parts_pkey primary key (id),
  constraint parts_messageId_messages_id_fk foreign KEY ("messageId") references messages (id) on delete CASCADE,
  constraint reasoning_text_required_if_type_is_reasoning check (
    case
      when ((type)::text = 'reasoning'::text) then (reasoning_text is not null)
      else true
    end
  ),
  constraint source_document_fields_required_if_type_is_source_document check (
    case
      when ((type)::text = 'source_document'::text) then (
        ("source_document_sourceId" is not null)
        and ("source_document_mediaType" is not null)
        and (source_document_title is not null)
      )
      else true
    end
  ),
  constraint source_url_fields_required_if_type_is_source_url check (
    case
      when ((type)::text = 'source_url'::text) then (
        ("source_url_sourceId" is not null)
        and (source_url_url is not null)
      )
      else true
    end
  ),
  constraint text_text_required_if_type_is_text check (
    case
      when ((type)::text = 'text'::text) then (text_text is not null)
      else true
    end
  ),
  constraint tool_getLocation_fields_required check (
    case
      when ((type)::text = 'tool-getLocation'::text) then (
        ("tool_toolCallId" is not null)
        and (tool_state is not null)
      )
      else true
    end
  ),
  constraint data_weather_fields_required check (
    case
      when ((type)::text = 'data-weather'::text) then (
        (data_weather_location is not null)
        and (data_weather_weather is not null)
        and (data_weather_temperature is not null)
      )
      else true
    end
  ),
  constraint tool_getWeatherInformation_fields_required check (
    case
      when ((type)::text = 'tool-getWeatherInformation'::text) then (
        ("tool_toolCallId" is not null)
        and (tool_state is not null)
      )
      else true
    end
  ),
  constraint file_fields_required_if_type_is_file check (
    case
      when ((type)::text = 'file'::text) then (
        ("file_mediaType" is not null)
        and (file_url is not null)
      )
      else true
    end
  )
) TABLESPACE pg_default;

create index IF not exists parts_message_id_idx on public.parts using btree ("messageId") TABLESPACE pg_default;

create index IF not exists parts_message_id_order_idx on public.parts using btree ("messageId", "order") TABLESPACE pg_default;