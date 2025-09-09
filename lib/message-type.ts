import { tools } from "@/ai/tools";
import { JSONValue, UIMessage } from "ai";
import z from "zod";

export const metadataSchema = z.object({});

type MyMetadata = z.infer<typeof metadataSchema>;

export const dataPartSchema = z.object({
  weather: z.object({
    weather: z.string().optional(),
    location: z.string().optional(),
    temperature: z.number().optional(),
    loading: z.boolean().default(true),
  }),
});

export type MyDataPart = z.infer<typeof dataPartSchema>;

export type MyToolSet = typeof tools;

export type MyUIMessage = UIMessage;

export type MyUIMessagePart = UIMessage;

export type MyProviderMetadata = Record<string, Record<string, JSONValue>>;
