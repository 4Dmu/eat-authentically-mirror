import { fetchLoggedInOrganizationListing } from "@/backend/rpc/organization";
import { ListingPageClient } from "./page-client";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { listCertifications } from "@/backend/data/certifications";

export default async function Page() {
  const listing = await fetchLoggedInOrganizationListing();

  const allCertifications = await listCertifications();

  const tier = await getSubTier();

  return (
    <ListingPageClient
      allCertifications={allCertifications}
      tier={tier}
      listing={listing}
    />
  );
}
