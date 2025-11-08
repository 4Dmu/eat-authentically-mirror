"use server";
import * as listing from "@/backend/data/producer";
import {
  getProducersArgsValidator,
  claimProducerArgs,
  checkClaimDomainDnsArgs,
  PublicClaimRequest,
  deleteProducerArgs,
  verifyClaimPhoneArgs,
  regenerateClaimPhoneTokenArgs,
  suggestProducerArgs,
  searchByGeoTextArgsValidator,
  listProducersArgsValidator,
  editProducerArgsValidatorV2,
  searchProducersArgsValidator,
  QueryFilters,
  ProducerTypes,
  editProducerContactArgsValidator,
  editProducerLocationArgsValidator,
  editProducerCertificationsArgsValidator,
  editProducerCommodotiesArgsValidator,
  addCommodityAndAssociateArgsValidator,
} from "@ea/validators/producers";
import { actionClient } from "./helpers/safe-action";
import { producerActionClient } from "./helpers/middleware";
import { db } from "@ea/db";
import {
  claimRequests,
  commodities,
  mediaAssets,
  PendingMediaAssetInsert,
  pendingMediaAssets,
  producerCards,
  producerCertifications,
  producerCommodities,
  producerContact,
  ProducerContactSelect,
  ProducerInsert,
  producerLocation,
  ProducerLocationSelect,
  producerMedia,
  producers,
  ProducerSelect,
  producersSearch,
  ProducersSearchSelect,
  SuggestedProducerInsert,
  suggestedProducers,
} from "@ea/db/schema";
import {
  and,
  ne,
  count,
  eq,
  inArray,
  isNull,
  notInArray,
  sql,
  isNotNull,
  asc,
} from "drizzle-orm";
import { type } from "arktype";
import { getSubTier } from "./utils/get-sub-tier";
import { env } from "@/env";
import { cloudflare } from "../lib/cloudflare";
import {
  allow100RequestPer30Min,
  allow10RequestPer30Minutes,
  allow25RequestPer30Min,
  claimProducerRateLimit,
  geocodeRatelimit,
  producerClaimDnsCheckRatelimit,
  producerClaimVerifyPhoneRatelimit,
  suggestProducerFreeLimit,
  suggestProducerProLimit,
  videoRatelimit,
} from "../lib/rate-limit";
import { authenticatedActionClient } from "./helpers/middleware";
import { registerProducerArgsValidator } from "@ea/validators/producers";
import isURL from "validator/es/lib/isURL";
import { resend } from "../lib/resend";
import ClaimListingEmail from "@/components/emails/claim-listing-email";
import { generateCode, generateToken } from "../utils/generate-tokens";
import { getDnsRecords } from "@layered/dns-records";
import { CLAIM_DNS_TXT_RECORD_NAME, RATELIMIT_ALL } from "@ea/shared/constants";
import {
  COMMODITIES_CACHE,
  COMMODITY_VARIANTS_CACHE,
  PRODUCER_COUNTRIES_CACHE,
  SEARCH_BY_GEO_TEXT_QUERIES_CACHE,
  USER_PRODUCER_IDS_KV,
} from "../kv";
import ManualClaimListingEmail from "@/components/emails/manual-claim-listing-email";
import SocialClaimListingInternalEmail from "@/components/emails/internal/social-claim-listing-email";
import crypto from "node:crypto";
import { sendClaimCodeMessage } from "./helpers/sms";
import { isMobilePhone, isNumeric } from "validator";
import { addMinutes, isAfter, isBefore } from "date-fns";
import { tryCatch } from "@/utils/try-catch";
import { geocode } from "../lib/google-maps";
import { logger } from "../lib/log";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import {
  mediaAssetSelectValidator,
  producerMediaSelectValidator,
} from "@ea/db/contracts";
import np from "compromise";
import ngeo from "ngeohash";
import { geocodePlace } from "./utils/geocode";
import { getIpGeo } from "./utils/get-ip-geo";

const LOCAL_INTENT_RE =
  /\b(near\s*me|around\s*me|close\s*by|nearby|in\s*my\s*area)\b/i;

const RE_ORGANIC = /\b(organic)\b/i;

type FindCategoryResult = {
  category: ProducerTypes | undefined;
  query: string;
};

function findCategory(query: string): FindCategoryResult {
  const aliases = {
    farm: ["farm", "farms"],
    ranch: ["ranch", "ranches"],
    eatery: ["eatery", "restaurant", "restaurants"],
  };

  const exceptions = [
    "farm to table",
    "farm-to-table",
    "farm to-table",
    "farm-to table",
    "farmers market",
    "farm to fork",
    "farm shop",
  ];

  const queryLower = query.toLowerCase();
  let safeQuery = queryLower;

  for (const phrase of exceptions) {
    const regex = new RegExp(phrase, "gi");
    safeQuery = safeQuery.replace(regex, " "); // replace with space to preserve separation
  }

  for (const [canonical, words] of Object.entries(aliases)) {
    for (const word of words) {
      // Match as a whole word
      const regex = new RegExp(`\\b${word}\\b`, "ig");
      if (regex.test(safeQuery)) {
        return {
          category: canonical as ProducerTypes,
          query: query.replaceAll(regex, ""),
        };
      }
    }
  }

  return { category: undefined, query: query }; // No match found
}

function extractLocationInfo(query: string) {
  let newQuery = query;
  const localIntent = LOCAL_INTENT_RE.test(query);

  if (localIntent) {
    newQuery = query.replace(LOCAL_INTENT_RE, "");
  }

  const doc = np(query);
  const places = doc.places();
  const custom = doc.match("(florence|Florence)");
  const results = (
    places.concat(custom).unique().sort("chron").json() as { text: string }[]
  ).map((r) => r.text);
  const placeName = results.length > 0 ? results.join(",") : undefined;
  console.log(query, placeName);

  if (placeName) {
    newQuery = newQuery.replace(placeName, "");
  }

  return { placeName, localIntent, query: newQuery.trim() };
}
function findCommodities(query: string, commodities: string[]) {
  if (commodities.length == 0) {
    return [];
  }
  const commoditiesRegex = new RegExp(
    "\\b(" +
      commodities
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|") +
      ")\\b",
    "g"
  );
  const matches = query.match(commoditiesRegex);
  if (!matches) return [];
  // Find *all* matches (not just first)
  return Array.from(query.matchAll(commoditiesRegex), (m) =>
    m[1].toLowerCase().trim()
  ).filter((r) => r.length > 0);
}

