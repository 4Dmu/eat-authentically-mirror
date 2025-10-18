import {
  keepPreviousData,
  MutationOptions,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  confirmPengingUpload,
  confirmPendingVideoUpload,
  editProducer,
  listCertificationTypesPublic,
  requestUploadUrls,
  requestVideoUploadUrl,
  updateExistingImages,
  deleteVideo,
  claimProducer,
  checkClaimDomainDNS,
  listClaimRequests,
  deleteProducer,
  getProducerPublic,
  verifyClaimPhone,
  regenerateClaimPhoneToken,
  suggestProducer,
  listProducers,
  getFullProducerPublic,
  searchProducers,
  searchByGeoText,
} from "@/backend/rpc/producers";
import {
  Producer,
  EditProducerArgs,
  ClaimProducerArgs,
  CheckClaimDomainDnsArgs,
  PublicClaimRequest,
  DeleteProducerArgs,
  VerifyClaimPhoneArgs,
  RegenerateClaimPhoneTokenArgs,
  SuggestProducerArgs,
  ListProducersArgs,
  EditProducerArgsV2,
  SearchProducersArgs,
  SearchByGeoTextArgs,
} from "@/backend/validators/producers";
import { fetchUserProducer, fetchUserProducers } from "@/backend/rpc/producers";
import {
  ProducerCardsRow,
  ProducerSelect,
  ProducerWith,
  ProducerWithAll,
} from "@/backend/db/schema";
import type { ProducerSearchResult } from "@/backend/data/producer";

type SimpleMutationOps<TData, TArgs> = Omit<
  MutationOptions<TData, Error, TArgs, unknown>,
  "mutationFn" | "mutationKey"
>;

/**
 * Gets the image url of the primary image.
 * Fallsback through:
 *  - first image
 *  - legacy image property
 *  - placeholder unsplash url
 */
export function primaryImageUrl(
  producer:
    | Pick<ProducerWith<"media">, "media" | "type">
    | Pick<ProducerCardsRow, "thumbnailUrl" | "type">
) {
  console.log(producer);
  const url: string | undefined | null =
    "thumbnailUrl" in producer
      ? producer.thumbnailUrl
      : (producer.media?.find((p) => p.role === "cover")?.asset.url ??
        producer.media?.[0]?.asset.url);

  if (url) {
    return url;
  }

  switch (producer.type) {
    case "eatery":
      return "/defaults/default-eatery.png";
    case "ranch":
      return "/defaults/default-ranch.png";
    case "farm":
      return "/defaults/default-farm.png";
  }
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
  return encodeURIComponent(
    `${name.toLowerCase().trim().split(" ").join("-")}-`
  );
}

/**
 * Generates slug from listing name,
 * to be used with self healing urls only
 *
 * Includes the trailing -
 * @example
 *  'Daves Ranch' returns 'daves-ranch-id'
 */
export function producerSlugFull(producer: Pick<Producer, "name" | "id">) {
  return `${producer.name.toLowerCase().trim().split(" ").join("-")}-${
    producer.id
  }`;
}

export function useProducerPublic(
  producerId: string,
  opts?: UseQueryOptions<
    ProducerCardsRow | undefined,
    Error,
    ProducerCardsRow | undefined,
    readonly [string, string]
  >
) {
  return useQuery({
    ...opts,
    queryKey: ["producer", producerId] as const,
    queryFn: async () => {
      const producer = await getProducerPublic({ id: producerId });
      if (!producer) throw new Error("Producer not found");
      return producer;
    },
    placeholderData: keepPreviousData,
  });
}

export function useSearchProducers(
  params: SearchProducersArgs,
  opts?: UseQueryOptions<
    ProducerSearchResult,
    Error,
    ProducerSearchResult,
    readonly [string, SearchProducersArgs]
  >
) {
  return useQuery({
    ...opts,
    queryKey: ["search-producers", params] as const,
    queryFn: async () => {
      return await searchProducers(params);
    },
    enabled: params.query !== undefined,
    placeholderData: keepPreviousData,
  });
}

