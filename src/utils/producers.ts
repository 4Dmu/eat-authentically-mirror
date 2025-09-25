import {
  keepPreviousData,
  MutationOptions,
  mutationOptions,
  QueryClient,
  QueryOptions,
  queryOptions,
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
  listProducersPublicLight,
  requestUploadUrls,
  requestVideoUploadUrl,
  updateExistingImages,
  deleteVideo,
  listProducersPublic,
  claimProducer,
  checkClaimDomainDNS,
  listClaimRequests,
  deleteProducer,
  getProducerPublic,
  verifyClaimPhone,
  regenerateClaimPhoneToken,
} from "@/backend/rpc/producers";
import {
  ListProducerArgsBeforeValidate,
  Producer,
  PublicProducerLight,
  PublicProducer,
  EditProducerArgs,
  ClaimProducerArgs,
  CheckClaimDomainDnsArgs,
  PublicClaimRequest,
  DeleteProducerArgs,
  VerifyClaimPhoneArgs,
  RegenerateClaimPhoneTokenArgs,
} from "@/backend/validators/producers";
import { fetchUserProducer, fetchUserProducers } from "@/backend/rpc/producers";
import { ImageData } from "@/backend/validators/producers";
import { match, P } from "ts-pattern";

type SimpleMutationOps<TData, TArgs> = Omit<
  MutationOptions<TData, Error, TArgs, unknown>,
  "mutationFn" | "mutationKey"
>;

type QOpts<T, T2, T3, T4 extends readonly unknown[]> = Omit<
  QueryOptions<T, T2, T3, T4>,
  "queryKey" | "queryFn"
>;

type LoggedInUserProducersOptions = QueryOptions<
  Producer[],
  Error,
  Producer[],
  string[]
>;

type LoggedInUserProducerOptions = QueryOptions<
  Producer | undefined,
  Error,
  Producer | undefined,
  string[]
>;

type EditProducerOpts = MutationOptions<void, Error, EditProducerArgs, unknown>;

type ClaimProducerOpts = MutationOptions<
  void,
  Error,
  ClaimProducerArgs,
  unknown
>;

/**
 * Additional user provided mutation opts for `checkClaimDomainDnsOpts`
 */
type CheckClaimDomainDnsOpts = MutationOptions<
  string,
  Error,
  CheckClaimDomainDnsArgs,
  unknown
>;

type VerifyClaimPhoneOpts = MutationOptions<
  string,
  Error,
  VerifyClaimPhoneArgs,
  unknown
>;

/**
 * Gets the image url of the primary image.
 * Fallsback through:
 *  - first image
 *  - legacy image property
 *  - placeholder unsplash url
 */
export function primaryImageUrl(producer: Pick<Producer, "images">) {
  return (
    producer.images?.items.find(
      (i) => i.cloudflareId === producer.images.primaryImgId
    )?.cloudflareUrl ??
    producer.images?.items[0]?.cloudflareUrl ??
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

export function useProducers(
  args: ListProducerArgsBeforeValidate,
  initialData?: {
    data: PublicProducerLight[];
    hasNextPage: boolean;
    count: number;
  }
) {
  const gate = match(args)
    .with(
      {
        page: 0,
        certs: [],
        type: P.nullish.optional(),
        query: P.nullish.optional(),
        locationSearchArea: P.nullish.optional(),
        claimed: P.nullish.optional(),
        userIpGeo: P.nullish.optional(),
      },
      () => ({ initialData })
    )
    .otherwise(() => ({}));

  return useQuery({
    queryKey: ["producers", args] as const,
    queryFn: () => listProducersPublicLight(args),
    placeholderData: keepPreviousData,
    ...gate,
  });
}

export function useProducersFull(
  args: ListProducerArgsBeforeValidate,
  initialData?: { data: PublicProducer[]; hasNextPage: boolean; count: number }
) {
  const gate = match(args)
    .with(
      {
        page: 0,
        certs: [],
        type: P.nullish.optional(),
        query: P.nullish.optional(),
        locationSearchArea: P.nullish.optional(),
        claimed: P.nullish.optional(),
        userIpGeo: P.nullish.optional(),
      },
      () => ({ initialData })
    )
    .otherwise(() => ({}));

  return useQuery({
    queryKey: ["producers", "full", args] as const,
    queryFn: () => listProducersPublic(args),
    placeholderData: keepPreviousData,
    ...gate,
  });
}

export function useProducerPublic(
  producerId: string,
  opts?: UseQueryOptions<
    PublicProducer | undefined,
    Error,
    PublicProducer | undefined,
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
    UseQueryOptions<Producer[], Error, Producer[], readonly [string]>,
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
      Producer | undefined,
      Error,
      Producer | undefined,
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
    UseQueryOptions<Producer[], Error, Producer[], readonly [string]>,
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
    UseMutationOptions<void, Error, EditProducerArgs, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["edit-producer"] as const,
    mutationFn: async (args: EditProducerArgs) => {
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
      toUpload: { _type: "upload"; file: File; isPrimary: boolean }[];
      producerId: string;
    }) => {
      if (toUpload.length === 0) return;

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
      toUpload: { _type: "upload"; file: File };
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
    mutationFn: async (data: {
      data: { items: ImageData[]; primaryImgId: string | null };
      producerId: string;
    }) => {
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
