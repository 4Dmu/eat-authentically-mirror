"use client";
import { usePathname } from "next/navigation";
import { AppNavSheet } from "./app-nav-sheet";
import { Button } from "@ea/ui/button";
import Link from "next/link";
import Image from "next/image";
import { SignedOut } from "@clerk/nextjs";
import { NotSubbed } from "./auth/RequireSub";
import { UserButton } from "./auth/UserButton";
import { UserJSON } from "@clerk/backend";
import type { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import SignedIn from "./auth/SignedIn";

export function Header({
  userFromServer,
  subTier,
  producerIds,
}: {
  userFromServer: UserJSON | null;
  subTier: SubTier;
  producerIds: string[];
}) {
  const pathname = usePathname();

  return (
    <div
      className={`${
        pathname === "/" ? "fixed top-0 left-0 z-10" : "bg-brand-green"
      } text-primary-foreground w-full`}
    >
      <div className="grid grid-cols-3 w-full p-5 max-w-7xl mx-auto">
        <AppNavSheet producerIds={producerIds} subTier={subTier} />
        <Link
          className="font-bold justify-self-center text-lg self-center"
          href={"/"}
        >
          {/* Eat Authentically */}
          <Image
            src={"/logo.png"}
            width={50}
            height={50}
            alt="Eat Authentically"
          />
        </Link>
        <div className="flex gap-2 justify-end items-center">
          <SignedIn userFromServer={userFromServer}>
            <NotSubbed initialSubTier={subTier}>
              <Button variant={"secondary"} asChild>
                <Link href="/dashboard/subscribe">Upgrade</Link>
              </Button>
            </NotSubbed>
          </SignedIn>
          <UserButton
            userFromServer={userFromServer}
            subTierFromServer={subTier}
          />
          <SignedOut>
            <Button variant={"secondary"} asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
