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
      (i) => i.cloudflareId === producer.images.primaryImgId,
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
    `${name.toLowerCase().trim().split(" ").join("-")}-`,
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

export const producersQueryOptions = (
  args: ListProducerArgsBeforeValidate,
  initialData?: {
    data: PublicProducerLight[];
    hasNextPage: boolean;
    count: number;
  },
) =>
  queryOptions({
    queryKey: ["producers", args],
    queryFn: () => listProducersPublicLight(args),
    placeholderData: keepPreviousData,
    ...match(args)
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
        () => ({ initialData }),
      )
      .otherwise(() => ({})),
  });

export const producersFullQueryOptions = (
  args: ListProducerArgsBeforeValidate,
  initialData?: { data: PublicProducer[]; hasNextPage: boolean; count: number },
) =>
  queryOptions({
    queryKey: ["producers", "full", args],
    queryFn: () => listProducersPublic(args),
    placeholderData: keepPreviousData,
    ...match(args)
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
        () => ({ initialData }),
      )
      .otherwise(() => ({})),
  });

export const producerPublicOpts = (
  producerId: string,
  opts?: Omit<
    QueryOptions<
      PublicProducer | undefined,
      Error,
      PublicProducer | undefined,
      string[]
    >,
    "queryKey" | "queryFn"
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["producer", producerId],
    queryFn: async () => {
      const producer = getProducerPublic({ id: producerId });
      if (!producer) {
        throw new Error("Producer not found");
      }
      return producer;
    },
    placeholderData: keepPreviousData,
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
    queryKey: ["logged-in-user-producer"],
    queryFn: () => fetchUserProducer(producerId),
  });

type EditProducerOpts = MutationOptions<void, Error, EditProducerArgs, unknown>;

export const editUserProducerOpts = (
  opts?: Omit<EditProducerOpts, "mutationKey" | "mutationFn">,
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
  deps: { queryClient: QueryClient },
  opts?: Omit<ClaimProducerOpts, "mutationFn" | "mutationKey">,
) =>
  mutationOptions({
    ...opts,
    onSuccess: async (d, v, c) => {
      if (opts?.onSuccess) {
        await opts.onSuccess(d, v, c);
      }
      await Promise.all([
        deps.queryClient.invalidateQueries({
          queryKey: ["list-claim-requests"],
        }),
      ]);
    },
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
    onSuccess: async (d, v, c) => {
      if (opts?.onSuccess) {
        await opts.onSuccess(d, v, c);
      }
      await Promise.all([
        deps.queryClient.invalidateQueries({
          queryKey: ["list-claim-requests"],
        }),
        deps.queryClient.invalidateQueries({
          queryKey: ["fetch-user-producers"],
        }),
        deps.queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producer"],
        }),
        deps.queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producers"],
        }),
      ]);
    },
    mutationKey: ["check-claim-domain-dns"],
    mutationFn: (args: CheckClaimDomainDnsArgs) => checkClaimDomainDNS(args),
  });

/**
 * List all of a users claim requests
 */
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

/**
 * Delets a users producer. Will delete associated data from tables like
 * certificationsToProducers and claimRequests.
 *
 * Will also invalidate the following queries:
 * - ["fetch-user-producers"]
 * - ["logged-in-user-producer"]
 * - ["logged-in-user-producers"]
 * - ["producers"]
 * - ["list-claim-requests"]
 */
export const deleteProducerOpts = (
  deps: { queryClient: QueryClient },
  opts?: SimpleMutationOps<void, DeleteProducerArgs>,
) =>
  mutationOptions({
    ...opts,
    onSuccess: async (d, v, c) => {
      if (opts?.onSuccess) {
        await opts.onSuccess(d, v, c);
      }
      await Promise.all([
        deps.queryClient.invalidateQueries({
          queryKey: ["fetch-user-producers"],
        }),
        deps.queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producer"],
        }),
        deps.queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producers"],
        }),
        deps.queryClient.invalidateQueries({
          queryKey: ["producers"],
        }),
        deps.queryClient.invalidateQueries({
          queryKey: ["list-claim-requests"],
        }),
      ]);
    },
    mutationKey: ["delete-producer"],
    mutationFn: async (args: DeleteProducerArgs) => {
      await deleteProducer(args);
    },
  });

export const fetchUserProducersOpts = (
  opts?: Omit<
    QueryOptions<Producer[], Error, Producer[], string[]>,
    "queryFn" | "queryKey"
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["fetch-user-producers"],
    queryFn: async () => {
      return await fetchUserProducers();
    },
  });

type VerifyClaimPhoneOpts = MutationOptions<
  string,
  Error,
  VerifyClaimPhoneArgs,
  unknown
>;

export const verifyClaimPhoneOpts = ({
  opts,
  deps,
}: {
  deps: { queryClient: QueryClient };
  opts?: Omit<VerifyClaimPhoneOpts, "mutationFn" | "mutationKey">;
}) =>
  mutationOptions({
    ...opts,
    onSuccess: async (d, v, c) => {
      if (opts?.onSuccess) {
        await opts.onSuccess(d, v, c);
      }
      await Promise.all([
        deps.queryClient.invalidateQueries({
          queryKey: ["list-claim-requests"],
        }),
        deps.queryClient.invalidateQueries({
          queryKey: ["fetch-user-producers"],
        }),
        deps.queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producer"],
        }),
        deps.queryClient.invalidateQueries({
          queryKey: ["logged-in-user-producers"],
        }),
      ]);
    },
    mutationKey: ["verify-claim-phone"],
    mutationFn: (args: VerifyClaimPhoneArgs) => verifyClaimPhone(args),
  });

export const regenerateClaimPhoneTokenOpts = (
  opts?: Omit<
    MutationOptions<void, Error, RegenerateClaimPhoneTokenArgs, unknown>,
    "mutationFn" | "mutationKey"
  >,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["regenerate-claim-phone-token"],
    mutationFn: (args: RegenerateClaimPhoneTokenArgs) =>
      regenerateClaimPhoneToken(args),
  });
