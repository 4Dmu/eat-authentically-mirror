import { useAuthState } from "@/hooks/use-auth-state";
import { PropsWithChildren } from "react";

export function OrgSignedIn(props: PropsWithChildren) {
  const { authState } = useAuthState();

  const allow = authState?.isAuthed && authState.orgId != null;
  if (allow) {
    return <>{props.children}</>;
  }

  return null;
}

export function OrgSignedOut(props: PropsWithChildren) {
  const { authState } = useAuthState();

  const allow = authState?.isAuthed && authState.orgId != null;
  if (!allow) {
    return <>{props.children}</>;
  }

  return null;
}
