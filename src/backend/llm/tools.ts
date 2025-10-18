import { tool } from "ai";
import z from "zod";
import { PRODUCER_TYPES } from "../constants";
import { searchByGeoText } from "../data/producer";
import { geocodePlace } from "./utils/geocode";

export const searchByGeoTextInput = z.object({
  q: z.string().trim().min(1).max(256).optional(),
  center: z.object({ lat: z.number(), lon: z.number() }),
  radiusKm: z.number().min(0.1).max(1000).default(1000),
  bbox: z
    .object({
      minLat: z.number(),
      maxLat: z.number(),
      minLon: z.number(),
      maxLon: z.number(),
    })
    .optional(),
  limit: z.number().min(1).max(50).default(30),
  offset: z.number().min(0).default(0),
  countryHint: z.string().optional(),
  stateProvinceHint: z.string().optional(),
  filters: z
    .object({
      category: z.enum(PRODUCER_TYPES).optional(),
      commodities: z.array(z.string().min(1)).optional(),
      variants: z.array(z.string().min(1)).optional(),
      certifications: z.array(z.string().min(1)).optional(),
      organicOnly: z.boolean().optional(),
    })
    .partial()
    .default({}),
});

export const geocodePlaceInput = z.object({
  place: z
    .string()
    .min(2)
    .max(300)
    .describe("Partial or complete address or placename to be geocoded"),
});

export const initTools = ({
  search_by_geo_text,
}: {
  search_by_geo_text: { limit: number; offset: number };
}) => {
  return {
    search_by_geo_text: tool({
      description: "Search producers by free text and a circular geofence.",
      inputSchema: searchByGeoTextInput,
      execute: async (args) => {
        console.log(args);
        const result = await searchByGeoText({
          ...args,
          limit: search_by_geo_text.limit,
          offset: search_by_geo_text.offset,
        });
        console.log(result.count);
        return result;
      },
    }),
    geocode_place: tool({
      description:
        "Convert partial or complete placename or address to latitude and longitude",
      inputSchema: geocodePlaceInput,
      execute: async (args) => {
        console.log(args);
        return await geocodePlace(args);
      },
    }),
  };
};
