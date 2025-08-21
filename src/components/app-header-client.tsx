"use client";
import { usePathname } from "next/navigation";
import { AppNavSheet } from "./app-nav-sheet";
import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { NotSubbed } from "./auth/RequireSub";
import { UserButton } from "./auth/UserButton";
import { AuthState } from "@/backend/rpc/auth";

export function Header({ authState }: { authState: AuthState }) {
  const pathname = usePathname();

  return (
    <div
      className={`${
        pathname === "/"
          ? "fixed top-0 left-0 z-10 bg-primary/75"
          : "bg-primary"
      } text-primary-foreground w-full`}
    >
      <div className="grid grid-cols-3 w-full p-5 max-w-7xl mx-auto">
        <AppNavSheet />
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
          <SignedIn>
            <NotSubbed>
              <Button variant={"secondary"} asChild>
                <Link href="/members/subscribe">Upgrade</Link>
              </Button>
            </NotSubbed>
          </SignedIn>
          <UserButton authState={authState} />
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
