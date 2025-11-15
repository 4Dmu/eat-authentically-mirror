import { STRIPE_CUSTOMER_SUBSCRIPTIONS_KV } from "@/backend/kv";
import { USER_STRIPE_CUSTOMER_ID_KV } from "@ea/kv";
import { PLANS } from "@/backend/stripe/subscription-plans";
import { auth } from "@clerk/nextjs/server";

export async function getSubTier(providedUserId?: string) {
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

  const activeSub = subs?.find((sub) => sub.status === "active");

  if (activeSub) {
    return PLANS[activeSub.priceId];
  }

  return "Free";
}

export type SubTier = Awaited<ReturnType<typeof getSubTier>>;
