import { getUserPinboardFull } from "@/backend/rpc/pinboard";
import { PinboardPageClient } from "./page-client";

export default async function PinboardPage() {
  const pinboard = await getUserPinboardFull();

  return <PinboardPageClient pinboard={pinboard} />;
}
