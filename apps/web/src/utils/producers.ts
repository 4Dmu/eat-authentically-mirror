import {
  keepPreviousData,
  type MutationOptions,
  useMutation,
  type UseMutationOptions,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
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
  listProducerContries,
  editProducerContact,
  editProducerLocation,
  editProducerCertifications,
  editProducerCommodoties,
  addCommodityAndAssociate,
  listCommodites,
} from "@/backend/rpc/producers";
import type {
  ClaimProducerArgs,
  CheckClaimDomainDnsArgs,
  PublicClaimRequest,
  DeleteProducerArgs,
  VerifyClaimPhoneArgs,
  RegenerateClaimPhoneTokenArgs,
  SuggestProducerArgs,
  ListProducersArgs,
  EditProducerArgsV2,
  ProducerTypes,
  EditProducerContact,
  EditProducerLocationArgs,
  EditProducerCertifications,
  EditProducerCommodoties,
  AddCommodityAndAssociate,
} from "@ea/validators/producers";
import { fetchUserProducer, fetchUserProducers } from "@/backend/rpc/producers";
import type {
  CommoditySelect,
  MediaAssetSelect,
  ProducerCardsRow,
  ProducerMediaSelect,
  ProducerWithAll,
} from "@ea/db/schema";
import type { ProducerSearchResult } from "@/backend/data/producer";
import { useHomePageStore } from "@/stores";
import { searchProducersLocalV2 } from "@/client/local-search";
import { useRef } from "react";

type SimpleMutationOps<TData, TArgs> = Omit<
  MutationOptions<TData, Error, TArgs, unknown>,
  "mutationFn" | "mutationKey"
>;

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

export function useSearchProducersLocal(
  params: { query: string | undefined },
  pagination: { page: number },
  location: {
    position: GeolocationPosition | undefined;
    radius: number | undefined;
  },
  searchArea: {
    bounds: google.maps.LatLngBoundsLiteral | undefined;
  },
  clientFilterOverrides: {
    country: string | undefined;
    category: ProducerTypes | undefined;
    certifications: string[] | undefined;
  },
  userIpGeo: { lat: number; lon: number } | undefined,
  opts?: UseQueryOptions<
    {
      result: ProducerSearchResult;
      userLocation: {
        userRequestsUsingTheirLocation: boolean | undefined;
        searchRadius: number;
      };
    },
    Error,
    {
      result: ProducerSearchResult;
      userLocation: {
        userRequestsUsingTheirLocation: boolean | undefined;
        searchRadius: number;
      };
    },
    readonly [
      string,
      { query: string | undefined },
      { page: number },
      { position: GeolocationPosition | undefined; radius: number | undefined },
      {
        bounds: google.maps.LatLngBoundsLiteral | undefined;
      },
      {
        country: string | undefined;
        category: ProducerTypes | undefined;
        certifications: string[] | undefined;
      },
      { lat: number; lon: number } | undefined,
    ]
  >
) {
  const store = useHomePageStore();
  const queryRef = useRef(params.query);

  return useQuery({
    ...opts,
    queryKey: [
      "search-producers-local",
      params,
      pagination,
      location,
      searchArea,
      clientFilterOverrides,
      userIpGeo,
    ] as const,
    queryFn: async () => {
      const browserGeolocationJson = location.position?.toJSON() as
        | {
            coords: {
              accuracy: number;
              altitude: number | null;
              altitudeAccuracy: number | null;
              heading: number | null;
              latitude: number;
              longitude: number;
              speed: number | null;
            };
          }
        | undefined;

      const userPosition = browserGeolocationJson
        ? {
            lat: browserGeolocationJson.coords.latitude,
            lon: browserGeolocationJson.coords.longitude,
          }
        : userIpGeo;

      if (queryRef.current !== params.query && pagination.page > 1) {
        pagination.page = 1;
        store.setPage(1);
      }

      const value = await searchProducersLocalV2({
        query: params.query ?? "*",
        page: pagination.page,
        userLocation: userPosition
          ? {
              position: userPosition,
              radius: location.radius ?? 100,
            }
          : undefined,
        filters: {
          ...clientFilterOverrides,
          searchArea:
            searchArea?.bounds !== undefined
              ? { bounds: searchArea.bounds }
              : undefined,
        },
      });

      queryRef.current = params.query;
      store.setPage(value.result.page);

      return value;
    },
    enabled: params.query !== undefined,
    placeholderData: keepPreviousData,
  });
}

