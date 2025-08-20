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

export type AuthState =
  | {
      isAuthed: false;
    }
  | {
      isAuthed: true;
      userId: string;
      userData: {
        imageUrl: string;
      };
      memberSubTier: "Free" | "Pro";
      orgId: null;
      orgData: null;
      orgSubTier: "Free";
      canMangeBilling: boolean;
    }
  | {
      isAuthed: true;
      userId: string;
      userData: {
        imageUrl: string;
      };
      memberSubTier: "Free" | "Pro";
      orgId: string;
      orgData: { imageUrl: string; name: string };
      orgSubTier: "Free" | "Pro" | "Premium";
      canMangeBilling: boolean;
    };

export const getAuthState = actionClient.action(
  async (): Promise<AuthState> => {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return {
        isAuthed: false,
      } as const;
    }

    const memberSubTier = await getMemberSubTier(userId);
    const userStripeCustomerId = await USER_STRIPE_CUSTOMER_ID_KV.get(userId);
    const orgId = await getUsersOrganizationIdCached(userId);
    const orgData = orgId ? await ORG_DATA_KV.get(orgId) : null;

    if (!orgData || !orgId) {
      return {
        isAuthed: true,
        userId: userId,
        userData: { imageUrl: sessionClaims.imageUrl! },
        memberSubTier: memberSubTier,
        orgId: null,
        orgData: null,
        orgSubTier: "Free",
        canMangeBilling: userStripeCustomerId !== null,
      } as const;
    }

    const orgSubTier = await getOrgSubTier({ providedOrgId: orgId });
    const orgStripeCustomerId = await ORG_STRIPE_CUSTOMER_ID_KV.get(orgId);

    return {
      isAuthed: true,
      memberSubTier,
      orgId,
      userId: userId,
      userData: { imageUrl: sessionClaims.imageUrl! },
      orgData: { imageUrl: orgData.imageUrl, name: orgData.name },
      orgSubTier,
      canMangeBilling:
        orgStripeCustomerId !== null || userStripeCustomerId != null,
    } as const;
  }
);
