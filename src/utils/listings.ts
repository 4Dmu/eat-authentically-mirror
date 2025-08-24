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
  updateExistingImages,
} from "@/backend/rpc/listing";
import {
  ListListingsArgs,
  Listing,
  PublicListingLight,
  PublicListing,
  EditListingArgs,
} from "@/backend/validators/listings";
import { fetchLoggedInOrganizationListing } from "@/backend/rpc/organization";
import { ImageData } from "@/backend/validators/listings";

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
    queryFn: () => listListingsPublicLight(args),
    placeholderData: keepPreviousData,
    initialData: initialData,
  });

export const certificationTypesOptions = () =>
  queryOptions({
    queryKey: ["certification-types"],
    queryFn: () => listCertificationTypesPublic(),
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
    queryFn: () => fetchLoggedInOrganizationListing(),
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
      await editUserListing(args);
    },
  });

export const uploadImagesOpts = () =>
  mutationOptions({
    mutationKey: ["upload-images"],
    mutationFn: async (
      toUpload: {
        _type: "upload";
        file: File;
        isPrimary: boolean;
      }[]
    ) => {
      if (toUpload.length === 0) {
        return;
      }

      const uploadUrls = await requestUploadUrls({
        imageItemParams: toUpload.map(({ isPrimary, file }) => ({
          isPrimary,
          type: file.type,
          name: file.name,
        })),
      });

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

export const updateExistingImagesOpts = () =>
  mutationOptions({
    mutationKey: ["update-existing-images"],
    mutationFn: async (args: ImageData[]) => {
      await updateExistingImages({ images: args });
    },
  });
