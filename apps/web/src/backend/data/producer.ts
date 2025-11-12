import type {
  GetProducerArgs,
  ProducerTypes,
  SearchByGeoTextArgs,
} from "@ea/validators/producers";
import { db } from "@ea/db";
import { asc, eq, like, SQL } from "drizzle-orm";
import {
  claimRequests,
  producerCards,
  producerMedia,
  producers,
} from "@ea/db/schema";
import { USER_PRODUCER_IDS_KV } from "../kv";
import {
  countryByAlpha2Code,
  countryByAlpha3Code,
  countryByName,
} from "@/utils/contries";
import { typesense, type SearchResponse } from "@ea/search";

export async function getUsersProducerIdsCached(userId: string) {
  const profileIds = await USER_PRODUCER_IDS_KV.get(userId);

  if (profileIds) {
    return profileIds;
  }

  const existing = await db
    .select({ id: producers.id })
    .from(producers)
    .where(eq(producers.userId, userId))
    .then((r) => r.map((i) => i.id));

  await USER_PRODUCER_IDS_KV.set(userId, existing);

  return existing;
}

function attemptDetectCountry(query: string) {
  const string = query.trim().toLowerCase();

  let country = countryByName(string);

  if (country) {
    return country;
  }

  country = countryByAlpha3Code(string);

  if (country) {
    return country;
  }

  country = countryByAlpha2Code(string);

  return country;
}

type GeoPoint = { lat: number; lon: number };
type BBox = { minLat: number; maxLat: number; minLon: number; maxLon: number };

// const DEG2RAD = Math.PI / 180;
// const EARTH_KM = 6371;

// // Fast planar (good for ≤ ~200 km windows)
// function approxMaxDistanceFromBBoxPlanar(center: GeoPoint, bbox: BBox): number {
//   const latRad = center.lat * DEG2RAD;
//   const kmPerDegLat = 111.045;
//   const kmPerDegLon = 111.045 * Math.cos(latRad);

//   const corners: GeoPoint[] = [
//     { lat: bbox.minLat, lon: bbox.minLon },
//     { lat: bbox.minLat, lon: bbox.maxLon },
//     { lat: bbox.maxLat, lon: bbox.minLon },
//     { lat: bbox.maxLat, lon: bbox.maxLon },
//   ];

//   let maxKm = 0;
//   for (const c of corners) {
//     const dxKm = Math.abs((c.lon - center.lon) * kmPerDegLon);
//     const dyKm = Math.abs((c.lat - center.lat) * kmPerDegLat);
//     const d = Math.hypot(dxKm, dyKm);
//     if (d > maxKm) maxKm = d;
//   }
//   // small cushion for rounding/curvature
//   return maxKm * 1.01;
// }

// // More accurate (4x haversine) - still cheap
// function haversineKm(a: GeoPoint, b: GeoPoint): number {
//   const dLat = (b.lat - a.lat) * DEG2RAD;
//   const dLon = (b.lon - a.lon) * DEG2RAD;
//   const lat1 = a.lat * DEG2RAD;
//   const lat2 = b.lat * DEG2RAD;
//   const h =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
//   return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
// }

// function maxDistanceFromBBoxHaversine(center: GeoPoint, bbox: BBox): number {
//   const corners: GeoPoint[] = [
//     { lat: bbox.minLat, lon: bbox.minLon },
//     { lat: bbox.minLat, lon: bbox.maxLon },
//     { lat: bbox.maxLat, lon: bbox.minLon },
//     { lat: bbox.maxLat, lon: bbox.maxLon },
//   ];
//   let maxKm = 0;
//   for (const c of corners) {
//     const d = haversineKm(center, c);
//     if (d > maxKm) maxKm = d;
//   }
//   return maxKm * 1.005; // tiny cushion
// }

// function approximateMaxDistanceKm(args: {
//   center?: GeoPoint; // if omitted with bbox, midpoint is used
//   radiusKm?: number | null; // if present, we return it
//   bbox?: BBox;
//   method?: "planar" | "haversine";
// }): {
//   center: GeoPoint | null;
//   maxDistanceKm: number | null;
//   source: "radius" | "bbox" | "none";
// } {
//   const { center, radiusKm, bbox, method = "planar" } = args;

//   if (radiusKm && radiusKm > 0) {
//     return {
//       center: center ?? null,
//       maxDistanceKm: radiusKm,
//       source: "radius",
//     };
//   }

