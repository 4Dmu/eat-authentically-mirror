"use server";
import * as listing from "@/backend/data/producer";
import {
  editProducerArgsValidator,
  getProducersArgsValidator,
  Producer,
  producerImagesValidator,
  listProducersArgsValidator,
  claimProducerArgs,
  checkClaimDomainDnsArgs,
  PublicClaimRequest,
  deleteProducerArgs,
} from "../validators/producers";
import { actionClient } from "./helpers/safe-action";
import { producerActionClient } from "./helpers/middleware";
import { db } from "../db";
import {
  certificationsToProducers,
  claimRequests,
  producers,
  Video,
} from "../db/schema";
import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { withCertifications } from "../utils/transform-data";
import { type } from "arktype";
import { getSubTier } from "./utils/get-sub-tier";
import { env } from "@/env";
import { cloudflare } from "../lib/cloudflare";
import { normalizeAddress } from "../utils/normalize-data";
import {
  producerClaimDnsCheckRatelimit,
  videoRatelimit,
} from "../lib/rate-limit";
import { authenticatedActionClient } from "./helpers/middleware";
import {
  PublicProducerLight,
  registerProducerArgsValidator,
} from "../validators/producers";
import { withCertificationsSingle } from "../utils/transform-data";
import isURL from "validator/es/lib/isURL";
import { resend } from "../lib/resend";
import ClaimListingEmail from "@/components/emails/claim-listing-email";
import { generateToken } from "../utils/generate-tokens";
import { getAllDnsRecords, getDnsRecords } from "@layered/dns-records";
import { CLAIM_DNS_TXT_RECORD_NAME } from "./helpers/constants";
import { getLoggedInUserProducerIds } from "./auth";

export const registerProducer = authenticatedActionClient
  .input(registerProducerArgsValidator)
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

    await db.insert(producers).values({
      id: producerProfileId,
      userId: userId,
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

    return producerProfileId;
  });

export const fetchUserProducer = producerActionClient
  .input(type("string"))
  .action(async ({ input, ctx: { producerIds, userId } }) => {
    const result = await db.query.producers
      .findFirst({
        where: and(
          eq(producers.id, input),
          inArray(producers.id, producerIds),
          eq(producers.userId, userId),
        ),
        with: {
          certificationsToProducers: {
            with: {
              certification: true,
            },
          },
        },
      })
      .then((r) => (r ? withCertificationsSingle(r) : r));

    return result;
  });

export const fetchUserProducers = authenticatedActionClient.action(
  async ({ producerIds, userId }) => {
    const result = await db.query.producers
      .findMany({
        where: and(
          inArray(producers.id, producerIds),
          eq(producers.userId, userId),
        ),
        with: {
          certificationsToProducers: {
            with: {
              certification: true,
            },
          },
        },
      })
      .then((r) => (r ? withCertifications(r) : r));

    return result;
  },
);

export const fetchUserProducerLight = producerActionClient
  .input(type("string"))
  .action(async ({ input, ctx: { producerIds, userId } }) => {
    const result = await db.query.producers
      .findFirst({
        where: and(
          eq(producers.id, input),
          inArray(producers.id, producerIds),
          eq(producers.userId, userId),
        ),
        with: {
          certificationsToProducers: {
            with: {
              certification: true,
            },
          },
        },
      })
      .then((r) => (r ? withCertificationsSingle(r) : r));

    return result satisfies PublicProducerLight | undefined;
  });

export const listProducersPublic = actionClient
  .input(listProducersArgsValidator)
  .action(async ({ input }) => await listing.listProducersPublic(input));

export const listProducersPublicLight = actionClient
  .input(listProducersArgsValidator)
  .action(async ({ input }) => await listing.listProducersPublicLight(input));

export const listCertificationTypesPublic = actionClient.action(
  async () => await listing.listCertificationTypesPublic(),
);

export const getProducerPublic = actionClient
  .input(getProducersArgsValidator)
  .action(async ({ input }) => await listing.getProducerPublic(input));

