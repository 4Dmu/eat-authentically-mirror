import type {
  GetListingArgs,
  ListListingsArgs,
  PublicListing,
} from "@/backend/validators/listings";
import { db } from "../db";
import { and, desc, eq, inArray, SQL, sql } from "drizzle-orm";
import { certificationsToListings, listings } from "../db/schema";
import * as transformers from "@/backend/utils/transform-data";

const orderListingsByScrapedMetadata = sql`CASE json_extract(scrapeMeta, '$.status')
        WHEN 'Registered' THEN 0
        ELSE 1
      END,
    CAST(json_extract(scrapeMeta, '$.numFavorites') AS INTEGER) DESC,
    CASE json_array_length(images) > 0
      WHEN true THEN 0
        ELSE 1
      END`;

export async function listListingsPublic(args: ListListingsArgs) {
  try {
    const limit = 100;
    const offest = args.page * limit;

    const queries: (SQL | undefined)[] = [];

    if (args.type) {
      queries.push(eq(listings.type, args.type));
    }

    if (args.certs.length > 0) {
      queries.push(
        inArray(
          listings.id,
          db
            .select({ listingId: certificationsToListings.listingId })
            .from(certificationsToListings)
            .where(
              inArray(certificationsToListings.certificationId, args.certs)
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

    const listingsQuery = await db.query.listings.findMany({
      orderBy: [orderListingsByScrapedMetadata, desc(listings.createdAt)],
      columns: {
        id: true,
        name: true,
        images: true,
        type: true,
        claimed: true,
        about: true,
        contact: true,
        address: true,
      },
      with: {
        certificationsToListings: {
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

    const hasNextPage = listingsQuery.length > limit;
    const paginatedListings = hasNextPage
      ? listingsQuery.slice(0, limit)
      : listingsQuery;

    const result = transformers.withCertifications(paginatedListings);

    return {
      data: result satisfies PublicListing[],
      hasNextPage,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Error loading listings");
  }
}

export async function listListingsPublicLight(args: ListListingsArgs) {
  try {
    const limit = 100;
    const offest = args.page * limit;

    const queries: (SQL | undefined)[] = [];

    if (args.type) {
      queries.push(eq(listings.type, args.type));
    }

    if (args.certs.length > 0) {
      queries.push(
        inArray(
          listings.id,
          db
            .select({ listingId: certificationsToListings.listingId })
            .from(certificationsToListings)
            .where(
              inArray(certificationsToListings.certificationId, args.certs)
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

    const listingsQuery = await db.query.listings.findMany({
      orderBy: [orderListingsByScrapedMetadata, desc(listings.createdAt)],
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
        certificationsToListings: {
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

    const hasNextPage = listingsQuery.length > limit;
    const paginatedListings = hasNextPage
      ? listingsQuery.slice(0, limit)
      : listingsQuery;

    const result = transformers.withCertifications(paginatedListings);

    return {
      data: result,
      hasNextPage,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Error loading listings");
  }
}

export async function getListingPublic(args: GetListingArgs) {
  try {
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, args.id),
      with: {
        certificationsToListings: {
          columns: {},
          with: {
            certification: true,
          },
        },
      },
    });

    if (!listing) {
      throw new Error("Listing not found");
    }

    const {
      id,
      name,
      type,
      about,
      claimed,
      images,
      contact,
      certificationsToListings,
      address,
    } = listing;

    return {
      id,
      name,
      type,
      about,
      claimed,
      images,
      certifications: certificationsToListings.map((c) => c.certification),
      address,
      contact,
    } satisfies PublicListing;
  } catch (err) {
    console.error(err);
    throw new Error("Error loading listing");
  }
}

export async function listCertificationTypesPublic() {
  const certs = await db.query.certifications.findMany();

  return certs;
}
