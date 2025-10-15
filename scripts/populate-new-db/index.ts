import { db } from "@/backend/db";
import * as oldSchema from "@/backend/db/schema";
import * as newSchema from "./db/schema";
import {
  desc,
  eq,
  and,
  type ExtractTablesWithRelations,
  isNull,
} from "drizzle-orm";
import { client, newDb } from "./db";
import geohash from "ngeohash";
import { parse } from "date-fns";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";

function slugify(s: string) {
  return encodeURIComponent(
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  );
}

function minutesSinceMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function parseTimeLoose(t: string) {
  // tries 'p' (locale time like 9:00 PM). If parse fails, returns null.
  try {
    const dt = parse(t.trim(), "p", new Date());
    if (isNaN(dt.getTime())) return null;
    return dt;
  } catch {
    return null;
  }
}

// returns [openMin, closeMin, overnightFlag]
function toMinutesRange(
  openStr: string,
  closeStr: string
): { openMin: number; closeMin: number; overnight: boolean } | null {
  const start = parseTimeLoose(openStr);
  const end = parseTimeLoose(closeStr);
  if (!start || !end) return null;
  const openMin = minutesSinceMidnight(start);
  let closeMin = minutesSinceMidnight(end);
  let overnight = false;
  if (closeMin <= openMin) {
    // wraps past midnight; represent as openMin..(closeMin + 1440) and let app handle wrap if needed
    closeMin += 24 * 60;
    overnight = true;
  }
  return { openMin, closeMin, overnight };
}

async function getOrCreateCommodity(
  tx: SQLiteTransaction<
    "async",
    any,
    typeof newSchema,
    ExtractTablesWithRelations<typeof newSchema>
  >,
  name: string
) {
  const slug = slugify(name);
  const existing = await tx
    .select({ id: newSchema.commodities.id })
    .from(newSchema.commodities)
    .where(eq(newSchema.commodities.slug, slug));
  if (existing.length) return existing[0].id;

  const inserted = await tx
    .insert(newSchema.commodities)
    .values({
      slug,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: newSchema.commodities.id });
  return inserted[0].id;
}

async function getOrCreateVariant(
  tx: SQLiteTransaction<
    "async",
    any,
    typeof newSchema,
    ExtractTablesWithRelations<typeof newSchema>
  >,
  commodityId: number,
  name: string
) {
  const slug = slugify(name);
  const existing = await tx
    .select({ id: newSchema.commodityVariants.id })
    .from(newSchema.commodityVariants)
    .where(
      and(
        eq(newSchema.commodityVariants.commodityId, commodityId),
        eq(newSchema.commodityVariants.slug, slug)
      )
    );
  if (existing.length) return existing[0].id;

  const inserted = await tx
    .insert(newSchema.commodityVariants)
    .values({
      commodityId,
      slug,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    })
    .returning({ id: newSchema.commodityVariants.id });
  return inserted[0].id;
}

function safeGeohash(lat?: number | null, lon?: number | null, precision = 9) {
  if (typeof lat === "number" && typeof lon === "number") {
    return geohash.encode(lat, lon, precision);
  }
  return null;
}

function collectSearchLabels(
  baseLabels: string[],
  commodities: Array<{ slug: string; variants?: string[] }>
) {
  const set = new Set<string>(baseLabels.map(slugify));
  for (const c of commodities) {
    set.add(slugify(c.slug));
    for (const v of c.variants ?? [])
      set.add(`${slugify(c.slug)}:${slugify(v)}`);
  }
  return Array.from(set).join(",");
}

function ratingBadgesFromAvg(avg: number | null): string[] {
  if (avg == null) return [];
  const tags = ["has_reviews"];
  if (avg >= 4.5) tags.push("rating_4_5_plus");
  else if (avg >= 4.0) tags.push("rating_4_plus");
  else if (avg >= 3.5) tags.push("rating_3_5_plus");
  return tags;
}

