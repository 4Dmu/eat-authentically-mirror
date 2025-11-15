"use server";
import { db } from "@ea/db";
import {
  mediaAssetSelectValidator,
  producerMediaSelectValidator,
} from "@ea/db/contracts";
import {
  certifications,
  commodities,
  mediaAssets,
  type PendingMediaAssetInsert,
  type ProducerContactSelect,
  type ProducerInsert,
  type ProducerLocationSelect,
  type ProducerSelect,
  type ProducersSearchSelect,
  pendingMediaAssets,
  producerCertifications,
  producerCommodities,
  producerContact,
  producerLocation,
  producerMedia,
  producers,
  producersSearch,
} from "@ea/db/schema";
import { USER_PRODUCER_IDS_KV } from "@ea/kv";
import { type ProducerSearchResultRow, typesense } from "@ea/search";
import {
  addCommodityAndAssociateArgsValidator,
  deleteProducerArgs,
  editProducerArgsValidatorV2,
  editProducerCertificationsArgsValidator,
  editProducerCommodotiesArgsValidator,
  editProducerContactArgsValidator,
  editProducerLocationArgsValidator,
  registerProducerArgsValidator,
} from "@ea/validators/producers";
import { type } from "arktype";
import { logger } from "better-auth";
import { and, asc, eq, inArray, ne, notInArray, sql } from "drizzle-orm";
import ngeo from "ngeohash";
import { env } from "@/env";
import { cloudflare } from "@/lib/cloudflare";
import { authenticatedActionClient } from "./helpers/middleware";

export const edit = authenticatedActionClient
  .input(editProducerArgsValidatorV2)
  .name("producers.edit")
  .action(async ({ input }) => {
    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, input.id)),
      columns: {
        id: true,
        summary: true,
      },
    });

    if (!producer) {
      throw new Error("Producer not found");
    }

    const toUpdate: Partial<ProducerSelect> = {};
    const toUpdateTypesense: Partial<ProducerSearchResultRow> = {};
    const toUpdateSearch: Partial<ProducersSearchSelect> = {};

    if (input.name) {
      toUpdate.name = input.name;
      toUpdateSearch.searchName = input.name;
      toUpdateTypesense.name = input.name;
    }

    if (input.type) {
      toUpdate.type = input.type;
      toUpdateTypesense.type = input.type;
    }

    if (input.about !== undefined) {
      toUpdate.about = input.about;
      // Update search via about if summary was not set
      if (producer.summary == null) {
        toUpdateSearch.searchSummary = input.about?.substring(0, 300);
        toUpdateTypesense.summary = input.about?.substring(0, 300);
      }
    }

    if (input.summary !== undefined) {
      toUpdate.summary = input.summary;
      toUpdateSearch.searchSummary = input.summary;
      toUpdateTypesense.summary = input.summary ?? undefined;
    }

    if (Object.keys(toUpdate).length > 0) {
      await db
        .update(producers)
        .set({
          ...toUpdate,
          updatedAt: new Date(),
        })
        .where(and(eq(producers.id, producer.id)));
    }

    if (Object.keys(toUpdateTypesense).length > 0) {
      const client = typesense();
      const docs = client
        .collections<ProducerSearchResultRow>("producers")
        .documents(producer.id);

      const typsenseDocResult = await docs.update(toUpdateTypesense);
      console.log(typsenseDocResult);
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

export const get = authenticatedActionClient
  .input(type({ id: "string" }))
  .name("producers.get")
  .action(async ({ input }) => {
    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, input.id)),
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

    return producer;
  });

