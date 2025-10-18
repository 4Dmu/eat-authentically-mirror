import type {
  GetProducerArgs,
  ProducerTypes,
  SearchByGeoTextArgs,
} from "@/backend/validators/producers";
import { db } from "../db";
import { asc, eq, ilike, like, SQL, sql } from "drizzle-orm";
import { claimRequests, producerCards, producers } from "../db/schema";
import { USER_PRODUCER_IDS_KV } from "../kv";

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

import {
  countryByAlpha2Code,
  countryByAlpha3Code,
  countryByName,
} from "@/utils/contries";
import { Row } from "@libsql/client";

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

const DEG2RAD = Math.PI / 180;
const EARTH_KM = 6371;

// Fast planar (good for ≤ ~200 km windows)
function approxMaxDistanceFromBBoxPlanar(center: GeoPoint, bbox: BBox): number {
  const latRad = center.lat * DEG2RAD;
  const kmPerDegLat = 111.045;
  const kmPerDegLon = 111.045 * Math.cos(latRad);

  const corners: GeoPoint[] = [
    { lat: bbox.minLat, lon: bbox.minLon },
    { lat: bbox.minLat, lon: bbox.maxLon },
    { lat: bbox.maxLat, lon: bbox.minLon },
    { lat: bbox.maxLat, lon: bbox.maxLon },
  ];

  let maxKm = 0;
  for (const c of corners) {
    const dxKm = Math.abs((c.lon - center.lon) * kmPerDegLon);
    const dyKm = Math.abs((c.lat - center.lat) * kmPerDegLat);
    const d = Math.hypot(dxKm, dyKm);
    if (d > maxKm) maxKm = d;
  }
  // small cushion for rounding/curvature
  return maxKm * 1.01;
}

// More accurate (4x haversine) - still cheap
function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = (b.lat - a.lat) * DEG2RAD;
  const dLon = (b.lon - a.lon) * DEG2RAD;
  const lat1 = a.lat * DEG2RAD;
  const lat2 = b.lat * DEG2RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

function maxDistanceFromBBoxHaversine(center: GeoPoint, bbox: BBox): number {
  const corners: GeoPoint[] = [
    { lat: bbox.minLat, lon: bbox.minLon },
    { lat: bbox.minLat, lon: bbox.maxLon },
    { lat: bbox.maxLat, lon: bbox.minLon },
    { lat: bbox.maxLat, lon: bbox.maxLon },
  ];
  let maxKm = 0;
  for (const c of corners) {
    const d = haversineKm(center, c);
    if (d > maxKm) maxKm = d;
  }
  return maxKm * 1.005; // tiny cushion
}

export function approximateMaxDistanceKm(args: {
  center?: GeoPoint; // if omitted with bbox, midpoint is used
  radiusKm?: number | null; // if present, we return it
  bbox?: BBox;
  method?: "planar" | "haversine";
}): {
  center: GeoPoint | null;
  maxDistanceKm: number | null;
  source: "radius" | "bbox" | "none";
} {
  const { center, radiusKm, bbox, method = "planar" } = args;

  if (radiusKm && radiusKm > 0) {
    return {
      center: center ?? null,
      maxDistanceKm: radiusKm,
      source: "radius",
    };
  }

  if (bbox) {
    const ctr = center ?? {
      lat: (bbox.minLat + bbox.maxLat) / 2,
      lon: (bbox.minLon + bbox.maxLon) / 2,
    };
    const maxKm =
      method === "haversine"
        ? maxDistanceFromBBoxHaversine(ctr, bbox)
        : approxMaxDistanceFromBBoxPlanar(ctr, bbox);
    return { center: ctr, maxDistanceKm: maxKm, source: "bbox" };
  }

  return { center: center ?? null, maxDistanceKm: null, source: "none" };
}

