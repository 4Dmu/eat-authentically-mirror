"use server";
import * as listing from "@/backend/data/listing";
import {
  editListingArgsValidator,
  GetListingArgsValidator,
  Listing,
  ListListingsArgsValidator,
} from "../validators/listings";
import { actionClient } from "./helpers/safe-action";
import {
  authenticatedActionClient,
  organizationActionClient,
} from "./helpers/middleware";
import { db } from "../db";
import {
  certifications,
  certificationsToListings,
  listings,
} from "../db/schema";
import { and, eq, inArray, or } from "drizzle-orm";
import { withCertifications } from "../utils/transform-data";
import { type } from "arktype";
import { getSubTier } from "./utils/get-sub-tier";
import { cloudflare } from "../lib/cloudflare";
import { env } from "@/env";

export const listListingsPublic = actionClient
  .inputSchema(ListListingsArgsValidator)
  .action(
    async ({ parsedInput }) => await listing.listListingsPublic(parsedInput)
  );

export const listListingsPublicLight = actionClient
  .inputSchema(ListListingsArgsValidator)
  .action(
    async ({ parsedInput }) =>
      await listing.listListingsPublicLight(parsedInput)
  );

export const listCertificationTypesPublic = actionClient.action(
  async () => await listing.listCertificationTypesPublic()
);

export const getListingPublic = actionClient
  .inputSchema(GetListingArgsValidator)
  .action(
    async ({ parsedInput }) => await listing.getListingPublic(parsedInput)
  );

export const editUserListing = organizationActionClient
  .inputSchema(editListingArgsValidator)
  .action(async ({ parsedInput, ctx: { orgId } }) => {
    const listing = await db.query.listings.findFirst({
      where: and(
        eq(listings.id, parsedInput.listingId),
        eq(listings.organizationId, orgId)
      ),
    });

    if (!listing) {
      throw new Error("Unauthorized");
    }

    const toUpdate: Partial<Listing> = {};

    if (parsedInput.basicInfo) {
      toUpdate.name = parsedInput.basicInfo.name;
      toUpdate.type = parsedInput.basicInfo.type;
      toUpdate.about = parsedInput.basicInfo.about;
    }

    if (parsedInput.address) {
      toUpdate.address = parsedInput.address;
    }

    if (parsedInput.contact) {
      toUpdate.contact = parsedInput.contact;
    }

    if (parsedInput.socialMedia) {
      toUpdate.socialMedia = parsedInput.socialMedia;
    }

    if (
      parsedInput.certifications &&
      parsedInput.certifications.certifications
    ) {
      const updatedCertifications = parsedInput.certifications.certifications;
      const currentCertifications = await db.query.listings
        .findFirst({
          where: and(
            eq(listings.id, parsedInput.listingId),
            eq(listings.organizationId, orgId)
          ),
          columns: {},
          with: {
            certificationsToListings: {
              columns: {},
              with: {
                certification: true,
              },
            },
          },
        })
        .then((r) => withCertifications(r ? [r] : [])[0]?.certifications ?? []);

      if (currentCertifications && currentCertifications.length > 0) {
        const addedCerts = updatedCertifications.filter(
          (cert) =>
            !currentCertifications.some((oldCert) => oldCert.id === cert.id)
        );
        const removedCerts = currentCertifications.filter(
          (cert) => !updatedCertifications.some((c) => c.id === cert.id)
        );

        try {
          await db.insert(certificationsToListings).values(
            addedCerts.map((cert) => ({
              listingId: listing.id,
              certificationId: cert.id,
            }))
          );

          await db.delete(certifications).where(
            inArray(
              certifications.id,
              removedCerts.map((c) => c.id)
            )
          );
        } catch (err) {
          console.log(err);
        }
      } else {
        try {
          await db.insert(certificationsToListings).values(
            parsedInput.certifications.certifications.map((cert) => ({
              listingId: listing.id,
              certificationId: cert.id,
            }))
          );
        } catch (err) {
          console.log(err);
        }
      }
    }

    if (parsedInput.products) {
      console.warn("implement product saving");
    }

    await db
      .update(listings)
      .set({
        ...toUpdate,
      })
      .where(
        and(eq(listings.id, listing.id), eq(listings.organizationId, orgId))
      );
  });

export const requestUploadUrls = organizationActionClient
  .inputSchema(
    type({ numberOfUrlsToGenerate: type.number.moreThan(0).atMost(10) })
  )
  .action(
    async ({
      ctx: { orgId, userId },
      parsedInput: { numberOfUrlsToGenerate },
    }) => {
      const listing = await db.query.listings.findFirst({
        columns: {
          id: true,
          images: true,
          pendingImages: true,
        },
        where: eq(listings.organizationId, orgId),
      });

      if (!listing) {
        throw new Error("Unauthorized");
      }

      const tier = await getSubTier(userId);

      const maxFiles =
        tier === "Free"
          ? 1
          : tier.tier === "community"
          ? 1
          : tier.tier === "pro"
          ? 4
          : tier.tier === "premium"
          ? 5
          : 1;

      const remainingFiles = maxFiles - listing.images.length;

      if (numberOfUrlsToGenerate > remainingFiles) {
        throw new Error("Number of files exceeds your plan");
      }

      const urls: { id: string; uploadURL: string }[] = [];

      for (let i = 0; i < numberOfUrlsToGenerate; i++) {
        const form = new FormData();

        form.set("creator", orgId);
        form.set("metadata", JSON.stringify({ orgId: orgId, userId: userId }));

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
        } else {
          console.error(uploadUrlGeneratorCloudflareResponseBody);
          throw new Error("Error generating urls");
        }
      }

      await db
        .update(listings)
        .set({
          pendingImages: urls.map((url) => url.id),
        })
        .where(eq(listings.id, listing.id));

      return urls;
    }
  );

export const confirmPengingUpload = organizationActionClient.action(
  async ({ ctx: { orgId } }) => {
    const listing = await db.query.listings.findFirst({
      columns: {
        id: true,
        images: true,
        pendingImages: true,
      },
      where: eq(listings.organizationId, orgId),
    });

    if (!listing) {
      throw new Error("Unauthorized");
    }

    if (!listing.pendingImages || listing.pendingImages.length === 0) {
      throw new Error("No uploads to confirm");
    }

    const pending = [];
    const images = listing.images;

    try {
      for (const imageId of listing.pendingImages) {
        const image = await cloudflare.images.v1.get(imageId, {
          account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
        });
        if (Object.hasOwn(image, "draft")) {
          pending.push(imageId);
          continue;
        }

        images.push({
          _type: "cloudflare",
          cloudflareId: imageId,
          cloudflareUrl: `https://imagedelivery.net/${env.SAFE_CLOUDFLARE_ACCOUNT_HASH}/${imageId}/public`,
          alt: "",
          isPrimary: false,
        });

        listing.pendingImages;
      }
    } catch (err) {}

    await db
      .update(listings)
      .set({
        images: images,
        pendingImages: pending,
      })
      .where(eq(listings.id, listing.id));
  }
);