// export function useSearchProducersLocal2(
//   params: { query: string | undefined },
//   pagination: { page: number },
//   location: {
//     position: GeolocationPosition | undefined;
//     radius: number | undefined;
//   },
//   clientFilterOverrides: {
//     country: string | undefined;
//     category: ProducerTypes | undefined;
//     certifications: string[] | undefined;
//   },
//   userIpGeo: { lat: number; lon: number } | undefined,
//   opts?: UseQueryOptions<
//     {
//       result: SearchResponse<ProducerSearchResultRow>;
//       userLocation: {
//         userRequestsUsingTheirLocation: boolean | undefined;
//         searchRadius: number;
//       };
//     },
//     Error,
//     {
//       result: SearchResponse<ProducerSearchResultRow>;
//       userLocation: {
//         userRequestsUsingTheirLocation: boolean | undefined;
//         searchRadius: number;
//       };
//     },
//     readonly [
//       string,
//       { query: string | undefined },
//       { page: number },
//       { position: GeolocationPosition | undefined; radius: number | undefined },
//       {
//         country: string | undefined;
//         category: ProducerTypes | undefined;
//         certifications: string[] | undefined;
//       },
//       { lat: number; lon: number } | undefined,
//     ]
//   >
// ) {
//   const store = useHomePageStore();

//   return useQuery({
//     ...opts,
//     queryKey: [
//       "search-producers-local2",
//       params,
//       pagination,
//       location,
//       clientFilterOverrides,
//       userIpGeo,
//     ] as const,
//     queryFn: async () => {
//       const value = await searchProducersLocal2({
//         page: pagination.page,
//         query: params.query ?? "",
//       });

//       console.log(clientFilterOverrides);

//       store.setPage(value.page);

//       return {
//         result: value,
//         userLocation: {
//           userRequestsUsingTheirLocation: false,
//           searchRadius: 0,
//         },
//       };
//     },
//     enabled: params.query !== undefined,
//     placeholderData: keepPreviousData,
//   });
// }

// export function useSearchByGeoText(
//   params: Omit<
//     Extract<SearchByGeoTextArgs, { mode: "query" }>,
//     "limit" | "offset"
//   >,
//   pagination: Pick<
//     Extract<SearchByGeoTextArgs, { mode: "query" }>,
//     "limit" | "offset"
//   >,
//   opts?: UseQueryOptions<
//     ProducerSearchResult,
//     Error,
//     ProducerSearchResult,
//     readonly [
//       string,
//       Omit<Extract<SearchByGeoTextArgs, { mode: "query" }>, "limit" | "offset">,
//       Pick<Extract<SearchByGeoTextArgs, { mode: "query" }>, "limit" | "offset">,
//     ]
//   >
// ) {
//   return useQuery({
//     ...opts,
//     queryKey: ["search-producer-by-geo-text", params, pagination] as const,
//     queryFn: async () => {
//       return await searchByGeoText(params);
//     },
//     placeholderData: keepPreviousData,
//   });
// }

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

export function useProducerCountries() {
  return useQuery({
    queryKey: ["producer-countries"],
    queryFn: async () => {
      return await listProducerContries();
    },
  });
}

