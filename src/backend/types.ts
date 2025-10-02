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