export async function searchByGeoText({
  q,
  center,
  limit,
  offset,
  filters,
  ...rest
}: SearchByGeoTextArgs) {
  const hardLimit = limit + 1;

  const geoSql = sql`
        WITH
        params AS (
          SELECT
            ${center?.lat ?? null} AS lat,
            ${center?.lon ?? null} AS lon,
            ${"radiusKm" in rest ? rest.radiusKm : null} AS R,
            ${rest.bbox?.minLat ?? null} AS minLatParam,
            ${rest.bbox?.maxLat ?? null} AS maxLatParam,
            ${rest.bbox?.minLon ?? null} AS minLonParam,
            ${rest.bbox?.maxLon ?? null} AS maxLonParam
        ),
        bbox AS (
          SELECT
            COALESCE(minLatParam, lat - (R/111.045)) AS minLat,
            COALESCE(maxLatParam, lat + (R/111.045)) AS maxLat,
            COALESCE(
              minLonParam,
              lon - (R/(111.045 * COS(lat * 0.017453292519943295)))
            ) AS minLon,
            COALESCE(
              maxLonParam,
              lon + (R/(111.045 * COS(lat * 0.017453292519943295)))
            ) AS maxLon,
            lat,
            lon,
            R
          FROM params
        ),
        prefilter AS (
        SELECT r.geo_id
        FROM rtree_producers r, bbox b
        WHERE r.minLon <= b.maxLon AND r.maxLon >= b.minLon
            AND r.minLat <= b.maxLat AND r.maxLat >= b.minLat
        ),
        scored AS (
        SELECT
            p.id,
            p.name,
            p.type,
            p.verified,
            p.user_id,
            p.subscription_rank,
            l.latitude,
            l.longitude,
            2 * 6371 * ASIN(
            SQRT(
                POWER(SIN(((l.latitude  - (SELECT lat FROM params)) * 0.017453292519943295) / 2.0), 2) +
                COS((SELECT lat FROM params) * 0.017453292519943295) *
                COS(l.latitude * 0.017453292519943295) *
                POWER(SIN(((l.longitude - (SELECT lon FROM params)) * 0.017453292519943295) / 2.0), 2)
            )
            ) AS distance_km
        FROM prefilter pf
        JOIN producer_location l ON l.geo_id = pf.geo_id
        JOIN producers p ON p.id = l.producer_id
        )
        SELECT s.id, s.name, s.type, s.verified, s.subscription_rank,
            s.latitude, s.longitude,
            s.distance_km,
            -- thumbnail via your view (optional):
            (SELECT thumbnailUrl FROM v_producer_cards v WHERE v.id = s.id) AS thumbnailUrl
        FROM scored s
        WHERE s.distance_km <= (SELECT R FROM params)
        ORDER BY s.distance_km ASC, s.id ASC
        LIMIT ${hardLimit} OFFSET ${offset};
    `;

  let rows: Row[] = [];
  if (q && q.trim().length) {
    const country = rest.countryHint
      ? attemptDetectCountry(rest.countryHint)
      : null;

    const hasbbox = rest.bbox !== undefined;

    const textBlend = sql`
        WITH
        -- center + radius or explicit bbox input
        params AS (
          SELECT
            ${center?.lat ?? null} AS lat,
            ${center?.lon ?? null} AS lon,
            ${rest.radiusKm} AS R,
            ${rest.bbox?.minLat ?? null} AS minLatParam,
            ${rest.bbox?.maxLat ?? null} AS maxLatParam,
            ${rest.bbox?.minLon ?? null} AS minLonParam,
            ${rest.bbox?.maxLon ?? null} AS maxLonParam
        ),
        -- derive bbox if not passed in
        bbox AS (
          SELECT
            COALESCE(minLatParam, lat - (R/111.045)) AS minLat,
            COALESCE(maxLatParam, lat + (R/111.045)) AS maxLat,
            COALESCE(
              minLonParam,
              lon - (R/(111.045 * COS(lat * 0.017453292519943295)))
            ) AS minLon,
            COALESCE(
              maxLonParam,
              lon + (R/(111.045 * COS(lat * 0.017453292519943295)))
            ) AS maxLon,
            lat,
            lon,
            R
          FROM params
        ),
        prefilter AS (
          SELECT r.geo_id
          FROM rtree_producers r, bbox b
          WHERE r.minLon <= b.maxLon AND r.maxLon >= b.minLon
            AND r.minLat <= b.maxLat AND r.maxLat >= b.minLat
        ),
        scored AS (
          SELECT
            p.id,
            p.name,
            p.type,
            p.verified,
            p.user_id,
            p.subscription_rank,
            l.latitude,
            l.longitude,
            l.locality,
            l.admin_area,
            l.country,
            2 * 6371 * ASIN(
              SQRT(
                POWER(SIN(((l.latitude  - (SELECT lat FROM bbox)) * 0.017453292519943295) / 2.0), 2) +
                COS((SELECT lat FROM bbox) * 0.017453292519943295) *
                COS(l.latitude * 0.017453292519943295) *
                POWER(SIN(((l.longitude - (SELECT lon FROM bbox)) * 0.017453292519943295) / 2.0), 2)
              )
            ) AS distance_km
          FROM prefilter pf
          JOIN producer_location l ON l.geo_id = pf.geo_id
          JOIN producers p ON p.id = l.producer_id
          WHERE 1=1
          ${country ? sql`AND l.country = ${country.alpha3}` : sql``}
        ),
        geo AS (
          SELECT *
          FROM scored
          WHERE 1=1
          ${
            hasbbox
              ? sql``
              : sql`AND (SELECT R FROM bbox) IS NULL OR distance_km <= (SELECT R FROM bbox)`
          }
        ),
        prod_fts AS (
          SELECT s.producer_id, bm25(producers_fts) AS prod_rel
          FROM producers_search s
          JOIN producers_fts ON producers_fts.rowid = s.rowid
          WHERE producers_fts MATCH ${q.trim()}
        ),
        rev_fts AS (
          SELECT t.producer_id, MIN(t.rank) AS review_rel
          FROM (
            SELECT rc.producer_id, reviews_fts.rank AS rank
            FROM reviews_fts
            JOIN reviews_content rc ON rc.docid = reviews_fts.rowid
            WHERE reviews_fts MATCH ${q.trim()}
          ) AS t
          GROUP BY t.producer_id
        ),
        rating_scores AS (
          SELECT
            pra.producer_id,
            pra.review_count AS n,
            CASE WHEN pra.review_count > 0
                THEN pra.rating_sum * 1.0 / pra.review_count
                ELSE NULL END AS avg_rating,
            (pra.rating_sum + 10 * 4.2) * 1.0 / (pra.review_count + 10) AS bayes_avg
          FROM producer_rating_agg pra
        ),
        cover AS (
          SELECT pm.producer_id, ma.url AS cover_url
          FROM producer_media pm
          JOIN media_assets ma ON ma.id = pm.asset_id
          WHERE pm.role = 'cover'
          GROUP BY pm.producer_id
        ),
        certs AS (
          SELECT pc.producer_id, GROUP_CONCAT(DISTINCT c.slug) AS certifications_csv
          FROM producer_certifications pc
          JOIN certifications c ON c.id = pc.certification_id
          GROUP BY pc.producer_id
        ),
        comms AS (
          SELECT pc2.producer_id,
                GROUP_CONCAT(DISTINCT c2.slug) AS commodities_csv,
                GROUP_CONCAT(DISTINCT CASE WHEN cv.id IS NOT NULL THEN c2.slug || ':' || cv.slug END) AS commodity_variants_csv
          FROM producer_commodities pc2
          JOIN commodities c2 ON c2.id = pc2.commodity_id
          LEFT JOIN commodity_variants cv ON cv.id = pc2.variant_id
          GROUP BY pc2.producer_id
        ),
        labels AS (
          SELECT s.producer_id, s.search_labels
          FROM producers_search s
        )
        SELECT
          g.id,
          g.name,
          g.type,
          g.user_id,
          g.verified,
          g.subscription_rank,
          g.latitude,
          g.longitude,
          g.locality,
          g.admin_area,
          g.country,
          g.distance_km,
          COALESCE(prod_fts.prod_rel, 10.0)  AS prod_rel,
          COALESCE(rev_fts.review_rel, 10.0) AS review_rel,
          rs.n,
          rs.avg_rating,
          rs.bayes_avg,
          co.cover_url,
          ce.certifications_csv,
          cm.commodities_csv,
          cm.commodity_variants_csv,
          lb.search_labels
        FROM geo g
        LEFT JOIN prod_fts      ON prod_fts.producer_id = g.id
        LEFT JOIN rev_fts       ON rev_fts.producer_id  = g.id
        LEFT JOIN rating_scores rs ON rs.producer_id    = g.id
        LEFT JOIN cover         co ON co.producer_id    = g.id
        LEFT JOIN certs         ce ON ce.producer_id    = g.id
        LEFT JOIN comms         cm ON cm.producer_id    = g.id
        LEFT JOIN labels        lb ON lb.producer_id    = g.id
        ${
          filters?.certifications && filters.certifications.length
            ? sql`
          JOIN producer_certifications pc ON pc.producer_id = g.id
          JOIN certifications c ON c.id = pc.certification_id
            AND c.slug IN (${sql.join(
              filters.certifications.map((s) => sql`${s}`),
              sql`,`
            )})
        `
            : sql``
        }
        ${
          (filters?.commodities && filters.commodities.length) ||
          (filters?.variants && filters.variants.length) ||
          filters?.organicOnly
            ? sql`
          JOIN producer_commodities pc2 ON pc2.producer_id = g.id
        `
            : sql``
        }
        ${
          filters?.commodities && filters.commodities.length
            ? sql`
          JOIN commodities c2 ON c2.id = pc2.commodity_id
            AND c2.slug IN (${sql.join(
              filters.commodities.map((s) => sql`${s}`),
              sql`,`
            )})
        `
            : sql``
        }
        ${
          filters?.variants && filters.variants.length
            ? sql`
          JOIN commodity_variants cv ON cv.id = pc2.variant_id
            AND cv.slug IN (${sql.join(
              filters.variants.map((s) => sql`${s}`),
              sql`,`
            )})
        `
            : sql``
        }
        WHERE 1=1
        ${filters?.category ? sql`AND g.type = ${filters.category}` : sql``}
        ${filters?.organicOnly ? sql`AND pc2.organic = 1` : sql``}
        ORDER BY
         g.distance_km ASC,
          COALESCE(prod_fts.prod_rel, 10.0) ASC,
          COALESCE(rev_fts.review_rel, 10.0) ASC,
          g.id ASC
        LIMIT ${hardLimit} OFFSET ${offset};
        `;

    const result = await db.run(textBlend);
    rows = result.rows;
  } else {
    const result = await db.run(geoSql);
    rows = result.rows;
  }

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  const maxDistance = approximateMaxDistanceKm({
    center: center,
    method: "haversine",
    bbox: rest.bbox,
    radiusKm: rest.bbox ? undefined : rest.radiusKm,
  });

  return {
    items: items.map((item) => ({
      id: item["id"] as string,
      name: item["name"] as string,
      type: item["type"] as ProducerTypes,
      isClaimed: item["user_id"] !== null,
      verified: Boolean(item["verified"]),
      latitude: item["latitude"] as number,
      longitude: item["longitude"] as number,
      locality: item["locality"] as string | null,
      admin_area: item["admin_area"] as string | null,
      country: item["country"] as string | null,
      distance_km: item["distance_km"] as number,
      prod_rel: item["prod_rel"] as number,
      review_rel: item["review_rel"] as number,
      avg_rating: item["avg_rating"] as number | null,
      thumbnailUrl: item["cover_url"] as string | null,
      certifications_csv: item["certifications_csv"] as string | null,
      commodities_csv: item["commodities_csv"] as string | null,
      commodity_variants_csv: item["commodity_variants_csv"] as string | null,
      search_labels: item["search_labels"] as string | null,
    })),
    count: items.length,
    page: offset / limit,
    limit,
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
    maxDistance: maxDistance.maxDistanceKm,
  };
}

export type ProducerSearchResultRow = {
  id: string;
  name: string;
  type: ProducerTypes;
  isClaimed: boolean;
  verified: boolean;
  latitude: number;
  longitude: number;
  locality: string | null;
  admin_area: string | null;
  country: string | null;
  distance_km: number;
  prod_rel: number;
  review_rel: number;
  avg_rating: number | null;
  thumbnailUrl: string | null;
  certifications_csv: string | null;
  commodities_csv: string | null;
  commodity_variants_csv: string | null;
  search_labels: string | null;
};

export type ProducerSearchResult = {
  items: ProducerSearchResultRow[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextOffset: number | null;
  maxDistance: number | null;
};

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
        },
        location: true,
        commodities: true,
        certifications: true,
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
    where = ilike(producerCards.name, args.query);
  }

  const hardLimit = args.limit + 1;

  const rows = await db.query.producers.findMany({
    orderBy: asc(producers.createdAt),
    where: where,
    offset: args.offset,
    limit: args.limit,
    with: {
      media: {
        with: {
          asset: true,
        },
      },
      location: true,
      commodities: true,
      certifications: true,
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
