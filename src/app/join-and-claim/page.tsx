import { getValidClaimInvitationByToken } from "@/backend/data/claim-invitations";
import { internalClaimProducer } from "@/backend/data/producer";
import { db } from "@/backend/db";
import { claimInvitations, producers } from "@/backend/db/schema";
import ClientRedirect from "@/components/client-redirect";
import { and, eq, sql } from "drizzle-orm";
import { Loader } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JoinPage } from "./page-client";

async function ClaimPage({ token }: { token: string }) {
  const claim = await getValidClaimInvitationByToken(token);

  await new Promise((r) => setTimeout(r, 1000));

  if (!claim) {
    notFound();
  }

  const producer = await db.query.producers.findFirst({
    where: eq(producers.id, claim.producerId),
    columns: {
      id: true,
      name: true,
    },
  });

  if (!producer) {
    notFound();
  }

  return <JoinPage token={token} producer={producer} />;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  if (!params.token) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <Suspense
        fallback={
          <div className="p-10 font-bold text-lg gap-2 flex flex-col items-center">
            <p>Checking Invitation</p>
            <Loader size={50} className="animate-spin" />
          </div>
        }
      >
        <ClaimPage token={params.token} />
      </Suspense>
    </div>
  );
}