async function extractFilters(
  rawQuery: string
): Promise<{ filters: QueryFilters; query: string }> {
  const { category, query } = findCategory(rawQuery);
  const commodities = await COMMODITIES_CACHE.get();
  const variants = await COMMODITY_VARIANTS_CACHE.get();
  const includedCommodities = findCommodities(rawQuery, commodities);
  const includedVariants = findCommodities(rawQuery, variants);
  const organic = RE_ORGANIC.test(rawQuery);

  return {
    filters: {
      category: category,
      commodities:
        includedCommodities.length === 0 ? undefined : includedCommodities,
      variants: includedVariants.length === 0 ? undefined : includedVariants,
      organicOnly: organic ? true : undefined,
    },
    query: query,
  };
}

async function prepareQuery(rawQuery: string): Promise<
  | {
      localIntent: boolean;
      hasLocation: true;
      location: string;
      keywords: string[];
      filters: QueryFilters;
    }
  | {
      localIntent: boolean;
      hasLocation: false;
      location: undefined;
      keywords: string[];
      filters: QueryFilters;
    }
> {
  const {
    localIntent,
    placeName,
    query: queryV1,
  } = extractLocationInfo(rawQuery);
  const { filters, query } = await extractFilters(queryV1);
  const rawKeywords = query
    .split(" ")
    .filter((r) => r.trim().length > 3)
    .map((r) => r.trim().toLowerCase());
  const keywords = new Set(rawKeywords).values().toArray().slice(0, 8); // cap 8 keywords

  console.log(placeName);

  if (placeName !== undefined) {
    return {
      localIntent,
      hasLocation: true,
      location: placeName,
      keywords,
      filters,
    };
  } else {
    return {
      localIntent,
      hasLocation: false,
      location: placeName,
      keywords,
      filters,
    };
  }
}

export const searchProducers = actionClient
  .name("searchProducers")
  .input(searchProducersArgsValidator)
  .action(
    async ({
      input: {
        page,
        userLocation,
        customUserLocationRadius,
        customFilterOverrides,
        ...rest
      },
    }) => {
      const { userId } = await auth();
      const headerList = await headers();

      const ipGeo = getIpGeo(headerList);

      const userGeo = userLocation
        ? {
            lat: userLocation.coords.latitude,
            lon: userLocation.coords.longitude,
          }
        : ipGeo;

      const userLocationRadius = customUserLocationRadius ?? 100;

      const params = await SEARCH_BY_GEO_TEXT_QUERIES_CACHE.get(rest.query);

      if (params) {
        console.log("Cache hit for query", rest.query, "params", params);

        const geo =
          params.userRequestsUsingTheirLocation === true
            ? {
                center: userGeo!,
                radiusKm: userLocationRadius,
              }
            : undefined;

        if (customFilterOverrides?.category) {
          params.filters = params.filters
            ? { ...params.filters, category: customFilterOverrides.category }
            : { category: customFilterOverrides.category };
        }

        if (
          customFilterOverrides?.certifications &&
          customFilterOverrides.certifications.length > 0
        ) {
          params.filters = params.filters
            ? {
                ...params.filters,
                certifications: customFilterOverrides.certifications,
              }
            : { certifications: customFilterOverrides.certifications };
        }

        const result = await listing.searchByGeoTextV2({
          ...params,
          page,
          geo: geo ?? params.geo,
          countryHint: customFilterOverrides?.country
            ? customFilterOverrides.country
            : params.countryHint,
        });

        return {
          result: result,
          userLocation: {
            userRequestsUsingTheirLocation:
              params.userRequestsUsingTheirLocation,
            searchRadius: userLocationRadius,
          },
        };
      }

      if (!userId) {
        const { success } = await allow10RequestPer30Minutes.limit(
          "searchProducers:global"
        );

        if (!success) {
          throw new Error(
            "Global ratelimit exceeded. Create an account to make more searches"
          );
        }
      } else {
        const subTier = await getSubTier(userId);
        if (subTier === "Free") {
          const { success } = await allow25RequestPer30Min.limit(
            `searchProducers:user:${userId}`
          );

          if (!success) {
            throw new Error("Ratelimit exceeded");
          }
        } else {
          const { success } = await allow100RequestPer30Min.limit(
            `searchProducers:user:${userId}`
          );

          if (!success) {
            throw new Error("Ratelimit exceeded");
          }
        }
      }

      // Query is not cached so pagination is invalid
      page = 1;

      const query = await prepareQuery(rest.query);
      console.log(query);

      let output: listing.ProducerSearchResult;

      if (query.hasLocation === true && query.localIntent !== true) {
        const placeInfo = await geocodePlace({
          place: query.location,
        });

        if (placeInfo.status == "error") {
          throw new Error("Failed geocoding");
        }

        await SEARCH_BY_GEO_TEXT_QUERIES_CACHE.set(rest.query, {
          geo: {
            center: {
              lat: Number(placeInfo.data.lat),
              lon: Number(placeInfo.data.lon),
            },
            bbox: placeInfo.data.boundingbox,
          },
          filters: query.filters,
          keywords: query.keywords,
          userRequestsUsingTheirLocation: query.localIntent,
        });

        const result = await listing.searchByGeoTextV2({
          geo: {
            center: {
              lat: Number(placeInfo.data.lat),
              lon: Number(placeInfo.data.lon),
            },
            bbox: placeInfo.data.boundingbox,
          },
          filters: query.filters,
          keywords: query.keywords,
          page: page,
        });

        output = result;
      } else {
        await SEARCH_BY_GEO_TEXT_QUERIES_CACHE.set(rest.query, {
          keywords: query.keywords,
          filters: query.filters,
          userRequestsUsingTheirLocation: query.localIntent,
        });

        const result = await listing.searchByGeoTextV2({
          geo:
            query.localIntent === true && userGeo !== undefined
              ? {
                  center: userGeo!,
                  radiusKm: userLocationRadius,
                }
              : undefined,
          keywords: query.keywords,
          filters: query.filters,
          page: page,
        });

        output = result;
      }

      return {
        result: output,
        userLocation: {
          userRequestsUsingTheirLocation: query.localIntent,
          searchRadius: userLocationRadius,
        },
      };
    }
  );

