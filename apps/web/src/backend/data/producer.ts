import type {
  GetProducerArgs,
  ProducerTypes,
  SearchByGeoTextArgs,
} from "@ea/validators/producers";
import { db } from "@ea/db";
import { asc, eq, like, SQL, sql } from "drizzle-orm";
import {
  claimRequests,
  producerCards,
  producerMedia,
  producers,
} from "@ea/db/schema";
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

function approximateMaxDistanceKm(args: {
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

export async function searchByGeoText(args: SearchByGeoTextArgs) {
  const { limit, offset } = args;

  console.log(args);

  let rows: Row[] = [];
  let maxDistance:
    | {
        center: GeoPoint | null;
        maxDistanceKm: number | null;
        source: "radius" | "bbox" | "none";
      }
    | undefined = undefined;

  const { keywords, geo, filters, countryHint } = args;

  const hardLimit = limit + 1;

  const country = countryHint ? attemptDetectCountry(countryHint) : null;

  const organicCertId = "fc340cb2-34c0-4c21-855b-4cb2c6d2d0df";

  const ftsAnyExpr = args.keywords.length
    ? args.keywords.map((t) => `${t}*`).join(" OR ")
    : "";

  const existsBlocks = args.keywords.map(
    (t) => sql`
  + CASE WHEN EXISTS(
      SELECT 1
      FROM producers_fts
      WHERE rowid = s.rowid
        AND producers_fts MATCH ${t + "*"}
    ) THEN 1 ELSE 0 END
`
  );

  const matchedTermsSQL = args.keywords.length
    ? sql.join(existsBlocks, sql``)
    : sql``;

  if (geo && keywords.length > 0) {
    const bbox = "bbox" in geo ? geo.bbox : undefined;
    const radius = "radiusKm" in geo ? geo.radiusKm : undefined;

    const textBlend = sql`
        WITH
        -- center + radius or explicit bbox input
        params AS (
          SELECT
            ${geo.center.lat ?? null} AS lat,
            ${geo.center.lon ?? null} AS lon,
            ${radius ?? null} AS R,
            ${bbox?.minLat ?? null} AS minLatParam,
            ${bbox?.maxLat ?? null} AS maxLatParam,
            ${bbox?.minLon ?? null} AS minLonParam,
            ${bbox?.maxLon ?? null} AS maxLonParam
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
            p.summary,
            p.subscription_rank,
            l.latitude,
            l.longitude,
            l.locality,
            l.city,
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
           -- Filter by specific certifications (any of the selected)
          ${
            filters?.certifications && filters.certifications.length
              ? sql`
                  AND EXISTS (
                    SELECT 1
                    FROM producer_certifications pc
                    JOIN certifications c ON c.id = pc.certification_id
                    WHERE pc.producer_id = p.id
                      AND c.slug IN (${sql.join(
                        filters.certifications.map((s) => sql`${s}`),
                        sql`,`
                      )})
                  )
                `
              : sql``
          }
          -- Filter by a specific certification ID (e.g., organicCertId)
          ${
            filters?.organicOnly
              ? sql`
                  AND EXISTS (
                    SELECT 1
                    FROM producer_certifications pc
                    WHERE pc.producer_id = p.id
                      AND pc.certification_id = ${organicCertId}
                  )
                `
              : sql``
          }

          -- Filter by commodities
          ${
            filters?.commodities && filters.commodities.length
              ? sql`
                  AND EXISTS (
                    SELECT 1
                    FROM producer_commodities pc2
                    JOIN commodities c2 ON c2.id = pc2.commodity_id
                    WHERE pc2.producer_id = p.id
                      AND c2.slug IN (${sql.join(
                        filters.commodities.map((s) => sql`${s}`),
                        sql`,`
                      )})
                  )
                `
              : sql``
          }
          -- Filter by variants
          ${
            filters?.variants && filters.variants.length
              ? sql`
                  AND EXISTS (
                    SELECT 1
                    FROM producer_commodities pc2
                    JOIN commodity_variants cv ON cv.id = pc2.variant_id
                    WHERE pc2.producer_id = p.id
                      AND cv.slug IN (${sql.join(
                        filters.variants.map((s) => sql`${s}`),
                        sql`,`
                      )})
                  )
                `
              : sql``
          }
          ${filters?.category ? sql`AND p.type = ${filters.category}` : sql``}
        ),
        geo AS (
          SELECT *
          FROM scored
          WHERE 1=1
          ${
            bbox
              ? sql``
              : sql`AND ((SELECT R FROM bbox) IS NULL OR distance_km <= (SELECT R FROM bbox))`
          }
        ),
        prod_fts AS (
          SELECT
            s.producer_id,
            bm25(producers_fts) AS prod_rel,
            (0${matchedTermsSQL}) AS matched_terms
          FROM producers_search AS s
          JOIN producers_fts  ON producers_fts.rowid = s.rowid
          WHERE producers_fts MATCH ${ftsAnyExpr}
        ),
        rev_fts AS (
          SELECT
            rc.producer_id,
            MIN(reviews_fts.rank) AS review_rel
          FROM reviews_fts
          JOIN reviews_content AS rc ON rc.docid = reviews_fts.rowid
          WHERE reviews_fts MATCH ${ftsAnyExpr}
          GROUP BY rc.producer_id
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
          SELECT pm.producer_id, MIN(ma.url) AS cover_url
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
          g.summary,
          g.verified,
          g.subscription_rank,
          g.latitude,
          g.longitude,
          g.locality,
          g.admin_area,
          g.country,
          g.city,
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
        JOIN prod_fts      ON prod_fts.producer_id = g.id
        LEFT JOIN rev_fts       ON rev_fts.producer_id  = g.id
        LEFT JOIN rating_scores rs ON rs.producer_id    = g.id
        LEFT JOIN cover         co ON co.producer_id    = g.id
        LEFT JOIN certs         ce ON ce.producer_id    = g.id
        LEFT JOIN comms         cm ON cm.producer_id    = g.id
        LEFT JOIN labels        lb ON lb.producer_id    = g.id
        WHERE 1=1
        ORDER BY
          g.distance_km ASC,
          COALESCE(prod_fts.matched_terms, 0) DESC,
          COALESCE(prod_fts.prod_rel, 10.0) ASC,
          COALESCE(rev_fts.review_rel, 10.0) ASC,
          g.subscription_rank ASC,
          g.id ASC
        LIMIT ${hardLimit} OFFSET ${offset};
        `;

    const result = await db.run(textBlend);
    rows = result.rows;

    maxDistance = approximateMaxDistanceKm({
      center: geo.center,
      method: "haversine",
      bbox: bbox,
      radiusKm: radius,
    });
  } else if (args.keywords.length > 0) {
    const textBlend = sql`
      WITH
      prod_fts AS (
        SELECT
          s.producer_id,
          bm25(producers_fts) AS prod_rel,
          (0${matchedTermsSQL}) AS matched_terms
        FROM producers_search AS s
        JOIN producers_fts  ON producers_fts.rowid = s.rowid
        WHERE producers_fts MATCH ${ftsAnyExpr}
      ),
      rev_fts AS (
        SELECT
          rc.producer_id,
          MIN(reviews_fts.rank) AS review_rel
        FROM reviews_fts
        JOIN reviews_content AS rc ON rc.docid = reviews_fts.rowid
        WHERE reviews_fts MATCH ${ftsAnyExpr}
        GROUP BY rc.producer_id
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
        SELECT pm.producer_id, MIN(ma.url) AS cover_url
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
        p.id,
        p.name,
        p.type,
        p.user_id,
        p.verified,
        p.summary,
        p.subscription_rank,
        l.latitude,
        l.longitude,
        l.locality,
        l.admin_area,
        l.city,
        l.country,
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
      FROM producers p
      JOIN (
        SELECT DISTINCT producer_id FROM prod_fts
        UNION
        SELECT DISTINCT producer_id FROM rev_fts
      ) AS matched ON matched.producer_id = p.id
      LEFT JOIN producer_location l ON l.producer_id = p.id
      LEFT JOIN prod_fts      ON prod_fts.producer_id = p.id
      LEFT JOIN rev_fts       ON rev_fts.producer_id  = p.id
      LEFT JOIN rating_scores rs ON rs.producer_id    = p.id
      LEFT JOIN cover         co ON co.producer_id    = p.id
      LEFT JOIN certs         ce ON ce.producer_id    = p.id
      LEFT JOIN comms         cm ON cm.producer_id    = p.id
      LEFT JOIN labels        lb ON lb.producer_id    = p.id
      WHERE 1=1
      ${
        filters?.certifications && filters.certifications.length
          ? sql`
            AND EXISTS (
              SELECT 1
              FROM producer_certifications pc
              JOIN certifications c ON c.id = pc.certification_id
              WHERE pc.producer_id = p.id
                AND c.slug IN (${sql.join(
                  filters.certifications.map((s) => sql`${s}`),
                  sql`,`
                )})
            )
          `
          : sql``
      }
      -- Filter by a specific certification ID (e.g., organicCertId)
      ${
        filters?.organicOnly
          ? sql`
              AND EXISTS (
                SELECT 1
                FROM producer_certifications pc
                WHERE pc.producer_id = p.id
                  AND pc.certification_id = ${organicCertId}
              )
            `
          : sql``
      }
      -- Filter by commodities
      ${
        filters?.commodities && filters.commodities.length
          ? sql`
              AND EXISTS (
                SELECT 1
                FROM producer_commodities pc2
                JOIN commodities c2 ON c2.id = pc2.commodity_id
                WHERE pc2.producer_id = p.id
                  AND c2.slug IN (${sql.join(
                    filters.commodities.map((s) => sql`${s}`),
                    sql`,`
                  )})
              )
            `
          : sql``
      }
      -- Filter by variants
      ${
        filters?.variants && filters.variants.length
          ? sql`
              AND EXISTS (
                SELECT 1
                FROM producer_commodities pc2
                JOIN commodity_variants cv ON cv.id = pc2.variant_id
                WHERE pc2.producer_id = p.id
                  AND cv.slug IN (${sql.join(
                    filters.variants.map((s) => sql`${s}`),
                    sql`,`
                  )})
              )
            `
          : sql``
      }
      ${country ? sql`AND l.country = ${country.alpha3}` : sql``}
      ${filters?.category ? sql`AND p.type = ${filters.category}` : sql``}
      ORDER BY
        COALESCE(prod_fts.matched_terms, 0) DESC,
        COALESCE(prod_fts.prod_rel, 10.0) ASC,
        COALESCE(rev_fts.review_rel, 10.0) ASC,
        p.subscription_rank ASC,
        p.id ASC
      LIMIT ${hardLimit} OFFSET ${offset};
    `;

    const result = await db.run(textBlend);
    rows = result.rows;
  } else if (geo) {
    const bbox = "bbox" in geo ? geo.bbox : undefined;
    const radius = "radiusKm" in geo ? geo.radiusKm : undefined;

    maxDistance = approximateMaxDistanceKm({
      center: geo.center,
      method: "haversine",
      bbox,
      radiusKm: radius,
    });

    const geoOnly = sql`
      WITH
      -- inputs: either center+radius or explicit bbox
      params AS (
        SELECT
          ${geo?.center?.lat ?? null} AS lat,
          ${geo?.center?.lon ?? null} AS lon,
          ${radius ?? null}           AS R,
          ${bbox?.minLat ?? null}     AS minLatParam,
          ${bbox?.maxLat ?? null}     AS maxLatParam,
          ${bbox?.minLon ?? null}     AS minLonParam,
          ${bbox?.maxLon ?? null}     AS maxLonParam
      ),
      -- derive bbox if not passed (approx. 1 deg lat ~= 111.045 km)
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
      -- fast spatial prefilter via R*Tree
      prefilter AS (
        SELECT r.geo_id
        FROM rtree_producers r, bbox b
        WHERE r.minLon <= b.maxLon AND r.maxLon >= b.minLon
          AND r.minLat <= b.maxLat AND r.maxLat >= b.minLat
      ),
      -- compute haversine distance to center (if center provided)
      scored AS (
        SELECT
          p.id,
          p.name,
          p.summary,
          p.type,
          p.verified,
          p.user_id,
          p.subscription_rank,
          l.latitude,
          l.longitude,
          l.locality,
          l.city,
          l.admin_area,
          l.country,
          CASE
            WHEN (SELECT lat FROM bbox) IS NOT NULL AND (SELECT lon FROM bbox) IS NOT NULL THEN
              2 * 6371 * ASIN(
                SQRT(
                  POWER(SIN(((l.latitude  - (SELECT lat FROM bbox)) * 0.017453292519943295) / 2.0), 2) +
                  COS((SELECT lat FROM bbox) * 0.017453292519943295) *
                  COS(l.latitude * 0.017453292519943295) *
                  POWER(SIN(((l.longitude - (SELECT lon FROM bbox)) * 0.017453292519943295) / 2.0), 2)
                )
              )
            ELSE NULL
          END AS distance_km
        FROM prefilter pf
        JOIN producer_location l ON l.geo_id = pf.geo_id
        JOIN producers p ON p.id = l.producer_id
        WHERE 1=1
        ${country ? sql`AND l.country = ${country.alpha3}` : sql``}
        ${
          filters?.certifications && filters.certifications.length
            ? sql`
            AND EXISTS (
              SELECT 1
              FROM producer_certifications pc
              JOIN certifications c ON c.id = pc.certification_id
              WHERE pc.producer_id = p.id
                AND c.slug IN (${sql.join(
                  filters.certifications.map((s) => sql`${s}`),
                  sql`,`
                )})
            )
          `
            : sql``
        }
        -- Filter by a specific certification ID (e.g., organicCertId)
        ${
          filters?.organicOnly
            ? sql`
                AND EXISTS (
                  SELECT 1
                  FROM producer_certifications pc
                  WHERE pc.producer_id = p.id
                    AND pc.certification_id = ${organicCertId}
                )
              `
            : sql``
        }
        -- Filter by commodities
        ${
          filters?.commodities && filters.commodities.length
            ? sql`
                AND EXISTS (
                  SELECT 1
                  FROM producer_commodities pc2
                  JOIN commodities c2 ON c2.id = pc2.commodity_id
                  WHERE pc2.producer_id = p.id
                    AND c2.slug IN (${sql.join(
                      filters.commodities.map((s) => sql`${s}`),
                      sql`,`
                    )})
                )
              `
            : sql``
        }
        -- Filter by variants
        ${
          filters?.variants && filters.variants.length
            ? sql`
                AND EXISTS (
                  SELECT 1
                  FROM producer_commodities pc2
                  JOIN commodity_variants cv ON cv.id = pc2.variant_id
                  WHERE pc2.producer_id = p.id
                    AND cv.slug IN (${sql.join(
                      filters.variants.map((s) => sql`${s}`),
                      sql`,`
                    )})
                )
              `
            : sql``
        }
        ${filters?.category ? sql`AND p.type = ${filters.category}` : sql``}
      ),
      -- enforce radius if provided
      geo AS (
        SELECT *
        FROM scored
        WHERE
          ${radius != null ? sql`distance_km <= (SELECT R FROM bbox)` : sql`1=1`}
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
        SELECT pm.producer_id, MIN(ma.url) AS cover_url
        FROM producer_media pm
        JOIN media_assets ma ON ma.id = pm.asset_id
        WHERE pm.role = 'cover'
        GROUP BY pm.producer_id
      )
      SELECT
        g.id,
        g.name,
        g.type,
        g.summary,
        g.city,
        g.user_id,
        g.verified,
        g.subscription_rank,
        g.latitude,
        g.longitude,
        g.locality,
        g.admin_area,
        g.country,
        g.distance_km,
        NULL as prod_rel,
        NULL as review_rel,
        rs.avg_rating,
        rs.bayes_avg,
        co.cover_url,
        NULL as certifications_csv,
        NULL as commodities_csv,
        NULL as commodity_variants_csv,
        NULL as search_labels
      FROM geo g
      LEFT JOIN rating_scores rs ON rs.producer_id = g.id
      LEFT JOIN cover         co ON co.producer_id = g.id
      WHERE 1=1
      ${filters?.minAvgRating != null ? sql`AND rs.avg_rating  >= ${filters.minAvgRating}` : sql``}
      ${filters?.minBayesAvg != null ? sql`AND rs.bayes_avg   >= ${filters.minBayesAvg}` : sql``}
      ${filters?.minReviews != null ? sql`AND rs.n           >= ${filters.minReviews}` : sql``}
      ${filters?.hasCover === true ? sql`AND co.cover_url IS NOT NULL` : sql``}
      ${filters?.hasCover === false ? sql`AND co.cover_url IS NULL` : sql``}
      ORDER BY
        CASE WHEN g.distance_km IS NULL THEN 1 ELSE 0 END,
        g.distance_km ASC,
        g.subscription_rank ASC,
        g.id ASC
      LIMIT ${hardLimit} OFFSET ${offset};
    `;

    const result = await db.run(geoOnly);
    rows = result.rows;
  } else if (filters) {
    const filteredOnly = sql`
      WITH
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
        SELECT pm.producer_id, MIN(ma.url) AS cover_url
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
      SELECT DISTINCT
        p.id,
        p.name,
        p.type,
        p.user_id,
        p.verified,
        p.summary,
        p.subscription_rank,
        l.latitude,
        l.longitude,
        l.locality,
        l.admin_area,
        l.country,
        l.city,
        rs.n,
        rs.avg_rating,
        rs.bayes_avg,
        co.cover_url,
        ce.certifications_csv,
        cm.commodities_csv,
        cm.commodity_variants_csv,
        lb.search_labels
      FROM producers p
      JOIN producer_location l ON l.producer_id = p.id
      LEFT JOIN rating_scores rs ON rs.producer_id = p.id
      LEFT JOIN cover         co ON co.producer_id = p.id
      LEFT JOIN certs         ce ON ce.producer_id = p.id
      LEFT JOIN comms         cm ON cm.producer_id = p.id
      LEFT JOIN labels        lb ON lb.producer_id = p.id

      -- constrain by passed list filters via INNER JOINs
      ${
        filters?.certifications?.length
          ? sql`
            JOIN producer_certifications pc ON pc.producer_id = p.id
            JOIN certifications c ON c.id = pc.certification_id
            AND c.slug IN (${sql.join(
              filters.certifications.map((s) => sql`${s}`),
              sql`,`
            )})
          `
          : sql``
      }
      ${
        filters?.commodities?.length ||
        filters?.variants?.length ||
        filters?.organicOnly
          ? sql`JOIN producer_commodities pc2 ON pc2.producer_id = p.id`
          : sql``
      }
      ${
        filters?.commodities?.length
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
        filters?.variants?.length
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
      ${country ? sql`AND l.country = ${country.alpha3}` : sql``}
      ${filters?.category ? sql`AND p.type = ${filters.category}` : sql``}
      -- Filter by a specific certification ID (e.g., organicCertId)
      ${
        filters?.organicOnly
          ? sql`
              AND EXISTS (
                SELECT 1
                FROM producer_certifications pc
                WHERE pc.producer_id = p.id
                  AND pc.certification_id = ${organicCertId}
              )
            `
          : sql``
      }

      -- additional optional filters (applied only when provided)
      ${filters?.verified === true ? sql`AND p.verified = 1` : sql``}
      ${filters?.verified === false ? sql`AND p.verified = 0` : sql``}

      ${filters?.isClaimed === true ? sql`AND p.user_id IS NOT NULL` : sql``}
      ${filters?.isClaimed === false ? sql`AND p.user_id IS NULL` : sql``}

      ${filters?.locality ? sql`AND l.locality = ${filters.locality}` : sql``}
      ${filters?.adminArea ? sql`AND l.admin_area = ${filters.adminArea}` : sql``}

      ${filters?.subscriptionRankMin != null ? sql`AND p.subscription_rank >= ${filters.subscriptionRankMin}` : sql``}
      ${filters?.subscriptionRankMax != null ? sql`AND p.subscription_rank <= ${filters.subscriptionRankMax}` : sql``}

      ${filters?.minAvgRating != null ? sql`AND rs.avg_rating  >= ${filters.minAvgRating}` : sql``}
      ${filters?.minBayesAvg != null ? sql`AND rs.bayes_avg   >= ${filters.minBayesAvg}` : sql``}
      ${filters?.minReviews != null ? sql`AND rs.n           >= ${filters.minReviews}` : sql``}

      ${filters?.hasCover === true ? sql`AND co.cover_url IS NOT NULL` : sql``}
      ${filters?.hasCover === false ? sql`AND co.cover_url IS NULL` : sql``}

      ${
        filters?.ids?.length
          ? sql`AND p.id IN (${sql.join(
              filters.ids.map((s) => sql`${s}`),
              sql`,`
            )})`
          : sql``
      }
      ${
        filters?.excludeIds?.length
          ? sql`AND p.id NOT IN (${sql.join(
              filters.excludeIds.map((s) => sql`${s}`),
              sql`,`
            )})`
          : sql``
      }

      ORDER BY
        p.subscription_rank ASC,
        p.id ASC
      LIMIT ${hardLimit} OFFSET ${offset};
    `;
    const result = await db.run(filteredOnly);
    rows = result.rows;
  } else {
    const browse = sql`
      WITH
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
        SELECT pm.producer_id, MIN(ma.url) AS cover_url
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
      SELECT DISTINCT
        p.id,
        p.name,
        p.type,
        p.user_id,
        p.verified,
        p.summary,
        p.subscription_rank,
        l.latitude,
        l.longitude,
        l.locality,
        l.city,
        l.admin_area,
        l.country,
        rs.n,
        rs.avg_rating,
        rs.bayes_avg,
        co.cover_url,
        ce.certifications_csv,
        cm.commodities_csv,
        cm.commodity_variants_csv,
        lb.search_labels
      FROM producers p
      JOIN producer_location l ON l.producer_id = p.id
      LEFT JOIN rating_scores rs ON rs.producer_id = p.id
      LEFT JOIN cover         co ON co.producer_id = p.id
      LEFT JOIN certs         ce ON ce.producer_id = p.id
      LEFT JOIN comms         cm ON cm.producer_id = p.id
      LEFT JOIN labels        lb ON lb.producer_id = p.id

      WHERE 1=1
      ${country ? sql`AND l.country = ${country.alpha3}` : sql``}

      ORDER BY
        p.subscription_rank ASC,
        p.id ASC
      LIMIT ${hardLimit} OFFSET ${offset};
    `;

    const result = await db.run(browse);
    rows = result.rows;
  }

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: items.map((item) => ({
      id: item["id"] as string,
      name: item["name"] as string,
      type: item["type"] as ProducerTypes,
      summary: item["summary"] as string | null,
      isClaimed: item["user_id"] !== null,
      verified: Boolean(item["verified"]),
      latitude: item["latitude"] as number,
      longitude: item["longitude"] as number,
      locality: item["locality"] as string | null,
      adminArea: item["admin_area"] as string | null,
      country: item["country"] as string | null,
      city: item["city"] as string | null,
      distanceKm: item["distance_km"] as number,
      prodRel: item["prod_rel"] as number,
      reviewRel: item["review_rel"] as number,
      avgRating: item["avg_rating"] as number | null,
      bayesAvg: item["bayes_avg"] as number | null,
      thumbnailUrl: item["cover_url"] as string | null,
      certificationsCsv: item["certifications_csv"] as string | null,
      commoditiesCsv: item["commodities_csv"] as string | null,
      commodityVariantsCsv: item["commodity_variants_csv"] as string | null,
      searchLabels: item["search_labels"] as string | null,
    })),
    count: items.length,
    page: offset / limit,
    limit,
    offset: offset,
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
    maxDistance: maxDistance?.maxDistanceKm ?? null,
  };
}

export type ProducerSearchResultRow = {
  id: string;
  name: string;
  type: ProducerTypes;
  isClaimed: boolean;
  summary: string | null;
  verified: boolean;
  latitude: number;
  longitude: number;
  locality: string | null;
  city: string | null;
  adminArea: string | null;
  country: string | null;
  distanceKm: number;
  prodRel: number;
  reviewRel: number;
  avgRating: number | null;
  bayesAvg: number | null;
  thumbnailUrl: string | null;
  certificationsCsv: string | null;
  commoditiesCsv: string | null;
  commodityVariantsCsv: string | null;
  searchLabels: string | null;
};

export type ProducerSearchResult = {
  items: ProducerSearchResultRow[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextOffset: number | null;
  maxDistance: number | null;
  offset: number;
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
