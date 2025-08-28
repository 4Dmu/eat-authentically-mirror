import { fetchUser, getAuthState } from "@/backend/rpc/auth";
import { Header as HeaderClient } from "./app-header-client";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";

export async function Header() {
  const authState = await getAuthState();
  const user = await fetchUser();
  const subTier = await getSubTier();

  return (
    <HeaderClient
      userFromServer={user}
      subTier={subTier}
      authState={authState}
    />
  );
}
