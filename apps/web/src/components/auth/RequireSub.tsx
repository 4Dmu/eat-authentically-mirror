"use client";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import { Tier } from "@/backend/stripe/subscription-plans";
import { useSubTier } from "@/hooks/use-sub-tier";
import { PropsWithChildren } from "react";

export function Subbed({
  children,
  tiers,
  initialSubTier = "Free",
}: PropsWithChildren & { tiers?: Tier[]; initialSubTier?: SubTier }) {
  const { subTier } = useSubTier({ initialData: initialSubTier });

  const allow =
    subTier !== "Free" && (tiers ? tiers.includes(subTier.tier) : true);

  if (allow) {
    return children;
  }

  return null;
}

export function NotSubbed({
  children,
  initialSubTier = "Free",
}: PropsWithChildren & { initialSubTier?: SubTier; tiers?: Tier[] }) {
  const { subTier } = useSubTier({ initialData: initialSubTier });

  const allow = subTier === "Free";

  if (allow) {
    return children;
  }

  return null;
}
