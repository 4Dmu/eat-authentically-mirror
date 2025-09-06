import { PublicProducer } from "@/backend/validators/producers";
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
import {
  ComponentRef,
  Dispatch,
  Ref,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewProducerOpts } from "@/utils/reviews";
import { ReviewSelect } from "@/backend/db/schema";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { LucideProps, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stars } from "@/backend/validators/reviews";
import { toast } from "sonner";
import { StarRating } from "./star-rating";

export type ReviewProducerDialogProps = {
  producer: PublicProducer;
  disable: boolean;
};

export function ReviewProducerDialog({
  producer,
  disable,
}: ReviewProducerDialogProps) {
  const [rating, setRating] = useState<Stars>(0);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const actualMessage = useMemo(() => message.trim(), [message]);

  const reviewProducerMt = useMutation(
    reviewProducerOpts({
      onSettled: async () => {
        setMessage("");
        setRating(0);
        await queryClient.invalidateQueries({
          queryKey: ["reviews", producer.id],
        });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

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
      <DialogTrigger asChild>
        <Button disabled={disable} className="w-28">
          <Star />
          Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Producer</DialogTitle>
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
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
