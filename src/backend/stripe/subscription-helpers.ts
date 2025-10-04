import { stripe } from "../lib/stripe";

type UpdateArgs = {
  subscriptionId: string;
  newPriceId: string;
  oldPriceId: string;
  /**
   * Quantity to apply to the target item (defaults to the current item quantity).
   * Useful if you let orgs change seat count at the same time.
   */
  quantity?: number;
};

type UpgradeOptions = UpdateArgs & {
  /**
   * How to handle the proration invoice for upgrades.
   * - "create_prorations" (default) → immediate charge for the price delta
   * - "none" → no prorations (rare for upgrades)
   */
  prorationBehavior?: "create_prorations" | "none";
  /**
   * If you want to collect payment up-front even when SCA is needed:
   * - "default_incomplete" (default) → creates invoice that might need client-side confirmation
   * - "allow_incomplete" → mark incomplete if payment fails; you can collect later
   */
  paymentBehavior?: "default_incomplete" | "allow_incomplete";
  /**
   * Keep billing cycle anchor the same (default) or reset it to "now"
   */
  resetBillingAnchor?: boolean;
};

type DowngradeOptions = UpdateArgs & {
  /**
   * Apply downgrade at the end of the current period (default, recommended)
   * If false, downgrade applies immediately (no proration by default).
   */
  atPeriodEnd?: boolean;
  /**
   * For immediate downgrades only.
   */
  prorationBehavior?: "none" | "create_prorations";
};

/**
 * Internal: load subscription and locate the paid item.
 */
async function getSubAndItem(subscriptionId: string, matchPriceId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product", "latest_invoice.payment_intent"],
  });

  const item = sub.items.data.find((it) => it.price.id === matchPriceId);
  if (!item) {
    throw new Error(
      `Subscription item with price ${matchPriceId} not found on subscription ${subscriptionId}`
    );
  }

  return { sub, item };
}

/**
 * UPGRADE: immediate price change with proration (default).
 * Keeps the billing anchor unless you opt to reset it.
 */
export async function upgradeSubscription({
  subscriptionId,
  newPriceId,
  oldPriceId,
  quantity,
  prorationBehavior = "create_prorations",
  paymentBehavior = "default_incomplete",
  resetBillingAnchor = false,
}: UpgradeOptions) {
  const { item } = await getSubAndItem(subscriptionId, oldPriceId);

  // Preserve quantity by default
  const nextQty = quantity ?? item.quantity ?? 1;

  const updated = await stripe.subscriptions.update(subscriptionId, {
    // Replace the existing item with the new price
    items: [
      {
        id: item.id,
        price: newPriceId,
        quantity: nextQty,
      },
    ],
    proration_behavior: prorationBehavior,
    payment_behavior: paymentBehavior,
    billing_cycle_anchor: resetBillingAnchor ? "now" : "unchanged",
    // Keep collection behavior consistent with your product (optional):
    // collection_method: sub.collection_method, // usually "charge_automatically"
    // invoice_settings: sub.invoice_settings,
  });

  // If payment_behavior was "default_incomplete" and SCA is required, you’ll
  // have a PaymentIntent to confirm on the client.
  const latestInvoiceId =
    typeof updated.latest_invoice === "string"
      ? updated.latest_invoice
      : updated.latest_invoice?.id;

  return { subscription: updated, latestInvoiceId };
}

/**
 * DOWNGRADE at period end (default): use a schedule with phases.
 * Phase 1: keep current item for exactly 1 billing iteration (no proration)
 * Phase 2: switch to the new price.
 *
 * Immediate downgrade: update the subscription now (no proration by default).
 */
export async function downgradeSubscription({
  subscriptionId,
  newPriceId,
  oldPriceId,
  quantity,
  atPeriodEnd = true,
  prorationBehavior = "none",
}: DowngradeOptions) {
  const { sub, item } = await getSubAndItem(subscriptionId, oldPriceId);
  const nextQty = quantity ?? item.quantity ?? 1;

  if (atPeriodEnd) {
    // Create or reuse a schedule
    const schedule =
      typeof sub.schedule === "string" && sub.schedule
        ? await stripe.subscriptionSchedules.retrieve(sub.schedule)
        : await stripe.subscriptionSchedules.create({
            from_subscription: subscriptionId,
          });

    // Build a 2‑phase plan using iterations (no need for current_period_end)
    const updatedSchedule = await stripe.subscriptionSchedules.update(
      schedule.id,
      {
        phases: [
          {
            // Start immediately, run for exactly one billing cycle
            start_date: "now",
            iterations: 1,
            items: [{ price: item.price.id, quantity: item.quantity ?? 1 }],
            proration_behavior: "none",
          },
          {
            // Next cycle begins on the natural renewal; switch to target price
            items: [{ price: newPriceId, quantity: nextQty }],
          },
        ],
        end_behavior: "release", // hand control back to the subscription
      }
    );

    // Subscription itself is unchanged now; Stripe swaps prices at renewal
    const refreshedSub = await stripe.subscriptions.retrieve(subscriptionId);
    return { subscription: refreshedSub, schedule: updatedSchedule };
  }

  // Immediate downgrade (no proration by default)
  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: item.id, price: newPriceId, quantity: nextQty }],
    proration_behavior: prorationBehavior, // "none" by default to avoid credits/refunds
    billing_cycle_anchor: "unchanged",
  });

  return { subscription: updated };
}
