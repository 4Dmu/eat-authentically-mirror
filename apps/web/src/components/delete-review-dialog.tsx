import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { Trash2Icon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteReview } from "@/utils/reviews";
import { PublicReview } from "@/backend/rpc/reviews";

export function DeleteReviewDialog({ review }: { review: PublicReview }) {
  const queryClient = useQueryClient();
  const deleteReviewMt = useDeleteReview({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["reviews", review.producerId],
      });
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={"brandRed"} size={"icon"}>
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            review.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteReviewMt.mutate({ reviewId: review.id })}
            variant={"brandRed"}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
