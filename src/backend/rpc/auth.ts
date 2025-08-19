"use server";
import { auth } from "@clerk/nextjs/server";
import { actionClient } from "./helpers/safe-action";
import { getMemberSubTier, getOrgSubTier } from "./utils/get-sub-tier";
import { getUsersOrganizationIdCached } from "../data/organization";
import {
  ORG_DATA_KV,
  ORG_STRIPE_CUSTOMER_ID_KV,
  USER_STRIPE_CUSTOMER_ID_KV,
} from "../kv";

export const getAuthState = actionClient.action(async () => {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return {
      isAuthed: false,
      userId: null,
      userData: null,
      memberSubTier: "Free",
      orgId: null,
      orgData: null,
      orgSubTier: "Free",
      canMangeBilling: false,
    } as const;
  }

  const memberSubTier = await getMemberSubTier(userId);
  const userStripeCustomerId = await USER_STRIPE_CUSTOMER_ID_KV.get(userId);
  const orgId = await getUsersOrganizationIdCached(userId);

  if (!orgId) {
    return {
      isAuthed: true,
      userId,
      userData: sessionClaims.imageUrl
        ? { imageUrl: sessionClaims.imageUrl }
        : null,
      memberSubTier: memberSubTier,
      orgId: null,
      orgData: null,
      orgSubTier: "Free",
      canMangeBilling: userStripeCustomerId !== null,
    } as const;
  }

  const orgData = await ORG_DATA_KV.get(orgId);
  const orgSubTier = await getOrgSubTier({ providedOrgId: orgId });
  const orgStripeCustomerId = await ORG_STRIPE_CUSTOMER_ID_KV.get(orgId);

  return {
    isAuthed: true,
    userId,
    userData: sessionClaims.imageUrl
      ? { imageUrl: sessionClaims.imageUrl }
      : null,
    memberSubTier,
    orgId,
    orgData: orgData
      ? { imageUrl: orgData.imageUrl, name: orgData.name }
      : null,
    orgSubTier,
    canMangeBilling:
      orgStripeCustomerId !== null || userStripeCustomerId != null,
  } as const;
});
