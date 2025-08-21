import { AuthState } from "@/backend/rpc/auth";
import { Tier } from "@/backend/stripe/subscription-plans";
import { useAuthState } from "@/hooks/use-auth-state";
import { PropsWithChildren } from "react";

export function Subbed(
  props: PropsWithChildren & { tiers?: Tier[]; initialAuthState?: AuthState }
) {
  const { data } = useAuthState({ initialData: props.initialAuthState });

  const allow =
    data &&
    data.isAuthed &&
    data.subTier !== "Free" &&
    (props.tiers ? props.tiers.includes(data.subTier.tier) : true);

  if (allow) {
    return props.children;
  }

  return null;
}

export function NotSubbed(
  props: PropsWithChildren & { initialAuthState?: AuthState; tiers?: Tier[] }
) {
  const { data } = useAuthState({ initialData: props.initialAuthState });

  const allow = data !== undefined && data.isAuthed && data.subTier === "Free";

  if (allow) {
    return props.children;
  }

  return null;
}
