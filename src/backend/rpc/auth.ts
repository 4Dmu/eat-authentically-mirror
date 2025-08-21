"use server";
import { auth } from "@clerk/nextjs/server";
import { actionClient } from "./helpers/safe-action";
import { getUsersOrganizationIdCached } from "../data/organization";
import {
  ORG_DATA_KV,
  ORG_STRIPE_CUSTOMER_ID_KV,
  USER_STRIPE_CUSTOMER_ID_KV,
} from "../kv";
import { getSubTier } from "./utils/get-sub-tier";
import { Plan } from "../stripe/subscription-plans";

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
      subTier: Plan | "Free";
      orgId: null;
      orgData: null;
      canMangeBilling: boolean;
    }
  | {
      isAuthed: true;
      userId: string;
      userData: {
        imageUrl: string;
      };
      subTier: Plan | "Free";
      orgId: string;
      orgData: { imageUrl: string; name: string };
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

    const subTier = await getSubTier(userId);
    const userStripeCustomerId = await USER_STRIPE_CUSTOMER_ID_KV.get(userId);
    const orgId = await getUsersOrganizationIdCached(userId);
    const orgData = orgId ? await ORG_DATA_KV.get(orgId) : null;

    if (!orgData || !orgId) {
      return {
        isAuthed: true,
        userId: userId,
        userData: { imageUrl: sessionClaims.imageUrl! },
        subTier: subTier,
        orgId: null,
        orgData: null,
        canMangeBilling: userStripeCustomerId !== null,
      } as const;
    }

    const orgStripeCustomerId = await ORG_STRIPE_CUSTOMER_ID_KV.get(orgId);

    return {
      isAuthed: true,
      subTier: subTier,
      orgId,
      userId: userId,
      userData: { imageUrl: sessionClaims.imageUrl! },
      orgData: { imageUrl: orgData.imageUrl, name: orgData.name },
      canMangeBilling:
        orgStripeCustomerId !== null || userStripeCustomerId != null,
    } as const;
  }
);
