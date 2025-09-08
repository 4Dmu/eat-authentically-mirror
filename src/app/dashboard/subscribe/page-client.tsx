"use client";
import { createCheckoutSession } from "@/backend/rpc/stripe";
import type { Tier, Interval } from "@/backend/stripe/subscription-plans";
import { CreateCheckoutSessionArgs } from "@/backend/validators/stripe";
import { TierCard } from "@/components/sub/TierCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { UserJSON } from "@clerk/backend";
import { useMutation } from "@tanstack/react-query";
import { Crown, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import {
  COMMUNITY_TIER_PROS,
  PREMIUM_TIER_PROS,
  PRO_TIER_PROS,
} from "@/backend/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ClientPage(props: {
  user: UserJSON;
  mode?: "community" | "producer";
}) {
  const [tier, setTier] = useState<Tier>(
    props.mode === "community" ? "community" : "pro",
  );
  const [interval, setInterval] = useState<Interval>("month");
  const [mode, setMode] = useState<"community" | "producer">(
    props.mode ?? "producer",
  );

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

  return (
    <div className="p-10 flex flex-col gap-5 mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="cursor-pointer hover:text-primary"
              >
                <Link href={"/"}>Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="cursor-pointer hover:text-primary"
              >
                <Link href={"/dashboard"}>My Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Subscribe</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <BackButton href={"/"} text="Back to Home" />
      </div>

      <Card>
        <CardHeader className="flex flex-col items-center gap-10 mt-10">
          <h1 className="font-bold text-5xl">
            Eat Authentically community and producer plans.
          </h1>
          <p className="text-lg">
            Are you looking to find real food producers? Or maybe you have your
            own farm, ranch or eatery you want people to find, choose the plan
            thats best for you.
          </p>
        </CardHeader>
        <CardContent>
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
              value={mode}
              onValueChange={(e) => {
                setMode(e as "producer");
                if (e == "producer") {
                  setTier("pro");
                } else {
                  setTier("community");
                }
              }}
              className="flex flex-col gap-10"
            >
              <div className="flex flex-col md:flex-row gap-5 md:justify-between">
                <TabsList className="text-xl grid grid-cols-2">
                  <TabsTrigger value="community" className="group">
                    <p>Community</p>
                    <div className="bg-border w-full h-1 group-data-[state=active]:bg-brand-green" />
                  </TabsTrigger>
                  <TabsTrigger value="producer" className="group">
                    <p>Producer</p>
                    <div className="bg-border w-full h-1 group-data-[state=active]:bg-brand-green" />
                  </TabsTrigger>
                </TabsList>
                <div className="flex gap-2 w-fit self-center bg-background border rounded-full">
                  <button
                    type="button"
                    onClick={() => setInterval("month")}
                    className={cn(
                      "flex gap-1 items-center rounded-full p-2",
                      interval == "month" &&
                        "text-primary-foreground bg-primary",
                    )}
                  >
                    1 Month
                  </button>
                  <button
                    onClick={() => setInterval("year")}
                    type="button"
                    className={cn(
                      "flex gap-1 items-center rounded-full p-2",
                      interval == "year" &&
                        "text-primary-foreground bg-primary",
                    )}
                  >
                    <span>12 Months</span>
                    <Badge className="bg-green-500">18% off</Badge>
                  </button>
                </div>
              </div>
              <TabsContent value="community" className="">
                <TierCard
                  color="green"
                  selected={tier === "community"}
                  select={() => {
                    setTier("community");
                  }}
                  priceSubtitle="per month"
                  name={"Commiunity Member"}
                  price="$4.99"
                  badge={{ name: "Commiunity Member" }}
                  pros={COMMUNITY_TIER_PROS}
                  cons={[]}
                />
              </TabsContent>
              <TabsContent value="producer" className="flex flex-col gap-10">
                <div className="grid md:grid-cols-2 gap-5">
                  <TierCard
                    color="blue"
                    badge={{ Icon: Star, name: "Popular" }}
                    selected={tier === "pro"}
                    select={() => {
                      setTier("pro");
                    }}
                    name="Producer Pro"
                    price="$29.99"
                    priceSubtitle="per month"
                    pros={PRO_TIER_PROS}
                    cons={["Upload video: No"]}
                  />
                  <TierCard
                    color="purple"
                    badge={{ Icon: Crown, name: "Premium" }}
                    name="Producer Premium"
                    selected={tier === "premium"}
                    select={() => {
                      setTier("premium");
                    }}
                    price="$69.99"
                    priceSubtitle="per month"
                    pros={PREMIUM_TIER_PROS}
                    cons={[]}
                  />
                </div>
                <p className="text-center font-bold text-brand-green">
                  All Producer plans include a full Community Membership!
                  ($4.99/mo value)
                </p>
              </TabsContent>
            </Tabs>
            <div className="flex gap-5 justify-center">
              <Button
                className="w-32"
                variant={"brandGreen"}
                disabled={
                  tier === undefined ||
                  createOrgCheckoutSessionMutation.isPending
                }
              >
                Subscribe
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
