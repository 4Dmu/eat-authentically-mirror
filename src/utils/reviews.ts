import { ReviewSelect } from "@/backend/db/schema";
import {
  deleteReview,
  listReviewsPublic,
  reviewProducer,
  updateReview,
} from "@/backend/rpc/reviews";
import {
  DeleteReviewArgs,
  ReviewProducerArgs,
  UpdateReviewArgs,
} from "@/backend/validators/reviews";
import {
  keepPreviousData,
  MutationOptions,
  mutationOptions,
  QueryKey,
  QueryOptions,
  queryOptions,
  useMutationState,
} from "@tanstack/react-query";

type MutationOpts<T, T2, T3, T4> = Omit<
  MutationOptions<T, T2, T3, T4>,
  "mutationFn" | "mutationKey"
>;

type QueryOpts<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = readonly unknown[],
  TPageParam = never,
> = Omit<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  "queryKey" | "queryFn"
>;

export const reviewProducerOpts = (
  opts?: MutationOpts<ReviewSelect, Error, ReviewProducerArgs, unknown>,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["review-producer"],
    mutationFn: (args: ReviewProducerArgs) => reviewProducer(args),
  });

export const deleteReviewOpts = (
  opts?: MutationOpts<void, Error, DeleteReviewArgs, unknown>,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["delete-review"],
    mutationFn: (args: DeleteReviewArgs) => deleteReview(args),
  });

export function useReviewProducerPendingState() {
  return useMutationState<ReviewProducerArgs>({
    filters: { mutationKey: ["review-producer"], status: "pending" },
    select: (mutation) => mutation.state.variables as ReviewProducerArgs,
  });
}

export const listReviewsPublicOpts = (producerId: string) =>
  queryOptions({
    queryKey: ["reviews", producerId],
    queryFn: () => listReviewsPublic({ producerId }),
  });

export const updateReviewOpts = (
  opts?: MutationOpts<void, Error, UpdateReviewArgs, unknown>,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["update-review"],
    mutationFn: (args: UpdateReviewArgs) => updateReview(args),
  });
