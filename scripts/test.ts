import { initTools } from "@/backend/llm/tools";
import {
  convertToModelMessages,
  generateObject,
  generateText,
  ModelMessage,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import z from "zod";
import { SQL, sql } from "drizzle-orm";
import { SearchByGeoTextArgs } from "@/backend/validators/producers";
import { SQLiteAsyncDialect } from "drizzle-orm/sqlite-core";
import { client, db } from "@/backend/db";
import { serialize, plainToInstance, instanceToPlain } from "class-transformer";

async function main() {
  // const prompt = process.argv[2];
  // console.log(prompt);
  // const {
  //   object: { hasLocationSnippet },
  // } = await generateObject({
  //   model: openai("gpt-4o-mini"),
  //   schema: z.object({ hasLocationSnippet: z.boolean() }),
  //   prompt: prompt,
  //   system: "Check if input contains a location snippet",
  // });
  // if (hasLocationSnippet === true) {
  //   const tools = initTools({ search_by_geo_text: { limit: 50, offset: 0 } });
  //   const result = await generateText({
  //     model: openai("gpt-4o-mini"),
  //     prompt: prompt,
  //     tools,
  //     stopWhen: stepCountIs(2),
  //     prepareStep: async ({ stepNumber }) => {
  //       if (stepNumber === 0) {
  //         return {
  //           toolChoice: { type: "tool", toolName: "geocode_place" },
  //           activeTools: ["geocode_place"],
  //         };
  //       } else if (stepNumber === 1) {
  //         return {
  //           toolChoice: { type: "tool", toolName: "search_by_geo_text" },
  //           activeTools: ["search_by_geo_text"],
  //         };
  //       }
  //     },
  //     toolChoice: "required",
  //     system: `Extract partial of full location snippet from input and call the 'geocode_place' tool.
  //       Finally call the 'search_by_geo_text' tool, use the provided tool to find farms, ranches, and restaurants.
  //       Always pass bounding box if geocode_place was used.
  //       Always pass country hint if geocode_place contains a country.
  //       Extract filters from query when possible, only pass q when filters are extracted and parts remain.
  //       Only pass commodities filter when looking for farms and the query contains specific products.`,
  //   });
  //   const item = result.toolResults[result.toolResults.length - 1];
  //   console.log(item);
  // } else {
  //   const tools = initTools({
  //     search_by_geo_text: { limit: 50, offset: 0, geo: undefined },
  //   });
  //   const result = await generateText({
  //     model: openai("gpt-4o-mini"),
  //     prompt: prompt,
  //     tools,
  //     activeTools: ["search_by_geo_text"],
  //     toolChoice: "required",
  //     system: `Call the 'search_by_geo_text' tool, use the provided tool to find farms, ranches, and restaurants.
  //       Extract filters from query when possible, only pass q when filters are extracted and parts remain.
  //       Only pass commodities filter when looking for farms and the query contains specific products.`,
  //   });
  //   const item = result.toolResults[result.toolResults.length - 1];
  //   console.log(item);
  // }
  // const params: SearchByGeoTextArgs = {
  //   mode: "query",
  //   q: "Restaurants",
  //   filters: { category: "eatery" },
  //   limit: 50,
  //   offset: 0,
  // };
  // const bbox = {
  //   minLat: 40.476578,
  //   maxLat: 40.91763,
  //   minLon: -74.258843,
  //   maxLon: -73.700233,
  // };
  // const q = params.q ?? "";
  // const filters = params.filters;
  // const center = { lat: "40.7127281", lon: "-74.0060152" };
  // const radius = undefined;
  // const country = undefined;
  // const textBlend = sql`
  //         WITH
  //         -- center + radius or explicit bbox input
  //         params AS (
  //           SELECT
  //             ${center.lat ?? null} AS lat,
  //             ${center.lon ?? null} AS lon,
  //             ${radius ?? null} AS R,
  //             ${bbox?.minLat ?? null} AS minLatParam,
  //             ${bbox?.maxLat ?? null} AS maxLatParam,
  //             ${bbox?.minLon ?? null} AS minLonParam,
  //             ${bbox?.maxLon ?? null} AS maxLonParam
  //         ),
  //         -- derive bbox if not passed in
  //         bbox AS (
  //           SELECT
  //             COALESCE(minLatParam, lat - (R/111.045)) AS minLat,
  //             COALESCE(maxLatParam, lat + (R/111.045)) AS maxLat,
  //             COALESCE(
  //               minLonParam,
  //               lon - (R/(111.045 * COS(lat * 0.017453292519943295)))
  //             ) AS minLon,
  //             COALESCE(
  //               maxLonParam,
  //               lon + (R/(111.045 * COS(lat * 0.017453292519943295)))
  //             ) AS maxLon,
  //             lat,
  //             lon,
  //             R
  //           FROM params
  //         ),
  //         prefilter AS (
  //           SELECT r.geo_id
  //           FROM rtree_producers r, bbox b
  //           WHERE r.minLon <= b.maxLon AND r.maxLon >= b.minLon
  //             AND r.minLat <= b.maxLat AND r.maxLat >= b.minLat
  //         ),
  //         scored AS (
  //           SELECT
  //             p.id,
  //             p.name,
  //             p.type,
  //             p.verified,
  //             p.user_id,
  //             p.subscription_rank,
  //             l.latitude,
  //             l.longitude,
  //             l.locality,
  //             l.admin_area,
  //             l.country,
  //             2 * 6371 * ASIN(
  //               SQRT(
  //                 POWER(SIN(((l.latitude  - (SELECT lat FROM bbox)) * 0.017453292519943295) / 2.0), 2) +
  //                 COS((SELECT lat FROM bbox) * 0.017453292519943295) *
  //                 COS(l.latitude * 0.017453292519943295) *
  //                 POWER(SIN(((l.longitude - (SELECT lon FROM bbox)) * 0.017453292519943295) / 2.0), 2)
  //               )
  //             ) AS distance_km
  //           FROM prefilter pf
  //           JOIN producer_location l ON l.geo_id = pf.geo_id
  //           JOIN producers p ON p.id = l.producer_id
  //           WHERE 1=1
  //           ${country ? sql`AND l.country = ${country.alpha3}` : sql``}
  //         ),
  //         geo AS (
  //           SELECT *
  //           FROM scored
  //           WHERE 1=1
  //           ${
  //             bbox
  //               ? sql``
  //               : sql`AND (SELECT R FROM bbox) IS NULL OR distance_km <= (SELECT R FROM bbox)`
  //           }
  //         ),
  //         prod_fts AS (
  //           SELECT s.producer_id, bm25(producers_fts) AS prod_rel
  //           FROM producers_search s
  //           JOIN producers_fts ON producers_fts.rowid = s.rowid
  //           WHERE producers_fts MATCH ${q.trim()}
  //         ),
  //         rev_fts AS (
  //           SELECT t.producer_id, MIN(t.rank) AS review_rel
  //           FROM (
  //             SELECT rc.producer_id, reviews_fts.rank AS rank
  //             FROM reviews_fts
  //             JOIN reviews_content rc ON rc.docid = reviews_fts.rowid
  //             WHERE reviews_fts MATCH ${q.trim()}
  //           ) AS t
  //           GROUP BY t.producer_id
  //         ),
  //         rating_scores AS (
  //           SELECT
  //             pra.producer_id,
  //             pra.review_count AS n,
  //             CASE WHEN pra.review_count > 0
  //                 THEN pra.rating_sum * 1.0 / pra.review_count
  //                 ELSE NULL END AS avg_rating,
  //             (pra.rating_sum + 10 * 4.2) * 1.0 / (pra.review_count + 10) AS bayes_avg
  //           FROM producer_rating_agg pra
  //         ),
  //         cover AS (
  //           SELECT pm.producer_id, ma.url AS cover_url
  //           FROM producer_media pm
  //           JOIN media_assets ma ON ma.id = pm.asset_id
  //           WHERE pm.role = 'cover'
  //           GROUP BY pm.producer_id
  //         ),
  //         certs AS (
  //           SELECT pc.producer_id, GROUP_CONCAT(DISTINCT c.slug) AS certifications_csv
  //           FROM producer_certifications pc
  //           JOIN certifications c ON c.id = pc.certification_id
  //           GROUP BY pc.producer_id
  //         ),
  //         comms AS (
  //           SELECT pc2.producer_id,
  //                 GROUP_CONCAT(DISTINCT c2.slug) AS commodities_csv,
  //                 GROUP_CONCAT(DISTINCT CASE WHEN cv.id IS NOT NULL THEN c2.slug || ':' || cv.slug END) AS commodity_variants_csv
  //           FROM producer_commodities pc2
  //           JOIN commodities c2 ON c2.id = pc2.commodity_id
  //           LEFT JOIN commodity_variants cv ON cv.id = pc2.variant_id
  //           GROUP BY pc2.producer_id
  //         ),
  //         labels AS (
  //           SELECT s.producer_id, s.search_labels
  //           FROM producers_search s
  //         )
  //         SELECT
  //           g.id,
  //           g.name,
  //           g.type,
  //           g.user_id,
  //           g.verified,
  //           g.subscription_rank,
  //           g.latitude,
  //           g.longitude,
  //           g.locality,
  //           g.admin_area,
  //           g.country,
  //           g.distance_km,
  //           COALESCE(prod_fts.prod_rel, 10.0)  AS prod_rel,
  //           COALESCE(rev_fts.review_rel, 10.0) AS review_rel,
  //           rs.n,
  //           rs.avg_rating,
  //           rs.bayes_avg,
  //           co.cover_url,
  //           ce.certifications_csv,
  //           cm.commodities_csv,
  //           cm.commodity_variants_csv,
  //           lb.search_labels
  //         FROM geo g
  //         LEFT JOIN prod_fts      ON prod_fts.producer_id = g.id
  //         LEFT JOIN rev_fts       ON rev_fts.producer_id  = g.id
  //         LEFT JOIN rating_scores rs ON rs.producer_id    = g.id
  //         LEFT JOIN cover         co ON co.producer_id    = g.id
  //         LEFT JOIN certs         ce ON ce.producer_id    = g.id
  //         LEFT JOIN comms         cm ON cm.producer_id    = g.id
  //         LEFT JOIN labels        lb ON lb.producer_id    = g.id
  //         ${
  //           filters?.certifications && filters.certifications.length
  //             ? sql`
  //           JOIN producer_certifications pc ON pc.producer_id = g.id
  //           JOIN certifications c ON c.id = pc.certification_id
  //             AND c.slug IN (${sql.join(
  //               filters.certifications.map((s) => sql`${s}`),
  //               sql`,`
  //             )})
  //         `
  //             : sql``
  //         }
  //         ${
  //           (filters?.commodities && filters.commodities.length) ||
  //           (filters?.variants && filters.variants.length) ||
  //           filters?.organicOnly
  //             ? sql`
  //           JOIN producer_commodities pc2 ON pc2.producer_id = g.id
  //         `
  //             : sql``
  //         }
  //         ${
  //           filters?.commodities && filters.commodities.length
  //             ? sql`
  //           JOIN commodities c2 ON c2.id = pc2.commodity_id
  //             AND c2.slug IN (${sql.join(
  //               filters.commodities.map((s) => sql`${s}`),
  //               sql`,`
  //             )})
  //         `
  //             : sql``
  //         }
  //         ${
  //           filters?.variants && filters.variants.length
  //             ? sql`
  //           JOIN commodity_variants cv ON cv.id = pc2.variant_id
  //             AND cv.slug IN (${sql.join(
  //               filters.variants.map((s) => sql`${s}`),
  //               sql`,`
  //             )})
  //         `
  //             : sql``
  //         }
  //         WHERE 1=1
  //         ${filters?.category ? sql`AND g.type = ${filters.category}` : sql``}
  //         ${filters?.organicOnly ? sql`AND pc2.organic = 1` : sql``}
  //         ORDER BY
  //          g.distance_km ASC,
  //           COALESCE(prod_fts.prod_rel, 10.0) ASC,
  //           COALESCE(rev_fts.review_rel, 10.0) ASC,
  //           g.id ASC
  //         LIMIT ${50} OFFSET ${0};
  //         `;
  // const dialect = new SQLiteAsyncDialect();
  // const value = dialect.sqlToQuery(textBlend);
  // console.log(value);
  // console.log(await db.$client.execute(value));
}

main();
