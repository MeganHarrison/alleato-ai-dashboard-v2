import type { DataPart, ProviderMetadata, ReasoningPart, SourceDocumentPart, SourceURLPart, TextPart, ToolCallPart, UIMessage } from "ai";

// Custom data parts for your application
export interface MyDataPart {
  weather?: {
    location: string;
    weather: string;
    temperature: number;
  };
  // Add more custom data types as needed
}

// Extended message part types
export type MyMessagePart = 
  | TextPart 
  | ReasoningPart 
  | ToolCallPart<string, any> 
  | SourceURLPart 
  | SourceDocumentPart 
  | DataPart<keyof MyDataPart, MyDataPart[keyof MyDataPart]>;

// Extended UI message
export interface MyUIMessage extends UIMessage {
  parts: MyMessagePart[];
}

// Provider metadata extension
export interface MyProviderMetadata extends ProviderMetadata {
  // Add any custom provider metadata fields
}