export const create = authenticatedActionClient
  .input(registerProducerArgsValidator)
  .name("producers.create")
  .action(async ({ input }) => {
    const producerProfileId = crypto.randomUUID();

    await db.insert(producers).values({
      id: producerProfileId,
      name: input.name,
      type: input.type,
      verified: false,
      about: input.about,
      summary: input.about.substring(0, 200),
      subscriptionRank: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies ProducerInsert);

    const client = typesense();
    const docs = client
      .collections<ProducerSearchResultRow>("producers")
      .documents();

    const typsenseDocResult = await docs.create({
      id: producerProfileId,
      userId: undefined,
      verified: true,
      name: input.name,
      type: input.type,
      summary: input.about.substring(0, 200),
      avgRating: 0,
      bayesAvg: 0,
      reviewCount: 0,
      subscriptionRank: 0,
      certifications: [],
      commodities: [],
      labels: [],
      country: undefined,
      city: undefined,
      adminArea: undefined,
      locality: undefined,
      location: undefined,
      coverUrl: undefined,
      organic: false,
      createdAt: Math.floor(new Date().getDate() / 1000),
      updatedAt: Math.floor(new Date().getDate() / 1000),
    });

    console.log(typsenseDocResult);

    await db.insert(producersSearch).values({
      producerId: producerProfileId,
      searchName: input.name,
      searchSummary: input.about.substring(0, 300),
    });

    return producerProfileId;
  });

export const editContact = authenticatedActionClient
  .input(editProducerContactArgsValidator)
  .name("producers.editContact")
  .action(async ({ input }) => {
    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, input.producerId)),
      columns: {
        id: true,
        summary: true,
      },
    });

    if (!producer) {
      throw new Error("Producer not found");
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

export const editLocation = authenticatedActionClient
  .input(editProducerLocationArgsValidator)
  .name("producers.editLocation")
  .action(async ({ input }) => {
    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, input.producerId)),
      columns: {
        id: true,
        summary: true,
      },
    });

    if (!producer) {
      throw new Error("Producer not found");
    }

    const existing = await db.query.producerLocation.findFirst({
      where: eq(producerLocation.producerId, producer.id),
    });

    const toUpdate: Partial<ProducerLocationSelect> = {};
    const toUpdateTypesense: Partial<ProducerSearchResultRow> = {};
    if (input.latitude !== undefined) {
      toUpdate.latitude = input.latitude;
    }
    if (input.longitude !== undefined) {
      toUpdate.longitude = input.longitude;
    }
    if (input.locality !== undefined) {
      toUpdate.locality = input.locality;
      toUpdateTypesense.locality = input.locality ?? undefined;
    }
    if (input.city !== undefined) {
      toUpdate.city = input.city;
      toUpdateTypesense.city = input.city ?? undefined;
    }
    if (input.postcode !== undefined) {
      toUpdate.postcode = input.postcode;
    }
    if (input.adminArea !== undefined) {
      toUpdate.adminArea = input.adminArea;
      toUpdateTypesense.adminArea = input.adminArea ?? undefined;
    }
    if (input.country !== undefined) {
      toUpdate.country = input.country;
      toUpdateTypesense.country = input.country ?? undefined;
    }

    if (input.latitude !== undefined && input.longitude !== undefined) {
      if (input.latitude === null || input.longitude === null) {
        toUpdate.geohash = null;
        toUpdateTypesense.location = undefined;
      } else {
        toUpdate.geohash = ngeo.encode(input.latitude, input.longitude);
        toUpdateTypesense.location = [input.latitude, input.longitude];
      }
    } else if (input.latitude !== undefined) {
      if (
        input.latitude == null ||
        existing?.longitude === undefined ||
        existing.longitude === null
      ) {
        toUpdate.geohash = null;
        toUpdateTypesense.location = undefined;
      } else {
        toUpdate.geohash = ngeo.encode(input.latitude, existing.longitude);
        toUpdateTypesense.location = [input.latitude, existing.longitude];
      }
    } else if (input.longitude !== undefined) {
      if (
        input.longitude == null ||
        existing?.latitude === undefined ||
        existing.latitude === null
      ) {
        toUpdate.geohash = null;
        toUpdateTypesense.location = undefined;
      } else {
        toUpdate.geohash = ngeo.encode(existing.latitude, input.longitude);
        toUpdateTypesense.location = [existing.latitude, input.longitude];
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
          }),
      );
    }

    if (Object.keys(toUpdateTypesense).length > 0) {
      const client = typesense();
      const docs = client
        .collections<ProducerSearchResultRow>("producers")
        .documents(producer.id);

      const typsenseDocResult = await docs.update(toUpdateTypesense);
      console.log(typsenseDocResult);
    }
  });

