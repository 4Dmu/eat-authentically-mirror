import { env } from "@/env";

export type Interval = "month" | "year";
export type Tier = "community" | "pro" | "premium" | "enterprise";

export type Plan = {
  priceId: string;
  tier: Tier;
  interval: Interval;
  // Overall rank for cross-tier comparisons (higher = “better”)
  // Use integers so you can insert future tiers between them if needed.
  rank: number;
};

// Central source of truth for prices → plan metadata
export const PLANS: Record<string, Plan> = {
  [env.COMMUNITY_MEMBER_MONTHLY_PRICE_ID]: {
    priceId: env.COMMUNITY_MEMBER_MONTHLY_PRICE_ID,
    tier: "community",
    interval: "month",
    rank: 1,
  },
  [env.COMMUNITY_MEMBER_YEARLY_PRICE_ID]: {
    priceId: env.COMMUNITY_MEMBER_YEARLY_PRICE_ID,
    tier: "community",
    interval: "year",
    rank: 2,
  },
  [env.ORGANIZATION_PRO_MONTHLY_PRICE_ID]: {
    priceId: env.ORGANIZATION_PRO_MONTHLY_PRICE_ID,
    tier: "pro",
    interval: "month",
    rank: 3,
  },
  [env.ORGANIZATION_PRO_YEARLY_PRICE_ID]: {
    priceId: env.ORGANIZATION_PRO_YEARLY_PRICE_ID,
    tier: "pro",
    interval: "year",
    rank: 4,
  },
  [env.ORGANIZATION_PREMIUM_MONTHLY_PRICE_ID]: {
    priceId: env.ORGANIZATION_PREMIUM_MONTHLY_PRICE_ID,
    tier: "premium",
    interval: "month",
    rank: 5,
  },
  [env.ORGANIZATION_PREMIUM_YEARLY_PRICE_ID]: {
    priceId: env.ORGANIZATION_PREMIUM_YEARLY_PRICE_ID,
    tier: "premium",
    interval: "year",
    rank: 6,
  },
  [env.PRODUCER_ENTERPRISE_MONTHLY_PRICE_ID]: {
    priceId: env.PRODUCER_ENTERPRISE_MONTHLY_PRICE_ID,
    tier: "enterprise",
    interval: "month",
    rank: 7,
  },
  [env.PRODUCER_ENTERPRISE_YEARLY_PRICE_ID]: {
    priceId: env.PRODUCER_ENTERPRISE_YEARLY_PRICE_ID,
    tier: "enterprise",
    interval: "year",
    rank: 8,
  },
};

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS[priceId];
}

export function getPlanBySubscriptionTier(
  tier: Tier,
  interval: Interval
): Plan | undefined {
  // Normalize whatever `newSubscriptionTier` is (e.g., "Pro-Monthly") to a Plan

  // Find the plan with matching tier+interval
  return Object.values(PLANS).find(
    (p) => p.tier === tier && p.interval === interval
  );
}

export function comparePlans(
  current: Plan,
  target: Plan
): "same" | "upgrade" | "downgrade" {
  if (current.priceId === target.priceId) return "same";

  // Primary: cross-tier/overall rank
  if (current.rank !== target.rank) {
    return target.rank > current.rank ? "upgrade" : "downgrade";
  }

  // Same rank shouldn’t happen if rank encodes both tier+interval,
  // but if you encode rank only by tier, use an explicit interval rule:
  // month -> year is upgrade; year -> month is downgrade.
  if (current.interval !== target.interval) {
    if (current.interval === "month" && target.interval === "year")
      return "upgrade";
    if (current.interval === "year" && target.interval === "month")
      return "downgrade";
  }

  return "same";
}

export function isActive(status: string): boolean {
  // Adjust to your policy. Common picks: "active" and "trialing".
  return status === "active";
}
