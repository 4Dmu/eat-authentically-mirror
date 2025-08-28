import { fetchUser } from "@/backend/rpc/auth";
import { Header as HeaderClient } from "./app-header-client";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { getUsersProducerIdsCached } from "@/backend/data/producer";

export async function Header() {
  const user = await fetchUser();
  const subTier = await getSubTier();
  const ids = user ? await getUsersProducerIdsCached(user.id) : [];

  return (
    <HeaderClient userFromServer={user} producerIds={ids} subTier={subTier} />
  );
}
