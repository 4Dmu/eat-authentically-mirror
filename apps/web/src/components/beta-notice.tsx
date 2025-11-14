"use client";
import {
  Dialog,
  DialogHeader,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@ea/ui/dialog";
import { Button } from "@ea/ui/button";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export function BetaNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const clear = setTimeout(() => {
      const hideBeta = Cookies.get("hide-beta-notice");
      if (hideBeta === undefined) {
        setShow(true);
        Cookies.set("hide-beta-notice", "true", { expires: 365 * 5 });
      }
    }, 2000);

    return () => clearTimeout(clear);
  }, []);

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent>
        <DialogHeader className="flex flex-col gap-6">
          <DialogTitle className="text-2xl">
            Welcome to EatAuthentically (Beta)
          </DialogTitle>
          <DialogDescription className="text-base">
            Welcome to the Eat Authentically Open Beta! We’re opening the gates
            early so you can explore, test things out, and help us shape this
            community from the ground up. Producers can claim their listings for
            free — always — and join the wave of real-food pioneers putting
            themselves on the map. We’ll be running weekly giveaways for free
            annual subscriptions with extra features for both producers and
            community members. Jump in, share your thoughts, and help us grow
            something real together.
          </DialogDescription>
        </DialogHeader>
        <p></p>
        <DialogClose asChild>
          <Button variant={"secondary"}>Start</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
