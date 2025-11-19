"use server";
import { and, eq, isNull, ne, or } from "drizzle-orm";
import { db } from "@ea/db";
import {
  deleteReviewArgs,
  listReviewsPublicArgs,
  reviewProducerArgs,
  updateReviewArgs,
} from "@ea/validators/reviews";
import { authenticatedActionClient } from "./helpers/middleware";
import {
  producerImportedReviews,
  producers,
  producerReviews,
  type ProducerReviewInsert,
} from "@ea/db/schema";
import { getSubTier } from "./utils/get-sub-tier";
import { actionClient } from "./helpers/safe-action";
import { USER_DATA_KV } from "@ea/kv";
import { isBefore } from "date-fns";

export const reviewProducer = authenticatedActionClient
  .input(reviewProducerArgs)
  .name("reviewProducer")
  .action(
    async ({
      ctx: { userId, producerIds },
      input: { review, stars, producerId },
    }) => {
      const subTier = await getSubTier(userId);

      if (subTier === "Free") {
        throw new Error("Free users cannot make reviews");
      }

      if (producerIds.includes(producerId)) {
        throw new Error("Cannot review your own producer");
      }

      const existingReview = await db.query.producerReviews.findFirst({
        where: and(
          eq(producerReviews.producerId, producerId),
          eq(producerReviews.userId, userId)
        ),
      });

      if (existingReview) {
        throw new Error(
          "You can only review a producer once, if your would like to change your review please update it."
        );
      }

      const producer = await db.query.producers.findFirst({
        where: and(
          eq(producers.id, producerId),
          or(isNull(producers.userId), ne(producers.userId, userId))
        ),
      });

      if (!producer) {
        throw new Error("Producer not found");
      }

      return await db
        .insert(producerReviews)
        .values({
          id: crypto.randomUUID(),
          producerId: producer.id,
          userId: userId,
          rating: stars,
          body: review,
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies ProducerReviewInsert)
        .returning()
        .then((r) => r[0]);
    }
  );

export const listReviewsPublic = actionClient
  .input(listReviewsPublicArgs)
  .name("listReviewsPublic")
  .action(async ({ input: { producerId } }) => {
    const userR = await db.query.producerReviews.findMany({
      where: eq(producerReviews.producerId, producerId),
    });

    const importedR = await db.query.producerImportedReviews.findMany({
      where: eq(producerImportedReviews.producerId, producerId),
    });

    const results = [...userR, ...importedR].sort((a, b) =>
      isBefore(a.createdAt, b.createdAt) ? 1 : 0
    );

    const response = [];

    for (const result of results) {
      if ("data" in result) {
        response.push(result);
      } else {
        const data = await USER_DATA_KV.get(result.userId);
        response.push({
          ...result,
          reviewerUserImgUrl: data?.image_url,
          reviewerUserFirstName: data?.first_name ?? undefined,
        });
      }
    }

    return response;
  });

export const deleteReview = authenticatedActionClient
  .input(deleteReviewArgs)
  .name("deleteReview")
  .action(async ({ ctx: { userId }, input: { reviewId } }) => {
    const results = await db
      .delete(producerReviews)
      .where(
        and(
          eq(producerReviews.id, reviewId),
          eq(producerReviews.userId, userId)
        )
      )
      .returning();

    if (results.length === 0) {
      throw new Error("Review not found");
    }

    return;
  });

export const updateReview = authenticatedActionClient
  .input(updateReviewArgs)
  .name("updateReview")
  .action(async ({ ctx: { userId }, input: { content, stars, reviewId } }) => {
    const review = await db.query.producerReviews.findFirst({
      where: and(
        eq(producerReviews.id, reviewId),
        eq(producerReviews.userId, userId)
      ),
    });

    if (!review) {
      throw new Error("Review does not exist");
    }

    await db
      .update(producerReviews)
      .set({
        rating: stars,
        body: content,
        updatedAt: new Date(),
      })
      .where(eq(producerReviews.id, review.id));
  });

export type PublicReview = Awaited<
  ReturnType<typeof listReviewsPublic>
>[number];

export type UserPublicReview = Exclude<PublicReview, { data: object }>;