export function useSearchByGeoText(
  params: SearchByGeoTextArgs,
  opts?: UseQueryOptions<
    ProducerSearchResult,
    Error,
    ProducerSearchResult,
    readonly [string, SearchProducersArgs]
  >
) {
  return useQuery({
    ...opts,
    queryKey: ["search-producer-by-geo-text", params] as const,
    queryFn: async () => {
      return await searchByGeoText(params);
    },
    placeholderData: keepPreviousData,
  });
}

export function useProducers(
  args: ListProducersArgs,
  opts?: UseQueryOptions<
    { items: ProducerWithAll[]; hasMore: boolean },
    Error,
    { items: ProducerWithAll[]; hasMore: boolean },
    readonly [string, ListProducersArgs]
  >
) {
  return useQuery({
    ...opts,
    queryKey: ["producers", args] as const,
    queryFn: async () => {
      return await listProducers(args);
    },
    placeholderData: keepPreviousData,
  });
}

export function useFullProducerPublic(
  producerId: string,
  opts?: UseQueryOptions<
    ProducerWithAll | undefined,
    Error,
    ProducerWithAll | undefined,
    readonly [string, string]
  >
) {
  return useQuery({
    ...opts,
    queryKey: ["producer", producerId] as const,
    queryFn: async () => {
      const producer = await getFullProducerPublic({ id: producerId });
      if (!producer) throw new Error("Producer not found");
      return producer;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCertificationTypes() {
  return useQuery({
    queryKey: ["certification-types"] as const,
    queryFn: () => listCertificationTypesPublic(),
    staleTime: 24 * 60 * 60 * 1000, // 24h
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
}

export function useLoggedInUserProducers(
  opts?: Pick<
    UseQueryOptions<ProducerCardsRow[], Error, Producer[], readonly [string]>,
    | "initialData"
    | "networkMode"
    | "persister"
    | "behavior"
    | "gcTime"
    | "meta"
    | "retry"
    | "retryDelay"
  >
) {
  return useQuery({
    ...opts,
    queryKey: ["logged-in-user-producers"] as const,
    queryFn: () => fetchUserProducers(),
  });
}

export function useLoggedInUserProducer(
  producerId: string,
  opts?: Pick<
    UseQueryOptions<
      ProducerWithAll | null,
      Error,
      ProducerWithAll | null,
      readonly [string]
    >,
    | "initialData"
    | "networkMode"
    | "persister"
    | "behavior"
    | "gcTime"
    | "meta"
    | "retry"
    | "retryDelay"
  >
) {
  return useQuery({
    ...opts,
    queryKey: ["logged-in-user-producer"] as const,
    queryFn: () => fetchUserProducer(producerId),
  });
}

export function useListClaimRequests(
  props?: Omit<
    UseQueryOptions<
      PublicClaimRequest[],
      Error,
      PublicClaimRequest[],
      readonly [string]
    >,
    "queryFn" | "queryKey"
  >
) {
  return useQuery({
    ...(props as object),
    queryKey: ["list-claim-requests"] as const,
    queryFn: () => listClaimRequests(),
  });
}

export function useFetchUserProducers(
  opts?: Omit<
    UseQueryOptions<
      ProducerCardsRow[],
      Error,
      ProducerCardsRow[],
      readonly [string]
    >,
    "queryFn" | "queryKey"
  >
) {
  return useQuery({
    ...opts,
    queryKey: ["fetch-user-producers"] as const,
    queryFn: () => fetchUserProducers(),
  });
}

// ---------- Mutations

export function useEditUserProducer(
  opts?: Omit<
    UseMutationOptions<void, Error, EditProducerArgsV2, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["edit-producer"] as const,
    mutationFn: async (args: EditProducerArgsV2) => {
      await editProducer(args);
    },
  });
}

export function useUploadImages() {
  return useMutation({
    mutationKey: ["upload-images"] as const,
    mutationFn: async ({
      toUpload,
      producerId,
    }: {
      toUpload: { file: File }[];
      producerId: string;
    }) => {
      if (toUpload.length === 0) return;

      const uploadUrls = await requestUploadUrls({
        producerId,
        imageItemParams: toUpload.map(({ file }) => ({
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

      await confirmPengingUpload({ producerId });
    },
  });
}

export function useUploadVideo() {
  return useMutation({
    mutationKey: ["upload-video"] as const,
    mutationFn: async ({
      producerId,
      toUpload,
    }: {
      producerId: string;
      toUpload: { file: File };
    }) => {
      const uploadUrl = await requestVideoUploadUrl({ producerId });
      const form = new FormData();
      form.set("file", toUpload.file);
      await fetch(uploadUrl, { method: "POST", body: form });
      await confirmPendingVideoUpload({ producerId });
    },
  });
}

export function useDeleteVideo() {
  return useMutation({
    mutationKey: ["delete-video"] as const,
    mutationFn: async ({ producerId }: { producerId: string }) => {
      await deleteVideo({ producerId });
    },
  });
}

export function useUpdateExistingImages() {
  return useMutation({
    mutationKey: ["update-existing-images"] as const,
    mutationFn: async (data: { data: string[]; producerId: string }) => {
      await updateExistingImages(data);
    },
  });
}

export function useClaimProducer(
  opts?: Omit<
    UseMutationOptions<void, Error, ClaimProducerArgs, unknown>,
    "mutationFn" | "mutationKey"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...opts,
    mutationKey: ["claim-producer"] as const,
    mutationFn: (args: ClaimProducerArgs) => claimProducer(args),
    onSuccess: async (d, v, c) => {
      await opts?.onSuccess?.(d, v, c);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["list-claim-requests"] }),
      ]);
    },
  });
}

export function useCheckClaimDomainDns(
  opts?: Omit<
    UseMutationOptions<string, Error, CheckClaimDomainDnsArgs, unknown>,
    "mutationFn" | "mutationKey"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...opts,
    mutationKey: ["check-claim-domain-dns"] as const,
    mutationFn: (args: CheckClaimDomainDnsArgs) => checkClaimDomainDNS(args),
    onSuccess: async (d, v, c) => {
      await opts?.onSuccess?.(d, v, c);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["list-claim-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["fetch-user-producers"] }),
        queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producer"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producers"],
        }),
      ]);
    },
  });
}

