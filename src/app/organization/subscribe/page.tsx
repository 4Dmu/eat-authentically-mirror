import { fetchLoggedInOrganizationListingLight } from "@/backend/rpc/organization";
import { ClientPage } from "./page-client";
import { throwErrors } from "@/utils/actions";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { redirect } from "next/navigation";

export default async function Page() {
  const subTier = await getSubTier();

  if (subTier != "Free") {
    redirect("/organization/profile");
  }

  const listing = await fetchLoggedInOrganizationListingLight().then((r) =>
    throwErrors(r)
  );

  return <ClientPage listing={listing} />;
}
