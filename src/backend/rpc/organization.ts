"use server";
import {
  authenticatedActionClient,
  organizationActionClient,
} from "./helpers/middleware";
import { db } from "../db";
import { listings, organizations } from "../db/schema";
import { eq } from "drizzle-orm";
import { ListingRegisterArgsValidator } from "../validators/listings";
import { env } from "@/env";
import { ORG_DATA_KV } from "../kv";

export const registerOrganization = authenticatedActionClient
  .inputSchema(ListingRegisterArgsValidator)
  .action(async ({ ctx: { userId, orgId }, parsedInput }) => {
    if (orgId) {
      throw new Error("Already logged in as listing");
    }

    const profileUrl = `${env.SITE_URL}/defaults/store.svg`;

    const newOrganizationId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      const org = await tx
        .insert(organizations)
        .values({
          id: newOrganizationId,
          ownerUserId: userId,
          name: parsedInput.name,
          imageUrl: profileUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await tx.insert(listings).values({
        id: crypto.randomUUID(),
        organizationId: newOrganizationId,
        name: parsedInput.name,
        type: parsedInput.type,
        claimed: true,
        verified: false,
        about: parsedInput.about,
        commodities: [],
        socialMedia: { twitter: null, facebook: null, instagram: null },
        images: [],
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
  async ({ ctx: { orgId } }) => {
    const listing = await db.query.listings.findFirst({
      where: eq(listings.organizationId, orgId),
    });

    return listing;
  }
);

export const fetchLoggedInOrganizationListingLight =
  organizationActionClient.action(async ({ ctx: { orgId } }) => {
    const listing = await db
      .select({ name: listings.name })
      .from(listings)
      .where(eq(listings.organizationId, orgId))
      .limit(1);

    return listing[0];
  });
