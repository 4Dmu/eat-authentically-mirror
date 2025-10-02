import { type } from "arktype";

export const LatLangBoundsLiteralValidator = type({
  east: "number",
  north: "number",
  south: "number",
  west: "number",
});

export const GeocodeRegionProps = type({
  zoom: "number",
  center: {
    lat: "number",
    lng: "number",
  },
});

export const PlusCode = type({
  global_code: "string",
});

export const AddressComponent = type({
  long_name: "string",
  short_name: "string",
  types: type("string").array(),
});

export const Location = type({
  lat: "number",
  lng: "number",
});

export const Bounds = type({
  northeast: Location,
  southwest: Location,
});

export const Geometry = type({
  bounds: Bounds,
  location: Location,
  location_type: "string",
  viewport: Bounds,
});

export const ReverseGeocodeResult = type({
  address_components: AddressComponent.array(),
  formatted_address: "string",
  geometry: Geometry,
  place_id: "string",
  types: type("string").array(),
});

export const ReverseGeocodeResponse = type({
  plus_code: PlusCode,
  results: ReverseGeocodeResult.array(),
  status: "string",
});

export type GeocodeRegionPropsType = typeof GeocodeRegionProps.infer;
export type ReverseGeocodeResponseType = typeof ReverseGeocodeResponse.infer;

export type PlusCodeType = typeof PlusCode.infer;
export type GeometryType = typeof Geometry.infer;
export type AddressComponentType = typeof AddressComponent.infer;
export type LocationType = typeof Location.infer;
export type BoundsType = typeof Bounds.infer;
export type ReverseGeocodeResultType = typeof ReverseGeocodeResult.infer;
