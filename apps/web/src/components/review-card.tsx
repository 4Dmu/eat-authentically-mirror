"use client";
import { PublicReview } from "@/backend/rpc/reviews";
import Image from "next/image";
import { StarRatingReadonly } from "./star-rating";
import { useAuth } from "@clerk/nextjs";
import { DeleteReviewDialog } from "./delete-review-dialog";
import { UpdateReviewDialog } from "./update-review-dialog";
import { ReviewProducerArgs } from "@/backend/validators/reviews";

export function ReviewCard({ review }: { review: PublicReview }) {
  const auth = useAuth();

  if ("data" in review) {
    return (
      <div className="flex flex-col gap-4 bg-background p-5 rounded-lg border flex-1 min-w-52">
        <div className="flex gap-3 items-center">
          <Image
            className="rounded-full object-cover size-10"
            src={review.data.authorAttribution.photoUri}
            alt="profile"
            width={50}
            height={50}
          />
          <p className="font-bold">
            {review.data.authorAttribution.displayName}
          </p>
        </div>
        <p>{review.data.text.text}</p>
        <StarRatingReadonly rating={review.rating} />
        <a href={review.data.googleMapsUri} className="text-sm text-brand-red">
          *This review was made on Google Maps
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 bg-background p-5 rounded-lg border flex-1 min-w-52">
      <div className="flex gap-3 items-center">
        {review.reviewerUserImgUrl && (
          <Image
            className="rounded-full object-cover size-10"
            src={review.reviewerUserImgUrl}
            alt="profile"
            width={50}
            height={50}
          />
        )}
        <p className="font-bold">{review.reviewerUserFirstName}</p>
      </div>
      <p>{review.body}</p>
      <StarRatingReadonly rating={review.rating} />
      {auth.userId === review.userId && (
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
