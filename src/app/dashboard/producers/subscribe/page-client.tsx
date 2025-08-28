"use client";
import { createCheckoutSession } from "@/backend/rpc/stripe";
import type { Tier, Interval } from "@/backend/stripe/subscription-plans";
import { CreateCheckoutSessionArgs } from "@/backend/validators/stripe";
import { TierCard } from "@/components/sub/TierCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { Crown, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ClientPage({ listing }: { listing: { name: string } }) {
  const [tier, setTier] = useState<Exclude<Tier, "community">>("pro");
  const [interval, setInterval] = useState<Interval>("month");

  const createOrgCheckoutSessionMutation = useMutation({
    mutationKey: ["create-org-checkout-session"],
    mutationFn: async (props: CreateCheckoutSessionArgs) =>
      await createCheckoutSession(props),
    onSuccess(url) {
      window.location.href = url;
    },
    onError(err) {
      console.log(err);
      toast.error(err.message);
    },
  });

  // const buttonText = match({
  //   currentTier,
  //   newTier: selected,
  // })
  //   .with(
  //     {
  //       currentTier: undefined,
  //       newTier: P.any,
  //     },
  //     () => "Upgrade Now"
  //   )
  //   .with(
  //     {
  //       currentTier: "Pro-Monthly",
  //       newTier: "Pro-Monthly",
  //     },
  //     {
  //       currentTier: "Pro-Yearly",
  //       newTier: "Pro-Yearly",
  //     },
  //     () => "Current Plan"
  //   )
  //   .with(
  //     {
  //       currentTier: "Premium-Monthly",
  //       newTier: "Premium-Monthly",
  //     },
  //     {
  //       currentTier: "Premium-Yearly",
  //       newTier: "Premium-Yearly",
  //     },
  //     () => "Current Plan"
  //   )
  //   // Upgrades
  //   .with(
  //     {
  //       currentTier: "Pro-Monthly",
  //       newTier: "Pro-Yearly",
  //     },
  //     {
  //       currentTier: "Premium-Monthly",
  //       newTier: "Premium-Yearly",
  //     },
  //     () => "Upgrade to annual plan"
  //   )
  //   .with(
  //     {
  //       currentTier: "Pro-Monthly",
  //       newTier: "Premium-Yearly",
  //     },
  //     {
  //       currentTier: "Pro-Yearly",
  //       newTier: "Premium-Monthly",
  //     },
  //     {
  //       currentTier: "Pro-Yearly",
  //       newTier: "Premium-Yearly",
  //     },
  //     {
  //       currentTier: "Pro-Monthly",
  //       newTier: "Premium-Monthly",
  //     },
  //     () => "Upgrade to premium plan"
  //   )
  //   // Downgrades
  //   .with(
  //     {
  //       currentTier: "Pro-Yearly",
  //       newTier: "Pro-Monthly",
  //     },
  //     () => "Downgrade to monthly plan"
  //   )
  //   .with(
  //     {
  //       currentTier: "Premium-Monthly",
  //       newTier: "Pro-Yearly",
  //     },
  //     {
  //       currentTier: "Premium-Yearly",
  //       newTier: "Pro-Monthly",
  //     },
  //     {
  //       currentTier: "Premium-Monthly",
  //       newTier: "Pro-Monthly",
  //     },
  //     {
  //       currentTier: "Premium-Yearly",
  //       newTier: "Pro-Yearly",
  //     },
  //     () => "Downgrade to pro plan"
  //   )
  //   .with(
  //     {
  //       currentTier: "Premium-Yearly",
  //       newTier: "Premium-Monthly",
  //     },
  //     () => "Change to monthly plan"
  //   )
  //   .exhaustive();

  // const disableButton = match({
  //   currentTier,
  //   newTier: selected,
  // })
  //   .with(
  //     {
  //       currentTier: undefined,
  //       newTier: P.any,
  //     },
  //     () => false
  //   )
  //   .with(
  //     {
  //       currentTier: "Pro-Monthly",
  //       newTier: "Pro-Monthly",
  //     },
  //     {
  //       currentTier: "Pro-Yearly",
  //       newTier: "Pro-Yearly",
  //     },
  //     () => true
  //   )
  //   .with(
  //     {
  //       currentTier: "Premium-Monthly",
  //       newTier: "Premium-Monthly",
  //     },
  //     {
  //       currentTier: "Premium-Yearly",
  //       newTier: "Premium-Yearly",
  //     },
  //     () => true
  //   )
  //   // Upgrades
  //   .with(
  //     {
  //       currentTier: "Pro-Monthly",
  //       newTier: "Pro-Yearly",
  //     },
  //     {
  //       currentTier: "Premium-Monthly",
  //       newTier: "Premium-Yearly",
  //     },
  //     () => false
  //   )
  //   .with(
  //     {
  //       currentTier: "Pro-Monthly",
  //       newTier: "Premium-Yearly",
  //     },
  //     {
  //       currentTier: "Pro-Yearly",
  //       newTier: "Premium-Monthly",
  //     },
  //     {
  //       currentTier: "Pro-Yearly",
  //       newTier: "Premium-Yearly",
  //     },
  //     {
  //       currentTier: "Pro-Monthly",
  //       newTier: "Premium-Monthly",
  //     },
  //     () => false
  //   )
  //   // Downgrades
  //   .with(
  //     {
  //       currentTier: "Pro-Yearly",
  //       newTier: "Pro-Monthly",
  //     },
  //     () => false
  //   )
  //   .with(
  //     {
  //       currentTier: "Premium-Monthly",
  //       newTier: "Pro-Yearly",
  //     },
  //     {
  //       currentTier: "Premium-Yearly",
  //       newTier: "Pro-Monthly",
  //     },
  //     {
  //       currentTier: "Premium-Monthly",
  //       newTier: "Pro-Monthly",
  //     },
  //     {
  //       currentTier: "Premium-Yearly",
  //       newTier: "Pro-Yearly",
  //     },
  //     () => false
  //   )
  //   .with(
  //     {
  //       currentTier: "Premium-Yearly",
  //       newTier: "Premium-Monthly",
  //     },
  //     () => false
  //   )
  //   .exhaustive();

  return (
    <div className="p-10 flex flex-col gap-10 mx-auto max-w-5xl">
      <div className="flex flex-col items-center gap-2">
        <p>Congragulations</p>
        <h1 className="font-bold text-3xl">{listing.name}</h1>
        <p>
          Your now a producer on find real food, subscribe to one of our payed
          plans to unlock all features.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createOrgCheckoutSessionMutation.mutate({
            tier: tier,
            timeframe: interval,
          });
        }}
        className="flex flex-col gap-5"
      >
        <Tabs
          value={interval}
          onValueChange={(e) => setInterval(e as "month")}
          className="gap-5"
        >
          <TabsList className="border self-center">
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="year">
              Annual <span className="text-primary">Save 18%</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="month">
            <div className="grid md:grid-cols-2 gap-5">
              <TierCard
                color="blue"
                badge={{ Icon: Star, name: "Popular" }}
                selected={tier === "pro" && interval === "month"}
                select={() => {
                  setTier("pro");
                  setInterval("month");
                }}
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
                selected={tier === "premium" && interval === "month"}
                select={() => {
                  setTier("premium");
                  setInterval("month");
                }}
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
          </TabsContent>
          <TabsContent value="year">
            <div className="grid md:grid-cols-2 gap-5">
              <TierCard
                color="blue"
                badge={{ Icon: Star, name: "Popular" }}
                selected={tier === "pro" && interval === "year"}
                select={() => {
                  setTier("pro");
                  setInterval("year");
                }}
                name="Pro"
                price="$299.00"
                priceSubtitle="per year"
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
                selected={tier === "premium" && interval === "year"}
                select={() => {
                  setTier("premium");
                  setInterval("year");
                }}
                price="$699.00"
                priceSubtitle="per year"
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
          </TabsContent>
        </Tabs>
        <div className="flex gap-5 justify-center">
          <Button
            disabled={
              tier === undefined || createOrgCheckoutSessionMutation.isPending
            }
          >
            Subscribe
          </Button>
        </div>
      </form>
    </div>
  );
}
