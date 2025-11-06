import { ProducerReviewSelect } from "@ea/db/schema";
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
} from "@ea/validators/reviews";
import {
  useMutation,
  UseMutationOptions,
  useMutationState,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

// --- mutations ---

export function useReviewProducer(
  opts?: Omit<
    UseMutationOptions<
      ProducerReviewSelect,
      Error,
      ReviewProducerArgs,
      unknown
    >,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["review-producer"] as const,
    mutationFn: (args: ReviewProducerArgs) => reviewProducer(args),
  });
}

export function useDeleteReview(
  opts?: Omit<
    UseMutationOptions<void, Error, DeleteReviewArgs, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["delete-review"] as const,
    mutationFn: (args: DeleteReviewArgs) => deleteReview(args),
  });
}

export function useUpdateReview(
  opts?: Omit<
    UseMutationOptions<void, Error, UpdateReviewArgs, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["update-review"] as const,
    mutationFn: (args: UpdateReviewArgs) => updateReview(args),
  });
}

// --- mutation state (pending tracking) ---

export function useReviewProducerPendingState() {
  return useMutationState<ReviewProducerArgs>({
    filters: { mutationKey: ["review-producer"], status: "pending" },
    select: (mutation) => mutation.state.variables as ReviewProducerArgs,
  });
}

// --- queries ---

export function useReviewsPublic(
  producerId: string,
  opts?: Omit<
    UseQueryOptions<
      ProducerReviewSelect[],
      Error,
      ProducerReviewSelect[],
      readonly [string, string]
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["reviews", producerId] as const,
    queryFn: () => listReviewsPublic({ producerId }),
  });
}
