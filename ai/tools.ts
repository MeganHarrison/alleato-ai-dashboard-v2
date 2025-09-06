import { MyDataPart } from "@/lib/message-type";
import {
  tool,
} from "ai";
import { z } from "zod";

export const getWeatherInformation = tool({
  description: "show the weather in a given city to the user",
  parameters: z.object({ city: z.string() }),
  execute: async ({ city }) => {
    // Add artificial delay of 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const weatherOptions = ["sunny", "cloudy", "rainy", "snowy", "windy"];

    const weather =
      weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

    // Generate random temperature between -10 and 40 degrees Celsius
    const temperature = Math.floor(Math.random() * 51) - 10;

    return { 
      city, 
      weather, 
      temperature: `${temperature}°C`,
      description: `The weather in ${city} is ${weather} with a temperature of ${temperature}°C.`
    };
  },
});

export const getLocation = tool({
  description: "Get the user location.",
  parameters: z.object({}),
  execute: async () => {
    // Mock location data
    const locations = ["New York", "San Francisco", "London", "Tokyo", "Paris"];
    const location = locations[Math.floor(Math.random() * locations.length)];
    return { location };
  },
});

export const tools = {
  getWeatherInformation,
  getLocation,
};

// Type definitions for schema.ts
export type getWeatherInformationInput = z.infer<typeof getWeatherInformation.parameters>;
export type getWeatherInformationOutput = Awaited<ReturnType<typeof getWeatherInformation.execute>>;
export type getLocationInput = z.infer<typeof getLocation.parameters>;  
export type getLocationOutput = Awaited<ReturnType<typeof getLocation.execute>>;
