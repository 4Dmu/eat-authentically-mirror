import { NominatimGeocodeResponseCache } from "@/backend/kv";
import { allow1RequestPer2Seconds } from "@/backend/lib/rate-limit";
import {
  nominationApiResponse,
  NominationPlace,
} from "@/backend/validators/nomination-api";

export const geocodePlace = async ({
  place,
}: {
  place: string;
}): Promise<
  | { status: "error"; error: string }
  | { status: "success"; data: NominationPlace }
> => {
  const cached = await NominatimGeocodeResponseCache.get(place);

  if (cached) {
    console.log("Cache hit");
    return { status: "success", data: cached };
  }

  const limitresult = await allow1RequestPer2Seconds.limit(
    "tool:searchByGeoText"
  );

  if (!limitresult.success) {
    return {
      status: "error",
      error: "Maps ratelimit exceeded",
    };
  }

  try {
    const params = new URLSearchParams();

    params.set("q", place);
    params.set("email", "nominatim.org.legwarmer632@passmail.net");
    params.set("limit", "1");
    params.set("format", "jsonv2");

    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "eat-authentically-dev",
        },
      }
    );

    const json = await nominatimResponse.json();

    const { boundingbox, ...rest } = nominationApiResponse.parse(json)[0];

    const result = {
      ...rest,
      boundingbox: {
        minLat: Number(boundingbox[0]),
        maxLat: Number(boundingbox[1]),
        minLon: Number(boundingbox[2]),
        maxLon: Number(boundingbox[3]),
      },
    };

    await NominatimGeocodeResponseCache.set(place, result);

    return { status: "success", data: result };
  } catch (err) {
    console.error(err);
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Error geocoding",
    };
  }
};
