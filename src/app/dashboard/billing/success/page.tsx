import { flushingLogger } from "@/backend/lib/log";
import { triggerStripeSync } from "@/backend/rpc/stripe";
import ClientRedirect from "@/components/client-redirect";
import { tryCatch } from "@/utils/try-catch";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function ConfirmStripeSessionComponent({
  redirectPath,
}: {
  redirectPath: string;
}) {
  const logger = flushingLogger();
  const user = await auth();
  if (!user) return <div>No user</div>;
  logger.info("[stripe/billing/success] [ConfirmStripeSessionComponent]", {
    user,
  });
  const { error } = await tryCatch(triggerStripeSync)();
  if (error) return <div>Failed to sync with stripe: {error.message}</div>;
  return <ClientRedirect to={redirectPath} />;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_path: string | undefined }>;
}) {
  const logger = flushingLogger();
  const params = await searchParams;

  logger.info("[stripe/billing/success] Info", {
    redirectPath: params.redirect_path,
  });

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
