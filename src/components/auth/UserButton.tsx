import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { CheckIcon, ChevronDown, LogOutIcon } from "lucide-react";
import { ManageSubscriptionsButton } from "./ManageSubscriptionsButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Badge } from "../ui/badge";
import { useAuthState } from "@/hooks/use-auth-state";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function UserButton() {
  const { authState } = useAuthState();
  const pathname = usePathname();

  const isOrgMode = pathname.startsWith("/organization");

  const { isLoaded: isUserLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();

  if (!isUserLoaded) {
    const imageUrl = authState?.isAuthed
      ? isOrgMode
        ? authState.orgData?.imageUrl
        : authState.userData?.imageUrl
      : undefined;

    if (!imageUrl) {
      return null;
    }

    return (
      <Image
        className="rounded-full overflow-hidden w-7 h-7"
        width={28}
        height={28}
        alt=""
        src={imageUrl}
      />
    );
  }

  if (!isUserLoaded || !isSignedIn) {
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
          src={
            (authState?.isAuthed
              ? isOrgMode
                ? authState.orgData?.imageUrl
                : authState.userData?.imageUrl
              : undefined) ?? user.imageUrl
          }
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-[unset] min-w-xs flex flex-col gap-3 rounded-lg p-5"
        align="end"
      >
        <Collapsible>
          <CollapsibleTrigger
            disabled={authState?.orgId == null || !authState}
            className={cn(
              "flex w-full gap-2 justify-start items-center enabled:hover:bg-muted p-2 rounded-lg group"
            )}
          >
            <Image
              className="w-10 h-10 rounded-full"
              width={40}
              height={40}
              alt=""
              src={
                (authState?.isAuthed
                  ? isOrgMode
                    ? authState.orgData?.imageUrl
                    : authState.userData?.imageUrl
                  : undefined) ?? user.imageUrl
              }
            />
            <div className="flex flex-col items-start">
              {isOrgMode && authState?.orgId ? (
                <>
                  <p className="text-sm font-bold items-start">
                    {authState.orgData?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">Organization</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold items-start">
                    {user.firstName ?? user.primaryEmailAddress?.emailAddress}
                  </p>
                  <p className="text-sm text-muted-foreground">Member</p>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge>
                {isOrgMode ? authState?.orgSubTier : authState?.memberSubTier}
              </Badge>
              <ChevronDown className="invisible group-enabled:visible" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 mt-3 flex flex-col gap-3">
              {authState?.orgData && (
                <Button
                  asChild
                  variant={"ghost"}
                  className="h-[unset] justify-start"
                >
                  <Link href="/organization/profile">
                    <Image
                      width={40}
                      height={40}
                      alt=""
                      className="w-10 h-10 rounded-full"
                      src={authState.orgData?.imageUrl ?? ""}
                    />
                    <div className="flex flex-col items-start">
                      <p className="text-sm font-bold items-start">
                        {authState.orgData?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">Producer</p>
                    </div>
                    <CheckIcon
                      className={`ml-auto ${!isOrgMode && "hidden"}`}
                    />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant={"ghost"}
                className="h-[unset] justify-start"
              >
                <Link href="/">
                  <Image
                    width={40}
                    height={40}
                    alt=""
                    className="w-10 h-10 rounded-full"
                    src={user.imageUrl}
                  />
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-bold items-start">
                      {user.firstName ?? user.primaryEmailAddress?.emailAddress}
                    </p>
                    <p className="text-sm text-muted-foreground">Member</p>
                  </div>
                  <CheckIcon className={`ml-auto ${isOrgMode && "hidden"}`} />
                </Link>
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Separator />
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
