import {
  getProducerPublic,
  getUsersProducerIdsCached,
} from "@/backend/data/producer";
import { producerSlug } from "@/utils/producers";
import { notFound, redirect } from "next/navigation";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { auth } from "@clerk/nextjs/server";
import { ProducerPageClient } from "./client-page";
import { getFullProducerPublic } from "@/backend/rpc/producers";

export default async function ProducerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = slug.substring(slug.length - 36);
  const receivedSlug = slug.substring(0, slug.length - 36);
  const session = await auth();
  const subTier = session.userId ? await getSubTier(session.userId) : "Free";
  const userProducerIds = session.userId
    ? await getUsersProducerIdsCached(session.userId)
    : [];

  const producer = await getFullProducerPublic({ id: id });

  if (!producer) {
    notFound();
  }

  const correctSlug = producerSlug(producer.name);

  if (receivedSlug !== correctSlug) {
    redirect(`${correctSlug}${producer.id}`);
  }

  return (
    <ProducerPageClient
      producer={producer}
      subTier={subTier}
      userProducerIds={userProducerIds}
    />
  );
}
