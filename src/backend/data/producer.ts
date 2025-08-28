import type {
  GetProducerArgs,
  ListProducerArgs,
  PublicProducer,
} from "@/backend/validators/producers";
import { db } from "../db";
import { and, desc, eq, inArray, like, SQL, sql } from "drizzle-orm";
import { certificationsToProducers, producers } from "../db/schema";
import * as transformers from "@/backend/utils/transform-data";
import { USER_PRODUCER_IDS_KV } from "../kv";

export async function getUsersProducerIdsCached(userId: string) {
  const profileIds = await USER_PRODUCER_IDS_KV.get(userId);

  if (profileIds) {
    return profileIds;
  }

  return await db
    .select({ id: producers.id })
    .from(producers)
    .where(eq(producers.userId, userId))
    .then((r) => r.map((i) => i.id));
}

const orderProducersByScrapedMetadata = sql`
  CASE
    WHEN scrapeMeta IS NOT NULL THEN 1
    ELSE 0
  END,
  CASE json_extract(scrapeMeta, '$.status')
      WHEN 'Registered' THEN 0
      ELSE 1
    END,
  CAST(json_extract(scrapeMeta, '$.numFavorites') AS INTEGER) DESC,
  CASE json_array_length(images) > 0
    WHEN true THEN 0
      ELSE 1
    END`;

export async function listProducersPublic(args: ListProducerArgs) {
  try {
    const limit = 100;
    const offest = args.page * limit;

    const queries: (SQL | undefined)[] = [];

    if (args.type) {
      queries.push(eq(producers.type, args.type));
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
      console.log(args.locationSearchArea);

      queries.push(
        and(
          sql`CAST(json_extract(address, '$.coordinate.latitude') AS INTEGER) BETWEEN ${south} AND ${north}`,
          sql`CAST(json_extract(address, '$.coordinate.longitude') AS INTEGER)  BETWEEN ${west} AND ${east}`
        )
      );
    }

    const producersQuery = await db.query.producers.findMany({
      orderBy: [orderProducersByScrapedMetadata, desc(producers.createdAt)],
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
      },
      with: {
        certificationsToProducers: {
          columns: {},
          with: {
            certification: true,
          },
        },
      },
      limit: limit + 1,
      offset: offest,
      where: queries.length > 0 ? and(...queries) : undefined,
    });

    const hasNextPage = producersQuery.length > limit;
    const paginatedProducers = hasNextPage
      ? producersQuery.slice(0, limit)
      : producersQuery;

    const result = transformers.withCertifications(paginatedProducers);

    return {
      data: result satisfies PublicProducer[],
      hasNextPage,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Error loading producers");
  }
}

export async function listProducersPublicLight(args: ListProducerArgs) {
  try {
    const limit = 100;
    const offest = args.page * limit;

    const queries: (SQL | undefined)[] = [];

    if (args.type) {
      queries.push(eq(producers.type, args.type));
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
      console.log(args.locationSearchArea);

      queries.push(
        and(
          sql`CAST(json_extract(address, '$.coordinate.latitude') AS INTEGER) BETWEEN ${south} AND ${north}`,
          sql`CAST(json_extract(address, '$.coordinate.longitude') AS INTEGER)  BETWEEN ${west} AND ${east}`
        )
      );
    }

    if (args.query) {
      console.log(args.query);
      queries.push(like(producers.name, `%${args.query.toLowerCase()}%`));
    }

    const producersQuery = await db.query.producers.findMany({
      orderBy: [orderProducersByScrapedMetadata, desc(producers.createdAt)],
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
      limit: limit + 1,
      offset: offest,
    });

    const hasNextPage = producersQuery.length > limit;
    const paginatedProducers = hasNextPage
      ? producersQuery.slice(0, limit)
      : producersQuery;

    const result = transformers.withCertifications(paginatedProducers);

    return {
      data: result,
      hasNextPage,
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
