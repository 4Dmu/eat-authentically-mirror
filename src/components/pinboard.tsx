import React, { useMemo } from "react";
import { Button } from "./ui/button";
import { MapPin, PinIcon } from "lucide-react";
import {
  useAddToPinboard,
  useUserPinboardFull,
  useRemoveFromPinboard,
} from "@/utils/pinboard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function AddToPinboardButton({
  producerId,
  className,
}: {
  producerId: string;
  className?: string;
}) {
  const pinboard = useUserPinboardFull();
  const add = useAddToPinboard({
    onSuccess: async () => await pinboard.refetch(),
    onError: (t) => toast.error(t.message),
  });
  const remove = useRemoveFromPinboard({
    onSuccess: async () => await pinboard.refetch(),
  });

  const isPinned = useMemo(() => {
    const pin = pinboard.data?.pins.find(
      (pin) => pin.producerId === producerId
    );
    if (add.isPending && add.variables.producerId === producerId) {
      return true;
    } else if (remove.isPending && pin) {
      return false;
    }
    return pin !== undefined;
  }, [
    pinboard.data,
    add.isPending,
    remove.isPending,
    add.variables?.producerId,
    producerId,
  ]);

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

export function AddToPinboardButtonRedirectToAuth() {
  return (
    <Button asChild className={"w-40"} variant={"brandBrown"}>
      <Link href={"/sign-in"}>
        <MapPin />
        <span>Add to Pinboard</span>
      </Link>
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
  const pinboard = useUserPinboardFull();
  const add = useAddToPinboard({
    onSuccess: async () => await pinboard.refetch(),
    onError: (t) => toast.error(t.message),
  });
  const remove = useRemoveFromPinboard({
    onSuccess: async () => await pinboard.refetch(),
  });

  const isPinned = useMemo(() => {
    const pin = pinboard.data?.pins.find(
      (pin) => pin.producerId === producerId
    );
    if (add.isPending && add.variables.producerId === producerId) {
      return true;
    } else if (remove.isPending && pin) {
      return false;
    }
    return pin !== undefined;
  }, [
    pinboard.data,
    add.isPending,
    remove.isPending,
    add.variables?.producerId,
    producerId,
  ]);

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
