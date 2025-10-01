import { Pin, Pinboard } from "@/backend/db/schema";
import {
  addToPinboard,
  deletePinList,
  getUserPinboard,
  getUserPinboardFull,
  getUserProducerPin,
  newPinList,
  PinboardFull,
  removeFromPinboard,
  syncPinsPinlistMemberships,
  updateUserPinboard,
} from "@/backend/rpc/pinboard";
import {
  AddToPinboardArgs,
  DeletePinListArgs,
  NewPinListArgs,
  RemoveFromPinboardArgs,
  SyncPinsPinlistMembershipsArgs,
  UpdateUserPinboardArgs,
} from "@/backend/validators/pinboard";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

// --- queries ---

export function useUserPinboard(
  opts?: Omit<
    UseQueryOptions<Pinboard, Error, Pinboard, readonly [string]>,
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
    UseQueryOptions<Pin | null, Error, Pin | null, readonly [string, string]>,
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
