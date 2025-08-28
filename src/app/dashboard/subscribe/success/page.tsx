import { triggerStripeSync } from "@/backend/rpc/stripe";
import { tryCatch } from "@/utils/try-catch";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function ConfirmStripeSessionComponent() {
  const user = await auth();
  if (!user) return <div>No user</div>;
  console.log("user", user);
  const { error } = await tryCatch(triggerStripeSync)();
  if (error) return <div>Failed to sync with stripe: {error.message}</div>;
  return redirect("/dashboard");
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe_session_id: string | undefined }>;
}) {
  const params = await searchParams;

  console.log("[stripe/success] Checkout session id", params.stripe_session_id);

  return (
    <div>
      <Suspense fallback={<div>{"One moment..."}</div>}>
        <ConfirmStripeSessionComponent />
      </Suspense>
    </div>
  );
}
