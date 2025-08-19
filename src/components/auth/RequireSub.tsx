import { useAuthState } from "@/hooks/use-auth-state";
import { PropsWithChildren } from "react";

export function MemberSubbed(props: PropsWithChildren & { tiers?: string[] }) {
  const { authState } = useAuthState();

  const allow =
    authState?.memberSubTier &&
    (props.tiers
      ? props.tiers.includes(authState.memberSubTier)
      : authState.memberSubTier !== "Free");

  if (allow) {
    return props.children;
  }

  return null;
}

export function MemberNotSubbed(props: PropsWithChildren) {
  const { authState } = useAuthState();

  const allow =
    authState?.memberSubTier === "Free" ||
    authState?.memberSubTier === undefined;

  if (allow) {
    return props.children;
  }

  return null;
}

export function OrgNotSubbed(props: PropsWithChildren) {
  const { authState } = useAuthState();

  const allow =
    authState?.orgSubTier === "Free" || authState?.orgSubTier === undefined;

  if (allow) {
    return props.children;
  }

  return null;
}
