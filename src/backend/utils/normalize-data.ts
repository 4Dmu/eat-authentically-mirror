import { Address } from "../validators/producers";

export function normalizeAddress(address: Address) {
  const normalized: Address = {};

  if (address.city) {
    normalized.city =
      address.city.trim().length === 0 ? undefined : address.city;
  }

  if (address.country) {
    normalized.country = address.country;
  }

  if (address.state) {
    normalized.state =
      address.state.trim().length === 0 ? undefined : address.state;
  }

  if (address.street) {
    normalized.street =
      address.street.trim().length === 0 ? undefined : address.street;
  }

  if (address.zip) {
    normalized.zip = address.zip.trim().length === 0 ? undefined : address.zip;
  }

  if (address.coordinate) {
    normalized.coordinate = address.coordinate;
  }

  console.log(normalized);

  return normalized;
}
