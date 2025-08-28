"use client";
import { createCheckoutSession } from "@/backend/rpc/stripe";
import type { Tier, Interval } from "@/backend/stripe/subscription-plans";
import { CreateCheckoutSessionArgs } from "@/backend/validators/stripe";
import { TierCard } from "@/components/sub/TierCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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

export function ClientPage(props: {
  user: UserJSON;
  mode?: "community" | "producer";
}) {
  const [tier, setTier] = useState<Tier>(
    props.mode === "community" ? "community" : "pro"
  );
  const [interval, setInterval] = useState<Interval>("month");
  const [mode, setMode] = useState<"community" | "producer">(
    props.mode ?? "producer"
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
    <div className="p-10 flex flex-col gap-5 mx-auto max-w-5xl">
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

      <div className="flex flex-col items-center gap-10 mt-10">
        <h1 className="font-bold text-5xl text-center">
          Eat Authentically plans for your privacy.
        </h1>
        <p>
          Are you looking to find real food producers? Or maybe you have your
          own farm, ranch or eatery you want people to find, choose the plan
          thats best for you.
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
        {/* <Tabs
        
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
          <div className="grid grid-cols-3">
            <div className=" flex flex-col justify-center items-center gap-2">
              <Label>Community Subscriptions</Label>
              <p className="text-sm">
                Subscribe for incresed community benifits.
              </p>
            </div>
            <div className="col-span-2 flex flex-col justify-center items-center gap-2">
              <Label>Producer Subscriptions</Label>
              <p className="text-sm">
                Subscribe for incresed community benifits.
              </p>
            </div>
          </div>
          <TabsContent value="month">
            <div className="grid grid-cols-3 gap-10 relative">
              <TierCard
                color="green"
                selected={tier === "community" && interval === "month"}
                select={() => {
                  setTier("community");
                  setInterval("month");
                }}
                priceSubtitle="per month"
                name={"Commiunity Member"}
                price="$4.99"
                badge={{ name: "Commiunity Member" }}
                pros={[
                  "Leave detailed reviews for producers.",
                  "Send direct messages to producers.",
                  "Access exclusive community content.",
                  "Priority customer support.",
                  "Support sustainable food producers.",
                ]}
                cons={[]}
              />
              <TierCard
                color="blue"
                badge={{ Icon: Star, name: "Popular" }}
                selected={tier === "pro" && interval === "month"}
                select={() => {
                  setTier("pro");
                  setInterval("month");
                }}
                name="Producer Pro"
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
                name="Producer Premium"
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
        </Tabs> */}
        <Tabs
          value={mode}
          onValueChange={(e) => setMode(e as "producer")}
          className="flex flex-col gap-10"
        >
          <div className="flex flex-col md:flex-row gap-5 md:justify-between">
            <TabsList className="text-xl grid grid-cols-2">
              <TabsTrigger value="community" className="group">
                <p>Community</p>
                <div className="bg-border w-full h-1 group-data-[state=active]:bg-primary" />
              </TabsTrigger>
              <TabsTrigger value="producer" className="group">
                <p>Producer</p>
                <div className="bg-border w-full h-1 group-data-[state=active]:bg-primary" />
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2 w-fit self-center bg-background border rounded-full">
              <button
                type="button"
                onClick={() => setInterval("month")}
                className={cn(
                  "flex gap-1 items-center rounded-full p-2",
                  interval == "month" && "text-primary-foreground bg-primary"
                )}
              >
                1 Month
              </button>
              <button
                onClick={() => setInterval("year")}
                type="button"
                className={cn(
                  "flex gap-1 items-center rounded-full p-2",
                  interval == "year" && "text-primary-foreground bg-primary"
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
              pros={[
                "Leave detailed reviews for producers.",
                "Send direct messages to producers.",
                "Access exclusive community content.",
                "Priority customer support.",
                "Support sustainable food producers.",
              ]}
              cons={[]}
            />
          </TabsContent>
          <TabsContent value="producer" className="grid md:grid-cols-2 gap-10">
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
              name="Producer Premium"
              selected={tier === "premium"}
              select={() => {
                setTier("premium");
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
