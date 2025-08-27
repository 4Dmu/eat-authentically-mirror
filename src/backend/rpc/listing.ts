"use server";
import * as listing from "@/backend/data/listing";
import {
  editListingArgsValidator,
  GetListingArgsValidator,
  Listing,
  listingImagesValidator,
  ListListingsArgsValidator,
} from "../validators/listings";
import { actionClient } from "./helpers/safe-action";
import { organizationActionClient } from "./helpers/middleware";
import { db } from "../db";
import {
  certifications,
  certificationsToListings,
  listings,
  Video,
} from "../db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { withCertifications } from "../utils/transform-data";
import { type } from "arktype";
import { getSubTier } from "./utils/get-sub-tier";
import { env } from "@/env";
import { cloudflare } from "../lib/cloudflare";
import { normalizeAddress } from "../utils/normalize-data";
import { videoRatelimit } from "../lib/rate-limit";

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
      toUpdate.address = normalizeAddress(input.address);
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

    if (input.commodities) {
      toUpdate.commodities = input.commodities.commodities;
    }

    if (Object.keys(toUpdate).length > 0) {
      await db
        .update(listings)
        .set({
          ...toUpdate,
        })
        .where(
          and(eq(listings.id, listing.id), eq(listings.organizationId, orgId))
        );
    }
  });

export const requestUploadUrls = organizationActionClient
  .input(
    type({
      imageItemParams: type({
        isPrimary: "boolean",
        type: "string",
        name: "string",
      })
        .array()
        .atLeastLength(1)
        .atMostLength(10),
    })
  )
  .action(async ({ ctx: { orgId, userId }, input: { imageItemParams } }) => {
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

    const remainingFiles = maxFiles - listing.images.items.length;

    if (imageItemParams.length > remainingFiles) {
      throw new Error("Number of files exceeds your plan");
    }

    const urls: { id: string; uploadURL: string }[] = [];
    const pending: { id: string; isPrimary: boolean }[] = [];

    for (let i = 0; i < imageItemParams.length; i++) {
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
        pending.push({
          id: uploadUrlGeneratorCloudflareResponseBody.result.id,
          isPrimary: imageItemParams[i].isPrimary,
        });
      } else {
        console.error(uploadUrlGeneratorCloudflareResponseBody);
        throw new Error("Error generating urls");
      }
    }

    await db
      .update(listings)
      .set({
        pendingImages: pending,
      })
      .where(eq(listings.id, listing.id));

    return urls;
  });