export function useDeleteProducer(
  opts?: SimpleMutationOps<void, DeleteProducerArgs>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...opts,
    mutationKey: ["delete-producer"] as const,
    mutationFn: async (args: DeleteProducerArgs) => {
      await deleteProducer(args);
    },
    onSuccess: async (d, v, c) => {
      await opts?.onSuccess?.(d, v, c);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fetch-user-producers"] }),
        queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producer"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producers"],
        }),
        queryClient.invalidateQueries({ queryKey: ["producers"] }),
        queryClient.invalidateQueries({ queryKey: ["list-claim-requests"] }),
      ]);
    },
  });
}

export function useVerifyClaimPhone(
  opts?: Omit<
    UseMutationOptions<string, Error, VerifyClaimPhoneArgs, unknown>,
    "mutationFn" | "mutationKey"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...opts,
    mutationKey: ["verify-claim-phone"] as const,
    mutationFn: (args: VerifyClaimPhoneArgs) => verifyClaimPhone(args),
    onSuccess: async (d, v, c) => {
      await opts?.onSuccess?.(d, v, c);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["list-claim-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["fetch-user-producers"] }),
        queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producer"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producers"],
        }),
      ]);
    },
  });
}

export function useRegenerateClaimPhoneToken(
  opts?: Omit<
    UseMutationOptions<void, Error, RegenerateClaimPhoneTokenArgs, unknown>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["regenerate-claim-phone-token"] as const,
    mutationFn: (args: RegenerateClaimPhoneTokenArgs) =>
      regenerateClaimPhoneToken(args),
  });
}

export function useSuggestProducer(
  opts?: Omit<
    UseMutationOptions<void, Error, SuggestProducerArgs, unknown>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["suggest-producer"] as const,
    mutationFn: (args: SuggestProducerArgs) => suggestProducer(args),
  });
}
