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

export const AddressSchema = z.object({
  county: z.string(),
  state: z.string(),
  "ISO3166-2-lvl4": z.string(),
  postcode: z.string(),
  country: z.string(),
  country_code: z.string(),
});
export type Address = z.infer<typeof AddressSchema>;

export const NominationReverseApiResponseSchema = z.object({
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
  address: AddressSchema,
  boundingbox: z.array(z.string()),
});
export type NominationReverseApiResponse = z.infer<
  typeof NominationReverseApiResponseSchema
>;

export type NominationReversePlace = Omit<
  NominationReverseApiResponse,
  "boundingbox"
> & {
  boundingbox: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
};
