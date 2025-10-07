import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { ListPlusIcon, MapPin, PinIcon } from "lucide-react";
import {
  useAddToPinboard,
  useUserPinboardFull,
  useRemoveFromPinboard,
  useSyncPinsPinlistMemberships,
} from "@/utils/pinboard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { useAtom, useAtomValue } from "jotai";
import { showPinlistDialogAfterPinCreationAtom } from "@/stores";
import * as R from "remeda";

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
  const showPinlistDialogAfterPinCreation = useAtomValue(
    showPinlistDialogAfterPinCreationAtom
  );
  const [open, setOpen] = useState(false);
  const pinboard = useUserPinboardFull();
  const add = useAddToPinboard({
    onSuccess: async () => {
      const { data: refetchedQueryData } = await pinboard.refetch();
      if (
        refetchedQueryData &&
        refetchedQueryData.pinLists.length > 0 &&
        showPinlistDialogAfterPinCreation
      ) {
        setOpen(true);
      }
    },
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
    <>
      <Button
        className={className}
        disabled={add.isPending || remove.isPending}
        onClick={(e) => {
          e.preventDefault();
          const pinId = pinboard.data
            ? pinboard.data.pins.find((pin) => pin.producerId === producerId)
                ?.id
            : undefined;
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
      <AddPinToPinlistDialog
        context="newPin"
        open={open}
        setOpen={setOpen}
        producerId={producerId}
      />
    </>
  );
}

export function AddToPinlistIconButton({
  producerId,
  className,
}: {
  producerId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AddPinToPinlistDialog
        open={open}
        setOpen={setOpen}
        producerId={producerId}
      />
      <Button
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className={className}
        variant={"brandBrown"}
        size={"icon"}
      >
        <ListPlusIcon />
      </Button>
    </>
  );
}

function AddPinToPinlistDialog({
  producerId,
  open,
  setOpen,
  context = "default",
}: {
  producerId: string;
  open: boolean;
  setOpen: (value: boolean) => void;
  context?: "default" | "newPin";
}) {
  const [pinListIds, setPinListIds] = useState<string[]>([]);
  const [
    showPinlistDialogAfterPinCreation,
    setShowPinlistDialogAfterPinCreation,
  ] = useAtom(showPinlistDialogAfterPinCreationAtom);
  const pinboard = useUserPinboardFull();
  const syncPinsPinlistMemberships = useSyncPinsPinlistMemberships({
    onSuccess: async () => {
      await pinboard.refetch();
      setOpen(false);
    },
  });

  const pin = pinboard.data?.pins.find((p) => p.producerId === producerId);
  const idsOfPinListsThatIncludePin = useMemo(() => {
    if (!pinboard.data || !pin) {
      return [];
    }
    return pinboard.data.pinLists
      .filter((pl) => pl.items.some((pli) => pli.pinId === pin.id))
      .map((p) => p.id);
  }, [pinboard.data, pin]);

  const pinlistMembershipsHaveChanged = useMemo(
    () => !R.isDeepEqual(idsOfPinListsThatIncludePin, pinListIds),
    [idsOfPinListsThatIncludePin, pinListIds]
  );

  function save() {
    if (!pin) {
      return;
    }
    syncPinsPinlistMemberships.mutate({
      pinId: pin?.id,
      pinListIds: pinListIds,
    });
  }

  useEffect(() => {
    if (idsOfPinListsThatIncludePin.length == 0) {
      return;
    }

    setPinListIds(idsOfPinListsThatIncludePin);
  }, [idsOfPinListsThatIncludePin]);

  if (!pin) {
    return;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onOverlayClick={(e) => e.preventDefault()}
        onClick={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {context === "newPin"
              ? "Added producer to pinboard - Want to add it to a list?"
              : "Add pin to list"}
          </DialogTitle>
          <DialogDescription>
            Checks lists to include the pin.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {pinboard.data?.pinLists.map((pinList) => (
            <div className="flex gap-2 items-center" key={pinList.id}>
              <Label>{pinList.name}</Label>
              <Checkbox
                checked={pinListIds.includes(pinList.id)}
                onCheckedChange={(e) => {
                  if (e) {
                    setPinListIds([...pinListIds, pinList.id]);
                  } else {
                    setPinListIds([
                      ...pinListIds.filter((id) => id !== pinList.id),
                    ]);
                  }
                }}
                className="size-5"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <DialogClose disabled={syncPinsPinlistMemberships.isPending} asChild>
            <Button className="w-30">
              {context === "newPin" ? "Skip" : "Cancel"}
            </Button>
          </DialogClose>
          <Button
            disabled={
              syncPinsPinlistMemberships.isPending ||
              !pinlistMembershipsHaveChanged
            }
            onClick={save}
            className="w-30"
            variant={"brandGreen"}
          >
            Save
          </Button>
        </div>
        {context === "newPin" && (
          <>
            <Separator className="w-full" />
            <div className="flex gap-2">
              <Label>Show this dialog on pin creation?</Label>
              <Checkbox
                checked={showPinlistDialogAfterPinCreation}
                onCheckedChange={(e) =>
                  setShowPinlistDialogAfterPinCreation(e == true)
                }
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
