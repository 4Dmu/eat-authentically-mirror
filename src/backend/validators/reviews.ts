import { type } from "arktype";

const stars = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export const starsValidator = type.number.narrow((v) => {
  return stars.includes(v);
});

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
