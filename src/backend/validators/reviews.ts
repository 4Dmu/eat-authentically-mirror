import { type } from "arktype";

export const starsValidator = type.enumerated(
  0,
  0.5,
  1,
  1.5,
  2,
  2.5,
  3,
  3.5,
  4,
  4.5,
  5,
);

export const reviewProducerArgs = type({
  producerId: "string.uuid",
  review: "string",
  stars: starsValidator,
});

export const listReviewsPublicArgs = type({
  producerId: "string.uuid",
});

export const deleteReviewArgs = type({
  reviewId: "string.uuid",
});

export const updateReviewArgs = type({
  reviewId: "string.uuid",
  content: "string",
  stars: starsValidator,
});

export type ReviewProducerArgs = typeof reviewProducerArgs.infer;

export type DeleteReviewArgs = typeof deleteReviewArgs.infer;

export type Stars = typeof starsValidator.infer;

export type UpdateReviewArgs = typeof updateReviewArgs.infer;
