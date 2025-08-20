"use client";
import { Star } from "lucide-react";
import { TierCard } from "./TierCard";
import { useState } from "react";
import { Button } from "../ui/button";
import { createMemberCheckoutSession } from "@/backend/rpc/stripe";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { throwErrors } from "@/utils/actions";

export function TiersCard({ currentTier }: { currentTier: "Free" | "Pro" }) {
  const [selected, setSelected] = useState<string | undefined>("Pro");

  const createMemeberCheckoutSessionMutation = useMutation({
    mutationKey: ["create-member-checkout-session"],
    mutationFn: async () =>
      await createMemberCheckoutSession().then((r) => throwErrors(r)),
    onSuccess(url) {
      window.location.href = url;
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <form
      className="flex flex-col items-center gap-10"
      onSubmit={async (e) => {
        e.preventDefault();
        createMemeberCheckoutSessionMutation.mutate();
      }}
    >
      <div className="grid grid-cols-2 gap-10">
        <TierCard
          selected={selected === "Free"}
          select={() => {
            setSelected("Free");
          }}
          name="Free"
          price="$0"
          priceSubtitle="Claim Only"
          pros={[
            "Edit basic info: Yes",
            "Add certifications: Up to 3",
            "Add products: Up to 3",
            "Upload hero images: 1 image",
          ]}
          cons={[
            "Additional images: No",
            "Upload video: No",
            "Featured in listings: No",
          ]}
          color={"green"}
        />
        <TierCard
          selected={selected === "Pro"}
          select={() => {
            setSelected("Pro");
          }}
          badge={{ Icon: Star, name: "Popular" }}
          color={"blue"}
          name="Pro"
          price="$29.99"
          priceSubtitle="per month"
          pros={[
            "Edit basic info: Yes",
            "Add certifications: Up to 6",
            "Add products: Up to 10",
            "Upload hero images: 3 images",
            "Additional images: 2 extra",
            "Featured in listings: Randomized",
          ]}
          cons={["Upload video: No"]}
        />
      </div>
      <Button
        disabled={
          selected === currentTier ||
          !selected ||
          createMemeberCheckoutSessionMutation.isPending
        }
      >
        {selected === currentTier ? "Already Selected" : "Upgrade"}
      </Button>
    </form>
  );
}
