import { getAuthState } from "@/backend/rpc/auth";
import { Header as HeaderClient } from "./app-header-client";

export async function Header() {
  const authState = await getAuthState();

  return <HeaderClient authState={authState} />;
}
