import { fetchLoggedInOrganizationListingLight } from "@/backend/rpc/organization";
import { ClientPage } from "./page-client";
import { throwErrors } from "@/utils/actions";

export default async function Page() {
  const listing = await fetchLoggedInOrganizationListingLight().then((r) =>
    throwErrors(r)
  );

  return <ClientPage listing={listing} />;
}
