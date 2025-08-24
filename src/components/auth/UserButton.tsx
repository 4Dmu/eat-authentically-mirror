import Image from "next/image";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { FactoryIcon, LogOutIcon, UserIcon } from "lucide-react";
import { ManageSubscriptionsButton } from "./ManageSubscriptionsButton";
import { Badge } from "../ui/badge";
import { useAuth, useUser } from "@clerk/nextjs";
import { AuthState } from "@/backend/rpc/auth";

export function UserButton({ authState }: { authState: AuthState }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();

  if (!authState.isAuthed || (isLoaded && !isSignedIn)) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger className="rounded-full overflow-hidden w-7 h-7 data-[state=open]:ring-3 ring-black/10">
        <Image
          className="w-full h-full"
          width={28}
          height={28}
          alt=""
          src={isLoaded ? user.imageUrl : authState.userData.imageUrl}
        />
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
            src={isLoaded ? user.imageUrl : authState.userData.imageUrl}
          />
          <div className="flex flex-col items-start">
            <p className="text-sm font-bold items-start">
              {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge>
              {authState.subTier === "Free" ? "Free" : authState.subTier.tier}
            </Badge>
          </div>
        </div>
        <Separator />

        <Button
          asChild
          variant={"ghost"}
          className="w-full justify-start gap-5"
        >
          <Link href="/account">
            <UserIcon />
            <p>Account</p>
          </Link>
        </Button>
        {authState?.orgId && (
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
        )}
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
