import React, { useMemo } from "react";
import { Button } from "./ui/button";
import { MapPin, PinIcon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addToPinboardOpts,
  getUserPinboardFullOpts,
  getUserProducerPinOpts,
  removeFromPinboardOpts,
} from "@/utils/pinboard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AddToPinboardButton({
  producerId,
  className,
}: {
  producerId: string;
  className?: string;
}) {
  const pinboard = useQuery(getUserPinboardFullOpts());
  const add = useMutation(
    addToPinboardOpts({
      onSuccess: async () => await pinboard.refetch(),
      onError: (t) => toast.error(t.message),
    }),
  );
  const remove = useMutation(
    removeFromPinboardOpts({
      onSuccess: async () => await pinboard.refetch(),
    }),
  );

  const isPinned = useMemo(() => {
    const pin = pinboard.data?.pins.find(
      (pin) => pin.producerId === producerId,
    );
    if (add.isPending && add.variables.producerId === producerId) {
      return true;
    } else if (remove.isPending && pin) {
      return false;
    }
    return pin !== undefined;
  }, [pinboard.data, add.isPending, remove.isPending]);
  return (
    <Button
      className={cn("w-40", className)}
      disabled={add.isPending || remove.isPending}
      onClick={(e) => {
        e.preventDefault();
        const pinId = pinboard.data
          ? pinboard.data.pins.find((pin) => pin.producerId === producerId)?.id
          : undefined;
        console.log(pinId);
        if (pinId) {
          remove.mutate({ pinId });
        } else {
          add.mutate({ producerId });
        }
      }}
      variant={isPinned ? "brandGreen" : "brandBrown"}
    >
      {isPinned ? <PinIcon /> : <MapPin />}
      <span>{isPinned ? "Unpin" : "Add to Pinboard"}</span>
    </Button>
  );
}

export function AddToPinboardIconButton({
  producerId,
  className,
}: {
  producerId: string;
  className?: string;
}) {
  const pinboard = useQuery(getUserPinboardFullOpts());
  const add = useMutation(
    addToPinboardOpts({
      onSuccess: async () => await pinboard.refetch(),
      onError: (t) => toast.error(t.message),
    }),
  );
  const remove = useMutation(
    removeFromPinboardOpts({
      onSuccess: async () => await pinboard.refetch(),
    }),
  );

  const isPinned = useMemo(() => {
    const pin = pinboard.data?.pins.find(
      (pin) => pin.producerId === producerId,
    );
    if (add.isPending && add.variables.producerId === producerId) {
      return true;
    } else if (remove.isPending && pin) {
      return false;
    }
    return pin !== undefined;
  }, [pinboard.data, add.isPending, remove.isPending]);

  return (
    <Button
      className={className}
      disabled={add.isPending || remove.isPending}
      onClick={(e) => {
        e.preventDefault();
        const pinId = pinboard.data
          ? pinboard.data.pins.find((pin) => pin.producerId === producerId)?.id
          : undefined;
        console.log(pinId);
        if (pinId) {
          remove.mutate({ pinId });
        } else {
          add.mutate({ producerId });
        }
      }}
      variant={isPinned ? "brandGreen" : "default"}
      size={"icon"}
    >
      {isPinned ? <PinIcon /> : <MapPin />}
    </Button>
  );
}
