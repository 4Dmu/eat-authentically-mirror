import { type } from "arktype";

export const sendMessageToProducerArgs = type({
  producerId: "string",
  message: "string < 5000",
});

export const replyToUserMessageArgs = type({
  producerId: "string",
  chatId: "string",
  message: "string < 5000",
});

export const blockUserChatArgs = type({
  producerId: "string",
  chatId: "string",
});

export const unblockUserChatArgs = type({
  producerId: "string",
  chatId: "string",
});

export const blockProducerChatArgs = type({
  chatId: "string",
});

export const unblockProducerChatArgs = type({
  chatId: "string",
});

export const getUserOrProducerChatArgs = type({
  chatId: "string",
});

export const getUserChatMessageNotificationsCountArgs = type({
  chatIds: "string[]",
});

export const getProducerChatArgs = type({
  producerId: "string",
});

export const resetChatNotificationsArgs = type({
  chatId: "string",
});

export const listProducerChatsArgs = type({ producerId: "string.uuid" });

export type SendMessageToProducerArgs = typeof sendMessageToProducerArgs.infer;

export type ReplyToUserMessageArgs = typeof replyToUserMessageArgs.infer;

export type ListProducerChatsArgs = typeof listProducerChatsArgs.infer;

export type BlockUserChatArgs = typeof blockUserChatArgs.infer;

export type UnblockUserChatArgs = typeof unblockUserChatArgs.infer;

export type BlockProducerChatArgs = typeof blockProducerChatArgs.infer;

export type UnblockProducerChatArgs = typeof unblockProducerChatArgs.infer;

export type GetUserOrProducerChatArgs = typeof getUserOrProducerChatArgs.infer;

export type GetProducerChatArgs = typeof getProducerChatArgs.infer;

export type GetUserChatMessageNotificationsCountArgs =
  typeof getUserChatMessageNotificationsCountArgs.infer;

export type ResetChatNotificationsArgs =
  typeof resetChatNotificationsArgs.infer;
