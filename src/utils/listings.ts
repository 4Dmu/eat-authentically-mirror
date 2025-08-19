import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
  listCertificationTypesPublic,
  listListingsPublicLight,
} from "@/backend/rpc/listing";
import {
  ListListingsArgs,
  Listing,
  PublicListingLight,
  PublicListing,
} from "@/backend/validators/listings";
import { throwErrors } from "./actions";

/**
 * Gets the image url of the primary image.
 * Fallsback through:
 *  - first image
 *  - legacy image property
 *  - placeholder unsplash url
 */
export function primaryImageUrl(
  listing: Listing | PublicListing | PublicListingLight
) {
  return (
    listing.images?.filter((i) => i.isPrimary)[0]?.cloudflareUrl ??
    listing.images?.[0]?.cloudflareUrl ??
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"
  );
}

export const listingsQueryOptions = (
  args: ListListingsArgs,
  initialData?: { data: PublicListingLight[]; hasNextPage: boolean }
) =>
  queryOptions({
    queryKey: ["listings", args],
    queryFn: () => listListingsPublicLight(args).then((c) => throwErrors(c)),
    placeholderData: keepPreviousData,
    initialData: initialData,
  });

export const certificationTypesOptions = () =>
  queryOptions({
    queryKey: ["certification-types"],
    queryFn: () => listCertificationTypesPublic().then((c) => throwErrors(c)),
    staleTime: 24 * 60 * 60 * 1000, // 24h
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
