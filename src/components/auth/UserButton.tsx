import Image from "next/image";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  MapIcon,
  SendIcon,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { useAuth, useUser } from "@clerk/nextjs";
import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import { UserJSON } from "@clerk/backend";
import { useSubTier } from "@/hooks/use-sub-tier";
import { useQuery } from "@tanstack/react-query";
import { getUserChatMessageNotificationsCountOpts } from "@/utils/messages";
import { MessageNotifications } from "../message-notifications";
import { Suspense } from "react";

export function UserButton({
  subTierFromServer,
  userFromServer,
}: {
  subTierFromServer: SubTier;
  userFromServer: UserJSON | null;
}) {
  const { subTier } = useSubTier({ initialData: subTierFromServer });
  const { signOut } = useAuth();
  const { isLoaded, user: clientUser } = useUser();

  const user = isLoaded ? clientUser : userFromServer;

  if (!user) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger className="rounded-full relative w-7 h-7 data-[state=open]:ring-3 ring-black/10">
        <Image
          className="w-full h-full rounded-full"
          width={28}
          height={28}
          alt=""
          src={"image_url" in user ? user.image_url : user.imageUrl}
        />
        <MessageNotifications className="absolute -top-2 -right-2" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[unset] min-w-xs flex flex-col gap-3 rounded-lg p-5"
        align="end"
      >
        <div className="flex w-full gap-2 justify-start items-center enabled:hover:bg-muted p-2 rounded-lg group">
          <Image
            className="w-10 h-10 rounded-full"
            width={40}
            height={40}
            alt=""
            src={"image_url" in user ? user.image_url : user.imageUrl}
          />
          <div className="flex flex-col items-start">
            <p className="text-sm font-bold items-start">
              {("first_name" in user ? user.first_name : user.firstName) ??
                ("email_addresses" in user
                  ? user?.email_addresses?.find(
                      (e) => e.id === user.primary_email_address_id,
                    )?.email_address
                  : user.emailAddresses.find(
                      (e) => e.id === user.primaryEmailAddressId,
                    )?.emailAddress)}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={"brandGreen"}>
              {subTier === "Free" ? "Free" : subTier.tier}
            </Badge>
          </div>
        </div>
        <Separator />
        <Button
          asChild
          variant={"ghost"}
          className="w-full justify-start gap-5"
        >
          <Link href="/dashboard">
            <LayoutDashboardIcon />
            <p>Dashboard</p>
          </Link>
        </Button>
        <Button
          asChild
          variant={"ghost"}
          className="w-full justify-start gap-5"
        >
          <Link href="/dashboard/pinboard">
            <MapIcon />
            <p>Pinboard</p>
          </Link>
        </Button>
        <Button
          asChild
          variant={"ghost"}
          className="w-full justify-start gap-5 relative"
        >
          <Link href="/dashboard/chats">
            <SendIcon />
            <p>Chats</p>
            <MessageNotifications className="ml-auto" />
          </Link>
        </Button>
        <Separator />
        {/* {authState?.orgId && (
          <Button
            asChild
            variant={"ghost"}
            className="w-full justify-start gap-5"
          >
            <Link href="/organization/profile">
              <FactoryIcon />
              <p>Producer profile</p>
            </Link>
          </Button>
        )}
        {authState?.canMangeBilling && (
          <div className="flex gap-2">
            <ManageSubscriptionsButton />
          </div>
        )} */}
        <div className="flex gap-2">
          <Button
            variant={"ghost"}
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full justify-start gap-5"
          >
            <LogOutIcon />
            <span>Sign out</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