export const editProducer = producerActionClient
  .input(editProducerArgsValidator)
  .action(async ({ input, ctx: { userId } }) => {
    const producer = await db.query.producers.findFirst({
      where: and(
        eq(producers.id, input.producerId),
        eq(producers.userId, userId),
      ),
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const toUpdate: Partial<Producer> = {};

    if (input.name) {
      toUpdate.name = input.name;
    }

    if (input.type) {
      toUpdate.type = input.type;
    }

    if (input.about !== undefined) {
      toUpdate.about = input.about;
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

    if (input.certifications && input.certifications) {
      const updatedCertifications = input.certifications;
      const currentCertifications = await db.query.producers
        .findFirst({
          where: and(
            eq(producers.id, input.producerId),
            eq(producers.userId, userId),
          ),
          columns: {},
          with: {
            certificationsToProducers: {
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
            !currentCertifications.some((oldCert) => oldCert.id === cert.id),
        );
        const removedCerts = currentCertifications.filter(
          (cert) => !updatedCertifications.some((c) => c.id === cert.id),
        );

        try {
          if (addedCerts.length > 0) {
            await db.insert(certificationsToProducers).values(
              addedCerts.map((cert) => ({
                listingId: producer.id,
                certificationId: cert.id,
              })),
            );
          }
          await db.delete(certificationsToProducers).where(
            inArray(
              certificationsToProducers.certificationId,
              removedCerts.map((c) => c.id),
            ),
          );
        } catch (err) {
          console.log(err);
        }
      } else {
        try {
          await db.insert(certificationsToProducers).values(
            input.certifications.map((cert) => ({
              listingId: producer.id,
              certificationId: cert.id,
            })),
          );
        } catch (err) {
          console.log(err);
        }
      }
    }

    if (input.commodities) {
      toUpdate.commodities = input.commodities;
    }

    if (Object.keys(toUpdate).length > 0) {
      await db
        .update(producers)
        .set({
          ...toUpdate,
          updatedAt: new Date(),
        })
        .where(
          and(eq(producers.id, producer.id), eq(producers.userId, userId)),
        );
    }
  });

export const requestUploadUrls = producerActionClient
  .input(
    type({
      producerId: "string",
      imageItemParams: type({
        isPrimary: "boolean",
        type: "string",
        name: "string",
      })
        .array()
        .atLeastLength(1)
        .atMostLength(10),
    }),
  )
  .action(
    async ({ ctx: { userId }, input: { imageItemParams, producerId } }) => {
      const producer = await db.query.producers.findFirst({
        columns: {
          id: true,
          images: true,
          pendingImages: true,
        },
        where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
      });

      if (!producer) {
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
              : tier.tier === "premium" || tier.tier === "enterprise"
                ? 5
                : 1;

      const remainingFiles = maxFiles - producer.images.items.length;

      if (imageItemParams.length > remainingFiles) {
        throw new Error("Number of files exceeds your plan");
      }

      const urls: { id: string; uploadURL: string }[] = [];
      const pending: { id: string; isPrimary: boolean }[] = [];

      for (let i = 0; i < imageItemParams.length; i++) {
        const form = new FormData();

        form.set("creator", userId);
        form.set(
          "metadata",
          JSON.stringify({ producerId: producer.id, userId: userId }),
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
            id: uploadUrlGeneratorCloudflareResponseBody.result.id,
            isPrimary: imageItemParams[i].isPrimary,
          });
        } else {
          console.error(uploadUrlGeneratorCloudflareResponseBody);
          throw new Error("Error generating urls");
        }
      }

      await db
        .update(producers)
        .set({
          pendingImages: pending,
          updatedAt: new Date(),
        })
        .where(eq(producers.id, producer.id));

      return urls;
    },
  );

export const requestVideoUploadUrl = producerActionClient
  .input(type({ producerId: "string" }))
  .action(async ({ ctx: { userId }, input: { producerId } }) => {
    const { success } = await videoRatelimit.limit(userId);

    if (!success) {
      throw new Error("Rate limit exceded");
    }

    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
        pendingVideos: true,
        video: true,
      },
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const tier = await getSubTier(userId);

    if (
      tier == "Free" ||
      !(tier.tier === "enterprise" || tier.tier === "premium")
    ) {
      throw new Error("Must be premium to upload video");
    }

    if (producer.video) {
      await cloudflare.stream.delete(producer.video.uid, {
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
      });
      await db
        .update(producers)
        .set({
          video: null,
          updatedAt: new Date(),
        })
        .where(eq(producers.id, producer.id));
    }

    const form = new FormData();

    form.set("creator", userId);
    form.set("maxDurationSeconds", "120");
    form.set(
      "meta",
      JSON.stringify({ producerId: producer.id, userId: userId }),
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
            producerId: userId,
            userId: userId,
          },
        }),
      },
    );

    const uploadUrlGeneratorCloudflareResponseBody =
      await uploadUrlGeneratorCloudflareResponse.json();

    if (uploadUrlGeneratorCloudflareResponseBody.success === true) {
      console.log(uploadUrlGeneratorCloudflareResponseBody);

      await db
        .update(producers)
        .set({
          pendingVideos: [
            ...(producer.pendingVideos ?? []),
            uploadUrlGeneratorCloudflareResponseBody.result.uid,
          ],
          updatedAt: new Date(),
        })
        .where(eq(producers.id, producer.id));

      return uploadUrlGeneratorCloudflareResponseBody.result.uploadURL;
    } else {
      console.error(uploadUrlGeneratorCloudflareResponseBody);
      throw new Error("Error generating video url");
    }
  });