export const requestVideoUploadUrl = organizationActionClient.action(
  async ({ orgId, userId }) => {
    const { success } = await videoRatelimit.limit(orgId);

    if (!success) {
      throw new Error("Rate limit exceded");
    }

    const listing = await db.query.listings.findFirst({
      columns: {
        id: true,
        pendingVideos: true,
        video: true,
      },
      where: eq(listings.organizationId, orgId),
    });

    if (!listing) {
      throw new Error("Unauthorized");
    }

    const tier = await getSubTier(userId);

    if (tier == "Free" || tier.tier !== "premium") {
      throw new Error("Must be premium to upload video");
    }

    if (listing.video) {
      await cloudflare.stream.delete(listing.video.uid, {
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
      });
      await db
        .update(listings)
        .set({
          video: null,
        })
        .where(eq(listings.id, listing.id));
    }

    const form = new FormData();

    form.set("creator", orgId);
    form.set("maxDurationSeconds", "120");
    form.set("meta", JSON.stringify({ orgId: orgId, userId: userId }));

    const uploadUrlGeneratorCloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SAFE_CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creator: orgId,
          maxDurationSeconds: 120,
          allowedOrigins: [
            "localhost:3000",
            "*.vercel.app",
            "eatauthentically.app",
            "*.eatauthentically.app",
          ],
          meta: {
            orgId: orgId,
            userId: userId,
          },
        }),
      }
    );

    const uploadUrlGeneratorCloudflareResponseBody =
      await uploadUrlGeneratorCloudflareResponse.json();

    if (uploadUrlGeneratorCloudflareResponseBody.success === true) {
      console.log(uploadUrlGeneratorCloudflareResponseBody);

      await db
        .update(listings)
        .set({
          pendingVideos: [
            ...(listing.pendingVideos ?? []),
            uploadUrlGeneratorCloudflareResponseBody.result.uid,
          ],
        })
        .where(eq(listings.id, listing.id));

      return uploadUrlGeneratorCloudflareResponseBody.result.uploadURL;
    } else {
      console.error(uploadUrlGeneratorCloudflareResponseBody);
      throw new Error("Error generating video url");
    }
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

      const pendingImagesThatExist = imagesListBody.result.images
        .filter((ri) => listing.pendingImages?.some((pi) => pi.id === ri.id))
        .map((i) => ({
          image: i,
          pendingData: listing.pendingImages?.find((f) => f.id === i.id),
        }));

      for (const { image, pendingData } of pendingImagesThatExist) {
        // const image = await cloudflare.images.v1.get(imageId, {
        //   account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
        // });
        if (Object.hasOwn(image, "draft")) {
          pending.push(pendingData ?? { id: image.id, isPrimary: false });
          continue;
        }

        if (pendingData?.isPrimary === true) {
          images.primaryImgId === pendingData.id;
        }

        images.items.push({
          _type: "cloudflare",
          cloudflareId: image.id,
          cloudflareUrl: `https://imagedelivery.net/${env.SAFE_CLOUDFLARE_ACCOUNT_HASH}/${image.id}/public`,
          alt: "",
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

export const confirmPendingVideoUpload = organizationActionClient.action(
  async ({ orgId }) => {
    const listing = await db.query.listings.findFirst({
      columns: {
        id: true,
        pendingVideos: true,
      },
      where: eq(listings.organizationId, orgId),
    });

    if (!listing) {
      throw new Error("Unauthorized");
    }

    if (!listing.pendingVideos || listing.pendingVideos.length === 0) {
      throw new Error("No video uploads to confirm");
    }

    try {
      const pending = [];
      let videoData: Video | undefined = undefined;

      const videosPage = await cloudflare.stream.list({
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
        creator: orgId,
      });

      const pendingVideosThatExists = videosPage.result.filter((v) =>
        listing.pendingVideos?.some((v2) => v.uid === v2)
      );

      for (const video of pendingVideosThatExists) {
        console.log(video);
        if (
          !video.status ||
          video.status.state === "error" ||
          video.status.state === "pendingupload"
        ) {
          pending.push(video.uid!);
          continue;
        }

        videoData = {
          uid: video.uid!,
          status: video.status.state === "ready" ? "ready" : "pending",
          url: `https://customer-a80gdw9axz7eg3xk.cloudflarestream.com/${video.uid!}/manifest/video.m3u8`,
          _type: "cloudflare",
        };
      }

      await db
        .update(listings)
        .set({
          pendingVideos: pending,
          video: videoData,
        })
        .where(eq(listings.id, listing.id));
    } catch (err) {
      console.error(err);
      throw new Error("Error generating urls");
    }
  }
);

export const deleteVideo = organizationActionClient.action(
  async ({ orgId }) => {
    const listing = await db.query.listings.findFirst({
      columns: {
        id: true,
        video: true,
      },
      where: eq(listings.organizationId, orgId),
    });

    if (!listing || !listing.video) {
      throw new Error("Unauthorized");
    }

    await cloudflare.stream.delete(listing.video.uid, {
      account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
    });

    await db
      .update(listings)
      .set({
        video: null,
      })
      .where(eq(listings.id, listing.id));
  }
);

export const updateExistingImages = organizationActionClient
  .input(listingImagesValidator)
  .action(async ({ ctx: { orgId, userId }, input }) => {
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

    const imagesToKeep = listing.images.items.filter((i) =>
      input.items.some((i2) => i.cloudflareId === i2.cloudflareId)
    );

    const imagesToDelete = listing.images.items.filter(
      (i) => !input.items.some((i2) => i.cloudflareId === i2.cloudflareId)
    );

    await db
      .update(listings)
      .set({
        images: {
          items: imagesToKeep,
          primaryImgId:
            input.primaryImgId ??
            imagesToKeep.find(
              (i) => i.cloudflareId === listing.images.primaryImgId
            )?.cloudflareId ??
            null,
        },
      })
      .where(eq(listings.id, listing.id));

    for (const image of imagesToDelete) {
      console.log(
        `action [updateExistingImages] - Deleting image (${image.cloudflareId}) - run by org(${orgId}) user(${userId})`
      );

      const response = await cloudflare.images.v1.delete(image.cloudflareId, {
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
      });

      console.log(
        `action [updateExistingImages] - Cloudflare delete image response`,
        response
      );
    }
  });
