"use client";
import {
  Listing,
  OrganizationSubscriptionTiers,
  PublicListingLight,
} from "@/backend/validators/listings";
import { TierCard } from "@/components/sub/TierCard";
import { Button } from "@/components/ui/button";
import { Crown, Star } from "lucide-react";
import { useState } from "react";

export function ClientPage({ listing }: { listing: { name: string } }) {
  const [selected, setSelected] = useState<
    OrganizationSubscriptionTiers | undefined
  >("Pro");

  return (
    <div className="p-10 flex flex-col gap-20 mx-auto max-w-7xl">
      <div className="flex flex-col items-center gap-2">
        <p>Congragulations</p>
        <h1 className="font-bold text-3xl">{listing.name}</h1>
        <p>
          Your now a producer on find real food, subscribe to one of our payed
          plans to unlock all features.
        </p>
      </div>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-10">
          <TierCard
            color="green"
            name="Free"
            selected={selected === "Free"}
            select={() => setSelected("Free")}
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
          />
          <TierCard
            color="blue"
            badge={{ Icon: Star, name: "Popular" }}
            selected={selected === "Pro"}
            select={() => setSelected("Pro")}
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
          <TierCard
            color="purple"
            badge={{ Icon: Crown, name: "Premium" }}
            name="Premium"
            selected={selected === "Premium"}
            select={() => setSelected("Premium")}
            price="$69.99"
            priceSubtitle="per month"
            pros={[
              "Edit basic info: Yes",
              "Add certifications: Unlimited",
              "Add products: Unlimited",
              "Upload hero images: 10 images + video",
              "Additional images: Up to 10 total",
              "Featured in listings: Priority slot",
              "Upload video: Yes",
            ]}
            cons={[]}
          />
        </div>
        <div className="flex gap-5 justify-center">
          <Button disabled={selected === undefined} className="w-38">
            {selected === "Free" ? "Finish Setup" : "Subscribe"}
          </Button>
        </div>
      </div>
    </div>
  );
}
