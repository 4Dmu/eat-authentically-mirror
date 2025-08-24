import { fetchLoggedInOrganizationListingLight } from "@/backend/rpc/organization";
import { useQuery } from "@tanstack/react-query";

export function useSignedInOrg() {
  return useQuery({
    queryKey: ["signed-in-org"],
    queryFn: () => fetchLoggedInOrganizationListingLight(),
  });
}
