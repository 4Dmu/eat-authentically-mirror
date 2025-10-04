import { env } from "@/env";

export async function geocode(address: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?key=${env.GOOGLE_MAPS_API_KEY}&address=${address}`
  );

  const data = (await response.json()) as GeocodeResponse;

  if (
    data.status !== "OK" ||
    data.results === undefined ||
    data.results.length === 0
  ) {
    console.log(data);
    throw new Error("Invalid address");
  }

  return data;
}

export type GeocodeResponse = {
  results: Result[];
  status: string;
};

export type Result = {
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: Geometry;
  place_id: string;
  plus_code: PlusCode;
  types: string[];
};

export type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type Geometry = {
  location: Location;
  location_type: string;
  viewport: Viewport;
};

export type Location = {
  lat: number;
  lng: number;
};

export type Viewport = {
  northeast: Location;
  southwest: Location;
};

export type PlusCode = {
  compound_code: string;
  global_code: string;
};