export const confirmPengingUpload = producerActionClient
  .input(type({ producerId: "string" }))
  .action(async ({ ctx: { userId }, input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
        images: true,
        pendingImages: true,
      },
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    if (!producer.pendingImages || producer.pendingImages.length === 0) {
      throw new Error("No uploads to confirm");
    }

    const pending = [];
    const images = producer.images;

    try {
      const imageListResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.SAFE_CLOUDFLARE_ACCOUNT_ID}/images/v2?creator=${userId}`,
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

      const pendingImagesThatExist = imagesListBody.result.images
        .filter((ri) => producer.pendingImages?.some((pi) => pi.id === ri.id))
        .map((i) => ({
          image: i,
          pendingData: producer.pendingImages?.find((f) => f.id === i.id),
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
          images.primaryImgId = pendingData.id;
        }

        images.items.push({
          _type: "cloudflare",
          cloudflareId: image.id,
          cloudflareUrl: `https://imagedelivery.net/${env.SAFE_CLOUDFLARE_ACCOUNT_HASH}/${image.id}/public`,
          alt: "",
        });
      }

      await db
        .update(producers)
        .set({
          images: images,
          pendingImages: pending,
          updatedAt: new Date(),
        })
        .where(eq(producers.id, producer.id));
    } catch (err) {
      console.error(err);
      throw new Error("Error generating urls");
    }
  });

export const confirmPendingVideoUpload = producerActionClient
  .input(type({ producerId: "string" }))
  .action(async ({ ctx: { userId }, input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
        pendingVideos: true,
      },
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    if (!producer.pendingVideos || producer.pendingVideos.length === 0) {
      throw new Error("No video uploads to confirm");
    }

    try {
      const pending = [];
      let videoData: Video | undefined = undefined;

      const videosPage = await cloudflare.stream.list({
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
        creator: userId,
      });

      const pendingVideosThatExists = videosPage.result.filter((v) =>
        producer.pendingVideos?.some((v2) => v.uid === v2),
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
        .update(producers)
        .set({
          pendingVideos: pending,
          video: videoData,
          updatedAt: new Date(),
        })
        .where(eq(producers.id, producer.id));
    } catch (err) {
      console.error(err);
      throw new Error("Error generating urls");
    }
  });

export const deleteVideo = producerActionClient
  .input(type({ producerId: "string" }))
  .action(async ({ ctx: { userId }, input: { producerId } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
        video: true,
      },
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer || !producer.video) {
      throw new Error("Unauthorized");
    }

    await cloudflare.stream.delete(producer.video.uid, {
      account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
    });

    await db
      .update(producers)
      .set({
        video: null,
        updatedAt: new Date(),
      })
      .where(eq(producers.id, producer.id));
  });

export const updateExistingImages = producerActionClient
  .input(type({ producerId: "string", data: producerImagesValidator }))
  .action(async ({ ctx: { userId }, input: { producerId, data } }) => {
    const producer = await db.query.producers.findFirst({
      columns: {
        id: true,
        images: true,
        pendingImages: true,
      },
      where: and(eq(producers.id, producerId), eq(producers.userId, userId)),
    });

    if (!producer) {
      throw new Error("Unauthorized");
    }

    const imagesToKeep = producer.images.items.filter((i) =>
      data.items.some((i2) => i.cloudflareId === i2.cloudflareId),
    );

    const imagesToDelete = producer.images.items.filter(
      (i) => !data.items.some((i2) => i.cloudflareId === i2.cloudflareId),
    );

    await db
      .update(producers)
      .set({
        images: {
          items: imagesToKeep,
          primaryImgId:
            data.primaryImgId ??
            imagesToKeep.find(
              (i) => i.cloudflareId === producer.images.primaryImgId,
            )?.cloudflareId ??
            null,
        },
        updatedAt: new Date(),
      })
      .where(eq(producers.id, producer.id));

    for (const image of imagesToDelete) {
      console.log(
        `action [updateExistingImages] - Deleting image (${image.cloudflareId}) - run by user(${userId})`,
      );

      const response = await cloudflare.images.v1.delete(image.cloudflareId, {
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
      });

      console.log(
        `action [updateExistingImages] - Cloudflare delete image response`,
        response,
      );
    }
  });

