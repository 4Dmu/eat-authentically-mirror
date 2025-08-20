"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { OrgSignedIn } from "./auth/RequireOrg";
import { OrgNotSubbed } from "./auth/RequireSub";
import { UserButton } from "./auth/UserButton";
import { SignedOut } from "@clerk/nextjs";
import { AuthState } from "@/backend/rpc/auth";

export function Header({ authState }: { authState: AuthState }) {
  const pathname = usePathname();

  return (
    <div className={` bg-green-900 text-white w-full`}>
      <div className="grid grid-cols-3 w-full p-5 max-w-7xl mx-auto">
        <div />
        <Link
          className="font-bold justify-self-center text-lg self-center"
          href={
            pathname == "/organization/register" ? "/" : "/organization/profile"
          }
        >
          FindRealFood
        </Link>
        <div className="flex gap-2 justify-end items-center">
          <OrgSignedIn initialAuthState={authState}>
            <OrgNotSubbed initialAuthState={authState}>
              <Button asChild>
                <Link href="/organization/subscribe">Upgrade</Link>
              </Button>
            </OrgNotSubbed>
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