export const editCertifications = authenticatedActionClient
  .input(editProducerCertificationsArgsValidator)
  .name("producers.editCertifications")
  .action(async ({ input }) => {
    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, input.producerId)),
      columns: {
        id: true,
      },
    });

    if (!producer) {
      throw new Error("Producer not found");
    }

    await db
      .delete(producerCertifications)
      .where(
        and(
          eq(producerCertifications.producerId, producer.id),
          notInArray(
            producerCertifications.certificationId,
            input.certifications,
          ),
        ),
      );

    await db
      .insert(producerCertifications)
      .values(
        input.certifications.map((cert) => ({
          producerId: input.producerId,
          certificationId: cert,
          addedAt: new Date(),
        })),
      )
      .onConflictDoNothing();

    const certs = await db.query.certifications.findMany({
      where: inArray(certifications.id, input.certifications),
    });

    const client = typesense();
    const docs = client
      .collections<ProducerSearchResultRow>("producers")
      .documents(producer.id);

    const typsenseDocResult = await docs.update({
      certifications: certs.map((cert) => cert.name),
      organic: certs.some((cert) => cert.id === env.ORGANIC_CERT_ID),
    });
    console.log(typsenseDocResult);
  });

export const editCommodities = authenticatedActionClient
  .input(editProducerCommodotiesArgsValidator)
  .name("producers.editCommodities")
  .action(async ({ input }) => {
    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, input.producerId)),
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
          notInArray(producerCommodities.commodityId, input.commodities),
        ),
      );

    const newComms = input.commodities.filter(
      (ic) => !producer.commodities.some((ec) => ec.commodityId === ic),
    );

    if (newComms.length > 0) {
      await db.insert(producerCommodities).values(
        newComms.map((cert) => ({
          producerId: input.producerId,
          commodityId: cert,
          updatedAt: new Date(),
        })),
      );
    }

    const comms = await db.query.commodities.findMany({
      where: inArray(commodities.id, input.commodities),
    });

    const client = typesense();
    const docs = client
      .collections<ProducerSearchResultRow>("producers")
      .documents(producer.id);

    const typsenseDocResult = await docs.update({
      commodities: comms.map((comm) => comm.name),
    });
    console.log(typsenseDocResult);
  });

export const addCommodityAndAssociate = authenticatedActionClient
  .input(addCommodityAndAssociateArgsValidator)
  .name("producers.addCommodityAndAssociate")
  .action(async ({ input }) => {
    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, input.producerId)),
      columns: {
        id: true,
      },
      with: {
        commodities: {
          columns: {},
          with: {
            commodity: {
              columns: {
                name: true,
              },
            },
          },
        },
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

    const comms = producer.commodities.map((c) => c.commodity.name);

    const client = typesense();
    const docs = client
      .collections<ProducerSearchResultRow>("producers")
      .documents(producer.id);

    const typsenseDocResult = await docs.update({
      commodities: [...comms, name],
    });
    console.log(typsenseDocResult);
  });

