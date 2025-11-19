import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ea/ui/dialog";
import { Button } from "@ea/ui/button";
import { type PropsWithChildren, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useReviewProducer } from "@/utils/reviews";
import { Textarea } from "@ea/ui/textarea";
import { Label } from "@ea/ui/label";
import { Star } from "lucide-react";
import type { Stars } from "@ea/validators/reviews";
import { toast } from "sonner";
import { StarRating } from "./star-rating";
import type { ProducerWithAll } from "@ea/db/schema";
import { atom, useAtom, useSetAtom } from "jotai";
import { NotSubbed, Subbed } from "./auth/RequireSub";
import Link from "next/link";

export type ReviewProducerDialogProps = {
  producer: ProducerWithAll;
};

const reviewProducerDialogOpenAtom = atom(false);

export function ReviewProducerDialog({
  children,
  producer,
}: PropsWithChildren<ReviewProducerDialogProps>) {
  const [rating, setRating] = useState<Stars>(0);
  const [open, setOpen] = useAtom(reviewProducerDialogOpenAtom);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const actualMessage = useMemo(() => message.trim(), [message]);

  const reviewProducerMt = useReviewProducer({
    onSettled: async () => {
      setMessage("");
      setRating(0);
      await queryClient.invalidateQueries({
        queryKey: ["reviews", producer.id],
      });
    },
    onError: (e) => toast.error(e.message),
  });

  async function submit() {
    // onCreatedOptimistic?.({ message: actualMessage, rating: rating });
    reviewProducerMt.mutate({
      review: actualMessage,
      stars: rating,
      producerId: producer.id,
    });

    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Producer</DialogTitle>
        </DialogHeader>
        <Subbed>
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
              disabled={actualMessage.length === 0}
              variant={"brandGreen"}
              className="w-32"
            >
              Submit Review
            </Button>
          </DialogFooter>
        </Subbed>
        <NotSubbed>
          <p>Upgrade to review and send direct messages to produces.</p>
          <Button variant={"brandGreen"} asChild>
            <Link href={"/dashboard/subscribe"}>Upgrade</Link>
          </Button>
        </NotSubbed>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewProducerDialogTrigger({ disable }: { disable: boolean }) {
  const setOpen = useSetAtom(reviewProducerDialogOpenAtom);
  return (
    <Button onClick={() => setOpen(true)} disabled={disable} className="w-full">
      <Star />
      Review
    </Button>
  );
}