//   if (bbox) {
//     const ctr = center ?? {
//       lat: (bbox.minLat + bbox.maxLat) / 2,
//       lon: (bbox.minLon + bbox.maxLon) / 2,
//     };
//     const maxKm =
//       method === "haversine"
//         ? maxDistanceFromBBoxHaversine(ctr, bbox)
//         : approxMaxDistanceFromBBoxPlanar(ctr, bbox);
//     return { center: ctr, maxDistanceKm: maxKm, source: "bbox" };
//   }

//   return { center: center ?? null, maxDistanceKm: null, source: "none" };
// }

function buildGeoFilter(
  geo?:
    | { center: GeoPoint; radiusKm?: number }
    | { center: GeoPoint; bbox: BBox }
) {
  if (!geo) return null;
  if ("bbox" in geo) {
    return `location:(${geo.bbox.minLat}, ${geo.bbox.minLon}, ${geo.bbox.minLat}, ${geo.bbox.maxLon}, ${geo.bbox.maxLat}, ${geo.bbox.maxLon}, ${geo.bbox.maxLat}, ${geo.bbox.minLon}, ${geo.bbox.minLat}, ${geo.bbox.minLon})`;
  }
  return `location:(${geo.center.lat}, ${geo.center.lon}, ${geo.radiusKm} km)`;
}

function buildFacetFilters(
  filters: SearchByGeoTextArgs["filters"],
  countryAlpha3?: string | null
) {
  const parts: string[] = [];

  if (countryAlpha3) parts.push(`country:=${countryAlpha3}`);

  if (filters?.category) parts.push(`type:=${filters.category}`);
  if (filters?.verified === true) parts.push(`verified:=true`);
  if (filters?.verified === false) parts.push(`verified:=false`);
  if (filters?.isClaimed === true) parts.push(`userId:!=""`);
  if (filters?.isClaimed === false) parts.push(`userId:=""`);

  if (filters?.organicOnly) parts.push(`organic:=true`);

  if (filters?.certifications?.length)
    parts.push(`certifications:=[${filters.certifications.join(",")}]`);

  if (filters?.commodities?.length)
    parts.push(`commodities:=[${filters.commodities.join(",")}]`);

  if (filters?.locality)
    parts.push(`locality:=${JSON.stringify(filters.locality)}`);
  if (filters?.adminArea)
    parts.push(`adminArea:=${JSON.stringify(filters.adminArea)}`);

  if (filters?.subscriptionRankMin != null)
    parts.push(`subscriptionRank:>=${filters.subscriptionRankMin}`);
  if (filters?.subscriptionRankMax != null)
    parts.push(`subscriptionRank:<=${filters.subscriptionRankMax}`);

  if (filters?.minAvgRating != null)
    parts.push(`avgRating:>=${filters.minAvgRating}`);
  if (filters?.minBayesAvg != null)
    parts.push(`bayesAvg:>=${filters.minBayesAvg}`);
  if (filters?.minReviews != null)
    parts.push(`reviewCount:>=${filters.minReviews}`);

  if (filters?.ids?.length)
    parts.push(`id:=[${filters.ids.map((s) => JSON.stringify(s)).join(",")}]`);
  if (filters?.excludeIds?.length)
    parts.push(
      `!id:=[${filters.excludeIds.map((s) => JSON.stringify(s)).join(",")}]`
    );

  return parts.length ? parts.join(" && ") : null;
}

function buildSort(center: GeoPoint | null, keywords: string[]) {
  // Prefer geo distance if we have a center; otherwise text → paid → rating
  if (center) {
    return `location(${center.lat}, ${center.lon}):asc, _text_match:desc, subscriptionRank:desc`;
  }
  if (keywords.length) {
    return `_text_match:desc, subscriptionRank:desc, bayesAvg:desc`;
  }
  return `subscriptionRank:desc, bayesAvg:desc, reviewCount:desc`;
}

