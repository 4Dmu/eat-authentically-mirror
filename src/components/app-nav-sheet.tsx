import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import {
  HomeIcon,
  InfoIcon,
  MapPinIcon,
  MenuIcon,
  MessageCircleIcon,
} from "lucide-react";
import { Separator } from "./ui/separator";
import { NotSubbed } from "./auth/RequireSub";
import { OrgSignedOut } from "./auth/RequireOrg";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export function AppNavSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={"ghost"} size={"icon"}>
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-2 gap-0">
        <SheetHeader>
          <SheetTitle>
            <Image
              src={"/logo.png"}
              width={50}
              height={50}
              alt="Eat Authentically"
            />
          </SheetTitle>
        </SheetHeader>
        <div className="p-5 flex flex-col gap-5">
          <Button
            variant={"ghost"}
            asChild
            className="flex font-bold items-center justify-start text-sm gap-5"
          >
            <Link href="/">
              <HomeIcon size={20} />
              <span>Home</span>
            </Link>
          </Button>
          <Button
            variant={"ghost"}
            asChild
            className="flex font-bold items-center justify-start text-sm gap-5"
          >
            <Link href="/">
              <MapPinIcon size={20} />
              <span>Find Producers</span>
            </Link>
          </Button>
          <Button
            variant={"ghost"}
            asChild
            className="flex font-bold items-center justify-start text-sm gap-5"
          >
            <Link href="/about">
              <InfoIcon size={20} />
              <span>About</span>
            </Link>
          </Button>
          <Button
            variant={"ghost"}
            asChild
            className="flex font-bold items-center justify-start text-sm gap-5"
          >
            <Link href="/">
              <MessageCircleIcon size={20} />
              <span>Messages</span>
            </Link>
          </Button>
          <OrgSignedOut>
            <Button variant={"secondary"} asChild>
              <Link href="/organization/register">Become a producer</Link>
            </Button>
          </OrgSignedOut>
          <SignedOut>
            <Separator />
            <Button asChild>
              <Link href="/sign-in">SignIn</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <NotSubbed>
              <Separator />
              <Button asChild>
                <Link href="/members/subscribe">Upgrade</Link>
              </Button>
            </NotSubbed>
          </SignedIn>
        </div>
      </SheetContent>
    </Sheet>
  );
}
