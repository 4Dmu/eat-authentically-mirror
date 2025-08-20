import { fetchLoggedInOrganizationListingLight } from "@/backend/rpc/organization";
import React from "react";

export default async function Page() {
  const listing = await fetchLoggedInOrganizationListingLight();
  return <div>Page</div>;
}
