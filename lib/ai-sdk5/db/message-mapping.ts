import { UIMessagePart } from "ai";
import { NewPart, Part } from "./schema";
import { MyMessagePart } from "../types/message-types";

/**
 * Maps UI message parts to database parts for storage
 */
export function mapUIMessagePartsToDBParts(
  parts: UIMessagePart[]
): Omit<NewPart, "id" | "messageId" | "createdAt" | "order">[] {
  return parts.map((part) => {
    const basePart: Omit<NewPart, "id" | "messageId" | "createdAt" | "order"> = {
      type: part.type,
      textText: null,
      reasoningText: null,
      fileMediaType: null,
      fileFilename: null,
      fileUrl: null,
      sourceUrlSourceId: null,
      sourceUrlUrl: null,
      sourceUrlTitle: null,
      sourceDocumentSourceId: null,
      sourceDocumentMediaType: null,
      sourceDocumentTitle: null,
      sourceDocumentFilename: null,
      toolToolCallId: null,
      toolState: null,
      toolErrorText: null,
      toolGetWeatherInformationInput: null,
      toolGetWeatherInformationOutput: null,
      toolGetLocationInput: null,
      toolGetLocationOutput: null,
      dataWeatherId: null,
      dataWeatherLocation: null,
      dataWeatherWeather: null,
      dataWeatherTemperature: null,
      providerMetadata: null,
    };

    switch (part.type) {
      case "text":
        return {
          ...basePart,
          textText: part.text,
        };

      case "reasoning":
        return {
          ...basePart,
          reasoningText: part.text,
        };

      case "file":
        return {
          ...basePart,
          fileMediaType: part.mediaType,
          fileFilename: part.filename || null,
          fileUrl: part.url,
        };

      case "source_url":
        return {
          ...basePart,
          sourceUrlSourceId: part.sourceId,
          sourceUrlUrl: part.url,
          sourceUrlTitle: part.title || null,
        };

      case "source_document":
        return {
          ...basePart,
          sourceDocumentSourceId: part.sourceId,
          sourceDocumentMediaType: part.mediaType,
          sourceDocumentTitle: part.title,
          sourceDocumentFilename: part.filename || null,
        };

      default:
        // Handle specific tool calls
        if (part.type === "tool-getWeatherInformation") {
          return {
            ...basePart,
            type: part.type,
            toolToolCallId: (part as any).toolCallId,
            toolState: (part as any).state,
            toolErrorText: (part as any).errorText || null,
            toolGetWeatherInformationInput: (part as any).input || null,
            toolGetWeatherInformationOutput: (part as any).result || null,
          };
        }
        
        if (part.type === "tool-getLocation") {
          return {
            ...basePart,
            type: part.type,
            toolToolCallId: (part as any).toolCallId,
            toolState: (part as any).state,
            toolErrorText: (part as any).errorText || null,
            toolGetLocationInput: (part as any).input || null,
            toolGetLocationOutput: (part as any).result || null,
          };
        }
        
        // Handle data-weather
        if (part.type === "data-weather") {
          const data = (part as any).data;
          return {
            ...basePart,
            type: part.type,
            dataWeatherLocation: data?.location || null,
            dataWeatherWeather: data?.weather || null,
            dataWeatherTemperature: data?.temperature || null,
          };
        }

        // Unknown part type - store as is
        return basePart;
    }
  });
}

/**
 * Maps database parts back to UI message parts
 */
export function mapDBPartToUIMessagePart(part: Part): MyMessagePart | null {
  switch (part.type) {
    case "text":
      if (!part.textText) return null;
      return {
        type: "text",
        text: part.textText,
      };

    case "reasoning":
      if (!part.reasoningText) return null;
      return {
        type: "reasoning",
        text: part.reasoningText,
      };

    case "file":
      if (!part.fileMediaType || !part.fileUrl) return null;
      return {
        type: "file",
        mediaType: part.fileMediaType,
        filename: part.fileFilename || undefined,
        url: part.fileUrl,
      };

    case "source_url":
      if (!part.sourceUrlSourceId || !part.sourceUrlUrl) return null;
      return {
        type: "source_url",
        sourceId: part.sourceUrlSourceId,
        url: part.sourceUrlUrl,
        title: part.sourceUrlTitle || undefined,
      };

    case "source_document":
      if (!part.sourceDocumentSourceId || !part.sourceDocumentMediaType || !part.sourceDocumentTitle) return null;
      return {
        type: "source_document",
        sourceId: part.sourceDocumentSourceId,
        mediaType: part.sourceDocumentMediaType,
        title: part.sourceDocumentTitle,
        filename: part.sourceDocumentFilename || undefined,
      };

    default:
      // Handle specific tool calls
      if (part.type === "tool-getWeatherInformation" && part.toolToolCallId && part.toolState) {
        return {
          type: part.type as any,
          toolCallId: part.toolToolCallId,
          state: part.toolState,
          errorText: part.toolErrorText || undefined,
          input: part.toolGetWeatherInformationInput || undefined,
          result: part.toolGetWeatherInformationOutput || undefined,
        } as any;
      }
      
      if (part.type === "tool-getLocation" && part.toolToolCallId && part.toolState) {
        return {
          type: part.type as any,
          toolCallId: part.toolToolCallId,
          state: part.toolState,
          errorText: part.toolErrorText || undefined,
          input: part.toolGetLocationInput || undefined,
          result: part.toolGetLocationOutput || undefined,
        } as any;
      }
      
      // Handle data-weather
      if (part.type === "data-weather" && part.dataWeatherLocation) {
        return {
          type: part.type as any,
          data: {
            location: part.dataWeatherLocation,
            weather: part.dataWeatherWeather,
            temperature: part.dataWeatherTemperature,
          },
        } as any;
      }

      // Unknown part type
      return null;
  }
}