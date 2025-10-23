import { tool } from "ai";
import z from "zod";
import { PRODUCER_TYPES } from "../constants";
import { searchByGeoText } from "../data/producer";
import { geocodePlace } from "./utils/geocode";
import { SearchByGeoTextArgs } from "../validators/producers";
import { SEARCH_BY_GEO_TEXT_QUERIES_CACHE } from "../kv";

export const searchByGeoTextInput = z.object({
  q: z.string().trim().min(1).max(256).nullable().optional(),
  geo: z
    .object({
      center: z.object({ lat: z.number(), lon: z.number() }),
      bbox: z.object({
        minLat: z.number(),
        maxLat: z.number(),
        minLon: z.number(),
        maxLon: z.number(),
      }),
    })
    .or(
      z.object({
        center: z.object({ lat: z.number(), lon: z.number() }),
        radiusKm: z.number().min(0.1).max(1000),
      })
    )
    .nullable(),
  limit: z.number().min(1).max(50).default(30),
  offset: z.number().min(0).default(0),
  countryHint: z.string().optional(),
  stateProvinceHint: z.string().optional(),
  filters: z
    .object({
      category: z.enum(PRODUCER_TYPES).optional(),
      commodities: z
        .array(z.string().min(1))
        .optional()
        .describe("products or dishes not category or certification"),
      variants: z.array(z.string().min(1)).optional(),
      certifications: z.array(z.string().min(1)).optional(),
      organicOnly: z.boolean().optional(),
      verified: z.boolean().optional(),
      isClaimed: z.boolean().optional(),
      locality: z.string().optional(),
      adminArea: z.string().optional(),
      subscriptionRankMin: z.number().optional(),
      subscriptionRankMax: z.number().optional(),
      minAvgRating: z.number().optional(),
      minBayesAvg: z.number().optional(),
      minReviews: z.number().optional(),
      hasCover: z.boolean().optional(),
      ids: z.string().array().optional(),
      excludeIds: z.string().array().optional(),
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
  search_by_geo_text: {
    limit: number;
    offset: number;
    geo?: Extract<SearchByGeoTextArgs, { q?: string | undefined }>["geo"];
    originalQuery: string;
    userRequestsUsingTheirLocation?: boolean;
    countryHint?: string | undefined;
  };
  userId: string | undefined;
}) => {
  return {
    search_by_geo_text: tool({
      description: "Search producers by free text and a circular geofence.",
      inputSchema: searchByGeoTextInput,
      execute: async (llmArgs) => {
        const overridedGeo = Object.hasOwn(search_by_geo_text, "geo")
          ? search_by_geo_text.geo
          : (llmArgs.geo ?? undefined);

        const overridedArgs = {
          ...llmArgs,
          geo: overridedGeo,
          q: llmArgs.q ?? undefined,
          limit: search_by_geo_text.limit,
          offset: search_by_geo_text.offset,
          countryHint: search_by_geo_text.countryHint
            ? search_by_geo_text.countryHint
            : llmArgs.countryHint,
        };

        await SEARCH_BY_GEO_TEXT_QUERIES_CACHE.set(
          search_by_geo_text.originalQuery,
          {
            geo: search_by_geo_text.userRequestsUsingTheirLocation
              ? undefined
              : overridedGeo,
            q: llmArgs.q ?? undefined,
            filters: llmArgs.filters,
            stateProvinceHint: llmArgs.stateProvinceHint,
            countryHint: llmArgs.countryHint,
            userRequestsUsingTheirLocation:
              search_by_geo_text.userRequestsUsingTheirLocation,
          }
        );

        const result = await searchByGeoText({
          ...overridedArgs,
          geo: Object.hasOwn(search_by_geo_text, "geo")
            ? search_by_geo_text.geo
            : (overridedArgs.geo ?? undefined),
          q: overridedArgs.q ?? undefined,
          limit: search_by_geo_text.limit,
          offset: search_by_geo_text.offset,
        });
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
