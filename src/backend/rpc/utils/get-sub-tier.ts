import { getUsersOrganizationIdCached } from "@/backend/data/organization";
import {
  ORG_STRIPE_CUSTOMER_ID_KV,
  STRIPE_CUSTOMER_SUBSCRIPTION_KV,
  USER_STRIPE_CUSTOMER_ID_KV,
} from "@/backend/kv";
import { env } from "@/env";
import { auth } from "@clerk/nextjs/server";

export async function getMemberSubTier(providedUserId?: string) {
  let userId = providedUserId;
  if (!userId) {
    const session = await auth();
    if (!session.userId) {
      return "Free";
    }
    userId = session.userId;
  }

  const customerId = await USER_STRIPE_CUSTOMER_ID_KV.get(userId);
  if (!customerId) {
    return "Free";
  }
  const sub = await STRIPE_CUSTOMER_SUBSCRIPTION_KV.get(customerId);

  if (!sub || sub.status !== "active") {
    return "Free";
  }

  return "Pro";
}

export async function getOrgSubTier(
  params?: { providedUserId: string } | { providedOrgId: string }
) {
  let orgId;

  if (params) {
    if ("providedOrgId" in params) {
      orgId = params.providedOrgId;
    } else {
      orgId = await getUsersOrganizationIdCached(params.providedUserId);
    }
  } else {
    const session = await auth();
    if (!session.userId) {
      return "Free";
    }
    orgId = await getUsersOrganizationIdCached(session.userId);
  }

  if (!orgId) return "Free";

  const customerId = await ORG_STRIPE_CUSTOMER_ID_KV.get(orgId);
  if (!customerId) {
    return "Free";
  }
  const sub = await STRIPE_CUSTOMER_SUBSCRIPTION_KV.get(customerId);

  if (!sub || sub.status !== "active") {
    return "Free";
  }

  if (
    sub.priceId === env.PRODUCER_PRO_MONTLY_PRICE_ID ||
    sub.priceId === env.PRODUCER_PRO_YEARLY_PRICE_ID
  ) {
    return "Pro";
  }

  if (
    sub.priceId === env.PRODUCER_PREMIUM_MONTLY_PRICE_ID ||
    sub.priceId === env.PRODUCER_PREMIUM_YEARLY_PRICE_ID
  ) {
    return "Premium";
  }

  return "Free";
}
