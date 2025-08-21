import { fetchLoggedInOrganizationListingLight } from "@/backend/rpc/organization";

export default async function Page() {
  const listing = await fetchLoggedInOrganizationListingLight();
  return <div>{listing.data?.name}</div>;
}
