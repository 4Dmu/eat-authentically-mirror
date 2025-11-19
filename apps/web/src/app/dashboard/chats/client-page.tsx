"use client";

import type { ProducerChat } from "@/backend/rpc/messages";
import { ChatMessageNotifications } from "@/components/message-notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@ea/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@ea/ui/card";
import { countListItemsByPropertyValues } from "@/utils/array";
import {
  useUserChatMessageNotificationsCount,
  useAllProducersChats,
  useUserChats,
} from "@/utils/messages";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { match, P } from "ts-pattern";

export function ChatsPageClient(props: {
  userChats: ProducerChat[];
  producerChats: ProducerChat[];
}) {
  const userChatsQuery = useUserChats({ initialData: props.userChats });
  const producerChatsQuery = useAllProducersChats({
    initialData: props.producerChats,
  });

  const chatsQuery = useMemo(() => {
    const userChats = userChatsQuery.data;
    const producerChats = producerChatsQuery.data;

    const chats = [
      ...(userChats ?? []),
      ...(producerChats ?? []),
    ] as ProducerChat[];

    const pending = userChatsQuery.isPending || producerChatsQuery.isPending;

    return { data: chats, pending };
  }, [
    userChatsQuery.data,
    producerChatsQuery.data,
    userChatsQuery.isPending,
    producerChatsQuery.isPending,
  ]);

  const hasMoreThanOneChatWithSameProducer = countListItemsByPropertyValues(
    chatsQuery.data,
    "producerUserId"
  ).some((entry) => entry[1] > 1);

  const countsQuery = useUserChatMessageNotificationsCount({
    chatIds: chatsQuery.data.map((c) => c.id),
  });

  return (
    <div>
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Your Chats</CardTitle>
        </CardHeader>
        <CardContent className="min-h-40 flex flex-col gap-5">
          {chatsQuery.data.map((chat) => (
            <Link
              href={`/dashboard/chats/${chat.id}`}
              key={chat.id}
              className="bg-background p-2 rounded-lg border flex gap-5 items-center relative"
            >
              {match(chat)
                .with({ initiatorUserName: P.nonNullable }, (v) => (
                  <>
                    <Avatar>
                      <AvatarImage src={v.initiatorUserImgUrl} />
                      <AvatarFallback>
                        {chat.producerName
                          ?.split(" ")
                          ?.map((p) => p[0])
                          ?.join("")}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-bold">
                      {v.initiatorUserName}
                      {hasMoreThanOneChatWithSameProducer
                        ? ` chatting with ${v.producerName}`
                        : ``}
                    </p>
                  </>
                ))
                .otherwise(() => (
                  <>
                    <Avatar>
                      <AvatarImage
                        src={chat.producerThumbnailUrl ?? undefined}
                      />
                      <AvatarFallback>
                        {chat.producerName
                          ?.split(" ")
                          ?.map((p) => p[0])
                          ?.join("")}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-bold">{chat.producerName}</p>
                  </>
                ))}
              <p className="ml-auto">
                {formatDistance(chat.updatedAt, new Date())}
              </p>
              <ChatMessageNotifications
                chatId={chat.id}
                counts={countsQuery.data}
                className="absolute -top-2 -right-2"
              />
            </Link>
          ))}
          {chatsQuery.data && chatsQuery.data.length === 0 && (
            <>
              <p>
                You dont have any chats yet, message a producer and their chat
                will appear here.
              </p>
              <Link href={"/"} className="underline">
                Find a producer
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
