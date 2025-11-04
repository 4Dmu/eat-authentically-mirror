"use client";
import { useSignIn } from "@clerk/nextjs";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LoginViaToken({
  token,
  redirectUrl,
}: {
  token: string;
  redirectUrl?: string;
}) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  useEffect(() => {
    async function attemptSignin() {
      if (isLoaded) {
        try {
          const attempt = await signIn.create({
            ticket: token,
            strategy: "ticket",
          });
          if (attempt.status === "complete") {
            await setActive({ session: attempt.createdSessionId });
            if (redirectUrl) {
              router.push(redirectUrl);
            } else {
              router.push("/dashboard");
            }
          } else {
            router.push("/sign-in");
          }
        } catch {
          router.push("/sign-in");
        }
      }
    }

    void attemptSignin();
  }, [isLoaded, redirectUrl, router, setActive, signIn, token]);

  return (
    <div className="flex h-(--app-height-footer) w-full flex-col items-center justify-center">
      <div className="flex items-center gap-5">
        <Loader className="animate-spin text-primary" size={50} />
        <p className="text-2xl font-bold">Logging you in...</p>
      </div>
    </div>
  );
}
