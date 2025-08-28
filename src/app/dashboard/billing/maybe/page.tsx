import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { redirect } from "next/navigation";

export default async function Page() {
  const subTier = await getSubTier();
  if (subTier === "Free") {
    redirect("/dashboard/subscribe");
  }
  redirect("/dashboard/billing");
}
