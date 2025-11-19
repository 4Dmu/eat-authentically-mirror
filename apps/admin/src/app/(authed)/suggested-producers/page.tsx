import { rpc } from "@/rpc";
import { SuggestedProducersPage } from "./client";

export default async function Page() {
  const suggested = await rpc.suggestedProducers.list();
  return <SuggestedProducersPage suggested={suggested} />;
}
