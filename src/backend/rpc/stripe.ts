"use server";

import { stripe } from "../lib/stripe";
import { env } from "@/env";
import {
  authenticatedActionClient,
  authenticatedWithUserActionClient,
} from "./helpers/middleware";
import {
  STRIPE_CUSTOMER_SUBSCRIPTIONS_KV,
  USER_STRIPE_CUSTOMER_ID_KV,
} from "../kv";
import { auth } from "@clerk/nextjs/server";
import { updateKvWithLatestStripeData } from "../stripe/stripe-sync";
import { CreateCheckoutSessionArgsValidator } from "../validators/stripe";
import * as plans from "../stripe/subscription-plans";
import { type } from "arktype";

export const createCheckoutSession = authenticatedWithUserActionClient
  .input(CreateCheckoutSessionArgsValidator)
  .action(async ({ ctx: { userId, user }, input: { tier, timeframe } }) => {
    let stripeCustomerId = await USER_STRIPE_CUSTOMER_ID_KV.get(userId);

    const existingSubs = stripeCustomerId
      ? await STRIPE_CUSTOMER_SUBSCRIPTIONS_KV.get(stripeCustomerId)
      : null;

    const activeSub = existingSubs?.find(
      (sub) =>
        plans.isActive(sub.status) && !!plans.getPlanByPriceId(sub.priceId)
    );

    console.log(
      "[createCheckoutSession] Active user subscription (if any):",
      activeSub
    );

    const targetPlan = plans.getPlanBySubscriptionTier(tier, timeframe);

    if (!targetPlan) {
      console.error(
        "[createCheckoutSession] Error invalid target plan:",
        targetPlan
      );
      throw new Error("Invalid target subscription tier/interval.");
    }

    if (activeSub) {
      console.error(
        "[createCheckoutSession] Error user already has active sub"
      );
      throw new Error("You already have an active sub");
    }

    console.log(
      "[createCheckoutSession] Here's the stripe id we got from kv:",
      stripeCustomerId
    );

    if (!stripeCustomerId) {
      console.log(
        "[createCheckoutSession] No stripe id found in kv, creatring new customer",
        stripeCustomerId
      );

      const newCustomer = await stripe.customers.create({
        email:
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
            ?.emailAddress ?? user.emailAddresses[0]?.emailAddress,
        metadata: {
          userId: userId,
        },
      });

      await USER_STRIPE_CUSTOMER_ID_KV.set(userId, newCustomer.id);

      console.log("[createCheckoutSession] Customer Created", newCustomer);

      stripeCustomerId = newCustomer.id;
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: targetPlan.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${env.SITE_URL}/dashboard/subscribe/success?stripe_session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.SITE_URL}/dashboard/subscribe/cancel`,
        subscription_data: {
          metadata: {
            userId: userId,
          },
        },
        customer: stripeCustomerId,
        allow_promotion_codes: true,
      });
    } catch (err) {
      console.error(err);
      throw new Error(
        "Failed to create checkout session. Pleae refresh and try again."
      );
    }

    return session.url!;

    // async function handleActiveSubscription(
    //   activeSub: SubscriptionJSON,
    //   targetPlan: orgSubscriptionHelpers.Plan
    // ) {
    //   const currentPlan = orgSubscriptionHelpers.getPlanByPriceId(
    //     activeSub.priceId
    //   )!;
    //   const decision = orgSubscriptionHelpers.comparePlans(
    //     currentPlan,
    //     targetPlan
    //   );

    //   if (decision === "same") {
    //     throw new Error("You already have this subscription.");
    //   }

    //   if (currentPlan.interval === "month" && targetPlan.interval === "year") {
    //     // Month → Year = UPGRADE (start annual today)
    //     await upgradeSubscription({
    //       subscriptionId: activeSub.subscriptionId,
    //       newPriceId: targetPlan.priceId,
    //       oldPriceId: currentPlan.priceId,
    //       prorationBehavior: "create_prorations", // credit unused month
    //       paymentBehavior: "default_incomplete", // handle SCA if needed
    //       resetBillingAnchor: true, // <-- start yearly cycle now
    //     });
    //   } else if (
    //     currentPlan.interval === "year" &&
    //     targetPlan.interval === "month"
    //   ) {
    //     // Year → Month = DOWNGRADE (schedule for renewal)
    //     await downgradeSubscription({
    //       subscriptionId: activeSub.subscriptionId,
    //       newPriceId: targetPlan.priceId,
    //       oldPriceId: currentPlan.priceId,
    //       atPeriodEnd: true, // use schedule phases with iterations: 1
    //     });
    //   } else {
    //     // Interval unchanged; just rely on your rank-based upgrade/downgrade decision
    //     if (decision === "upgrade") {
    //       await upgradeSubscription({
    //         subscriptionId: activeSub.subscriptionId,
    //         newPriceId: targetPlan.priceId,
    //         oldPriceId: currentPlan.priceId,
    //         prorationBehavior: "create_prorations",
    //         paymentBehavior: "default_incomplete",
    //         resetBillingAnchor: false, // keep cycle when interval doesn't change
    //       });
    //     } else {
    //       await downgradeSubscription({
    //         subscriptionId: activeSub.subscriptionId,
    //         newPriceId: targetPlan.priceId,
    //         oldPriceId: currentPlan.priceId,
    //         atPeriodEnd: true,
    //       });
    //     }
    //   }
    // }
  });

export const createBillingPortalSession = authenticatedActionClient
  .input(type({ redirectPath: "string" }))
  .action(async ({ ctx: { userId }, input: { redirectPath } }) => {
    const customerId = await USER_STRIPE_CUSTOMER_ID_KV.get(userId);

    if (!customerId) {
      throw new Error("Error creating billing session");
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.SITE_URL}/billing/success?redirect_path=${redirectPath}`,
    });

    return session.url;
  });

export async function triggerStripeSync() {
  const user = await auth();
  if (!user.userId) return;

  const stripeCustomerId = await USER_STRIPE_CUSTOMER_ID_KV.get(user.userId);
  if (!stripeCustomerId) return;

  return await updateKvWithLatestStripeData(stripeCustomerId);
}
