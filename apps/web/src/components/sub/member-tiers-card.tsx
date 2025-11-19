"use client";
import { SingleTierCard } from "./TierCard";
import { Button } from "@ea/ui/button";
import { createCheckoutSession } from "@/backend/rpc/stripe";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsTrigger, TabsContent, TabsList } from "@ea/ui/tabs";
import type { CreateCheckoutSessionArgs } from "@ea/validators/stripe";

export function TiersCard() {
  const createMemeberCheckoutSessionMutation = useMutation({
    mutationKey: ["create-member-checkout-session"],
    mutationFn: async (args: CreateCheckoutSessionArgs) =>
      await createCheckoutSession(args),
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
                tier: "community",
                timeframe: "month",
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
              submit={
                <Button
                  disabled={createMemeberCheckoutSessionMutation.isPending}
                  className="w-full"
                >
                  Upgrade Now
                </Button>
              }
            />
          </form>
        </TabsContent>
        <TabsContent value="yearly">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMemeberCheckoutSessionMutation.mutate({
                tier: "community",
                timeframe: "month",
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
              submit={
                <Button
                  disabled={createMemeberCheckoutSessionMutation.isPending}
                  className="w-full"
                >
                  Upgrade Now
                </Button>
              }
            />
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