export async function main() {
  let page = 132;
  const limit = 150;
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  while (true) {
    const offset = page * limit;

    const items = await db.query.producers.findMany({
      orderBy: desc(oldSchema.producers.createdAt),
      limit: limit,
      offset: offset,
      where: isNull(oldSchema.producers.userId),
      with: {
        certificationsToProducers: {
          with: { certification: true },
        },
      },
    });

    if (items.length === 0) {
      break;
    }

    console.log("Processing page: ", page, "items:", items.length);

    await newDb.transaction(async (tx) => {
      for (const item of items) {
        const importedReviews = await db.query.importedReviews.findMany({
          where: eq(oldSchema.importedReviews.producerId, item.id),
        });

        await tx.insert(newSchema.producers).values({
          id: item.id,
          name: item.name,
          type: item.type,
          verified: item.verified,
          summary: item.about ? String(item.about).slice(0, 240) : null,
          about: item.about,
          subscriptionRank: 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });

        if (importedReviews.length > 0) {
          console.log(importedReviews[0]);
          await tx.insert(newSchema.producerImportedReviews).values(
            importedReviews.map((r) => ({
              id: r.id,
              producerId: item.id,
              rating: r.rating,
              data: r.data,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
            }))
          );
        }

        const reviewBodies = importedReviews.map((r) => ({
          body: r.data.text.text.trim(),
          srcId: r.id,
        }));

        if (reviewBodies.length) {
          await tx.insert(newSchema.reviewsContent).values(
            reviewBodies.map(({ body, srcId }) => ({
              // docid: auto (INTEGER PRIMARY KEY)
              producerId: item.id,
              body: body,
              importedReviewId: srcId,
            }))
          );
        }

        let ratingBadges: string[] = [];
        if (importedReviews.length) {
          const agg = await tx
            .select({
              n: newSchema.producerRatingAgg.reviewCount,
              sum: newSchema.producerRatingAgg.ratingSum,
            })
            .from(newSchema.producerRatingAgg)
            .where(eq(newSchema.producerRatingAgg.producerId, item.id));

          if (agg.length && agg[0].n > 0) {
            const avg = Number(agg[0].sum) / Number(agg[0].n);
            ratingBadges = ratingBadgesFromAvg(isFinite(avg) ? avg : null);
          }
        }

        const mediaAssetRows = Array.isArray(item.images.items)
          ? item.images.items.map(
              (img) =>
                ({
                  id: crypto.randomUUID(),
                  uploadedByType: "system",
                  origin: "system_seed",
                  storage: "cloudflare",
                  contentType: "image/*",
                  cloudflareId: img.cloudflareId,
                  url: img.cloudflareUrl,
                  alt: img.alt,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }) satisfies newSchema.MediaAssetInsert
            )
          : [];

        if (mediaAssetRows.length > 0) {
          await tx.insert(newSchema.mediaAssets).values(mediaAssetRows);

          await tx.insert(newSchema.producerMedia).values(
            mediaAssetRows.map(
              (mediaAssetRow, i) =>
                ({
                  producerId: item.id,
                  assetId: mediaAssetRow.id,
                  role:
                    item.images.primaryImgId &&
                    item.images.primaryImgId === mediaAssetRow.cloudflareId
                      ? "cover"
                      : "gallery",
                  position: (i + 1) * 65536,
                  caption: mediaAssetRow.alt ?? null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }) satisfies newSchema.ProducerMediaInsert
            )
          );
        }

        await tx.insert(newSchema.producerSocial).values({
          producerId: item.id,
          instagram: item.socialMedia.instagram,
          facebook: item.socialMedia.facebook,
          twitter: item.socialMedia.twitter,
        });

        await tx.insert(newSchema.producerContact).values({
          producerId: item.id,
          email: item.contact?.email,
          phone: item.contact?.phone,
          websiteUrl: item.contact?.website,
        });

        const lat = item.address?.coordinate?.latitude ?? null;
        const lon = item.address?.coordinate?.longitude ?? null;

        await tx.insert(newSchema.producerLocation).values({
          producerId: item.id,
          latitude: lat,
          longitude: lon,
          locality: item.address?.street,
          city: item.address?.city,
          adminArea: item.address?.state,
          postcode: item.address?.zip,
          country: item.address?.country,
          geohash: safeGeohash(lat ?? undefined, lon ?? undefined) ?? null,
        });

        if (item.scrapeMeta !== null) {
          const meta =
            typeof item.scrapeMeta === "string"
              ? JSON.parse(item.scrapeMeta)
              : item.scrapeMeta;
          await tx.insert(newSchema.producersScrapeMeta).values({
            producerId: item.id,
            type: meta._metaType,
            meta: meta,
          });
        }

        if (item.hours) {
          const hourRows: Array<newSchema.ProducerHoursInsert> = [];

          for (const [day, info] of Object.entries(item.hours)) {
            if (!info || typeof info.open !== "string") continue;
            if (String(info.open).toLowerCase() === "closed") continue;

            const parts = String(info.open).split("-");
            if (parts.length !== 2) continue;

            const range = toMinutesRange(parts[0], parts[1]);
            if (!range) continue;

            hourRows.push({
              producerId: item.id,
              weekday: Math.max(0, days.indexOf(day)), // 0=Mon..6=Sun
              openMin: range.openMin,
              closeMin: range.closeMin,
            });
          }
          if (hourRows.length) {
            await tx.insert(newSchema.producerHours).values(hourRows);
          }
        }

        if (item.googleMapsPlaceDetails) {
          await tx.insert(newSchema.producersGoogleMapsPlaceDetails).values({
            producerId: item.id,
            placeName: item.googleMapsPlaceDetails.name,
            placeId: item.googleMapsPlaceDetails.id,
            mapsUri: item.googleMapsPlaceDetails.googleMapsUri,
            businessStatus: item.googleMapsPlaceDetails.businessStatus,
            types: item.googleMapsPlaceDetails.types,
            rating: item.googleMapsPlaceDetails.rating,
          });
        }

        const commodityDefs = item.commodities ?? [];
        const labelCommodities: Array<{ slug: string; variants?: string[] }> =
          [];
        for (const c of commodityDefs) {
          const commName = c.name;
          if (!commName) continue;

          const commodityId = await getOrCreateCommodity(tx, commName);
          const variants = Array.isArray(c.varieties) ? c.varieties : [];

          if (variants.length) {
            for (const v of variants) {
              const variantId = await getOrCreateVariant(tx, commodityId, v);
              // link producer -> commodity+variant (idempotent)
              await tx
                .insert(newSchema.producerCommodities)
                .values({
                  producerId: item.id,
                  commodityId,
                  variantId,
                  organic: item.certificationsToProducers?.some((p) =>
                    p.certification.name
                      .toLowerCase()
                      .trim()
                      .includes("organic")
                  ),
                  updatedAt: new Date(),
                } satisfies newSchema.ProducerCommodityInsert)
                .onConflictDoNothing();
            }
          } else {
            await tx
              .insert(newSchema.producerCommodities)
              .values({
                producerId: item.id,
                commodityId,
                variantId: null,
                updatedAt: new Date(),
              } satisfies newSchema.ProducerCommodityInsert)
              .onConflictDoNothing();
          }

          labelCommodities.push({
            slug: slugify(commName),
            variants: variants.map(slugify),
          });
        }

        const certRows = item.certificationsToProducers.map(
          (c) => c.certification
        );

        const certLabelSlugs: string[] = [];

        for (const c of certRows) {
          const slug = slugify(c.name);

          // Upsert into certifications
          await tx
            .insert(newSchema.certifications)
            .values({
              id: c.id, // reuse source id
              slug,
              name: c.name,
              isVerified: c.isVerified,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
            })
            .onConflictDoUpdate({
              target: newSchema.certifications.id,
              set: {
                slug,
                name: c.name,
                isVerified: c.isVerified,
                updatedAt: new Date(c.updatedAt),
              },
            });

          // Link producer -> certification
          await tx
            .insert(newSchema.producerCertifications)
            .values({
              producerId: item.id,
              certificationId: c.id,
              addedAt: new Date(),
            })
            .onConflictDoNothing();

          // Collect labels for search (namespace them)
          certLabelSlugs.push(`cert:${slug}`);
          if (c.isVerified) certLabelSlugs.push(`cert_verified:${slug}`);
        }

        const baseLabels: string[] = [];
        if (item.verified) baseLabels.push("verified");

        baseLabels.push(...certLabelSlugs);
        baseLabels.push(...ratingBadges);

        const searchLabels = collectSearchLabels(baseLabels, labelCommodities);

        const searchName = item.name?.toLowerCase?.() ?? null;
        const searchSummary = (
          item.about ? String(item.about) : ""
        ).toLowerCase();

        await tx
          .insert(newSchema.producersSearch)
          .values({
            producerId: item.id,
            searchName,
            searchSummary: searchSummary ? searchSummary.slice(0, 240) : null,
            searchLabels: searchLabels || null,
          })
          .onConflictDoUpdate({
            target: newSchema.producersSearch.producerId,
            set: {
              searchName,
              searchSummary: searchSummary ? searchSummary.slice(0, 240) : null,
              searchLabels: searchLabels || null,
            },
          });
      }
    });

    page++;
  }
}

