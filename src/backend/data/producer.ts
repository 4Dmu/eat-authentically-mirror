import type {
  GetProducerArgs,
  IpGeoValidator,
  ListProducerArgsAfterValidate,
  PublicProducer,
} from "@/backend/validators/producers";
import { db } from "../db";
import { and, count, desc, eq, inArray, like, SQL, sql } from "drizzle-orm";
import {
  certificationsToProducers,
  claimRequests,
  producers,
} from "../db/schema";
import * as transformers from "@/backend/utils/transform-data";
import { USER_PRODUCER_IDS_KV } from "../kv";
import { HOME_PAGE_RESULT_LIMIT } from "../constants";

const orderProducersByScrapedMetadata = sql`
  CASE json_array_length(json_extract(images, '$.items')) > 0
  WHEN true THEN 0
  ELSE 1
  END,
  subscriptionRank DESC,
  RANDOM()`;

function orderProducerByIpGeo(geo?: IpGeoValidator) {
  if (geo?.longitude === undefined || geo?.latitude === undefined) {
    return undefined;
  }

  const latitude = geo.latitude;
  const longitude = geo.longitude;

  return sql`
      json_type(json_extract(address, '$.coordinate.latitude')) IS NOT NULL AND
      json_type(json_extract(address, '$.coordinate.longitude')) IS NOT NULL DESC,

      -- Then: order by squared Euclidean distance
      (
        (CAST(json_extract(address, '$.coordinate.latitude') AS REAL) - ${latitude}) *
        (CAST(json_extract(address, '$.coordinate.latitude') AS REAL) - ${latitude}) +
        (CAST(json_extract(address, '$.coordinate.longitude') AS REAL) - ${longitude}) *
        (CAST(json_extract(address, '$.coordinate.longitude') AS REAL) - ${longitude})
      ) ASC
  `;
}

// 6371 * acos(
//   cos(radians(${latitude}))
//   * cos(radians(CAST(json_extract(address, '$.coordinate.latitude') AS REAL)))
//   * cos(radians(CAST(json_extract(address, '$.coordinate.longitude') AS REAL)) - radians(${longitude}))
//   + sin(radians(${latitude}))
//   * sin(radians(CAST(json_extract(address, '$.coordinate.latitude') AS REAL)))
// )

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