export async function searchByGeoTextV2(args: SearchByGeoTextArgs) {
  const client = typesense();

  const { keywords, geo, filters, countryHint, page } = args;

  const q = (keywords && keywords.length ? keywords.join(" ") : "*") || "*";

  const country = countryHint ? attemptDetectCountry(countryHint) : null;

  const geoFilter = buildGeoFilter(geo);
  const facetFilter = buildFacetFilters(filters, country?.alpha3 ?? null);
  const filter_by = [geoFilter, facetFilter].filter(Boolean).join(" && ");

  const sort_by = buildSort(
    geo ? ("center" in geo ? geo.center : null) : null,
    keywords
  );

  console.log(page, "page");

  const docs = client
    .collections<ProducerSearchResultRow>("producers")
    .documents();

  const results = await docs.search({
    q: q,
    query_by: "name,summary,labels,commodities,certifications",
    query_by_weights: "8,3,2,4,2",
    filter_by: filter_by,
    sort_by: sort_by,
    page: page,
    prioritize_exact_match: true,
    num_typos: 1,
    drop_tokens_threshold: 1,
  });
  return results;
}

export type ProducerSearchResultRow = {
  avgRating: number;
  bayesAvg: number;
  certifications: string[];
  commodities: string[];
  country: string | undefined;
  city: string | undefined;
  adminArea: string | undefined;
  locality: string | undefined;
  coverUrl: string | undefined;
  createdAt: number;
  id: string;
  labels: string[];
  location: [37.140639, -8.632694] | undefined;
  name: string;
  organic: boolean;
  reviewCount: number;
  subscriptionRank: number;
  summary: string | undefined;
  type: ProducerTypes;
  updatedAt: number;
  verified: boolean;
  userId: string | undefined;
};

export type ProducerSearchResult = SearchResponse<ProducerSearchResultRow>;

export async function getProducerPublic(args: GetProducerArgs) {
  try {
    const listing = await db
      .select()
      .from(producerCards)
      .where(eq(producerCards.id, args.id))
      .limit(1);

    if (!listing) {
      return;
    }

    return listing[0];
  } catch (err) {
    console.error(err);
    throw new Error("Error loading listing");
  }
}

export async function getFullProducerPublic(args: GetProducerArgs) {
  try {
    const listing = await db.query.producers.findFirst({
      where: eq(producers.id, args.id),
      with: {
        media: {
          with: {
            asset: true,
          },
          orderBy: asc(producerMedia.position),
        },
        location: true,
        commodities: {
          with: {
            commodity: true,
          },
        },
        certifications: {
          with: {
            certification: true,
          },
        },
        chats: true,
        labels: true,
        hours: true,
        contact: true,
        social: true,
        quality: true,
        campaigns: true,
        search: true,
        reviews: true,
        importedReviews: true,
        ratingAgg: true,
        pins: true,
        scrapeMeta: true,
        googleMapsPlaceDetails: true,
      },
    });

    if (!listing) {
      return;
    }

    return listing;
  } catch (err) {
    console.error(err);
    throw new Error("Error loading listing");
  }
}

export async function listCertificationTypesPublic() {
  const certs = await db.query.certifications.findMany();

  return certs;
}

export async function internalClaimProducer({
  claimRequestId,
  producerId,
  userId,
}: {
  claimRequestId: string;
  producerId: string;
  userId: string;
}) {
  await db.transaction(async (tx) => {
    await tx
      .update(claimRequests)
      .set({
        status: {
          type: "claimed",
        },
        claimedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(claimRequests.id, claimRequestId));

    await tx
      .update(producers)
      .set({
        userId: userId,
        verified: true,
      })
      .where(eq(producers.id, producerId));

    await USER_PRODUCER_IDS_KV.push(userId, producerId);
  });
}

export async function listProducers(args: {
  offset: number;
  limit: number;
  query?: string;
}) {
  let where: SQL<unknown> | undefined = undefined;

  if (args.query) {
    where = like(producerCards.name, `%${args.query}%`);
  }

  const rows = await db.query.producers.findMany({
    orderBy: asc(producers.createdAt),
    where: where,
    offset: args.offset,
    limit: args.limit + 1,
    with: {
      media: {
        with: {
          asset: true,
        },
        orderBy: asc(producerMedia.position),
      },
      location: true,
      commodities: {
        with: {
          commodity: true,
        },
      },
      certifications: {
        with: {
          certification: true,
        },
      },
      chats: true,
      labels: true,
      hours: true,
      contact: true,
      social: true,
      quality: true,
      campaigns: true,
      search: true,
      reviews: true,
      importedReviews: true,
      ratingAgg: true,
      pins: true,
      scrapeMeta: true,
      googleMapsPlaceDetails: true,
    },
  });

  const hasMore = rows.length > args.limit;
  const items = hasMore ? rows.slice(0, args.limit) : rows;

  return {
    items: items,
    hasMore,
  };
}
