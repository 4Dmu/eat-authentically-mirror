"use client";

import {
  type ProducerChatMessage,
  type ProducerChat,
} from "@/backend/rpc/messages";
import { MessageCard } from "@/components/message-card";
import { Avatar, AvatarFallback, AvatarImage } from "@ea/ui/avatar";
import { Button } from "@ea/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@ea/ui/card";
import { Separator } from "@ea/ui/separator";
import { Textarea } from "@ea/ui/textarea";
import {
  useBlockProducerChat,
  useBlockUserChat,
  useChatMessages,
  useChat,
  useReplyToUserMessage,
  useSendMessageToProducer,
  useUnblockProducerChat,
  useUnblockUserChat,
} from "@/utils/messages";
import { format, startOfDay } from "date-fns";
import { Shield, ShieldOff } from "lucide-react";
import {
  Fragment,
  startTransition,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { match, P } from "ts-pattern";

export function ChatPageClient(props: {
  chat: ProducerChat;
  userId: string;
  messages: ProducerChatMessage[];
}) {
  const messageListRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const chatQuery = useChat(props.chat.id, { initialData: props.chat });
  const messagesQuery = useChatMessages(props.chat.id, {
    initialData: props.messages,
  });

  const messagesQueryData = messagesQuery.data ?? [];

  const [messages, addMessageOptimistic] = useOptimistic(
    messagesQueryData,
    (state, message: ProducerChatMessage) => [...state, message]
  );

  const sortedMessages = useMemo(() => {
    const groups = new Map<number, ProducerChatMessage[]>();

    for (const message of messages) {
      const date = startOfDay(message.createdAt).getTime();
      const group = groups.get(date) ?? [];
      group.push(message);
      groups.set(date, group);
    }

    return Array.from(groups.entries());
  }, [messages]);

  const blockUserChatMut = useBlockUserChat({
    onSuccess: async () => await chatQuery.refetch(),
    onError: (e) => toast.error(e.message),
  });
  const unblockUserChatMut = useUnblockUserChat({
    onSuccess: async () => await chatQuery.refetch(),
    onError: (e) => toast.error(e.message),
  });
  const blockProducerChatMut = useBlockProducerChat({
    onSuccess: async () => await chatQuery.refetch(),
    onError: (e) => toast.error(e.message),
  });
  const unblockProducerChatMut = useUnblockProducerChat({
    onSuccess: async () => await chatQuery.refetch(),
    onError: (e) => toast.error(e.message),
  });

  const sendMessageToProducer = useSendMessageToProducer({
    onSuccess: async () => await messagesQuery.refetch(),
  });
  const replyToUserMessage = useReplyToUserMessage({
    onSuccess: async () => await messagesQuery.refetch(),
  });

  async function blockChat() {
    if (!chatQuery.data) {
      return;
    }

    if (chatQuery.data.initiatorUserId === props.userId) {
      blockProducerChatMut.mutate({
        chatId: chatQuery.data.id,
      });
    } else {
      blockUserChatMut.mutate({
        chatId: chatQuery.data.id,
        producerId: chatQuery.data.producerId,
      });
    }
  }

  async function unblockChat() {
    if (!chatQuery.data) {
      return;
    }
    if (chatQuery.data.initiatorUserId === props.userId) {
      unblockProducerChatMut.mutate({
        chatId: chatQuery.data.id,
      });
    } else {
      unblockUserChatMut.mutate({
        chatId: chatQuery.data.id,
        producerId: chatQuery.data.producerId,
      });
    }
  }

  function sendMessage() {
    if (
      message.trim().length == 0 ||
      !chatQuery.data ||
      chatQuery.data.initiatorPreventedMoreMessagesAt !== null ||
      chatQuery.data.producerPreventedMoreMessagesAt !== null
    ) {
      return;
    }

    if (chatQuery.data.initiatorUserId === props.userId) {
      sendMessageToProducer.mutate({
        producerId: chatQuery.data.producerId,
        message: message,
      });
    } else {
      replyToUserMessage.mutate({
        producerId: chatQuery.data.producerId,
        chatId: chatQuery.data.id,
        message: message,
      });
    }

    startTransition(() => {
      addMessageOptimistic({
        id: crypto.randomUUID(),
        content: message,
        senderUserId: props.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        chatId: chatQuery.data!.id,
      });
    });

    setMessage("");
  }

  const chatIsBlocked =
    chatQuery.data &&
    (chatQuery.data.initiatorPreventedMoreMessagesAt !== null ||
      chatQuery.data.producerPreventedMoreMessagesAt !== null);

  const messageIsInvalid = useMemo(
    () => message.trim().length === 0,
    [message]
  );

  const userIsInitiator = chatQuery.data?.initiatorUserId === props.userId;

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
    });
  }, [messages]);

  return (
    <>
      {match(chatQuery.data)
        .with(P.nonNullable, (data) => (
          <Card className="h-full min-h-0">
            <CardHeader className="flex items-center gap-5">
              {match(data)
                .with({ initiatorUserName: P.nonNullable }, (v) => (
                  <>
                    <Avatar>
                      <AvatarImage src={v.initiatorUserImgUrl} />
                      <AvatarFallback>
                        {v.initiatorUserName
                          .split(" ")
                          .map((p) => p[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <p>{v.initiatorUserName}</p>
                  </>
                ))
                .otherwise(() => (
                  <>
                    <Avatar>
                      <AvatarImage
                        src={data.producerThumbnailUrl ?? undefined}
                      />
                      <AvatarFallback>
                        {data.producerName
                          ?.split(" ")
                          ?.map((p) => p[0])
                          ?.join("")}
                      </AvatarFallback>
                    </Avatar>
                    <p>{data.producerName}</p>
                  </>
                ))}
              {(
                data.initiatorUserId === props.userId
                  ? data.initiatorPreventedMoreMessagesAt === null
                  : data.producerPreventedMoreMessagesAt === null
              ) ? (
                <Button
                  onClick={blockChat}
                  disabled={
                    blockUserChatMut.isPending || blockProducerChatMut.isPending
                  }
                  className="ml-auto"
                  variant={"brandRed"}
                >
                  <Shield />
                  Block Chat
                </Button>
              ) : (
                <Button
                  onClick={unblockChat}
                  disabled={
                    unblockUserChatMut.isPending ||
                    unblockProducerChatMut.isPending
                  }
                  className="ml-auto"
                  variant={"brandRed"}
                >
                  <ShieldOff />
                  Unblock Chat
                </Button>
              )}
            </CardHeader>
            <Separator />
            <CardContent className="h-full min-h-0">
              <div
                ref={messageListRef}
                className="overflow-auto flex-1 shrink h-full min-h-0 px-5"
              >
                <div className="flex flex-col gap-5 pb-0">
                  <div className="flex flex-col gap-5">
                    {sortedMessages.map((group, i) => (
                      <Fragment key={i}>
                        <p className="text-center">
                          {format(new Date(group[0]), "EE, MMM dd, yyyy")}
                        </p>
                        {group[1].map((message) => (
                          <MessageCard
                            message={message}
                            userId={props.userId}
                            key={message.id}
                          />
                        ))}
                      </Fragment>
                    ))}
                  </div>
                  {((userIsInitiator &&
                    data.initiatorPreventedMoreMessagesAt !== null) ||
                    (!userIsInitiator &&
                      data.producerPreventedMoreMessagesAt !== null)) && (
                    <div className="flex justify-center w-full">
                      <p className="text-brand-red font-bold text-center">
                        You have blocked this chat, in order for anyone to send
                        messages you must unblock it.
                      </p>
                    </div>
                  )}
                  {((!userIsInitiator &&
                    data.initiatorPreventedMoreMessagesAt !== null) ||
                    (userIsInitiator &&
                      data.producerPreventedMoreMessagesAt !== null)) && (
                    <div className="flex justify-center w-full">
                      <p className="text-brand-red font-bold text-center">
                        This chat has been blocked, in order for anyone to send
                        messages the one who blocked it must unblock.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="p-2 flex flex-col gap-5 w-full">
                <Textarea
                  disabled={chatIsBlocked}
                  value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                  className="w-full  resize-none"
                  placeholder="Message..."
                />
                <Button
                  className="self-end"
                  onClick={sendMessage}
                  disabled={chatIsBlocked || messageIsInvalid}
                >
                  Send
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))
        .otherwise(() => (
          <Card></Card>
        ))}
    </>
  );
}
