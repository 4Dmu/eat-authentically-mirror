import {
  keepPreviousData,
  MutationOptions,
  mutationOptions,
  QueryOptions,
  queryOptions,
} from "@tanstack/react-query";
import {
  confirmPengingUpload,
  editUserListing,
  listCertificationTypesPublic,
  listListingsPublicLight,
  requestUploadUrls,
} from "@/backend/rpc/listing";
import {
  ListListingsArgs,
  Listing,
  PublicListingLight,
  PublicListing,
  EditListingArgs,
  editListingFormImagesValidator,
} from "@/backend/validators/listings";
import { throwErrors } from "./actions";
import { fetchLoggedInOrganizationListing } from "@/backend/rpc/organization";

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

/**
 * Generates slug from listing name,
 * to be used with self healing urls only
 *
 * Includes the trailing -
 * @example
 *  'Daves Ranch' returns 'daves-ranch-'
 */
export function listingSlug(name: string) {
  return `${name.toLowerCase().trim().split(" ").join("-")}-`;
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

type LoggedInOrganizationListingOptions = QueryOptions<
  Listing,
  Error,
  Listing,
  string[]
>;
export const loggedInOrganizationListingOptions = (
  opts?: Pick<
    LoggedInOrganizationListingOptions,
    | "initialData"
    | "networkMode"
    | "persister"
    | "behavior"
    | "gcTime"
    | "meta"
    | "retry"
    | "retryDelay"
  >
) =>
  queryOptions({
    ...opts,
    queryKey: ["logged-in-organization-listing"],
    queryFn: () =>
      fetchLoggedInOrganizationListing().then((r) => throwErrors(r)),
  });

type EditUserListingOpts = MutationOptions<
  void,
  Error,
  EditListingArgs,
  unknown
>;

export const editUserListingOpts = (
  opts?: Pick<
    EditUserListingOpts,
    | "onSuccess"
    | "onError"
    | "onSettled"
    | "onMutate"
    | "gcTime"
    | "meta"
    | "networkMode"
    | "retry"
    | "retryDelay"
    | "scope"
  >
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["edit-user-listing"],
    mutationFn: async (args: EditListingArgs) => {
      const result = await editUserListing(args);
      if (result.serverError) {
        throw new Error(result.serverError);
      } else if (result.validationErrors) {
        throw new Error(JSON.stringify(result.validationErrors));
      }
    },
  });

export const uploadImagesOpts = () =>
  mutationOptions({
    mutationKey: ["upload-images"],
    mutationFn: async (args: typeof editListingFormImagesValidator.infer) => {
      const toUpload = args.images.filter((i) => i._type === "upload");

      const uploadUrls = await requestUploadUrls({
        numberOfUrlsToGenerate: toUpload.length,
      }).then((r) => throwErrors(r));

      for (let i = 0; i < toUpload.length; i++) {
        const url = uploadUrls[i];
        const file = toUpload[i].file;
        const form = new FormData();
        form.set("file", file);
        await fetch(url.uploadURL, { method: "POST", body: form });
      }

      await confirmPengingUpload();
    },
  });
