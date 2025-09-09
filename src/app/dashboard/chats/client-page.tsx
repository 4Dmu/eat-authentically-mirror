"use client";

import { ProducerChat } from "@/backend/rpc/messages";
import { ChatMessageNotifications } from "@/components/message-notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countListItemsByPropertyValues } from "@/utils/array";
import {
  getUserChatMessageNotificationsCountOpts,
  listAllProducersChatsOpts,
  listUserChatsOpts,
} from "@/utils/messages";
import { primaryImageUrl } from "@/utils/producers";
import { useQueries, useQuery } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { match, P } from "ts-pattern";

export function ChatsPageClient(props: {
  userChats: ProducerChat[];
  producerChats: ProducerChat[];
}) {
  const chatsQuery = useQueries({
    queries: [
      listUserChatsOpts({ initialData: props.userChats }),
      listAllProducersChatsOpts({ initialData: props.producerChats }),
    ],
    combine: (results) => {
      return {
        data: results.flatMap((r) => r.data ?? []) as ProducerChat[],
        pending: results.some((result) => result.isPending),
      };
    },
  });

  const hasMoreThanOneChatWithSameProducer = countListItemsByPropertyValues(
    chatsQuery.data,
    "producerUserId",
  ).some((entry) => entry[1] > 1);

  const countsQuery = useQuery(
    getUserChatMessageNotificationsCountOpts({
      chatIds: chatsQuery.data.map((c) => c.id),
    }),
  );

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
                        {chat.producer.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-bold">
                      {v.initiatorUserName}
                      {hasMoreThanOneChatWithSameProducer
                        ? ` chatting with ${v.producer.name}`
                        : ``}
                    </p>
                  </>
                ))
                .otherwise(() => (
                  <>
                    <Avatar>
                      <AvatarImage src={primaryImageUrl(chat.producer)} />
                      <AvatarFallback>
                        {chat.producer.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-bold">{chat.producer.name}</p>
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