export const claimProducer = authenticatedActionClient
  .input(claimProducerArgs)
  .action(
    async ({
      ctx: { userId, producerIds },
      input: { producerId, verification },
    }) => {
      const subTier = await getSubTier(userId);

      const claimRequestsCountForUser = await db
        .select({ count: count() })
        .from(claimRequests)
        .where(
          and(
            eq(claimRequests.userId, userId),
            sql`json_extract(${claimRequests.status}, '$.type') = 'waiting'`,
          ),
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
        where: and(
          eq(producers.id, producerId),
          isNull(producers.userId),
          eq(producers.claimed, false),
        ),
      });

      if (!producer) {
        throw new Error("This listing cannot be claimed");
      }

      const existingClaim = await db.query.claimRequests.findFirst({
        where: and(
          eq(claimRequests.producerId, producer.id),
          eq(claimRequests.userId, userId),
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
        case "domain-email-link":
          const website = producer.contact?.website;
          if (!website) {
            throw new Error(
              "Method invalid: Missing or invalid contact website",
            );
          }

          const url = new URL(website);
          let domain = url.hostname;
          console.log(domain);
          if (/\..*\./.test(domain)) {
            console.log("match");
            domain = domain.substring(domain.indexOf(".") + 1);
          }

          if (!isURL(domain, { require_tld: true, require_host: true })) {
            throw new Error(
              "Method invalid: Missing or invalid contact website",
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
        case "contact-phone-link":
          const phone = producer.contact?.phone;

          if (!phone) {
            throw new Error("Missing or invalid contact phone");
          }

          console.warn("Implement producer claim contact-phone-link method");

          break;
        case "social-post":
          const profiles: string[] = [];

          if (producer.socialMedia.facebook) {
            profiles.push(producer.socialMedia.facebook);
          }
          if (producer.socialMedia.instagram) {
            profiles.push(producer.socialMedia.instagram);
          }
          if (producer.socialMedia.twitter) {
            profiles.push(producer.socialMedia.twitter);
          }

          if (
            profiles.length === 0 ||
            !profiles.some((p) => p === verification.socialHandle)
          ) {
            throw new Error("Missing or invalid social handle");
          }

          console.warn("Implement producer claim social-post method");

          break;
        case "manual":
          console.warn("Implement producer claim manual method");
          break;
      }
    },
  );

export const listClaimRequests = authenticatedActionClient.action(
  async ({ userId }) => {
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
              : requestedVerification,
        }) satisfies PublicClaimRequest,
    );
  },
);

export const checkClaimDomainDNS = authenticatedActionClient
  .input(checkClaimDomainDnsArgs)
  .action(async ({ ctx: { userId }, input: { claimRequestId } }) => {
    // const { success } = await producerClaimDnsCheckRatelimit.limit(userId);

    // if (!success) {
    //   throw new Error("Rate limit exceded");
    // }

    const claimRequest = await db.query.claimRequests.findFirst({
      where: and(
        eq(claimRequests.userId, userId),
        eq(claimRequests.id, claimRequestId),
      ),
    });

    if (!claimRequest || claimRequest.status.type !== "waiting") {
      throw new Error("Claim does not exist");
    }

    if (claimRequest.requestedVerification.method !== "domain-dns") {
      throw new Error("Invalid claim verification method");
    }

    const recordName = `${CLAIM_DNS_TXT_RECORD_NAME}.${claimRequest.requestedVerification.domain}`;

    console.log(recordName);
    const records = await getDnsRecords(recordName, "TXT");

    console.log(records);

    const claimDnsRecord = records.find((r) => r.name === recordName);

    if (!claimDnsRecord) {
      throw new Error("Claim record not found");
    }

    const hasValidCode = claimDnsRecord.data === claimRequest.claimToken;

    if (!hasValidCode) {
      throw new Error("Claim tokens did not match.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(claimRequests)
        .set({
          status: { type: "claimed" },
          claimedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(claimRequests.id, claimRequest.id));

      await tx
        .update(producers)
        .set({
          userId: claimRequest.userId,
          claimed: true,
          verified: true,
        })
        .where(eq(producers.id, claimRequest.producerId));
    });

    return "Claim successfull";
  });

export const deleteProducer = producerActionClient
  .input(deleteProducerArgs)
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

    console.log(
      `[deleteProducer] Starting deletion proccess - userId: ${userId} producerId: ${producer.id}`,
    );

    if (producer.video) {
      const videDelRes = await cloudflare.stream.delete(producer.video.uid, {
        account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
      });
      console.log(`[deleteProducer] deleting video`, videDelRes);
    }

    for (const image of producer.images.items) {
      const imageDelRes = await cloudflare.images.v1.delete(
        image.cloudflareId,
        {
          account_id: env.SAFE_CLOUDFLARE_ACCOUNT_ID,
        },
      );
      console.log(`[deleteProducer] deleting image`, imageDelRes);
    }

    const delTxRes = await db.transaction(async (tx) => {
      await tx
        .delete(certificationsToProducers)
        .where(eq(certificationsToProducers.listingId, producer.id));

      await tx
        .delete(claimRequests)
        .where(eq(claimRequests.producerId, producer.id));

      return await tx.delete(producers).where(eq(producers.id, producer.id));
    });

    console.log(`[deleteProducer] deletion successfull`, delTxRes);
  });
