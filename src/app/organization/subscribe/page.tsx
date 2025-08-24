import { fetchLoggedInOrganizationListingLight } from "@/backend/rpc/organization";
import { ClientPage } from "./page-client";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { redirect } from "next/navigation";

export default async function Page() {
  const subTier = await getSubTier();

  if (subTier != "Free") {
    redirect("/organization/profile");
  }

  const listing = await fetchLoggedInOrganizationListingLight();

  return <ClientPage listing={listing} />;
}