export const requestUploadUrls = authenticatedActionClient
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
    }),
  )
  .name("producers.requestUploadUrls")
  .action(
    async ({ input: { imageItemParams, producerId }, ctx: { session } }) => {
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
        where: and(eq(producers.id, producerId)),
      });

      if (!producer) {
        throw new Error("Producer not found");
      }

      const images = producer.media.filter(
        (m) =>
          m.asset.contentType === undefined ||
          m.asset.contentType?.startsWith("image/"),
      );

      const maxFiles = 10;

      const remainingFiles = maxFiles - images.length;

      if (imageItemParams.length > remainingFiles) {
        throw new Error("Number of files exceeds harcoded 10");
      }

      const urls: { id: string; uploadURL: string }[] = [];
      const pending: PendingMediaAssetInsert[] = [];

      for (let i = 0; i < imageItemParams.length; i++) {
        const item = imageItemParams[i];
        const form = new FormData();

        form.set("creator", session.user.id);
        form.set(
          "metadata",
          JSON.stringify({ producerId: producer.id, userId: session.user.id }),
        );

        const uploadUrlGeneratorCloudflareResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.SAFE_CLOUDFLARE_API_TOKEN}`,
            },
            body: form,
          },
        );

        const uploadUrlGeneratorCloudflareResponseBody =
          await uploadUrlGeneratorCloudflareResponse.json();

        if (uploadUrlGeneratorCloudflareResponseBody.success === true) {
          urls.push(uploadUrlGeneratorCloudflareResponseBody.result);
          pending.push({
            id: crypto.randomUUID(),
            pendingAssetKey: uploadUrlGeneratorCloudflareResponseBody.result.id,
            mode: "cloudflare-image",
            ownerUserId: session.user.id,
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
    },
  );

export const requestVideoUploadUrl = authenticatedActionClient
  .input(type({ producerId: "string" }))
  .name("producers.requestVideoUploadUrl")
  .action(async ({ ctx: { session }, input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(producers.id, producerId)),
    });

    if (!producer) {
      throw new Error("Producer not found");
    }

    const pendingVideo = await db.query.pendingMediaAssets.findFirst({
      where: and(
        eq(pendingMediaAssets.ownerUserId, session.user.id),
        eq(pendingMediaAssets.mode, "cloudflare-stream"),
      ),
    });

    if (pendingVideo) {
      await cloudflare.stream.delete(pendingVideo.pendingAssetKey, {
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
      });

      await db
        .delete(pendingMediaAssets)
        .where(eq(pendingMediaAssets.id, pendingVideo.id));
    }

    const form = new FormData();

    form.set("creator", session.session.userId);
    form.set("maxDurationSeconds", "120");
    form.set(
      "meta",
      JSON.stringify({
        producerId: producer.id,
        message: "Made by admin",
        userId: session.session.userId,
      }),
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
          creator: session.session.userId,
          maxDurationSeconds: 120,
          allowedOrigins: [
            "localhost:3000",
            "*.vercel.app",
            "eatauthentically.app",
            "*.eatauthentically.app",
          ],
          meta: {
            userId: session.session.userId,
            message: "Made by admin",
          },
        }),
      },
    );

    const uploadUrlGeneratorCloudflareResponseBody =
      await uploadUrlGeneratorCloudflareResponse.json();

    if (uploadUrlGeneratorCloudflareResponseBody.success === true) {
      logger.info("Cloudflare direct upload response body", {
        body: uploadUrlGeneratorCloudflareResponseBody,
      });

      await db.insert(pendingMediaAssets).values({
        id: crypto.randomUUID(),
        ownerUserId: session.user.id,
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

export const confirmPengingUpload = authenticatedActionClient
  .input(type({ producerId: "string" }))
  .name("producers.confirmPengingUpload")
  .action(async ({ ctx: { session }, input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(producers.id, producerId)),
    });

    if (!producer) {
      throw new Error("Producer not found");
    }

    const pendingImages = await db.query.pendingMediaAssets.findMany({
      where: and(
        eq(pendingMediaAssets.ownerUserId, session.user.id),
        eq(pendingMediaAssets.mode, "cloudflare-image"),
      ),
    });

    if (!pendingImages || pendingImages.length === 0) {
      throw new Error("No uploads to confirm");
    }

    try {
      const imageListResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/images/v2?creator=${session.user.id}`,
        {
          headers: {
            Authorization: `Bearer ${env.SAFE_CLOUDFLARE_API_TOKEN}`,
          },
        },
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
          (img) => img.id === pendingImage.pendingAssetKey,
        );

        if (!cloudflareImage) {
          continue;
        }

        const assetId = crypto.randomUUID();

        await db.insert(mediaAssets).values({
          id: assetId,
          uploadedByType: "admin",
          uploadedById: session.session.userId,
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
          position: pendingImage.position,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await db
          .delete(pendingMediaAssets)
          .where(eq(pendingMediaAssets.id, pendingImage.id));
      }

      const media = await db.query.producerMedia.findMany({
        where: eq(producerMedia.producerId, producer.id),
        with: {
          asset: true,
        },
      });

      const client = typesense();
      const docs = client
        .collections<ProducerSearchResultRow>("producers")
        .documents(producer.id);

      const coverUrl =
        media.find((r) => r.role === "cover")?.asset.url ?? media[0].asset.url;

      const typsenseDocResult = await docs.update({
        coverUrl: coverUrl,
      });
      console.log(typsenseDocResult);
    } catch (err) {
      console.error(err);
      throw new Error("Error generating urls");
    }
  });

