import { type } from "arktype";
import { pinboardViewModes } from "../db/schema";

export const pinboardVideModeValidator = type.enumerated(...pinboardViewModes);

export const addToPinboardArgs = type({
  producerId: "string.uuid",
  "pinListId?": "string.uuid",
});

export const removeFromPinboardArgs = type({
  pinId: "string.uuid",
});

export const getPinboardStatusArgs = type({
  producerId: "string.uuid",
});

export const updateUserPinboardArgs = type({
  viewMode: pinboardVideModeValidator,
});

export const newPinListArgs = type({
  name: type.string
    .atLeastLength(3)
    .atMostLength(125)
    .describe("more then 2 and less then 126 characters."),
});

export const deletePinListArgs = type({ pinListId: "string.uuid" });

export const syncPinsPinlistMembershipsArgs = type({
  pinId: "string.uuid",
  pinListIds: "string.uuid[]",
});

export type AddToPinboardArgs = typeof addToPinboardArgs.infer;

export type RemoveFromPinboardArgs = typeof removeFromPinboardArgs.infer;

export type GetPinboardStatusArgs = typeof getPinboardStatusArgs.infer;

export type UpdateUserPinboardArgs = typeof updateUserPinboardArgs.infer;

export type NewPinListArgs = typeof newPinListArgs.infer;

export type SyncPinsPinlistMembershipsArgs =
  typeof syncPinsPinlistMembershipsArgs.infer;

export type DeletePinListArgs = typeof deletePinListArgs.infer;
