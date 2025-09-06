import { getUsersProducerIdsCached } from "@/backend/data/producer";
import { db } from "@/backend/db";
import { producers } from "@/backend/db/schema";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ClaimPage } from "./claim-page";

export default async function Page(props: {
  params: Promise<{ id?: string }>;
}) {
  const session = await auth.protect();
  const params = await props.params;

  if (!params.id) {
    notFound();
  }

  const tier = await getSubTier(session.userId);
  const userProducersCount = await getUsersProducerIdsCached(session.userId);

  if (
    tier !== "Free" &&
    tier.tier === "enterprise" &&
    userProducersCount.length < 3
  ) {
    console.log("multiple");
  } else if (userProducersCount.length > 0) {
    redirect("/dashboard");
  }

  const producer = await db.query.producers.findFirst({
    where: and(
      eq(producers.id, params.id),
      isNull(producers.userId),
      eq(producers.claimed, false),
    ),
  });

  if (!producer) {
    notFound();
  }

  return <ClaimPage producer={producer} />;
}