export const confirmPendingVideoUpload = authenticatedActionClient
  .input(type({ producerId: "string" }))
  .name("producers.confirmPendingVideoUpload")
  .action(async ({ ctx: { session }, input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(producers.id, producerId)),
    });

    if (!producer) {
      throw new Error("Producer not found");
    }

    const pendingVideos = await db.query.pendingMediaAssets.findMany({
      where: and(
        eq(pendingMediaAssets.ownerUserId, session.user.id),
        eq(pendingMediaAssets.mode, "cloudflare-stream"),
      ),
    });

    if (!pendingVideos || pendingVideos.length === 0) {
      throw new Error("No video uploads to confirm");
    }

    try {
      const videosPage = await cloudflare.stream.list({
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
        creator: session.user.id,
      });

      for (const pendingVideo of pendingVideos) {
        const cloudflareVideo = videosPage.result.find(
          (vid) => vid.uid === pendingVideo.pendingAssetKey,
        );

        if (
          !cloudflareVideo ||
          !cloudflareVideo.status ||
          !cloudflareVideo.uid ||
          cloudflareVideo.status.state === "error" ||
          cloudflareVideo.status.state === "pendingupload"
        ) {
          continue;
        }

        const assetId = crypto.randomUUID();

        await db.insert(mediaAssets).values({
          id: assetId,
          uploadedByType: "admin",
          uploadedById: session.user.id,
          contentType: "video/*",
          url: `https://customer-a80gdw9axz7eg3xk.cloudflarestream.com/${cloudflareVideo.uid}/manifest/video.m3u8`,
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

export const deleteVideo = authenticatedActionClient
  .input(type({ producerId: "string" }))
  .name("producers.deleteVideo")
  .action(async ({ input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(producers.id, producerId)),
    });

    if (!producer) {
      throw new Error("Producer not found");
    }

    const video = await db.query.producerMedia.findFirst({
      where: and(
        eq(producerMedia.producerId, producerId),
        eq(producerMedia.role, "video"),
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

export const updateExistingImages = authenticatedActionClient
  .input(
    type({
      producerId: "string",
      data: producerMediaSelectValidator
        .and({ asset: mediaAssetSelectValidator })
        .array(),
    }),
  )
  .name("producers.updateExistingImages")
  .action(async ({ ctx: { session }, input: { producerId, data } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
      },
      where: and(eq(producers.id, producerId)),
    });

    if (!producer) {
      throw new Error("Producer not found");
    }

    const ids = data.map((r) => r.assetId);

    const imagesToDelete = await db.query.producerMedia.findMany({
      where: and(
        eq(producerMedia.producerId, producer.id),
        ne(producerMedia.role, "video"),
        notInArray(producerMedia.assetId, ids),
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
        `action [updateExistingImages] - Deleting image (${image.asset.cloudflareId}) - run by admin(${session.user.id})`,
      );

      const response = await cloudflare.images.v1.delete(
        image.asset.cloudflareId,
        {
          account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
        },
      );

      logger.info(
        `action [updateExistingImages] - Cloudflare delete image response`,
        { response: response },
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
            eq(producerMedia.assetId, image.assetId),
          ),
        );
    }

    const media = await db.query.producerMedia.findMany({
      where: eq(producerMedia.producerId, producer.id),
      with: {
        asset: true,
      },
    });

    const client = typesense();
    const docs = client
      .collections<ProducerSearchResultRow>("producers")
      .documents(producer.id);

    const coverUrl =
      media.find((r) => r.role === "cover")?.asset.url ?? media[0].asset.url;

    const typsenseDocResult = await docs.update({
      coverUrl: coverUrl,
    });
    console.log(typsenseDocResult);
  });

export const remove = authenticatedActionClient
  .input(deleteProducerArgs)
  .name("producers.remove")
  .action(async ({ ctx: { session }, input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      where: and(eq(producers.id, producerId)),
    });

    if (!producer) {
      throw new Error("Producer not found");
    }

    logger.info(
      `[deleteProducer] Starting deletion proccess - admin Id: ${session.user.id} producerId: ${producer.id}`,
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
            },
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
            },
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

    const client = typesense();
    const docs = client
      .collections<ProducerSearchResultRow>("producers")
      .documents(producerId);

    const typsenseDocResult = await docs.delete();
    console.log(typsenseDocResult);

    if (producer.userId) {
      await USER_PRODUCER_IDS_KV.pop(producer.userId, producer.id);
    }

    logger.info(`[deleteProducer] deletion successfull`, {
      deleteProducerTxResponse: delTxRes,
    });
  });
