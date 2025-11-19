import type { PinSelect, PinboardSelect } from "@ea/db/schema";
import {
  addToPinboard,
  deletePinList,
  getUserPinboard,
  getUserPinboardFull,
  getUserProducerPin,
  newPinList,
  type PinboardFull,
  removeFromPinboard,
  syncPinsPinlistMemberships,
  updateUserPinboard,
} from "@/backend/rpc/pinboard";
import type {
  AddToPinboardArgs,
  DeletePinListArgs,
  NewPinListArgs,
  RemoveFromPinboardArgs,
  SyncPinsPinlistMembershipsArgs,
  UpdateUserPinboardArgs,
} from "@ea/validators/pinboard";
import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

// --- queries ---

export function useUserPinboard(
  opts?: Omit<
    UseQueryOptions<PinboardSelect, Error, PinboardSelect, readonly [string]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["get-user-pinboard"] as const,
    queryFn: () => getUserPinboard(),
  });
}

export function useUserPinboardFull(
  opts?: Omit<
    UseQueryOptions<PinboardFull, Error, PinboardFull, readonly [string]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["get-user-pinboard-full"] as const,
    queryFn: () => getUserPinboardFull(),
  });
}

export function useUserProducerPin(
  producerId: string,
  opts?: Omit<
    UseQueryOptions<
      PinSelect | null,
      Error,
      PinSelect | null,
      readonly [string, string]
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["producer-pin", producerId] as const,
    queryFn: async () => {
      const pin = await getUserProducerPin({ producerId });
      return pin ?? null;
    },
  });
}

// --- mutations ---

export function useUpdateUserPinboard(
  opts?: Omit<
    UseMutationOptions<void, Error, UpdateUserPinboardArgs, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["update-pinboard"] as const,
    mutationFn: (args: UpdateUserPinboardArgs) => updateUserPinboard(args),
  });
}

export function useAddToPinboard(
  opts?: Omit<
    UseMutationOptions<void, Error, AddToPinboardArgs, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["add-to-pinboard"] as const,
    mutationFn: (args: AddToPinboardArgs) => addToPinboard(args),
  });
}

export function useNewPinlist(
  opts?: Omit<
    UseMutationOptions<string, Error, NewPinListArgs, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["new-pinlist"] as const,
    mutationFn: (args: NewPinListArgs) => newPinList(args),
  });
}

export function useRemoveFromPinboard(
  opts?: Omit<
    UseMutationOptions<void, Error, RemoveFromPinboardArgs, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["remove-from-pinboard"] as const,
    mutationFn: (args: RemoveFromPinboardArgs) => removeFromPinboard(args),
  });
}

export function useSyncPinsPinlistMemberships(
  opts?: Omit<
    UseMutationOptions<void, Error, SyncPinsPinlistMembershipsArgs, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["sync-pins-pin-list-memberships"] as const,
    mutationFn: (args: SyncPinsPinlistMembershipsArgs) =>
      syncPinsPinlistMemberships(args),
  });
}

export function useDeletePinlist(
  opts?: Omit<
    UseMutationOptions<void, Error, DeletePinListArgs, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation({
    ...opts,
    mutationKey: ["delete-pinlist"] as const,
    mutationFn: (args: DeletePinListArgs) => deletePinList(args),
  });
}
