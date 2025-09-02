"use client";

import { ProducerChat } from "@/backend/rpc/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listAllProducersChatsOpts, listUserChatsOpts } from "@/utils/messages";
import { primaryImageUrl } from "@/utils/producers";
import { useQueries, useQuery } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { match, P } from "ts-pattern";

export function ChatsPageClient() {
  const chatsQuery = useQueries({
    queries: [listUserChatsOpts(), listAllProducersChatsOpts()],
    combine: (results) => {
      return {
        data: results.flatMap((r) => r.data ?? []) as ProducerChat[],
        pending: results.some((result) => result.isPending),
      };
    },
  });

  return (
    <div>
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Your Chats</CardTitle>
        </CardHeader>
        <CardContent className="min-h-40">
          {chatsQuery.data.map((chat) => (
            <Link
              href={`/dashboard/chats/${chat.id}`}
              key={chat.id}
              className="bg-background p-2 rounded-lg border flex gap-5 items-center"
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
                    <p>{v.initiatorUserName}</p>
                  </>
                ))
                .otherwise((v) => (
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
                    <p>{chat.producer.name}</p>
                  </>
                ))}
              <p className="ml-auto">
                {formatDistance(chat.updatedAt, new Date())}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
