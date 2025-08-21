import { AuthState } from "@/backend/rpc/auth";
import { useAuthState } from "@/hooks/use-auth-state";
import { PropsWithChildren } from "react";

export function OrgSignedIn(
  props: PropsWithChildren & { initialAuthState?: AuthState }
) {
  const { data } = useAuthState({ initialData: props.initialAuthState });

  const allow = data && data.isAuthed && data.orgId;

  if (allow) {
    return <>{props.children}</>;
  }

  return null;
}

export function OrgSignedOut(
  props: PropsWithChildren & { initialAuthState?: AuthState }
) {
  const { data } = useAuthState({ initialData: props.initialAuthState });

  const allow = data && data.isAuthed && !data.orgId;

  if (allow) {
    return <>{props.children}</>;
  }

  return null;
}
