import { db } from "@/backend/db";
import { claimRequests, producers } from "@/backend/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Loader } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

async function ClaimPage({ token }: { token: string }) {
  const claim = await db.query.claimRequests.findFirst({
    where: and(
      eq(claimRequests.claimToken, token),
      sql`json_extract(${claimRequests.status}, '$.type') = 'waiting'`
    ),
  });

  await new Promise((r) => setTimeout(r, 500));

  if (!claim) {
    notFound();
  }

  await db.transaction(async (tx) => {
    await tx
      .update(claimRequests)
      .set({
        status: {
          type: "claimed",
        },
        claimedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(claimRequests.id, claim.id));

    await tx
      .update(producers)
      .set({
        userId: claim.userId,
        claimed: true,
        verified: true,
      })
      .where(eq(producers.id, claim.producerId));
  });

  return redirect("/dashboard");
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
    <div className="flex flex-col p-20">
      <Suspense
        fallback={
          <div className="p-10 font-bold text-lg gap-2 flex flex-col items-center">
            <p>Claimimg listing.</p>
            <Loader size={50} className="animate-spin" />
          </div>
        }
      >
        <ClaimPage token={params.token} />
      </Suspense>
    </div>
  );
}
