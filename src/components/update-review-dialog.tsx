import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateReview } from "@/utils/reviews";
import { ProducerReviewSelect } from "@/backend/db/schema";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { EditIcon } from "lucide-react";
import { Stars } from "@/backend/validators/reviews";
import { toast } from "sonner";
import { StarRating } from "./star-rating";
import { UserPublicReview } from "@/backend/rpc/reviews";

export function UpdateReviewDialog({
  review,
  disable,
}: {
  review: ProducerReviewSelect | UserPublicReview;
  disable?: boolean;
}) {
  const [rating, setRating] = useState<number>(review.rating);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(review.body ?? "");
  const queryClient = useQueryClient();

  const actualMessage = useMemo(() => message.trim(), [message]);

  const updateReviewMt = useUpdateReview({
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["reviews", review.producerId],
      });
    },
    onError: (e) => toast.error(e.message),
  });

  async function submit() {
    updateReviewMt.mutate({
      content: actualMessage,
      stars: rating,
      reviewId: review.id,
    });

    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disable} variant={"brandGreen"} size={"icon"}>
          <EditIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Review</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              className="resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Rating</Label>
            <div>
              <StarRating selected={rating} setSelected={setRating} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="w-32" variant={"brandRed"}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={actualMessage.length == 0}
            variant={"brandGreen"}
            className="w-32"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
