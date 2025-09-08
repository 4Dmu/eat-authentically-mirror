import { auth } from "@clerk/nextjs/server";
import { ChatsPageClient } from "./client-page";
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
import { listAllProducersChats, listUserChats } from "@/backend/rpc/messages";

export default async function MessagesPage() {
  const session = await auth.protect();

  const sub = await getSubTier(session.userId);

  const userChats = await listUserChats();
  const producerChats = await listAllProducersChats();

  return (
    <div className="p-10 pb-20">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
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
                <BreadcrumbPage>Chats</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <BackButton href={"./"} text="Back" />
        </div>
        {sub !== "Free" && (
          <ChatsPageClient
            userChats={userChats}
            producerChats={producerChats}
          />
        )}
      </div>
    </div>
  );
}
