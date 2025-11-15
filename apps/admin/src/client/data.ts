import type {
  CommoditySelect,
  MediaAssetSelect,
  ProducerMediaSelect,
  ProducerWithAll,
} from "@ea/db/schema";
import type {
  AddCommodityAndAssociate,
  EditProducerArgsV2,
  EditProducerCertifications,
  EditProducerCommodoties,
  EditProducerContact,
  EditProducerLocationArgs,
  RegisterProducerArgs,
} from "@ea/validators/producers";
import {
  type MutationOptions,
  type QueryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { rpc } from "@/rpc";
import { searchProducersLocal } from "./local-search";

export function useExternalApiKeys(
  opts?: Omit<
    QueryOptions<
      {
        id: number;
        createdAt: Date;
        apiKey: string;
        rolledAt: Date;
      }[],
      Error,
      {
        id: number;
        createdAt: Date;
        apiKey: string;
        rolledAt: Date;
      }[],
      string[]
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    ...opts,
    queryKey: ["list-external-api-keys"],
    queryFn: async () => {
      return await rpc.externalApiKeys.list();
    },
  });
}

export function useCreateExternalApiKey(
  opts?: Omit<
    MutationOptions<void, Error, void, unknown>,
    "queryKey" | "queryFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["create-external-api-key"],
    mutationFn: async () => {
      return await rpc.externalApiKeys.create();
    },
  });
}

export function useCreateProducer(
  opts?: Omit<
    MutationOptions<string, Error, RegisterProducerArgs, unknown>,
    "queryKey" | "queryFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["create-producer"],
    mutationFn: async (props) => {
      return await rpc.producers.create(props);
    },
  });
}

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
      await rpc.producers.edit(args);
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
      await rpc.producers.editContact(args);
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
      await rpc.producers.editLocation(args);
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
      await rpc.producers.editCertifications(args);
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
      await rpc.producers.editCommodities(args);
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
      await rpc.producers.addCommodityAndAssociate(args);
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

      const uploadUrls = await rpc.producers.requestUploadUrls({
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

      await rpc.producers.confirmPengingUpload({ producerId });
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
      const uploadUrl = await rpc.producers.requestVideoUploadUrl({
        producerId,
      });
      const form = new FormData();
      form.set("file", toUpload.file);
      await fetch(uploadUrl, { method: "POST", body: form });
      await rpc.producers.confirmPendingVideoUpload({ producerId });
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
      await rpc.producers.deleteVideo({ producerId });
    },
  });
}

export function useRemoveProducer(
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
    mutationKey: ["remove-producer"] as const,
    mutationFn: async ({ producerId }: { producerId: string }) => {
      await rpc.producers.remove({ producerId });
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
      await rpc.producers.updateExistingImages(data);
    },
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
    queryFn: async () => await rpc.commodities.list(),
  });
}

export function useProducer(
  producerId: string,
  props?: Omit<
    UseQueryOptions<
      ProducerWithAll,
      Error,
      ProducerWithAll,
      readonly [string, string]
    >,
    "queryFn" | "queryKey"
  >
) {
  return useQuery({
    ...(props as object),
    queryKey: ["producer", producerId] as const,
    queryFn: async () => await rpc.producers.get({ id: producerId }),
  });
}

export function useUser(userId: string | null) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }
      return await rpc.users.get({ userId: userId });
    },
  });
}

export function useSearchProducers(props: { page: number; query: string }) {
  return useQuery({
    queryKey: ["search-producers", props],
    queryFn: async () => {
      const query = props.query.trim().length === 0 ? "*" : props.query.trim();

      return await searchProducersLocal({
        page: props.page,
        query: query,
      });
    },
  });
}

export function useListCertifications() {
  return useQuery({
    queryKey: ["list-certification"] as const,
    queryFn: () => rpc.certifications.list(),
    staleTime: 24 * 60 * 60 * 1000, // 24h
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
}