export const registerProducer = authenticatedActionClient
  .input(registerProducerArgsValidator)
  .name("registerProducer")
  .action(async ({ ctx: { userId, producerIds }, input }) => {
    const subTier = await getSubTier(userId);
    if (
      subTier !== "Free" &&
      subTier.tier === "enterprise" &&
      producerIds.length < 3
    ) {
      console.log("multiple");
    } else if (producerIds.length > 0) {
      throw new Error("Upgrade to make more then one profile.");
    }

    const producerProfileId = crypto.randomUUID();

    let subscriptionRank = 0;
    if (subTier !== "Free" && subTier.tier !== "community") {
      subscriptionRank = subTier.rank;
    }

    await db.insert(producers).values({
      id: producerProfileId,
      userId: userId,
      name: input.name,
      type: input.type,
      verified: false,
      about: input.about,
      subscriptionRank: subscriptionRank,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies ProducerInsert);

    await db.insert(producersSearch).values({
      producerId: producerProfileId,
      searchName: input.name,
      searchSummary: input.about.substring(0, 300),
    });

    await USER_PRODUCER_IDS_KV.push(userId, producerProfileId);

    return producerProfileId;
  });

export const fetchUserProducer = producerActionClient
  .input(type("string"))
  .name("fetchUserProducer")
  .action(async ({ input, ctx: { producerIds, userId } }) => {
    const result = await db.query.producers.findFirst({
      where: and(
        eq(producers.id, input),
        inArray(producers.id, producerIds),
        eq(producers.userId, userId)
      ),
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

    return result ?? null;
  });

export const listProducerContries = actionClient
  .name("listProducerContries")
  .action(async () => {
    const cached = await PRODUCER_COUNTRIES_CACHE.get();

    if (cached) {
      return cached;
    }

    const result = await db
      .selectDistinct({ country: producerLocation.country })
      .from(producerLocation)
      .where(isNotNull(producerLocation.country));

    const value = result
      .filter((r): r is { country: string } => r.country !== null)
      .map((r) => r.country);

    await PRODUCER_COUNTRIES_CACHE.set(value);

    return value;
  });

export const fetchUserProducers = authenticatedActionClient
  .name("fetchUserProducers")
  .action(async ({ userId }) => {
    const result = await db
      .select()
      .from(producerCards)
      .where(eq(producerCards.userId, userId));

    return result;
  });

export const fetchUserProducerLight = producerActionClient
  .input(type("string"))
  .name("fetchUserProducerLight")
  .action(async ({ input, ctx: { producerIds, userId } }) => {
    const result = await db
      .select()
      .from(producerCards)
      .where(
        and(
          eq(producers.id, input),
          inArray(producers.id, producerIds),
          eq(producers.userId, userId)
        )
      )
      .limit(1)
      .then((r) => r[0]);

    return result ?? null;
  });

export const listCertificationTypesPublic = actionClient
  .name("listCertificationTypesPublic")
  .action(async () => await listing.listCertificationTypesPublic());

export const listProducers = authenticatedActionClient
  .input(listProducersArgsValidator)
  .name("listProducers")
  .action(async ({ input }) => await listing.listProducers(input));

export const getProducerPublic = actionClient
  .input(getProducersArgsValidator)
  .name("getProducerPublic")
  .action(async ({ input }) => await listing.getProducerPublic(input));

export const getFullProducerPublic = actionClient
  .input(getProducersArgsValidator)
  .name("getFullProducerPublic")
  .action(async ({ input }) => await listing.getFullProducerPublic(input));

export const editProducer = producerActionClient
  .input(editProducerArgsValidatorV2)
  .name("editProducer")
  .action(async ({ input, ctx: { userId } }) => {
    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, input.id), eq(producers.userId, userId)),
      columns: {
        id: true,
        summary: true,
      },
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const toUpdate: Partial<ProducerSelect> = {};
    const toUpdateSearch: Partial<ProducersSearchSelect> = {};

    if (input.name) {
      toUpdate.name = input.name;
      toUpdateSearch.searchName = input.name;
    }

    if (input.type) {
      toUpdate.type = input.type;
    }

    if (input.about !== undefined) {
      toUpdate.about = input.about;
      // Update search via about if summary was not set
      if (producer.summary == null) {
        toUpdateSearch.searchSummary = input.about?.substring(0, 300);
      }
    }

    if (input.summary !== undefined) {
      toUpdate.summary = input.summary;
      toUpdateSearch.searchSummary = input.summary;
    }

    if (Object.keys(toUpdate).length > 0) {
      await db
        .update(producers)
        .set({
          ...toUpdate,
          updatedAt: new Date(),
        })
        .where(
          and(eq(producers.id, producer.id), eq(producers.userId, userId))
        );
    }

    if (Object.keys(toUpdateSearch).length > 0) {
      await db
        .update(producersSearch)
        .set({
          ...toUpdateSearch,
        })
        .where(eq(producersSearch.producerId, producer.id));
    }
  });

export const editProducerContact = producerActionClient
  .input(editProducerContactArgsValidator)
  .name("editProducerContact")
  .action(async ({ input, ctx: { userId } }) => {
    const producer = await db.query.producers.findFirst({
      where: and(
        eq(producers.id, input.producerId),
        eq(producers.userId, userId)
      ),
      columns: {
        id: true,
        summary: true,
      },
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const toUpdate: Partial<ProducerContactSelect> = {};
    if (input.email !== undefined) {
      toUpdate.email = input.email;
    }
    if (input.phone !== undefined) {
      toUpdate.phone = input.phone;
    }
    if (input.websiteUrl !== undefined) {
      toUpdate.websiteUrl = input.websiteUrl;
    }

    if (Object.keys(toUpdate).length > 0) {
      await db
        .insert(producerContact)
        .values({
          producerId: producer.id,
          ...toUpdate,
        })
        .onConflictDoUpdate({
          set: { ...toUpdate },
          target: producerContact.producerId,
        });
    }
  });

export const editProducerLocation = producerActionClient
  .input(editProducerLocationArgsValidator)
  .name("editProducerLocation")
  .action(async ({ input, ctx: { userId } }) => {
    const producer = await db.query.producers.findFirst({
      where: and(
        eq(producers.id, input.producerId),
        eq(producers.userId, userId)
      ),
      columns: {
        id: true,
        summary: true,
      },
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const existing = await db.query.producerLocation.findFirst({
      where: eq(producerLocation.producerId, producer.id),
    });

    const toUpdate: Partial<ProducerLocationSelect> = {};
    if (input.latitude !== undefined) {
      toUpdate.latitude = input.latitude;
    }
    if (input.longitude !== undefined) {
      toUpdate.longitude = input.longitude;
    }
    if (input.locality !== undefined) {
      toUpdate.locality = input.locality;
    }
    if (input.city !== undefined) {
      toUpdate.city = input.city;
    }
    if (input.postcode !== undefined) {
      toUpdate.postcode = input.postcode;
    }
    if (input.adminArea !== undefined) {
      toUpdate.adminArea = input.adminArea;
    }
    if (input.country !== undefined) {
      toUpdate.country = input.country;
    }
    if (input.postcode !== undefined) {
      toUpdate.postcode = input.postcode;
    }

    if (input.latitude !== undefined && input.longitude !== undefined) {
      if (input.latitude === null || input.longitude === null) {
        toUpdate.geohash = null;
      } else {
        toUpdate.geohash = ngeo.encode(input.latitude, input.longitude);
      }
    } else if (input.latitude !== undefined) {
      if (
        input.latitude == null ||
        existing?.longitude === undefined ||
        existing.longitude === null
      ) {
        toUpdate.geohash = null;
      } else {
        toUpdate.geohash = ngeo.encode(input.latitude, existing.longitude);
      }
    } else if (input.longitude !== undefined) {
      if (
        input.longitude == null ||
        existing?.latitude === undefined ||
        existing.latitude === null
      ) {
        toUpdate.geohash = null;
      } else {
        toUpdate.geohash = ngeo.encode(existing.latitude, input.longitude);
      }
    }

    console.log(toUpdate);

    if (Object.keys(toUpdate).length > 0) {
      console.log(
        await db
          .insert(producerLocation)
          .values({
            producerId: producer.id,
            ...toUpdate,
          })
          .onConflictDoUpdate({
            set: { ...toUpdate },
            target: producerLocation.producerId,
          })
      );
    }
  });

export const editProducerCertifications = producerActionClient
  .input(editProducerCertificationsArgsValidator)
  .name("editProducerCertifications")
  .action(async ({ input, ctx: { userId } }) => {
    const producer = await db.query.producers.findFirst({
      where: and(
        eq(producers.id, input.producerId),
        eq(producers.userId, userId)
      ),
      columns: {
        id: true,
      },
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    await db
      .delete(producerCertifications)
      .where(
        and(
          eq(producerCertifications.producerId, producer.id),
          notInArray(
            producerCertifications.certificationId,
            input.certifications
          )
        )
      );

    await db
      .insert(producerCertifications)
      .values(
        input.certifications.map((cert) => ({
          producerId: input.producerId,
          certificationId: cert,
          addedAt: new Date(),
        }))
      )
      .onConflictDoNothing();
  });

export const editProducerCommodoties = producerActionClient
  .input(editProducerCommodotiesArgsValidator)
  .name("editProducerCommodoties")
  .action(async ({ input, ctx: { userId } }) => {
    const producer = await db.query.producers.findFirst({
      where: and(
        eq(producers.id, input.producerId),
        eq(producers.userId, userId)
      ),
      columns: {
        id: true,
      },
      with: {
        commodities: {
          columns: {
            commodityId: true,
          },
        },
      },
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    console.log(input);

    await db
      .delete(producerCommodities)
      .where(
        and(
          eq(producerCommodities.producerId, producer.id),
          notInArray(producerCommodities.commodityId, input.commodities)
        )
      );

    const newComms = input.commodities.filter(
      (ic) => !producer.commodities.some((ec) => ec.commodityId === ic)
    );

    if (newComms.length > 0) {
      await db.insert(producerCommodities).values(
        newComms.map((cert) => ({
          producerId: input.producerId,
          commodityId: cert,
          updatedAt: new Date(),
        }))
      );
    }
  });

export const addCommodityAndAssociate = producerActionClient
  .input(addCommodityAndAssociateArgsValidator)
  .name("addCommodityAndAssociate")
  .action(async ({ input, ctx: { userId } }) => {
    const producer = await db.query.producers.findFirst({
      where: and(
        eq(producers.id, input.producerId),
        eq(producers.userId, userId)
      ),
      columns: {
        id: true,
      },
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const name = input.name.trim();
    const slug = name.toLowerCase().replaceAll(" ", "_");
    const commodity = await db
      .insert(commodities)
      .values({
        name: name,
        slug: slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning()
      .then((r) => r[0]);

    await db.insert(producerCommodities).values({
      producerId: producer.id,
      commodityId: commodity.id,
      updatedAt: new Date(),
    });
  });

export const requestUploadUrls = producerActionClient
  .input(
    type({
      producerId: "string",
      imageItemParams: type({
        type: "string",
        name: "string",
        position: "number",
      })
        .array()
        .atLeastLength(1)
        .atMostLength(10),
    })
  )
  .name("requestUploadUrls")
  .action(
    async ({ ctx: { userId }, input: { imageItemParams, producerId } }) => {
      const producer = await db.query.producers.findFirst({
        columns: {
          id: true,
        },
        with: {
          media: {
            with: {
              asset: {
                columns: { contentType: true },
              },
            },
          },
        },
        where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
      });

      if (!producer) {
        throw new Error("Unauthorized");
      }

      const tier = await getSubTier(userId);

      const images = producer.media.filter(
        (m) =>
          m.asset.contentType === undefined ||
          m.asset.contentType?.startsWith("image/")
      );

      const maxFiles =
        tier === "Free"
          ? 1
          : tier.tier === "community"
            ? 1
            : tier.tier === "pro"
              ? 4
              : tier.tier === "premium" || tier.tier === "enterprise"
                ? 5
                : 1;

      const remainingFiles = maxFiles - images.length;

      if (imageItemParams.length > remainingFiles) {
        throw new Error("Number of files exceeds your plan");
      }

      const urls: { id: string; uploadURL: string }[] = [];
      const pending: PendingMediaAssetInsert[] = [];

      for (let i = 0; i < imageItemParams.length; i++) {
        const item = imageItemParams[i];
        const form = new FormData();

        form.set("creator", userId);
        form.set(
          "metadata",
          JSON.stringify({ producerId: producer.id, userId: userId })
        );

        const uploadUrlGeneratorCloudflareResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.SAFE_CLOUDFLARE_API_TOKEN}`,
            },
            body: form,
          }
        );

        const uploadUrlGeneratorCloudflareResponseBody =
          await uploadUrlGeneratorCloudflareResponse.json();

        if (uploadUrlGeneratorCloudflareResponseBody.success === true) {
          urls.push(uploadUrlGeneratorCloudflareResponseBody.result);
          pending.push({
            id: crypto.randomUUID(),
            pendingAssetKey: uploadUrlGeneratorCloudflareResponseBody.result.id,
            mode: "cloudflare-image",
            ownerUserId: userId,
            position: item.position,
            createdAt: new Date(),
          });
        } else {
          console.error(uploadUrlGeneratorCloudflareResponseBody);
          throw new Error("Error generating urls");
        }
      }

      await db.insert(pendingMediaAssets).values(pending);

      await db
        .update(producers)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(producers.id, producer.id));

      return urls;
    }
  );

export const requestVideoUploadUrl = producerActionClient
  .input(type({ producerId: "string" }))
  .name("requestVideoUploadUrl")
  .action(async ({ ctx: { userId }, input: { producerId } }) => {
    const { success } = await videoRatelimit.limit(userId);

    if (!success) {
      throw new Error("Rate limit exceded");
    }

    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const pendingVideo = await db.query.pendingMediaAssets.findFirst({
      where: and(
        eq(pendingMediaAssets.ownerUserId, userId),
        eq(pendingMediaAssets.mode, "cloudflare-stream")
      ),
    });

    const tier = await getSubTier(userId);

    if (
      tier == "Free" ||
      !(tier.tier === "enterprise" || tier.tier === "premium")
    ) {
      throw new Error("Must be premium to upload video");
    }

    if (pendingVideo) {
      await cloudflare.stream.delete(pendingVideo.pendingAssetKey, {
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
      });

      await db
        .delete(pendingMediaAssets)
        .where(eq(pendingMediaAssets.id, pendingVideo.id));
    }

    const form = new FormData();

    form.set("creator", userId);
    form.set("maxDurationSeconds", "120");
    form.set(
      "meta",
      JSON.stringify({ producerId: producer.id, userId: userId })
    );

    const uploadUrlGeneratorCloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SAFE_CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creator: userId,
          maxDurationSeconds: 120,
          allowedOrigins: [
            "localhost:3000",
            "*.vercel.app",
            "eatauthentically.app",
            "*.eatauthentically.app",
          ],
          meta: {
            userId: userId,
          },
        }),
      }
    );

    const uploadUrlGeneratorCloudflareResponseBody =
      await uploadUrlGeneratorCloudflareResponse.json();

    if (uploadUrlGeneratorCloudflareResponseBody.success === true) {
      logger.info("Cloudflare direct upload response body", {
        body: uploadUrlGeneratorCloudflareResponseBody,
      });

      await db.insert(pendingMediaAssets).values({
        id: crypto.randomUUID(),
        ownerUserId: userId,
        pendingAssetKey: uploadUrlGeneratorCloudflareResponseBody.result.uid,
        mode: "cloudflare-stream",
        createdAt: new Date(),
        position: 0,
      });

      return uploadUrlGeneratorCloudflareResponseBody.result.uploadURL;
    } else {
      logger.error("Cloudflare direct upload response error body", {
        body: uploadUrlGeneratorCloudflareResponseBody,
      });
      throw new Error("Error generating video url");
    }
  });

export const confirmPengingUpload = producerActionClient
  .input(type({ producerId: "string" }))
  .name("confirmPengingUpload")
  .action(async ({ ctx: { userId }, input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const pendingImages = await db.query.pendingMediaAssets.findMany({
      where: and(
        eq(pendingMediaAssets.ownerUserId, userId),
        eq(pendingMediaAssets.mode, "cloudflare-image")
      ),
    });

    if (!pendingImages || pendingImages.length === 0) {
      throw new Error("No uploads to confirm");
    }

    try {
      const imageListResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/images/v2?creator=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${env.SAFE_CLOUDFLARE_API_TOKEN}`,
          },
        }
      );

      const imagesListBody = (await imageListResponse.json()) as {
        success: boolean;
        result: { images: { id: string }[] };
      };

      if (imagesListBody.success) {
      } else {
        throw new Error("Error listing images");
      }

      for (const pendingImage of pendingImages) {
        const cloudflareImage = imagesListBody.result.images.find(
          (img) => img.id === pendingImage.pendingAssetKey
        );

        if (!cloudflareImage) {
          continue;
        }

        const assetId = crypto.randomUUID();

        await db.insert(mediaAssets).values({
          id: assetId,
          uploadedByType: "user",
          uploadedById: userId,
          contentType: "image/*",
          url: `https://imagedelivery.net/${env.SAFE_CLOUDFLARE_ACCOUNT_HASH}/${cloudflareImage.id}/public`,
          cloudflareId: cloudflareImage.id,
          storage: "cloudflare",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await db.insert(producerMedia).values({
          producerId: producer.id,
          assetId: assetId,
          role: "gallery",
          addedByUserId: userId,
          position: pendingImage.position,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await db
          .delete(pendingMediaAssets)
          .where(eq(pendingMediaAssets.id, pendingImage.id));
      }
    } catch (err) {
      console.error(err);
      throw new Error("Error generating urls");
    }
  });

export const confirmPendingVideoUpload = producerActionClient
  .input(type({ producerId: "string" }))
  .name("confirmPendingVideoUpload")
  .action(async ({ ctx: { userId }, input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const pendingVideos = await db.query.pendingMediaAssets.findMany({
      where: and(
        eq(pendingMediaAssets.ownerUserId, userId),
        eq(pendingMediaAssets.mode, "cloudflare-stream")
      ),
    });

    if (!pendingVideos || pendingVideos.length === 0) {
      throw new Error("No video uploads to confirm");
    }

    try {
      const videosPage = await cloudflare.stream.list({
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
        creator: userId,
      });

      for (const pendingVideo of pendingVideos) {
        const cloudflareVideo = videosPage.result.find(
          (vid) => vid.uid === pendingVideo.pendingAssetKey
        );

        if (
          !cloudflareVideo ||
          !cloudflareVideo.status ||
          cloudflareVideo.status.state === "error" ||
          cloudflareVideo.status.state === "pendingupload"
        ) {
          continue;
        }

        const assetId = crypto.randomUUID();

        await db.insert(mediaAssets).values({
          id: assetId,
          uploadedByType: "user",
          uploadedById: userId,
          contentType: "video/*",
          url: `https://customer-a80gdw9axz7eg3xk.cloudflarestream.com/${cloudflareVideo.uid!}/manifest/video.m3u8`,
          cloudflareId: cloudflareVideo.uid,
          videoStatus:
            cloudflareVideo.status.state === "ready" ? "ready" : "pending",
          storage: "cloudflare",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const nextPosRow = await db.run(sql`
          SELECT COALESCE(MAX(position)+1, 0) AS next_pos
          FROM producer_media
          WHERE producer_id = ${producerId} AND role = ${"video"}
        `);
        const nextPos = (nextPosRow.rows[0]?.next_pos ?? 0) as number;

        await db.insert(producerMedia).values({
          producerId: producer.id,
          assetId: assetId,
          role: "video",
          addedByUserId: userId,
          position: nextPos,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await db
          .delete(pendingMediaAssets)
          .where(eq(pendingMediaAssets.id, pendingVideo.id));
      }
    } catch (err) {
      console.error(err);
      throw new Error("Error confirming upload");
    }
  });

export const deleteVideo = producerActionClient
  .input(type({ producerId: "string" }))
  .name("deleteVideo")
  .action(async ({ ctx: { userId }, input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const video = await db.query.producerMedia.findFirst({
      where: and(
        eq(producerMedia.producerId, producerId),
        eq(producerMedia.role, "video")
      ),
      with: { asset: true },
    });

    if (!video || video.asset.cloudflareId == null) {
      throw new Error("Video not found");
    }

    await cloudflare.stream.delete(video.asset.cloudflareId, {
      account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
    });

    await db.delete(mediaAssets).where(eq(mediaAssets.id, producer.id));
  });

export const updateExistingImages = producerActionClient
  .input(
    type({
      producerId: "string",
      data: producerMediaSelectValidator
        .and({ asset: mediaAssetSelectValidator })
        .array(),
    })
  )
  .name("updateExistingImages")
  .action(async ({ ctx: { userId }, input: { producerId, data } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const ids = data.map((r) => r.assetId);

    const imagesToDelete = await db.query.producerMedia.findMany({
      where: and(
        eq(producerMedia.producerId, producer.id),
        ne(producerMedia.role, "video"),
        notInArray(producerMedia.assetId, ids)
      ),
      columns: {},
      with: {
        asset: {
          columns: {
            id: true,
            cloudflareId: true,
          },
        },
      },
    });

    for (const image of imagesToDelete) {
      if (!image.asset.cloudflareId) {
        continue;
      }

      logger.info(
        `action [updateExistingImages] - Deleting image (${image.asset.cloudflareId}) - run by user(${userId})`
      );

      const response = await cloudflare.images.v1.delete(
        image.asset.cloudflareId,
        {
          account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
        }
      );

      logger.info(
        `action [updateExistingImages] - Cloudflare delete image response`,
        { response: response }
      );

      await db.delete(mediaAssets).where(eq(mediaAssets.id, image.asset.id));
    }

    for (const image of data) {
      await db
        .update(producerMedia)
        .set({
          role: image.role,
          position: image.position,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(producerMedia.producerId, producerId),
            eq(producerMedia.assetId, image.assetId)
          )
        );
    }
  });

export const claimProducer = authenticatedActionClient
  .input(claimProducerArgs)
  .name("claimProducer")
  .action(
    async ({
      ctx: { userId, producerIds },
      input: { producerId, verification },
    }) => {
      const success = await claimProducerRateLimit.limit(userId);

      if (!success) {
        throw new Error("Rate limit exceded");
      }

      const subTier = await getSubTier(userId);

      const claimRequestsCountForUser = await db
        .select({ count: count() })
        .from(claimRequests)
        .where(
          and(
            eq(claimRequests.userId, userId),
            sql`json_extract(${claimRequests.status}, '$.type') = 'waiting'`
          )
        )
        .then((r) => r[0].count ?? 0);

      if (subTier !== "Free" && subTier.tier === "enterprise") {
        if (producerIds.length + claimRequestsCountForUser >= 3) {
          throw new Error("Exceeded maximum producers or producer claims");
        }
      } else if (producerIds.length > 0) {
        throw new Error("Upgrade to make or claim more then one profile.");
      }

      const producer = await db.query.producers.findFirst({
        where: and(eq(producers.id, producerId), isNull(producers.userId)),
        with: {
          contact: true,
          social: true,
        },
      });

      if (!producer) {
        throw new Error("This listing cannot be claimed");
      }

      const existingClaim = await db.query.claimRequests.findFirst({
        where: and(
          eq(claimRequests.producerId, producer.id),
          eq(claimRequests.userId, userId)
        ),
      });

      if (existingClaim) {
        throw new Error("You already have a claim attempt");
      }

      switch (verification.method) {
        case "contact-email-link":
          const email = type("string.email")(producer.contact?.email?.trim());

          if (email instanceof type.errors) {
            throw new Error("Method invalid: Missing or invalid contact email");
          }

          const token = generateToken();
          const claimUrl = `${env.SITE_URL}/claim?token=${token}`;

          await db.insert(claimRequests).values({
            id: crypto.randomUUID(),
            producerId: producer.id,
            userId: userId,
            status: {
              type: "waiting",
            },
            requestedVerification: {
              method: verification.method,
              producerContactEmail: email,
            },
            claimToken: token,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await resend.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: [email],
            subject: "Claim Producer",
            react: ClaimListingEmail({
              producer: { name: producer.name },
              url: claimUrl,
            }),
          });

          break;
        case "domain-dns":
        case "domain-email-link": {
          const website = producer.contact?.websiteUrl;
          if (!website) {
            throw new Error(
              "Method invalid: Missing or invalid contact website"
            );
          }

          const url = new URL(website);
          let domain = url.hostname;
          if (/\..*\./.test(domain)) {
            domain = domain.substring(domain.indexOf(".") + 1);
          }

          if (!isURL(domain, { require_tld: true, require_host: true })) {
            throw new Error(
              "Method invalid: Missing or invalid contact website"
            );
          }

          if (verification.method === "domain-email-link") {
            const token = generateToken();
            const claimUrl = `${env.SITE_URL}/claim?token=${token}`;
            const email = `${verification.domainDomainEmailPart}@${domain}`;

            await db.insert(claimRequests).values({
              id: crypto.randomUUID(),
              producerId: producer.id,
              userId: userId,
              status: {
                type: "waiting",
              },
              requestedVerification: {
                method: verification.method,
                domainDomainEmailPart: verification.domainDomainEmailPart,
                domain: domain,
              },
              claimToken: token,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            await resend.emails.send({
              from: env.RESEND_FROM_EMAIL,
              to: [email],
              subject: "Claim Producer",
              react: ClaimListingEmail({
                producer: { name: producer.name },
                url: claimUrl,
              }),
            });
          } else {
            const token = generateToken();

            await db.insert(claimRequests).values({
              id: crypto.randomUUID(),
              producerId: producer.id,
              userId: userId,
              status: {
                type: "waiting",
              },
              requestedVerification: {
                method: verification.method,
                domain: domain,
              },
              claimToken: token,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          break;
        }
        case "contact-phone-link": {
          const rawPhone = producer.contact?.phone;

          if (!rawPhone) {
            throw new Error("Missing or invalid contact phone");
          }

          const phone = rawPhone
            .trim()
            .split("")
            .filter((c) => isNumeric(c) || c == "+")
            .join("");

          if (!isMobilePhone(phone)) {
            throw new Error("Missing or invalid contact phone");
          }

          const token = generateCode();

          await db.insert(claimRequests).values({
            id: crypto.randomUUID(),
            producerId: producer.id,
            userId: userId,
            status: {
              type: "waiting",
            },
            requestedVerification: {
              method: verification.method,
              producerContactPhone: phone,
              tokenExpiresAt: addMinutes(new Date(), 3),
            },
            claimToken: token.toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await sendClaimCodeMessage(phone, token.toString());
          break;
        }
        case "social-post": {
          const profiles: string[] = [];

          if (producer.social?.facebook) {
            profiles.push(producer.social.facebook);
          }
          if (producer.social?.instagram) {
            profiles.push(producer.social.instagram);
          }
          if (producer.social?.twitter) {
            profiles.push(producer.social.twitter);
          }

          if (
            profiles.length === 0 ||
            !profiles.some((p) => p === verification.socialHandle)
          ) {
            throw new Error("Missing or invalid social handle");
          }

          const token = generateToken();

          await db.insert(claimRequests).values({
            id: crypto.randomUUID(),
            producerId: producer.id,
            userId: userId,
            status: {
              type: "waiting",
            },
            requestedVerification: {
              method: verification.method,
              socialHandle: verification.socialHandle,
            },
            claimToken: token,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await resend.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: [env.RESEND_FROM_EMAIL],
            subject: "Social Claim Producer Request",
            react: SocialClaimListingInternalEmail({
              producer: producer,
              socialHandle: verification.socialHandle,
              token: token,
            }),
          });

          break;
        }
        case "manual": {
          const token = generateToken();

          await db.insert(claimRequests).values({
            id: crypto.randomUUID(),
            producerId: producer.id,
            userId: userId,
            status: {
              type: "waiting",
            },
            requestedVerification: {
              method: verification.method,
              claimerEmail: verification.claimerEmail,
            },
            claimToken: token,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await resend.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: [verification.claimerEmail],
            subject: "Claim Producer",
            react: ManualClaimListingEmail({
              producer: { name: producer.name },
            }),
          });

          break;
        }
      }
    }
  );

export const listClaimRequests = authenticatedActionClient
  .name("listClaimRequests")
  .action(async ({ userId }) => {
    const requests = await db.query.claimRequests.findMany({
      where: eq(claimRequests.userId, userId),
      with: {
        producer: {
          columns: { name: true, id: true },
        },
      },
    });

    return requests.map(
      ({
        id,
        userId,
        producer,
        producerId,
        status,
        requestedVerification,
        claimToken,
      }) =>
        ({
          id,
          userId,
          producer,
          producerId,
          status,
          requestedVerification:
            requestedVerification.method === "domain-dns"
              ? { ...requestedVerification, token: claimToken }
              : requestedVerification.method === "social-post"
                ? { ...requestedVerification, token: claimToken }
                : requestedVerification.method === "contact-phone-link"
                  ? { ...requestedVerification }
                  : requestedVerification,
        }) satisfies PublicClaimRequest
    );
  });

export const checkClaimDomainDNS = authenticatedActionClient
  .input(checkClaimDomainDnsArgs)
  .name("checkClaimDomainDNS")
  .action(async ({ ctx: { userId }, input: { claimRequestId } }) => {
    const { success } = await producerClaimDnsCheckRatelimit.limit(userId);

    if (!success) {
      throw new Error("Rate limit exceded");
    }

    const claimRequest = await db.query.claimRequests.findFirst({
      where: and(
        eq(claimRequests.userId, userId),
        eq(claimRequests.id, claimRequestId)
      ),
    });

    if (!claimRequest || claimRequest.status.type !== "waiting") {
      throw new Error("Claim does not exist");
    }

    if (claimRequest.requestedVerification.method !== "domain-dns") {
      throw new Error("Invalid claim verification method");
    }

    const recordName = `${CLAIM_DNS_TXT_RECORD_NAME}.${claimRequest.requestedVerification.domain}`;

    const records = await getDnsRecords(recordName, "TXT");

    const claimDnsRecord = records.find((r) => r.name === recordName);

    if (!claimDnsRecord) {
      throw new Error("Claim record not found");
    }

    const hasValidCode = claimDnsRecord.data === claimRequest.claimToken;

    if (!hasValidCode) {
      throw new Error("Claim tokens did not match.");
    }

    await listing.internalClaimProducer({
      userId: claimRequest.userId,
      producerId: claimRequest.producerId,
      claimRequestId: claimRequest.id,
    });

    return "Claim successfull";
  });

export const verifyClaimPhone = authenticatedActionClient
  .input(verifyClaimPhoneArgs)
  .name("verifyClaimPhone")
  .action(async ({ ctx: { userId }, input: { claimRequestId, code } }) => {
    const { success } = await producerClaimVerifyPhoneRatelimit.limit(userId);

    if (!success) {
      throw new Error("Rate limit exceded");
    }

    const claimRequest = await db.query.claimRequests.findFirst({
      where: and(
        eq(claimRequests.userId, userId),
        eq(claimRequests.id, claimRequestId)
      ),
    });

    if (!claimRequest || claimRequest.status.type !== "waiting") {
      throw new Error("Claim does not exist");
    }

    if (claimRequest.requestedVerification.method !== "contact-phone-link") {
      throw new Error("Invalid claim verification method");
    }

    if (
      isAfter(new Date(), claimRequest.requestedVerification.tokenExpiresAt)
    ) {
      throw new Error("Token is expired please request a new one.");
    }

    if (claimRequest.claimToken === code) {
      await listing.internalClaimProducer({
        userId: claimRequest.userId,
        producerId: claimRequest.producerId,
        claimRequestId: claimRequest.id,
      });
      return "Claim successfull";
    }

    throw new Error("Claim did not match");
  });

export const regenerateClaimPhoneToken = authenticatedActionClient
  .input(regenerateClaimPhoneTokenArgs)
  .name("regenerateClaimPhoneToken")
  .action(async ({ ctx: { userId }, input: { claimRequestId } }) => {
    const claimRequest = await db.query.claimRequests.findFirst({
      where: and(
        eq(claimRequests.userId, userId),
        eq(claimRequests.id, claimRequestId)
      ),
    });

    if (!claimRequest || claimRequest.status.type !== "waiting") {
      throw new Error("Claim does not exist");
    }

    if (claimRequest.requestedVerification.method !== "contact-phone-link") {
      throw new Error("Invalid claim verification method");
    }

    if (
      isBefore(new Date(), claimRequest.requestedVerification.tokenExpiresAt)
    ) {
      throw new Error("Token has not expired");
    }

    const token = generateCode();

    await db
      .update(claimRequests)
      .set({
        claimToken: token.toString(),
        requestedVerification: {
          ...claimRequest.requestedVerification,
          tokenExpiresAt: addMinutes(new Date(), 3),
        },
      })
      .where(eq(claimRequests.id, claimRequest.id));

    await sendClaimCodeMessage(
      claimRequest.requestedVerification.producerContactPhone,
      token.toString()
    );
  });

export const deleteProducer = producerActionClient
  .input(deleteProducerArgs)
  .name("deleteProducer")
  .action(async ({ ctx: { userId, producerIds }, input: { producerId } }) => {
    if (!producerIds.includes(producerId)) {
      throw new Error("Producer not found");
    }

    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer) {
      throw new Error("Producer not found");
    }

    logger.info(
      `[deleteProducer] Starting deletion proccess - userId: ${userId} producerId: ${producer.id}`
    );

    const media = await db.query.producerMedia.findMany({
      where: eq(producerMedia.producerId, producer.id),
      with: {
        asset: true,
      },
    });

    for (const item of media) {
      if (item.asset.storage === "cloudflare" && item.asset.cloudflareId) {
        if (item.asset.contentType?.startsWith("video/")) {
          const videDelRes = await cloudflare.stream.delete(
            item.asset.cloudflareId,
            {
              account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
            }
          );
          logger.info(`[deleteProducer] deleting video`, {
            deleteResponse: videDelRes,
          });
        } else {
          console.log(item.asset.cloudflareId);
          const imageDelRes = await cloudflare.images.v1.delete(
            item.asset.cloudflareId,
            {
              account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
            }
          );
          logger.info(`[deleteProducer] deleting image`, {
            imageResponse: imageDelRes,
          });
        }
      }
      await db.delete(mediaAssets).where(eq(mediaAssets.id, item.asset.id));
    }

    const delTxRes = await db
      .delete(producers)
      .where(eq(producers.id, producer.id));

    await USER_PRODUCER_IDS_KV.pop(userId, producer.id);

    logger.info(`[deleteProducer] deletion successfull`, {
      deleteProducerTxResponse: delTxRes,
    });
  });

export const suggestProducer = authenticatedActionClient
  .input(suggestProducerArgs)
  .name("suggestProducer")
  .action(async ({ ctx: { userId }, input }) => {
    const subtier = await getSubTier(userId);

    if (subtier === "Free") {
      const result = await suggestProducerFreeLimit.limit(userId);
      logger.info("suggestProducerFreeLimit ratelimit result", { result });

      if (!result.success) {
        throw new Error("Free users can only suggest 1 producer per day");
      }
    } else {
      const result = await suggestProducerProLimit.limit(userId);
      logger.info("suggestProducerProLimit ratelimit result", {
        result,
      });

      if (!result.success) {
        throw new Error("Pro users can only suggest 3 producers per day");
      }
    }

    const { success } = await geocodeRatelimit.limit(RATELIMIT_ALL);

    if (!success) {
      logger.info(
        "IMPORTANT Suggestion global limit exceeded, please wait and try again later"
      );
      throw new Error(
        "Suggestion global limit exceeded, please wait and try again later"
      );
    }

    const { data: geocodeResponse, error: geocodeError } = await tryCatch(
      geocode
    )(
      `${input.address.street}, ${input.address.city}, ${input.address.state}, ${input.address.zip}, ${input.address.country}`
    );

    if (geocodeResponse == null) {
      logger.error("geocoding error", { error: geocodeError });
      throw new Error("Invalid address");
    }

    const geocoded = geocodeResponse.results[0];

    await db.insert(suggestedProducers).values({
      id: crypto.randomUUID(),
      suggesterUserId: userId,
      name: input.name,
      type: input.type,
      address: {
        street: input.address.street,
        city: input.address.city,
        state: input.address.state,
        zip: input.address.zip,
        country: input.address.country,
        coordinate: {
          latitude: geocoded.geometry.location.lat,
          longitude: geocoded.geometry.location.lng,
        },
      },
      email: input.email,
      phone: input.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies SuggestedProducerInsert);
  });

export const listCommodites = authenticatedActionClient
  .name("listCommodites")
  .action(async () => {
    return await db.query.commodities.findMany();
  });
