import { USER_STRIPE_CUSTOMER_ID_KV } from "@/backend/kv";
import { billingPortalRatelimit } from "@/backend/lib/rate-limit";
import { createBillingPortalSession } from "@/backend/rpc/stripe";
import { env } from "@/env";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { userId } = await auth.protect();

  const { success } = await billingPortalRatelimit.limit(userId);

  if (!success) {
    return <p>Ratelimit exceeded</p>;
  }

  const customerId = await USER_STRIPE_CUSTOMER_ID_KV.get(userId);

  if (!customerId) {
    redirect("/dashboard");
  }

  const url = await createBillingPortalSession({
    redirectPath: `/dashboard`,
  });

  redirect(url);
}
