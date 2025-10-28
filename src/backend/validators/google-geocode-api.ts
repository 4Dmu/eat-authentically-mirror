import z from "zod";

export const AddressComponentSchema = z.object({
  long_name: z.string(),
  short_name: z.string(),
  types: z.array(z.string()),
});
export type AddressComponent = z.infer<typeof AddressComponentSchema>;

export const NortheastClassSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
export type NortheastClass = z.infer<typeof NortheastClassSchema>;

export const ViewportSchema = z.object({
  northeast: NortheastClassSchema,
  southwest: NortheastClassSchema,
});
export type Viewport = z.infer<typeof ViewportSchema>;

export const NavigationPointLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});
export type NavigationPointLocation = z.infer<
  typeof NavigationPointLocationSchema
>;

export const PlusCodeSchema = z.object({
  compound_code: z.string(),
  global_code: z.string(),
});
export type PlusCode = z.infer<typeof PlusCodeSchema>;

export const GeometrySchema = z.object({
  location: NortheastClassSchema,
  location_type: z.string(),
  viewport: ViewportSchema,
});
export type Geometry = z.infer<typeof GeometrySchema>;

export const NavigationPointSchema = z.object({
  location: NavigationPointLocationSchema,
});
export type NavigationPoint = z.infer<typeof NavigationPointSchema>;

export const ResultSchema = z.object({
  address_components: z.array(AddressComponentSchema),
  formatted_address: z.string(),
  geometry: GeometrySchema,
  navigation_points: z.array(NavigationPointSchema).optional(),
  place_id: z.string(),
  plus_code: PlusCodeSchema.optional(),
  types: z.array(z.string()),
});
export type Result = z.infer<typeof ResultSchema>;

export const GeocodeResponseSchema = z.object({
  results: z.array(ResultSchema),
  status: z.string(),
});
export type GeocodeResponse = z.infer<typeof GeocodeResponseSchema>;
