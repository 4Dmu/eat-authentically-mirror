import {
  blockUserChat,
  ProducerChat,
  getUserOrProducerChat,
  listAllProducersChats,
  listProducerChats,
  listUserChats,
  ProducerChatMessage,
  replyToUserMessage,
  sendMessageToProducer,
  unblockUserChat,
  getUserOrProducerChatMessages,
  blockProducerChat,
  unblockProducerChat,
  getProducerChat,
} from "@/backend/rpc/messages";
import {
  BlockProducerChatArgs,
  BlockUserChatArgs,
  GetProducerChatArgs,
  ListProducerChatsArgs,
  ReplyToUserMessageArgs,
  SendMessageToProducerArgs,
  UnblockProducerChatArgs,
  UnblockUserChatArgs,
} from "@/backend/validators/messages";
import {
  MutationOptions,
  mutationOptions,
  QueryKey,
  QueryOptions,
  queryOptions,
} from "@tanstack/react-query";

type MutationOpts<T, T2, T3, T4> = Omit<
  MutationOptions<T, T2, T3, T4>,
  "mutationFn" | "mutationKey"
>;

type QueryOpts<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = readonly unknown[],
  TPageParam = never,
> = Omit<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  "queryKey" | "queryFn"
>;

export const sendMessageToProducerOpts = (
  opts?: MutationOpts<string, Error, SendMessageToProducerArgs, unknown>,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["send-message-to-producer"],
    mutationFn: async (args: SendMessageToProducerArgs) =>
      await sendMessageToProducer(args),
  });

export const replyToUserMessageOpts = (
  opts?: MutationOpts<void, Error, ReplyToUserMessageArgs, unknown>,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["reply-to-user-message"],
    mutationFn: async (args: ReplyToUserMessageArgs) =>
      await replyToUserMessage(args),
  });

export const blockUserChatOpts = (
  opts?: MutationOpts<void, Error, BlockUserChatArgs, unknown>,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["block-user-chat"],
    mutationFn: async (args: BlockUserChatArgs) => await blockUserChat(args),
  });

export const unblockUserChatOpts = (
  opts?: MutationOpts<void, Error, UnblockUserChatArgs, unknown>,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["unblock-user-chat"],
    mutationFn: async (args: UnblockUserChatArgs) =>
      await unblockUserChat(args),
  });

export const blockProducerChatOpts = (
  opts?: MutationOpts<void, Error, BlockProducerChatArgs, unknown>,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["block-producer-chat"],
    mutationFn: async (args: BlockProducerChatArgs) =>
      await blockProducerChat(args),
  });

export const unblockProducerChatOpts = (
  opts?: MutationOpts<void, Error, UnblockProducerChatArgs, unknown>,
) =>
  mutationOptions({
    ...opts,
    mutationKey: ["unblock-producer-chat"],
    mutationFn: async (args: UnblockProducerChatArgs) =>
      await unblockProducerChat(args),
  });

export const listUserChatsOpts = (
  opts?: Omit<
    QueryOptions<ProducerChat[], Error, ProducerChat[], string[]>,
    "queryKey" | "queryFn"
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["user-chats"],
    queryFn: async () => await listUserChats(),
  });

export const listProducerChatsOpts = (
  args: ListProducerChatsArgs,
  opts?: Omit<
    QueryOptions<ProducerChat[], Error, ProducerChat[], string[]>,
    "queryKey" | "queryFn"
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["producer-chats"],
    queryFn: async () => await listProducerChats(args),
  });

export const listAllProducersChatsOpts = (
  opts?: Omit<
    QueryOptions<ProducerChat[], Error, ProducerChat[], string[]>,
    "queryKey" | "queryFn"
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["all-producers-chats"],
    queryFn: async () => await listAllProducersChats(),
  });

export const getUserOrProducerChatOpts = (
  chatId: string,
  opts?: QueryOpts<
    ProducerChat | undefined,
    Error,
    ProducerChat | undefined,
    string[]
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["chat"],
    queryFn: () => getUserOrProducerChat({ chatId: chatId }),
  });

export const getProducerChatOpts = (
  args: GetProducerChatArgs,
  opts?: QueryOpts<ProducerChat | null, Error, ProducerChat | null, string[]>,
) =>
  queryOptions({
    ...opts,
    queryKey: ["chat"],
    queryFn: () => getProducerChat(args),
  });

export const getUserOrProducerChatMessagesOpts = (
  chatId: string,
  opts?: QueryOpts<
    ProducerChatMessage[] | undefined,
    Error,
    ProducerChatMessage[] | undefined,
    string[]
  >,
) =>
  queryOptions({
    ...opts,
    queryKey: ["chat-messages", chatId],
    queryFn: () => getUserOrProducerChatMessages({ chatId: chatId }),
    refetchInterval: 1000,
  });
