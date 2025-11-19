import { CUSTOM_GEO_HEADER_NAME } from "@ea/shared/constants";
import type { Geo } from "@vercel/functions";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

export function getIpGeo(headers: ReadonlyHeaders) {
  const rawGeo = headers.get(CUSTOM_GEO_HEADER_NAME);

  const parsedGeo = rawGeo
    ? (JSON.parse(Buffer.from(rawGeo, "base64").toString()) as Geo)
    : undefined;

  const ipGeo =
    parsedGeo?.latitude && parsedGeo.longitude
      ? {
          lat: Number(parsedGeo.latitude),
          lon: Number(parsedGeo.longitude),
        }
      : undefined;

  return ipGeo;
}
