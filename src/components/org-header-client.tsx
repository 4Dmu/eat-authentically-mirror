"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { OrgSignedIn } from "./auth/RequireOrg";
import { NotSubbed } from "./auth/RequireSub";
import { UserButton } from "./auth/UserButton";
import { SignedOut } from "@clerk/nextjs";
import { AuthState } from "@/backend/rpc/auth";

export function Header({ authState }: { authState: AuthState }) {
  return (
    <div className={` bg-primary text-primary-foreground w-full`}>
      <div className="grid grid-cols-3 w-full p-5 max-w-7xl mx-auto">
        <div />
        <Link
          className="font-bold font-fraunces justify-self-center text-lg self-center"
          href={"/"}
        >
          FindRealFood
        </Link>
        <div className="flex gap-2 justify-end items-center">
          <OrgSignedIn initialAuthState={authState}>
            <NotSubbed tiers={["premium", "pro"]} initialAuthState={authState}>
              <Button variant={"secondary"} asChild>
                <Link href="/organization/subscribe">Upgrade</Link>
              </Button>
            </NotSubbed>
          </OrgSignedIn>
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
