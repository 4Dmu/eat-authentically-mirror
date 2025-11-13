import { createExternalApiKey, listExternalApiKeys } from "@/rpc/api";
import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

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
      return await listExternalApiKeys();
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
      return await createExternalApiKey();
    },
  });
}
