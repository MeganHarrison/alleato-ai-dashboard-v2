import { tool } from "ai";
import { z } from "zod";

// Example weather tool
export const weatherTool = tool({
  description: "Get the current weather in a location",
  parameters: z.object({
    location: z.string().describe("The location to get the weather for"),
    units: z
      .enum(["celsius", "fahrenheit"])
      .default("celsius")
      .describe("The temperature unit to use"),
  }),
  execute: async ({ location, units }) => {
    // This is a mock implementation
    // In a real app, you would call a weather API
    const mockWeather = {
      location,
      temperature: units === "celsius" ? 22 : 72,
      units,
      condition: "Partly cloudy",
      humidity: 65,
      windSpeed: 12,
    };

    return mockWeather;
  },
});

// Example calculation tool
export const calculatorTool = tool({
  description: "Perform basic mathematical calculations",
  parameters: z.object({
    expression: z.string().describe("The mathematical expression to evaluate"),
  }),
  execute: async ({ expression }) => {
    try {
      // Simple evaluation - in production, use a proper math parser
      const result = Function(`"use strict"; return (${expression})`)();
      return { expression, result };
    } catch (error) {
      return { 
        expression, 
        error: "Invalid mathematical expression" 
      };
    }
  },
});