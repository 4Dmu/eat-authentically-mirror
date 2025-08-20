import { getUsersOrganizationIdCached } from "@/backend/data/organization";
import {
  ORG_STRIPE_CUSTOMER_ID_KV,
  STRIPE_CUSTOMER_SUBSCRIPTIONS_KV,
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
  const subs = await STRIPE_CUSTOMER_SUBSCRIPTIONS_KV.get(customerId);

  if (subs?.some((sub) => sub.status === "active")) {
    return "Pro";
  }

  return "Free";
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
  const subs = await STRIPE_CUSTOMER_SUBSCRIPTIONS_KV.get(customerId);
  const activeSubs = subs?.filter((s) => s.status === "active");

  if (!activeSubs || activeSubs.length === 0) {
    return "Free";
  }

  if (
    activeSubs.some(
      (sub) => sub.priceId === env.ORGANIZATION_PRO_MONTLY_PRICE_ID
    ) ||
    activeSubs.some(
      (sub) => sub.priceId === env.ORGANIZATION_PRO_YEARLY_PRICE_ID
    )
  ) {
    return "Pro";
  }

  if (
    activeSubs.some(
      (sub) => sub.priceId === env.ORGANIZATION_PREMIUM_MONTLY_PRICE_ID
    ) ||
    activeSubs.some(
      (sub) => sub.priceId === env.ORGANIZATION_PREMIUM_YEARLY_PRICE_ID
    )
  ) {
    return "Premium";
  }

  return "Free";
}
