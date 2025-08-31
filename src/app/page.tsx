import { listProducersPublicLight } from "@/backend/rpc/producers";
import { Page } from "./page-client";

export default async function Home() {
  const initialProducersFromServer = await listProducersPublicLight({
    page: 0,
    certs: [],
  });
  return <Page initialProducersFromServer={initialProducersFromServer} />;
}
