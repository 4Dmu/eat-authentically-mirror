import { Pin, Pinboard } from "@/backend/db/schema";
import {
  addToPinboard,
  getUserPinboard,
  getUserPinboardFull,
  getUserProducerPin,
  PinboardFull,
  removeFromPinboard,
  updateUserPinboard,
} from "@/backend/rpc/pinboard";
import {
  AddToPinboardArgs,
  RemoveFromPinboardArgs,
  UpdateUserPinboardArgs,
} from "@/backend/validators/pinboard";
import {
  MutationOptions,
  mutationOptions,
  QueryOptions,
  queryOptions,
} from "@tanstack/react-query";

export const getUserPinboardOpts = (
  opts?: Omit<
    QueryOptions<Pinboard, Error, Pinboard, string[]>,
    "queryKey" | "queryFn"
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["get-user-pinboard"],
    queryFn: async () => await getUserPinboard(),
  });

export const getUserPinboardFullOpts = (
  opts?: Omit<
    QueryOptions<PinboardFull, Error, PinboardFull, string[]>,
    "queryKey" | "queryFn"
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["get-user-pinboard-full"],
    queryFn: async () => await getUserPinboardFull(),
  });

export const updateUserPinboardOpts = (
  opts?: Omit<
    MutationOptions<void, Error, UpdateUserPinboardArgs, unknown>,
    "mutationKey" | "mutationFn"
  >,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["update-pinboard"],
    mutationFn: async (args: UpdateUserPinboardArgs) =>
      await updateUserPinboard(args),
  });

export const addToPinboardOpts = (
  opts?: Omit<
    MutationOptions<void, Error, AddToPinboardArgs, unknown>,
    "mutationKey" | "mutationFn"
  >,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["add-to-pinboard"],
    mutationFn: async (args: AddToPinboardArgs) => await addToPinboard(args),
  });

export const removeFromPinboardOpts = (
  opts?: Omit<
    MutationOptions<void, Error, RemoveFromPinboardArgs, unknown>,
    "mutationKey" | "mutationFn"
  >,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["remove-from-pinboard"],
    mutationFn: async (args: RemoveFromPinboardArgs) =>
      await removeFromPinboard(args),
  });

export const getUserProducerPinOpts = (
  producerId: string,
  opts?: Omit<
    QueryOptions<Pin | null, Error, Pin | null, string[]>,
    "queryKey" | "queryFn"
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["producer-pin", producerId],
    queryFn: async () => {
      const pin = await getUserProducerPin({ producerId });
      return pin ?? null;
    },
  });
