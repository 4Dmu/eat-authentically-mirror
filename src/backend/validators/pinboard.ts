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

export type AddToPinboardArgs = typeof addToPinboardArgs.infer;

export type RemoveFromPinboardArgs = typeof removeFromPinboardArgs.infer;

export type GetPinboardStatusArgs = typeof getPinboardStatusArgs.infer;

export type UpdateUserPinboardArgs = typeof updateUserPinboardArgs.infer;
