"use server";
import * as listing from "@/backend/data/listing";
import {
  editListingArgsValidator,
  GetListingArgsValidator,
  Listing,
  ListListingsArgsValidator,
} from "../validators/listings";
import { actionClient } from "./helpers/safe-action";
import { organizationActionClient } from "./helpers/middleware";
import { db } from "../db";
import {
  certifications,
  certificationsToListings,
  listings,
} from "../db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { withCertifications } from "../utils/transform-data";
import { type } from "arktype";
import { getSubTier } from "./utils/get-sub-tier";
import { env } from "@/env";

export const listListingsPublic = actionClient
  .input(ListListingsArgsValidator)
  .action(async ({ input }) => await listing.listListingsPublic(input));

export const listListingsPublicLight = actionClient
  .input(ListListingsArgsValidator)
  .action(async ({ input }) => await listing.listListingsPublicLight(input));

export const listCertificationTypesPublic = actionClient.action(
  async () => await listing.listCertificationTypesPublic()
);

export const getListingPublic = actionClient
  .input(GetListingArgsValidator)
  .action(async ({ input }) => await listing.getListingPublic(input));

export const editUserListing = organizationActionClient
  .input(editListingArgsValidator)
  .action(async ({ input, ctx: { orgId } }) => {
    const listing = await db.query.listings.findFirst({
      where: and(
        eq(listings.id, input.listingId),
        eq(listings.organizationId, orgId)
      ),
    });

    if (!listing) {
      throw new Error("Unauthorized");
    }

    const toUpdate: Partial<Listing> = {};

    if (input.basicInfo) {
      toUpdate.name = input.basicInfo.name;
      toUpdate.type = input.basicInfo.type;
      toUpdate.about = input.basicInfo.about;
    }

    if (input.address) {
      toUpdate.address = input.address;
    }

    if (input.contact) {
      toUpdate.contact = input.contact;
    }

    if (input.socialMedia) {
      toUpdate.socialMedia = input.socialMedia;
    }

    if (input.certifications && input.certifications.certifications) {
      const updatedCertifications = input.certifications.certifications;
      const currentCertifications = await db.query.listings
        .findFirst({
          where: and(
            eq(listings.id, input.listingId),
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
            input.certifications.certifications.map((cert) => ({
              listingId: listing.id,
              certificationId: cert.id,
            }))
          );
        } catch (err) {
          console.log(err);
        }
      }
    }

    if (input.products) {
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
  .input(type({ numberOfUrlsToGenerate: type.number.moreThan(0).atMost(10) }))
  .action(
    async ({ ctx: { orgId, userId }, input: { numberOfUrlsToGenerate } }) => {
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
  async ({ orgId }) => {
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
      const imageListResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/images/v2?creator=${orgId}`,
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

      const pendingImagesThatExist = imagesListBody.result.images.filter((ri) =>
        listing.pendingImages?.some((pi) => pi === ri.id)
      );

      for (const image of pendingImagesThatExist) {
        // const image = await cloudflare.images.v1.get(imageId, {
        //   account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
        // });
        if (Object.hasOwn(image, "draft")) {
          pending.push(image.id);
          continue;
        }

        images.push({
          _type: "cloudflare",
          cloudflareId: image.id,
          cloudflareUrl: `https://imagedelivery.net/${env.SAFE_CLOUDFLARE_ACCOUNT_HASH}/${image.id}/public`,
          alt: "",
          isPrimary: false,
        });
      }

      await db
        .update(listings)
        .set({
          images: images,
          pendingImages: pending,
        })
        .where(eq(listings.id, listing.id));
    } catch (err) {
      console.error(err);
      throw new Error("Error generating urls");
    }
  }
);
