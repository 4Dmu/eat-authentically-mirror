"use client";
import { Star } from "lucide-react";
import { SingleTierCard, TierCard } from "./TierCard";
import { useState } from "react";
import { Button } from "../ui/button";
import { createMemberCheckoutSession } from "@/backend/rpc/stripe";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { throwErrors } from "@/utils/actions";
import { Tabs, TabsTrigger, TabsContent, TabsList } from "../ui/tabs";
import { CreateMemberCheckoutSessionArgs } from "@/backend/validators/stripe";

export function TiersCard() {
  const createMemeberCheckoutSessionMutation = useMutation({
    mutationKey: ["create-member-checkout-session"],
    mutationFn: async (args: CreateMemberCheckoutSessionArgs) =>
      await createMemberCheckoutSession(args).then((r) => throwErrors(r)),
    onSuccess(url) {
      window.location.href = url;
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  return (
    <div className="flex flex-col items-center gap-10">
      <Tabs defaultValue="monthly" className="gap-5">
        <TabsList className="border self-center">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">
            Annual <span className="text-primary">Save 18%</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="monthly">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMemeberCheckoutSessionMutation.mutate({
                timeframe: "monthly",
              });
            }}
          >
            <SingleTierCard
              title={<p>$4.99/month</p>}
              badge={{ name: "Commiunity Member" }}
              color={"green"}
              pros={[
                "Leave detailed reviews for producers.",
                "Send direct messages to producers.",
                "Access exclusive community content.",
                "Priority customer support.",
                "Support sustainable food producers.",
              ]}
              cons={[]}
              submit={<Button className="w-full">Upgrade Now</Button>}
            />
          </form>
        </TabsContent>
        <TabsContent value="yearly">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMemeberCheckoutSessionMutation.mutate({
                timeframe: "yearly",
              });
            }}
          >
            <SingleTierCard
              title={<p>$49.00/year</p>}
              badge={{ name: "Commiunity Member" }}
              color={"green"}
              pros={[
                "Leave detailed reviews for producers.",
                "Send direct messages to producers.",
                "Access exclusive community content.",
                "Priority customer support.",
                "Support sustainable food producers.",
              ]}
              cons={[]}
              submit={<Button className="w-full">Upgrade Now</Button>}
            />
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
