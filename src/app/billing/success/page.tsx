import { triggerStripeSync } from "@/backend/rpc/stripe";
import { tryCatch } from "@/utils/try-catch";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function ConfirmStripeSessionComponent({
  redirectPath,
}: {
  redirectPath: string;
}) {
  const user = await auth();
  if (!user) return <div>No user</div>;
  console.log("user", user);
  const { error } = await tryCatch(triggerStripeSync());
  if (error) return <div>Failed to sync with stripe: {error.message}</div>;
  return redirect(redirectPath);
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_path: string | undefined }>;
}) {
  const params = await searchParams;

  console.log("[stripe/billing/success] redirect_path", params.redirect_path);

  return (
    <div>
      <Suspense fallback={<div>{"One moment..."}</div>}>
        <ConfirmStripeSessionComponent
          redirectPath={params.redirect_path ?? "/"}
        />
      </Suspense>
    </div>
  );
}
