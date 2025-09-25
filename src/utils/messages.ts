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
  getUserChatMessageNotificationsCount,
  getUserChatsMessageNotificationsCount,
  ChatNotificationsCount,
  resetChatNotifications,
} from "@/backend/rpc/messages";
import {
  BlockProducerChatArgs,
  BlockUserChatArgs,
  GetProducerChatArgs,
  GetUserChatMessageNotificationsCountArgs,
  ListProducerChatsArgs,
  ReplyToUserMessageArgs,
  ResetChatNotificationsArgs,
  SendMessageToProducerArgs,
  UnblockProducerChatArgs,
  UnblockUserChatArgs,
} from "@/backend/validators/messages";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

// ----------------------- Mutations -----------------------

export function useSendMessageToProducer(
  opts?: UseMutationOptions<string, Error, SendMessageToProducerArgs, unknown>
) {
  return useMutation({
    ...opts,
    mutationKey: ["send-message-to-producer"] as const,
    mutationFn: (args: SendMessageToProducerArgs) =>
      sendMessageToProducer(args),
  });
}

export function useReplyToUserMessage(
  opts?: UseMutationOptions<void, Error, ReplyToUserMessageArgs, unknown>
) {
  return useMutation({
    ...opts,
    mutationKey: ["reply-to-user-message"] as const,
    mutationFn: (args: ReplyToUserMessageArgs) => replyToUserMessage(args),
  });
}

export function useBlockUserChat(
  opts?: UseMutationOptions<void, Error, BlockUserChatArgs, unknown>
) {
  return useMutation({
    ...opts,
    mutationKey: ["block-user-chat"] as const,
    mutationFn: (args: BlockUserChatArgs) => blockUserChat(args),
  });
}

export function useUnblockUserChat(
  opts?: UseMutationOptions<void, Error, UnblockUserChatArgs, unknown>
) {
  return useMutation({
    ...opts,
    mutationKey: ["unblock-user-chat"] as const,
    mutationFn: (args: UnblockUserChatArgs) => unblockUserChat(args),
  });
}

export function useBlockProducerChat(
  opts?: UseMutationOptions<void, Error, BlockProducerChatArgs, unknown>
) {
  return useMutation({
    ...opts,
    mutationKey: ["block-producer-chat"] as const,
    mutationFn: (args: BlockProducerChatArgs) => blockProducerChat(args),
  });
}

export function useUnblockProducerChat(
  opts?: UseMutationOptions<void, Error, UnblockProducerChatArgs, unknown>
) {
  return useMutation({
    ...opts,
    mutationKey: ["unblock-producer-chat"] as const,
    mutationFn: (args: UnblockProducerChatArgs) => unblockProducerChat(args),
  });
}

export function useResetChatNotifications(
  opts?: UseMutationOptions<void, Error, ResetChatNotificationsArgs, unknown>
) {
  return useMutation({
    ...opts,
    mutationKey: ["reset-chat-notifications"] as const,
    mutationFn: (args: ResetChatNotificationsArgs) =>
      resetChatNotifications(args),
  });
}

// ------------------------- Queries -------------------------

export function useUserChats(
  opts?: Omit<
    UseQueryOptions<ProducerChat[], Error, ProducerChat[], readonly [string]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["user-chats"] as const,
    queryFn: () => listUserChats(),
  });
}

export function useProducerChats(
  args: ListProducerChatsArgs,
  opts?: Omit<
    UseQueryOptions<
      ProducerChat[],
      Error,
      ProducerChat[],
      readonly [string, ListProducerChatsArgs]
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["producer-chats", args] as const, // include args to avoid collisions
    queryFn: () => listProducerChats(args),
  });
}

export function useAllProducersChats(
  opts?: Omit<
    UseQueryOptions<ProducerChat[], Error, ProducerChat[], readonly [string]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["all-producers-chats"] as const,
    queryFn: () => listAllProducersChats(),
  });
}

export function useChat<TData = ProducerChat | undefined, TSelect = TData>(
  chatId: string,
  opts?: Omit<
    UseQueryOptions<
      ProducerChat | undefined,
      Error,
      TSelect,
      readonly [string, string]
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["chat", chatId] as const, // include id to scope cache
    queryFn: () => getUserOrProducerChat({ chatId }),
  });
}

export function useProducerChat<TData = ProducerChat | null, TSelect = TData>(
  args: GetProducerChatArgs,
  opts?: UseQueryOptions<
    ProducerChat | null,
    Error,
    TSelect,
    readonly [string, GetProducerChatArgs]
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["chat", args] as const, // include args to scope cache
    queryFn: () => getProducerChat(args),
  });
}

export function useChatMessages(
  chatId: string,
  opts?: Omit<
    UseQueryOptions<
      ProducerChatMessage[] | undefined,
      Error,
      ProducerChatMessage[] | undefined,
      readonly [string, string]
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["chat-messages", chatId] as const,
    queryFn: () => getUserOrProducerChatMessages({ chatId }),
    refetchInterval: 1000 * 10,
  });
}

export function useUserChatsMessageNotificationsCount(
  userId: string | undefined | null,
  opts?: UseQueryOptions<
    number | null,
    Error,
    number | null,
    readonly [string, string | null]
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["user-chats-message-notifications", userId ?? null] as const,
    queryFn: () => getUserChatsMessageNotificationsCount(),
    refetchInterval: 1000 * 60,
    enabled: userId != null && userId !== undefined && (opts?.enabled ?? true),
  });
}

export function useUserChatMessageNotificationsCount(
  args: GetUserChatMessageNotificationsCountArgs,
  opts?: UseQueryOptions<
    ChatNotificationsCount[],
    Error,
    ChatNotificationsCount[],
    readonly [string, GetUserChatMessageNotificationsCountArgs]
  >
) {
  return useQuery({
    ...(opts as object),
    queryKey: ["user-chat-message-notifications", args] as const,
    queryFn: () => getUserChatMessageNotificationsCount(args),
    refetchInterval: 1000 * 60,
  });
}
