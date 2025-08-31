import {
  keepPreviousData,
  MutationOptions,
  mutationOptions,
  QueryClient,
  QueryOptions,
  queryOptions,
} from "@tanstack/react-query";
import {
  confirmPengingUpload,
  confirmPendingVideoUpload,
  editProducer,
  listCertificationTypesPublic,
  listProducersPublicLight,
  requestUploadUrls,
  requestVideoUploadUrl,
  updateExistingImages,
  deleteVideo,
  listProducersPublic,
  claimProducer,
  checkClaimDomainDNS,
  listClaimRequests,
} from "@/backend/rpc/producers";
import {
  ListProducerArgs,
  Producer,
  PublicProducerLight,
  PublicProducer,
  EditProducerArgs,
  ClaimProducerArgs,
  CheckClaimDomainDnsArgs,
  PublicClaimRequest,
} from "@/backend/validators/producers";
import { fetchUserProducer, fetchUserProducers } from "@/backend/rpc/producers";
import { ImageData } from "@/backend/validators/producers";

/**
 * Gets the image url of the primary image.
 * Fallsback through:
 *  - first image
 *  - legacy image property
 *  - placeholder unsplash url
 */
export function primaryImageUrl(
  listing: Producer | PublicProducer | PublicProducerLight,
) {
  return (
    listing.images?.items.find(
      (i) => i.cloudflareId === listing.images.primaryImgId,
    )?.cloudflareUrl ??
    listing.images?.items[0]?.cloudflareUrl ??
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
export function producerSlug(name: string) {
  return `${name.toLowerCase().trim().split(" ").join("-")}-`;
}

/**
 * Generates slug from listing name,
 * to be used with self healing urls only
 *
 * Includes the trailing -
 * @example
 *  'Daves Ranch' returns 'daves-ranch-id'
 */
export function producerSlugFull(
  producer: Producer | PublicProducer | PublicProducerLight,
) {
  return `${producer.name.toLowerCase().trim().split(" ").join("-")}-${
    producer.id
  }`;
}

export const producersQueryOptions = (
  args: ListProducerArgs,
  initialData?: { data: PublicProducerLight[]; hasNextPage: boolean },
) =>
  queryOptions({
    queryKey: ["producers", args],
    queryFn: () => listProducersPublicLight(args),
    placeholderData: keepPreviousData,
    initialData: initialData,
  });

export const producersFullQueryOptions = (
  args: ListProducerArgs,
  initialData?: { data: PublicProducer[]; hasNextPage: boolean },
) =>
  queryOptions({
    queryKey: ["producers", args],
    queryFn: () => listProducersPublic(args),
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

type LoggedInUserProducersOptions = QueryOptions<
  Producer[],
  Error,
  Producer[],
  string[]
>;
export const loggedInUserProducersOptions = (
  opts?: Pick<
    LoggedInUserProducersOptions,
    | "initialData"
    | "networkMode"
    | "persister"
    | "behavior"
    | "gcTime"
    | "meta"
    | "retry"
    | "retryDelay"
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["logged-in-user-producers"],
    queryFn: () => fetchUserProducers(),
  });

type LoggedInUserProducerOptions = QueryOptions<
  Producer | undefined,
  Error,
  Producer | undefined,
  string[]
>;

export const loggedInUserProducerOptions = (
  producerId: string,
  opts?: Pick<
    LoggedInUserProducerOptions,
    | "initialData"
    | "networkMode"
    | "persister"
    | "behavior"
    | "gcTime"
    | "meta"
    | "retry"
    | "retryDelay"
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["logged-in-user-producers"],
    queryFn: () => fetchUserProducer(producerId),
  });

type EditProducerOpts = MutationOptions<void, Error, EditProducerArgs, unknown>;

export const editUserProducerOpts = (
  opts?: Pick<
    EditProducerOpts,
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
  >,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["edit-producer"],
    mutationFn: async (args: EditProducerArgs) => {
      await editProducer(args);
    },
  });

export const uploadImagesOpts = () =>
  mutationOptions({
    mutationKey: ["upload-images"],
    mutationFn: async ({
      toUpload,
      producerId,
    }: {
      toUpload: {
        _type: "upload";
        file: File;
        isPrimary: boolean;
      }[];
      producerId: string;
    }) => {
      if (toUpload.length === 0) {
        return;
      }

      const uploadUrls = await requestUploadUrls({
        producerId,
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

      await confirmPengingUpload({ producerId: producerId });
    },
  });

export const uploadVideoOpts = () =>
  mutationOptions({
    mutationKey: ["upload-video"],
    mutationFn: async ({
      producerId,
      toUpload,
    }: {
      producerId: string;
      toUpload: { _type: "upload"; file: File };
    }) => {
      const uploadUrl = await requestVideoUploadUrl({ producerId });

      const file = toUpload.file;
      const form = new FormData();
      form.set("file", file);
      await fetch(uploadUrl, { method: "POST", body: form });

      await confirmPendingVideoUpload({ producerId });
    },
  });

export const deleteVideoOpts = () =>
  mutationOptions({
    mutationKey: ["delete-video"],
    mutationFn: async ({ producerId }: { producerId: string }) => {
      await deleteVideo({ producerId });
    },
  });

export const updateExistingImagesOpts = () =>
  mutationOptions({
    mutationKey: ["update-existing-images"],
    mutationFn: async (data: {
      data: {
        items: ImageData[];
        primaryImgId: string | null;
      };
      producerId: string;
    }) => {
      await updateExistingImages(data);
    },
  });

type ClaimProducerOpts = MutationOptions<
  void,
  Error,
  ClaimProducerArgs,
  unknown
>;

export const claimProducerOpts = (
  opts?: Omit<ClaimProducerOpts, "mutationFn" | "mutationKey">,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["claim-producer"],
    mutationFn: (args: ClaimProducerArgs) => claimProducer(args),
  });

/**
 * Additional user provided mutation opts for `checkClaimDomainDnsOpts`
 */
type CheckClaimDomainDnsOpts = MutationOptions<
  string,
  Error,
  CheckClaimDomainDnsArgs,
  unknown
>;

/**
 * Check for a users claimRequest with a verification type of domainDns
 * and then checks the dns records of that domain for the required token.
 *
 * Will invalidate all queries using the key ["list-claim-requests"]
 */
export const checkClaimDomainDnsOpts = ({
  opts,
  deps,
}: {
  deps: { queryClient: QueryClient };
  opts?: Omit<CheckClaimDomainDnsOpts, "mutationFn" | "mutationKey">;
}) =>
  mutationOptions({
    ...opts,
    onSuccess: (d, v, c) => {
      if (opts?.onSuccess) {
        opts.onSuccess(d, v, c);
      }
      deps.queryClient.invalidateQueries({
        queryKey: ["list-claim-requests"],
      });
    },
    mutationKey: ["check-claim-domain-dns"],
    mutationFn: (args: CheckClaimDomainDnsArgs) => checkClaimDomainDNS(args),
  });

export const listClaimRequestsOpts = (
  props: Omit<
    QueryOptions<PublicClaimRequest[], Error, PublicClaimRequest[], string[]>,
    "queryFn" | "queryKey"
  >,
) =>
  queryOptions({
    ...props,
    queryKey: ["list-claim-requests"],
    queryFn: async () => {
      return await listClaimRequests();
    },
  });