async function fixLabels() {
  const backfillSQL = `
WITH
  comm AS (
    SELECT
      pc.producer_id,
      'commodity:' || c.slug                           AS lbl1,
      CASE WHEN cv.id IS NOT NULL
           THEN 'commodity:' || c.slug || ':' || cv.slug
           ELSE NULL END                               AS lbl2
    FROM producer_commodities pc
    JOIN commodities c ON c.id = pc.commodity_id
    LEFT JOIN commodity_variants cv ON cv.id = pc.variant_id
  ),
  comm_agg AS (
    SELECT producer_id,
           GROUP_CONCAT(DISTINCT lbl1) AS l1,
           GROUP_CONCAT(DISTINCT lbl2) AS l2
    FROM comm
    GROUP BY producer_id
  ),
  cert AS (
    SELECT
      pc.producer_id,
      'cert:' || c.slug                  AS c1,
      CASE WHEN c.is_verified=1
           THEN 'cert_verified:' || c.slug
           ELSE NULL END                AS c2
    FROM producer_certifications pc
    JOIN certifications c ON c.id = pc.certification_id
  ),
  cert_agg AS (
    SELECT producer_id,
           GROUP_CONCAT(DISTINCT c1) AS c1,
           GROUP_CONCAT(DISTINCT c2) AS c2
    FROM cert
    GROUP BY producer_id
  ),
  rate AS (
    SELECT
      r.producer_id,
      CASE WHEN r.review_count > 0 THEN 'has_reviews' END AS has_reviews,
      CASE
        WHEN r.review_count > 0 AND (r.rating_sum * 1.0 / r.review_count) >= 4.5 THEN 'rating_4_5_plus'
        WHEN r.review_count > 0 AND (r.rating_sum * 1.0 / r.review_count) >= 4.0 THEN 'rating_4_plus'
        WHEN r.review_count > 0 AND (r.rating_sum * 1.0 / r.review_count) >= 3.5 THEN 'rating_3_5_plus'
      END AS bucket
    FROM producer_rating_agg r
  ),
  rate_agg AS (
    SELECT producer_id,
           GROUP_CONCAT(DISTINCT has_reviews) AS r1,
           GROUP_CONCAT(DISTINCT bucket)      AS r2
    FROM rate
    GROUP BY producer_id
  ),
  base AS (
    SELECT id AS producer_id,
           CASE WHEN verified=1 THEN 'verified' END AS base1
    FROM producers
  ),
  labels AS (
    SELECT
      p.id AS producer_id,
      TRIM(
        COALESCE(b.base1,'') || ',' ||
        COALESCE(ca.c1,'')   || ',' ||
        COALESCE(ca.c2,'')   || ',' ||
        COALESCE(ra.r1,'')   || ',' ||
        COALESCE(ra.r2,'')   || ',' ||
        COALESCE(co.l1,'')   || ',' ||
        COALESCE(co.l2,'')
      , ',') AS csv
    FROM producers p
    LEFT JOIN base      b  ON b.producer_id = p.id
    LEFT JOIN cert_agg  ca ON ca.producer_id = p.id
    LEFT JOIN rate_agg  ra ON ra.producer_id = p.id
    LEFT JOIN comm_agg  co ON co.producer_id = p.id
  )
  UPDATE producers_search AS s
  SET search_labels = (SELECT csv FROM labels WHERE producer_id = s.producer_id);
`;

  const result = await client.execute(backfillSQL);
  console.log(result);
}

fixLabels();