export async function listProducersPublic(args: ListProducerArgsAfterValidate) {
  try {
    const offest = args.page * HOME_PAGE_RESULT_LIMIT;

    const queries: (SQL | undefined)[] = [];

    if (args.type) {
      queries.push(eq(producers.type, args.type));
    }

    if (args.claimed !== undefined) {
      queries.push(eq(producers.claimed, args.claimed));
    }

    if (args.certs.length > 0) {
      queries.push(
        inArray(
          producers.id,
          db
            .select({ listingId: certificationsToProducers.listingId })
            .from(certificationsToProducers)
            .where(
              inArray(certificationsToProducers.certificationId, args.certs)
            )
        )
      );
    }
    if (args.locationSearchArea) {
      const { north, south, east, west } = args.locationSearchArea;
      queries.push(
        and(
          sql`CAST(json_extract(address, '$.coordinate.latitude') AS INTEGER) BETWEEN ${south} AND ${north}`,
          sql`CAST(json_extract(address, '$.coordinate.longitude') AS INTEGER)  BETWEEN ${west} AND ${east}`
        )
      );
    }

    let orderBy = [orderProducersByScrapedMetadata, desc(producers.createdAt)];

    const ipGeo = orderProducerByIpGeo(args.userIpGeo);
    console.log(ipGeo);

    if (ipGeo) {
      orderBy = [ipGeo, ...orderBy];
    }

    const producersQuery = await db.query.producers.findMany({
      orderBy: orderBy,
      columns: {
        id: true,
        name: true,
        images: true,
        type: true,
        claimed: true,
        about: true,
        contact: true,
        address: true,
        video: true,
        socialMedia: true,
        googleMapsPlaceDetails: true,
      },
      with: {
        certificationsToProducers: {
          columns: {},
          with: {
            certification: true,
          },
        },
      },
      limit: HOME_PAGE_RESULT_LIMIT + 1,
      offset: offest,
      where: queries.length > 0 ? and(...queries) : undefined,
    });

    const rowsCount = await db
      .select({ count: count() })
      .from(producers)
      .where(queries.length > 0 ? and(...queries) : undefined)
      .then((r) => r[0].count ?? 0);

    const hasNextPage = producersQuery.length > HOME_PAGE_RESULT_LIMIT;
    const paginatedProducers = hasNextPage
      ? producersQuery.slice(0, HOME_PAGE_RESULT_LIMIT)
      : producersQuery;

    const result = transformers.withCertifications(
      transformers.withMapsUrl(paginatedProducers)
    );

    return {
      data: result satisfies PublicProducer[],
      hasNextPage,
      count: rowsCount,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Error loading producers");
  }
}

export async function listProducersPublicLight(
  args: ListProducerArgsAfterValidate
) {
  try {
    const offest = args.page * HOME_PAGE_RESULT_LIMIT;

    const queries: (SQL | undefined)[] = [];

    if (args.type) {
      queries.push(eq(producers.type, args.type));
    }

    if (args.claimed !== undefined) {
      queries.push(eq(producers.claimed, args.claimed));
    }

    if (args.certs.length > 0) {
      queries.push(
        inArray(
          producers.id,
          db
            .select({ listingId: certificationsToProducers.listingId })
            .from(certificationsToProducers)
            .where(
              inArray(certificationsToProducers.certificationId, args.certs)
            )
        )
      );
    }
    if (args.locationSearchArea) {
      const { north, south, east, west } = args.locationSearchArea;

      queries.push(
        and(
          sql`CAST(json_extract(address, '$.coordinate.latitude') AS INTEGER) BETWEEN ${south} AND ${north}`,
          sql`CAST(json_extract(address, '$.coordinate.longitude') AS INTEGER)  BETWEEN ${west} AND ${east}`
        )
      );
    }

    if (args.query) {
      queries.push(like(producers.name, `%${args.query.toLowerCase()}%`));
    }

    const rowsCount = await db
      .select({ count: count() })
      .from(producers)
      .where(queries.length > 0 ? and(...queries) : undefined)
      .then((r) => r[0].count ?? 0);

    let orderBy = [orderProducersByScrapedMetadata, desc(producers.createdAt)];

    const ipGeo = orderProducerByIpGeo(args.userIpGeo);

    if (ipGeo) {
      orderBy = [ipGeo, ...orderBy];
    }

    const producersQuery = await db.query.producers.findMany({
      orderBy: orderBy,
      columns: {
        id: true,
        name: true,
        images: true,
        type: true,
        claimed: true,
        contact: true,
        address: true,
      },
      with: {
        certificationsToProducers: {
          columns: {},
          with: {
            certification: true,
          },
        },
      },
      where: queries.length > 0 ? and(...queries) : undefined,
      limit: HOME_PAGE_RESULT_LIMIT + 1,
      offset: offest,
    });

    const hasNextPage = producersQuery.length > HOME_PAGE_RESULT_LIMIT;
    const paginatedProducers = hasNextPage
      ? producersQuery.slice(0, HOME_PAGE_RESULT_LIMIT)
      : producersQuery;

    const result = transformers.withCertifications(paginatedProducers);

    return {
      data: result,
      hasNextPage,
      count: rowsCount,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Error loading producers");
  }
}

export async function getProducerPublic(args: GetProducerArgs) {
  try {
    const listing = await db.query.producers.findFirst({
      where: eq(producers.id, args.id),
      columns: {
        id: true,
        name: true,
        type: true,
        about: true,
        claimed: true,
        images: true,
        contact: true,
        address: true,
        video: true,
        socialMedia: true,
        googleMapsPlaceDetails: true,
      },
      with: {
        certificationsToProducers: {
          columns: {},
          with: {
            certification: true,
          },
        },
      },
    });

    if (!listing) {
      return;
    }

    const {
      id,
      name,
      type,
      about,
      claimed,
      images,
      contact,
      certificationsToProducers,
      address,
      video,
      socialMedia,
      googleMapsPlaceDetails,
    } = listing;

    return {
      id,
      name,
      type,
      about,
      claimed,
      images,
      certifications: certificationsToProducers.map((c) => c.certification),
      address,
      contact,
      video,
      socialMedia,
      googleMapsUrl: googleMapsPlaceDetails?.googleMapsUri,
    } satisfies PublicProducer;
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
        claimed: true,
        verified: true,
      })
      .where(eq(producers.id, producerId));

    await USER_PRODUCER_IDS_KV.push(userId, producerId);
  });
}
