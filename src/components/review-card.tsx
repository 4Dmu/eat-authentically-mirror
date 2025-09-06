"use client";
import { PublicReview } from "@/backend/rpc/reviews";
import Image from "next/image";
import { StarRatingReadonly } from "./star-rating";
import { useAuth } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { EditIcon, Trash2Icon } from "lucide-react";
import { ReviewProducerArgs } from "@/backend/validators/reviews";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteReviewOpts } from "@/utils/reviews";
import { DeleteReviewDialog } from "./delete-review-dialog";
import { UpdateReviewDialog } from "./update-review-dialog";

export function ReviewCard({ review }: { review: PublicReview }) {
  const auth = useAuth();

  return (
    <div className="flex flex-col gap-4 bg-background p-5 rounded-lg border flex-1 min-w-52">
      <div className="flex gap-3">
        {review.reviewerUserImgUrl && (
          <Image
            className="rounded-full object-cover"
            src={review.reviewerUserImgUrl}
            alt="profile"
            width={25}
            height={25}
          />
        )}
        <p>{review.reviewerUserFirstName}</p>
      </div>
      <p>{review.content}</p>
      <StarRatingReadonly rating={review.rating} />
      {auth.userId === review.reviewerUserId && (
        <div className="flex gap-2">
          <UpdateReviewDialog review={review} />
          <DeleteReviewDialog review={review} />
        </div>
      )}
    </div>
  );
}

export function PendingReviewCard({ review }: { review: ReviewProducerArgs }) {
  const auth = useAuth();

  return (
    <div className="flex flex-col gap-4 bg-background p-5 rounded-lg border flex-1 min-w-52">
      <div className="flex gap-3">
        {auth.sessionClaims?.imageUrl && (
          <Image
            className="rounded-full object-cover"
            src={auth.sessionClaims.imageUrl!}
            alt="profile"
            width={25}
            height={25}
          />
        )}
        <p>{auth.sessionClaims?.firstName}</p>
      </div>
      <p>{review.review}</p>
      <StarRatingReadonly rating={review.stars} />
    </div>
  );
}
