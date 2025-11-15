import { notFound } from "next/navigation";
import { PageClient } from "./page-client";
import { rpc } from "@/rpc";

export default async function Page(props: {
  params: Promise<{ id: string | undefined }>;
}) {
  const params = await props.params;
  if (!params.id) {
    notFound();
  }
  const producer = await rpc.producers.get({ id: params.id });
  if (!producer) {
    notFound();
  }

  return <PageClient producer={producer} />;
}
