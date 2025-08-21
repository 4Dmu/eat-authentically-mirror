import { env } from "@/env";
import Stripe from "stripe";
import { STRIPE_CUSTOMER_SUBSCRIPTIONS_KV } from "../kv";
import stripe from "stripe";

export type SubscriptionJSON = {
  subscriptionId: string;
  status: stripe.Subscription.Status;
  priceId: string;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
  canceledAt: number | null;
  billingCycleAnchor: number;
  billingCycleAnchorConfig: stripe.Subscription.BillingCycleAnchorConfig | null;
  billingMode: stripe.Subscription.BillingMode;
  billingThresholds: stripe.Subscription.BillingThresholds | null;
  paymentMethod: {
    brand: string | null;
    last4: string | null;
  } | null;
};

const allowedEvents: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.pending_update_applied",
  "customer.subscription.pending_update_expired",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "invoice.upcoming",
  "invoice.marked_uncollectible",
  "invoice.payment_succeeded",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
];

export async function processStripeEvent(event: Stripe.Event) {
  if (allowedEvents.includes(event.type)) {
    const { customer: customerId } = event?.data?.object as {
      customer: string;
    };
    if (typeof customerId !== "string") {
      throw new Error(
        `[STRIPE HOOK] [PROCESS EVENT] Id isn't a string.\nEvent type: ${event.type}`
      );
    }

    return await updateKvWithLatestStripeData(customerId);
  } else {
    console.log(
      "[STRIPE HOOK] [PROCESS EVENT] Ignoring event type:",
      event.type
    );
  }
}

export async function updateKvWithLatestStripeData(customerId: string) {
  try {
    const stripeSdk = new Stripe(env.STRIPE_SECRET_KEY);
    const subscriptions = await stripeSdk.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    if (subscriptions.data.length === 0) {
      STRIPE_CUSTOMER_SUBSCRIPTIONS_KV.set(customerId, []);
      return [];
    }

    const subs: SubscriptionJSON[] = subscriptions.data.map((sub) => ({
      subscriptionId: sub.id,
      status: sub.status,
      priceId: sub.items.data[0].price.id,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      cancelAt: sub.cancel_at,
      canceledAt: sub.canceled_at,
      billingCycleAnchor: sub.billing_cycle_anchor,
      billingCycleAnchorConfig: sub.billing_cycle_anchor_config,
      billingMode: sub.billing_mode,
      billingThresholds: sub.billing_thresholds,
      paymentMethod:
        sub.default_payment_method &&
        typeof sub.default_payment_method !== "string"
          ? {
              brand: sub.default_payment_method.card?.brand ?? null,
              last4: sub.default_payment_method.card?.last4 ?? null,
            }
          : null,
    }));

    await STRIPE_CUSTOMER_SUBSCRIPTIONS_KV.set(customerId, subs);
    return subs;
  } catch (err) {
    console.error(
      "[STRIPE HOOK] [PROCESS EVENT] [UPDATE KV] Error updating Stripe data:",
      err
    );
    throw err;
  }
}
