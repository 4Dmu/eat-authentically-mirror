import { auth } from "@clerk/nextjs/server";
import { getSubTier } from "@/backend/rpc/utils/get-sub-tier";
import { BackButton } from "@/components/back-button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useSubTier } from "@/hooks/use-sub-tier";
import { notFound, redirect } from "next/navigation";
import { getUserOrProducerChat } from "@/backend/rpc/messages";
import { ChatPageClient } from "./chat-page-client";
import { match, P } from "ts-pattern";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const session = await auth.protect();

  const sub = await getSubTier(session.userId);

  if (sub === "Free") {
    redirect("/dashboard/chats");
  }

  const { id } = await params;

  if (!id) {
    notFound();
  }

  const chat = await getUserOrProducerChat({ chatId: id });

  if (!chat) {
    notFound();
  }

  return (
    <div className="p-10 h-[calc(100vh_-_150px)]">
      <div className="max-w-4xl mx-auto flex flex-col gap-10 h-full">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  asChild
                  className="cursor-pointer hover:text-primary"
                >
                  <Link href={"/"}>Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  asChild
                  className="cursor-pointer hover:text-primary"
                >
                  <Link href={"/dashboard"}>My Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  asChild
                  className="cursor-pointer hover:text-primary"
                >
                  <Link href={"/dashboard/chats"}>Chats</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {match(chat)
                    .with(
                      { initiatorUserName: P.nonNullable },
                      (v) => v.initiatorUserName,
                    )
                    .otherwise((c) => c.producer.name)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <BackButton href={"/"} text="Back to Home" />
        </div>
        <ChatPageClient userId={session.userId} chat={chat} />
      </div>
    </div>
  );
}
