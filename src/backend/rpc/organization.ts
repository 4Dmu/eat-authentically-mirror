"use server";

import {
  authenticatedActionClient,
  organizationActionClient,
} from "./helpers/middleware";
import { db } from "../db";
import { listings, organizations } from "../db/schema";
import { eq } from "drizzle-orm";
import { registerListingArgsValidator } from "../validators/listings";
import { ORG_DATA_KV } from "../kv";
import { withCertifications } from "../utils/transform-data";

export const registerOrganization = authenticatedActionClient
  .input(registerListingArgsValidator)
  .action(async ({ ctx: { userId, orgId }, input }) => {
    if (orgId) {
      throw new Error("Already logged in as listing");
    }

    const profileUrl = `/defaults/store.png`;

    const newOrganizationId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      const org = await tx
        .insert(organizations)
        .values({
          id: newOrganizationId,
          ownerUserId: userId,
          name: input.name,
          imageUrl: profileUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await tx.insert(listings).values({
        id: crypto.randomUUID(),
        organizationId: newOrganizationId,
        name: input.name,
        type: input.type,
        claimed: true,
        verified: false,
        about: input.about,
        commodities: [],
        socialMedia: { twitter: null, facebook: null, instagram: null },
        images: {
          items: [],
          primaryImgId: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await ORG_DATA_KV.set(org[0]);
    });

    return {
      organizationId: newOrganizationId,
    };
  });

export const fetchLoggedInOrganizationListing = organizationActionClient.action(
  async ({ orgId }) => {
    const results = await db.query.listings
      .findMany({
        where: eq(listings.organizationId, orgId),
        with: {
          certificationsToListings: {
            with: {
              certification: true,
            },
          },
        },
        limit: 1,
      })
      .then((r) => withCertifications(r));

    return results[0];
  }
);

export const fetchLoggedInOrganizationListingLight =
  organizationActionClient.action(async ({ orgId }) => {
    const listing = await db
      .select({ name: listings.name })
      .from(listings)
      .where(eq(listings.organizationId, orgId))
      .limit(1);

    return listing[0];
  });
