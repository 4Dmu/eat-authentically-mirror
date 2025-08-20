import { AuthState } from "@/backend/rpc/auth";
import { useAuthState } from "@/hooks/use-auth-state";
import { PropsWithChildren } from "react";

export function MemberSubbed(
  props: PropsWithChildren & { tiers?: string[]; initialAuthState?: AuthState }
) {
  const { data } = useAuthState({ initialData: props.initialAuthState });

  const allow = data && data.isAuthed && data.memberSubTier !== "Free";

  if (allow) {
    return props.children;
  }

  return null;
}

export function MemberNotSubbed(
  props: PropsWithChildren & { initialAuthState?: AuthState }
) {
  const { data } = useAuthState({ initialData: props.initialAuthState });

  const allow = data && data.isAuthed && data.memberSubTier === "Free";

  if (allow) {
    return props.children;
  }

  return null;
}

export function OrgNotSubbed(
  props: PropsWithChildren & { initialAuthState?: AuthState }
) {
  const { data } = useAuthState({ initialData: props.initialAuthState });

  const allow = data?.isAuthed && data.orgId && data.orgSubTier === "Free";

  if (allow) {
    return props.children;
  }

  return null;
}