export function useFullProducerPublic(
  producerId: string,
  opts?: Omit<
    UseQueryOptions<
      ProducerWithAll | undefined,
      Error,
      ProducerWithAll | undefined,
      readonly [string, string]
    >,
    "queryKey" | "queryFn"
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
    UseQueryOptions<
      ProducerCardsRow[],
      Error,
      ProducerCardsRow[],
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

export function useListCommodoties(
  props?: Omit<
    UseQueryOptions<
      CommoditySelect[],
      Error,
      CommoditySelect[],
      readonly [string]
    >,
    "queryFn" | "queryKey"
  >
) {
  return useQuery({
    ...(props as object),
    queryKey: ["list-commodites"] as const,
    queryFn: async () => await listCommodites(),
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

export function useEditProducerContact(
  opts?: Omit<
    UseMutationOptions<void, Error, EditProducerContact, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["edit-producer-contact"],
    mutationFn: async (args) => {
      await editProducerContact(args);
    },
  });
}

export function useEditProducerLocation(
  opts?: Omit<
    UseMutationOptions<void, Error, EditProducerLocationArgs, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["edit-producer-location"],
    mutationFn: async (args) => {
      await editProducerLocation(args);
    },
  });
}

export function useEditProducerCertifications(
  opts?: Omit<
    UseMutationOptions<void, Error, EditProducerCertifications, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["edit-producer-certifications"],
    mutationFn: async (args) => {
      await editProducerCertifications(args);
    },
  });
}

export function useEditProducerCommodities(
  opts?: Omit<
    UseMutationOptions<void, Error, EditProducerCommodoties, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["edit-producer-commodoties"],
    mutationFn: async (args) => {
      await editProducerCommodoties(args);
    },
  });
}

export function useAddCommodityAndAssociate(
  opts?: Omit<
    UseMutationOptions<void, Error, AddCommodityAndAssociate, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["add-commodity-and-associate"],
    mutationFn: async (args) => {
      await addCommodityAndAssociate(args);
    },
  });
}

export function useUploadImages(
  opts?: Omit<
    MutationOptions<
      void,
      Error,
      {
        toUpload: {
          file: File;
        }[];
        producerId: string;
      },
      unknown
    >,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["upload-images"] as const,
    mutationFn: async ({
      toUpload,
      producerId,
    }: {
      toUpload: { file: File; position: number }[];
      producerId: string;
    }) => {
      if (toUpload.length === 0) return;

      const uploadUrls = await requestUploadUrls({
        producerId,
        imageItemParams: toUpload.map(({ file, position }) => ({
          type: file.type,
          name: file.name,
          position: position,
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

export function useUploadVideo(
  opts?: Omit<
    MutationOptions<
      void,
      Error,
      {
        producerId: string;
        toUpload: {
          file: File;
        };
      },
      unknown
    >,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
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

export function useDeleteVideo(
  opts?: Omit<
    MutationOptions<
      void,
      Error,
      {
        producerId: string;
      },
      unknown
    >,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["delete-video"] as const,
    mutationFn: async ({ producerId }: { producerId: string }) => {
      await deleteVideo({ producerId });
    },
  });
}

export function useUpdateExistingImages(
  opts?: Omit<
    MutationOptions<
      void,
      Error,
      {
        data: (ProducerMediaSelect & { asset: MediaAssetSelect })[];
        producerId: string;
      },
      unknown
    >,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["update-existing-images"] as const,
    mutationFn: async (data: {
      data: (ProducerMediaSelect & { asset: MediaAssetSelect })[];
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
    onSuccess: async (a, b, c, d) => {
      await opts?.onSuccess?.(a, b, c, d);
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
    onSuccess: async (a, b, c, d) => {
      await opts?.onSuccess?.(a, b, c, d);
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
    onSuccess: async (a, b, c, d) => {
      await opts?.onSuccess?.(a, b, c, d);
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
    onSuccess: async (a, b, c, d) => {
      await opts?.onSuccess?.(a, b, c, d);
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
