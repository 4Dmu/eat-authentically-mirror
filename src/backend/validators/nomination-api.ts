import z from "zod";

export const nominationApiResponse = z
  .object({
    place_id: z.number(),
    licence: z.string(),
    osm_type: z.string(),
    osm_id: z.number(),
    lat: z.string(),
    lon: z.string(),
    category: z.string(),
    type: z.string(),
    place_rank: z.number(),
    importance: z.number(),
    addresstype: z.string(),
    name: z.string(),
    display_name: z.string(),
    boundingbox: z.array(z.string()),
  })
  .array();

export type NominationApiResponse = z.infer<typeof nominationApiResponse>;

export type NominationPlace = Omit<
  NominationApiResponse[number],
  "boundingbox"
> & {
  boundingbox: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
};
