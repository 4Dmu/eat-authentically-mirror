import { getAuthState } from "@/backend/rpc/auth";
import { Header as HeaderClient } from "./app-header-client";
import { throwErrors } from "@/utils/actions";

export async function Header() {
  const authState = await getAuthState().then((t) => throwErrors(t));

  return <HeaderClient authState={authState} />;
}
