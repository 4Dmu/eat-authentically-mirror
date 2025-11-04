import { listCertifications } from "@/backend/data/certifications";
import { fetchUserProducer } from "@/backend/rpc/producers";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { notFound } from "next/navigation";
import { ProducersPageClient } from "./page-client";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const producer = await fetchUserProducer(id);

  if (!producer) {
    notFound();
  }

  const allCertifications = await listCertifications();

  const tier = await getSubTier();

  return (
    <ProducersPageClient
      allCertifications={allCertifications}
      tier={tier}
      producer={producer}
    />
  );
}
